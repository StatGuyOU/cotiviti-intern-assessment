#!/usr/bin/env python3
"""
Claims Anomaly Radar - hackathon proof of concept for payment-integrity
pattern recognition (Cotiviti intern assessment, topic: Clinical Decision
Making and Pattern Recognition in Health Care - anomaly detection for TPO).

One command does the whole loop:
  1. Generate a SYNTHETIC professional-claims dataset (no PHI, no real data)
     for 240 providers x 24 months, with five injected billing-anomaly
     archetypes: steady upcoding, upcoding drift (level shift), volume spike,
     modifier-25 overuse, duplicate billing.
  2. Engineer provider-level billing-behaviour features.
  3. Run three complementary (not independent: A and C share features) detectors:
       A. Peer-group robust z-scores (explainable, per feature, per specialty)
       B. Time-series anomaly detection: rolling-window volume outliers and an
          E/M level-shift (change-point) test
       C. Isolation Forest (multivariate, unsupervised; scikit-learn optional)
  4. Combine them into a consensus rank and write, for every flagged provider,
     an evidence packet + a plain-English auditor brief with a next step.
  4b. A deterministic CRITIC (a structural release gate) checks every packet (explainable signal present,
     peer baseline attached, enough claim volume, corroboration, policy source
     identified) and sets a disposition: REVIEW or WITHHOLD. Nothing is ever
     "denied"; a human reviewer decides.
  5. Score the radar against the injected ground truth (precision/recall@K).
     Ground truth is used ONLY for scoring, never for detection. The fixed-seed
     1.00 is a wiring check on designed anomalies, not production accuracy;
     `--seeds N` reports the spread across seeds and contamination settings.

Usage
  python claims_radar.py                    # full run, writes ./output
  python claims_radar.py --provider P0042   # print one auditor brief
  python claims_radar.py --llm              # LLM-written briefs (ANTHROPIC_API_KEY)
  python claims_radar.py --seeds 20         # robustness across seeds and contamination
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------
SEED = 42
N_PER_SPECIALTY = 60
MONTHS = pd.period_range("2024-01", "2025-12", freq="M")          # 24 months
SPECIALTIES = {
    #                     avg visits/month, E/M mix 99212..99215, modifier-25 rate
    "Family Medicine": dict(base_visits=55, em_mix=[0.10, 0.45, 0.35, 0.10], mod25=0.08),
    "Cardiology":      dict(base_visits=40, em_mix=[0.05, 0.30, 0.45, 0.20], mod25=0.12),
    "Orthopedics":     dict(base_visits=35, em_mix=[0.08, 0.40, 0.40, 0.12], mod25=0.15),
    "Dermatology":     dict(base_visits=65, em_mix=[0.20, 0.50, 0.25, 0.05], mod25=0.30),
}
EM_CODES = ["99212", "99213", "99214", "99215"]
EM_LEVEL = {"99212": 2, "99213": 3, "99214": 4, "99215": 5}
EM_FEE = {"99212": 57.0, "99213": 92.0, "99214": 130.0, "99215": 183.0}  # illustrative
PROC_FEE_MEAN = 75.0
DUP_BASE = 0.005
UPCODE_MIX = np.array([0.02, 0.10, 0.43, 0.45])
ARCHETYPES = ["upcoding", "upcoding_drift", "volume_spike", "mod25_overuse", "duplicate_billing"]
N_PER_ARCHETYPE = 3
Z_THRESHOLD = 3.5          # Iglewicz-Hoaglin modified z-score cut-off
VOLUME_Z_THRESHOLD = 4.0   # rolling-window volume cut-off (count data, Poisson noise floor)
SHIFT_Z_THRESHOLD = 4.0    # two-proportion z for an E/M level shift
FEATURES = ["em_high_share", "em5_share", "em_mean_level", "mod25_rate", "dup_rate",
            "visits_per_month", "visits_cv", "paid_per_visit"]
FEATURE_LABEL = {
    "em_high_share": "share of level 4-5 E/M visits",
    "em5_share": "share of level-5 (99215) visits",
    "em_mean_level": "mean E/M level",
    "mod25_rate": "modifier-25 rate (E/M billed with a same-day procedure)",
    "dup_rate": "exact-duplicate claim rate",
    "visits_per_month": "visits per month (de-duplicated encounters)",
    "visits_cv": "month-to-month volume variability",
    "paid_per_visit": "paid amount per visit",
}
VOLUME_STEP = ("Verify billed volume in the flagged months against scheduling capacity and beneficiary "
               "contact; screen for services not rendered.")
NEXT_STEP = {
    "em_high_share": "Request documentation for a random sample of level 4-5 E/M visits and validate "
                     "medical decision making / time against the 2021 AMA E/M guidelines.",
    "em_mean_level": "Request documentation for a random sample of level 4-5 E/M visits and validate "
                     "medical decision making / time against the 2021 AMA E/M guidelines.",
    "em5_share": "Request documentation for a random sample of level 4-5 E/M visits and validate "
                 "medical decision making / time against the 2021 AMA E/M guidelines.",
    "em_shift": "Focus the E/M documentation review on visits after the detected change point.",
    "mod25_rate": "Review same-day E/M + procedure pairs for modifier-25 support (a separately "
                  "identifiable service must be documented).",
    "dup_rate": "Verify adjustment and reversal history and the full claim attributes of the duplicate groups "
                "before considering an edit or a recovery.",
    "visits_per_month": VOLUME_STEP,
    "visits_cv": VOLUME_STEP,
    "volume_ts": VOLUME_STEP,
    "paid_per_visit": "Compare the paid-code mix with peers and review add-on procedure billing.",
    "multivariate": "Multivariate signal only: have an analyst inspect the feature profile before any outreach.",
}
EM_POLICY = ("CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); "
             "AMA 2021 E/M guidelines")
VOLUME_POLICY = "CMS Program Integrity Manual, Ch. 4 (benefit integrity: services not rendered)"
POLICY_SOURCE = {
    "em_high_share": EM_POLICY, "em5_share": EM_POLICY, "em_mean_level": EM_POLICY, "em_shift": EM_POLICY,
    "mod25_rate": "CMS NCCI Policy Manual for Medicare Services, Ch. I (modifier 25: significant, "
                  "separately identifiable E/M service)",
    "dup_rate": "Payer duplicate-claim edit policy; CMS Medicare Claims Processing Manual, Ch. 1 (claim adjustments)",
    "visits_per_month": VOLUME_POLICY, "visits_cv": VOLUME_POLICY, "volume_ts": VOLUME_POLICY,
    "paid_per_visit": "Payer fee schedule and add-on procedure policy",
    "multivariate": "No single governing policy (multivariate profile only)",
}
REQUIRED_EVIDENCE = {
    "em_high_share": "documentation for a random sample of 30 level 4-5 visits",
    "em5_share": "documentation for a random sample of 30 level-5 visits",
    "em_mean_level": "documentation for a random sample of 30 level 4-5 visits",
    "em_shift": "documentation for 30 level 4-5 visits dated after the change point",
    "mod25_rate": "procedure and E/M notes for 30 same-day E/M + procedure pairs",
    "dup_rate": "adjustment and reversal history for the duplicate claim groups",
    "visits_per_month": "scheduling capacity and staffing for the flagged months",
    "visits_cv": "scheduling capacity and staffing for the flagged months",
    "volume_ts": "scheduling capacity and staffing for the flagged months",
    "paid_per_visit": "add-on procedure documentation for a sample of 30 visits",
    "multivariate": "analyst review of the peer-normalised feature profile",
}
MIN_CLAIMS_FOR_REVIEW = 200      # below this, statistics are too noisy to open a case
STRONG_SINGLE_Z = 8.0            # one detector is enough only if its signal is this strong


# --------------------------------------------------------------------------
# 1. Synthetic data
# --------------------------------------------------------------------------
def generate_claims(rng: np.random.Generator) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (claims, providers). Providers carries the hidden ground truth."""
    providers = []
    pid = 0
    for spec, cfg in SPECIALTIES.items():
        for _ in range(N_PER_SPECIALTY):
            pid += 1
            providers.append(dict(
                provider_id=f"P{pid:04d}",
                specialty=spec,
                lam=cfg["base_visits"] * rng.lognormal(0.0, 0.25),
                em_mix=rng.dirichlet(np.array(cfg["em_mix"]) * 60),
                mod25=float(np.clip(rng.normal(cfg["mod25"], 0.03), 0.01, 0.9)),
                dup=float(np.clip(rng.normal(DUP_BASE, 0.002), 0.0, 0.05)),
                archetype="normal",
            ))
    # Inject anomalies (hidden ground truth): 3 providers per archetype.
    chosen = rng.choice(len(providers), size=N_PER_ARCHETYPE * len(ARCHETYPES), replace=False)
    for k, i in enumerate(chosen):
        providers[i]["archetype"] = ARCHETYPES[k % len(ARCHETYPES)]

    cols = {k: [] for k in ["provider_id", "specialty", "month", "service_date",
                            "patient_id", "em_code", "modifier_25", "em_paid", "proc_paid"]}
    for p in providers:
        a = p["archetype"]
        for m_i, month in enumerate(MONTHS):
            season = 1.0 + 0.08 * np.sin(2 * np.pi * (m_i % 12) / 12)
            lam, mix, mod25, dup = p["lam"] * season, p["em_mix"], p["mod25"], p["dup"]
            if a == "upcoding" or (a == "upcoding_drift" and m_i >= 12):
                mix = 0.25 * mix + 0.75 * UPCODE_MIX
            elif a == "volume_spike" and 17 <= m_i <= 20:
                lam *= 3.0
            elif a == "mod25_overuse":
                mod25 = 0.65
            elif a == "duplicate_billing":
                dup = 0.12
            n = int(rng.poisson(lam))
            if n == 0:
                continue
            codes = rng.choice(EM_CODES, size=n, p=mix / mix.sum())
            days = rng.integers(1, 29, size=n)
            patients = rng.integers(0, 800, size=n)
            mod = rng.random(n) < mod25
            proc = np.where(mod, rng.gamma(4.0, PROC_FEE_MEAN / 4.0, size=n), 0.0)
            # exact duplicates: re-submit a random subset of this month's lines
            n_dup = int(rng.binomial(n, dup))
            dup_idx = rng.choice(n, size=n_dup, replace=False) if n_dup else np.array([], dtype=int)
            idx = np.concatenate([np.arange(n), dup_idx])
            cols["provider_id"].append(np.repeat(p["provider_id"], len(idx)))
            cols["specialty"].append(np.repeat(p["specialty"], len(idx)))
            cols["month"].append(np.repeat(str(month), len(idx)))
            cols["service_date"].append(np.array([f"{month}-{d:02d}" for d in days[idx]]))
            cols["patient_id"].append(np.array([f"{p['provider_id']}-M{x:04d}" for x in patients[idx]]))
            cols["em_code"].append(codes[idx])
            cols["modifier_25"].append(mod[idx].astype(int))
            cols["em_paid"].append(np.array([EM_FEE[c] for c in codes[idx]]))
            cols["proc_paid"].append(np.round(proc[idx], 2))
    claims = pd.DataFrame({k: np.concatenate(v) for k, v in cols.items()})
    claims.insert(0, "claim_id", [f"C{i:07d}" for i in range(len(claims))])
    claims["total_paid"] = claims["em_paid"] + claims["proc_paid"]
    truth = pd.DataFrame([{"provider_id": p["provider_id"], "specialty": p["specialty"],
                           "archetype": p["archetype"]} for p in providers])
    return claims, truth


# --------------------------------------------------------------------------
# 2. Features
# --------------------------------------------------------------------------
def build_features(claims: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    c = claims.copy()
    c["em_level"] = c["em_code"].map(EM_LEVEL)
    c["em_high"] = (c["em_level"] >= 4).astype(int)
    c["em5"] = (c["em_level"] == 5).astype(int)
    # An encounter is one patient, one date, one E/M code; exact re-submissions are not extra visits.
    enc = c.drop_duplicates(["provider_id", "patient_id", "service_date", "em_code"])
    monthly = (enc.groupby(["provider_id", "month"])
                .agg(visits=("claim_id", "size"), high=("em_high", "sum"), paid=("total_paid", "sum"))
                .reset_index())
    # make the monthly panel complete (a month with zero claims is still a month)
    full = pd.MultiIndex.from_product([sorted(c["provider_id"].unique()), [str(m) for m in MONTHS]],
                                      names=["provider_id", "month"])
    monthly = monthly.set_index(["provider_id", "month"]).reindex(full, fill_value=0).reset_index()

    g = enc.groupby("provider_id")            # billing-mix features on encounters
    ga = c.groupby("provider_id")             # volume and duplicate features on all lines
    dup_groups = c.groupby(["provider_id", "patient_id", "service_date", "em_code"]).size()
    extra = (dup_groups - 1).clip(lower=0).groupby(level="provider_id").sum()
    mv = monthly.groupby("provider_id")["visits"]
    feats = pd.DataFrame({
        "specialty": g["specialty"].first(),
        "n_claims": ga.size(),
        "em_high_share": g["em_high"].mean(),
        "em5_share": g["em5"].mean(),
        "em_mean_level": g["em_level"].mean(),
        "mod25_rate": g["modifier_25"].mean(),
        "dup_rate": extra / ga.size(),
        "visits_per_month": mv.mean(),
        "visits_cv": mv.std() / mv.mean(),
        "paid_per_visit": g["total_paid"].mean(),
    }).reset_index()
    return feats, monthly


# --------------------------------------------------------------------------
# 3. Detectors
# --------------------------------------------------------------------------
def modified_z(x: pd.Series) -> pd.Series:
    """Iglewicz-Hoaglin modified z-score: 0.6745 * (x - median) / MAD."""
    med = x.median()
    mad = (x - med).abs().median()
    if mad == 0:                                   # fall back to mean absolute deviation
        mad = (x - med).abs().mean() * 1.253314 or 1e-9
    return 0.6745 * (x - med) / mad


def detector_peer(feats: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """A. Within-specialty robust z-scores; flag any feature with z > threshold (over-billing side)."""
    z = feats[["provider_id", "specialty"]].copy()
    for f in FEATURES:
        z[f] = feats.groupby("specialty")[f].transform(modified_z)
    z["peer_max_z"] = z[FEATURES].max(axis=1)
    z["peer_flag"] = z["peer_max_z"] > Z_THRESHOLD
    peer_medians = feats.groupby("specialty")[FEATURES].median()
    return z, peer_medians


def detector_timeseries(monthly: pd.DataFrame, window: int = 6) -> pd.DataFrame:
    """B. Rolling-window volume outliers + E/M level-shift (change-point) test per provider."""
    out = []
    for pid, grp in monthly.groupby("provider_id"):
        grp = grp.sort_values("month")
        v = grp["visits"].to_numpy(dtype=float)
        h = grp["high"].to_numpy(dtype=float)
        months = grp["month"].tolist()
        # B1: rolling robust z on monthly visits (trailing window, excludes current month)
        zs = np.full(len(v), np.nan)
        for t in range(window, len(v)):
            w = v[t - window:t]
            med = np.median(w)
            mad = np.median(np.abs(w - med))
            mad = max(mad, 0.6745 * np.sqrt(max(med, 1.0)))   # counts are at least Poisson-noisy
            zs[t] = 0.6745 * (v[t] - med) / mad
        spike_months = [months[t] for t in range(len(v)) if zs[t] > VOLUME_Z_THRESHOLD]
        t_max = int(np.nanargmax(zs)) if np.isfinite(zs).any() else window
        # B2: E/M level shift - best split by two-proportion z (first segment vs second)
        best = (0.0, None, 0.0, 0.0)
        for s in range(6, len(v) - 5):
            n1, n2 = v[:s].sum(), v[s:].sum()
            if n1 == 0 or n2 == 0:
                continue
            p1, p2 = h[:s].sum() / n1, h[s:].sum() / n2
            p = (h.sum()) / (n1 + n2)
            se = np.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)) or 1e-9
            zshift = (p2 - p1) / se
            if zshift > best[0]:
                best = (zshift, months[s], p1, p2)
        out.append(dict(
            provider_id=pid,
            ts_volume_max_z=float(np.nanmax(zs)) if np.isfinite(zs).any() else 0.0,
            ts_volume_peak_month=months[t_max],
            ts_volume_peak_visits=float(v[t_max]),
            ts_volume_trailing_median=float(np.median(v[max(0, t_max - window):t_max])) if t_max else float("nan"),
            ts_spike_months=";".join(spike_months),
            ts_volume_flag=len(spike_months) >= 2,
            shift_z=float(best[0]), shift_month=best[1],
            shift_before=float(best[2]), shift_after=float(best[3]),
            shift_flag=best[0] > SHIFT_Z_THRESHOLD,
        ))
    ts = pd.DataFrame(out)
    ts["ts_flag"] = ts["ts_volume_flag"] | ts["shift_flag"]
    return ts


def detector_isoforest(z: pd.DataFrame, contamination: float = 0.06, seed: int = SEED) -> pd.DataFrame:
    """C. Isolation Forest on the peer-normalised feature matrix (multivariate, unsupervised)."""
    res = z[["provider_id"]].copy()
    try:
        from sklearn.ensemble import IsolationForest
    except ImportError:
        print("  [note] scikit-learn not installed - Isolation Forest skipped (pip install scikit-learn)")
        res["iso_score"], res["iso_flag"] = 0.0, False
        return res
    X = z[FEATURES].to_numpy()
    model = IsolationForest(n_estimators=300, contamination=contamination, random_state=seed)
    pred = model.fit_predict(X)
    res["iso_score"] = -model.score_samples(X)      # higher = more anomalous
    res["iso_flag"] = pred == -1
    return res


# --------------------------------------------------------------------------
# 4. Consensus, evidence packets, auditor briefs
# --------------------------------------------------------------------------
def build_evidence(row: pd.Series, feats_row: pd.Series, peer_medians: pd.DataFrame) -> list[dict]:
    ev = []
    med = peer_medians.loc[row["specialty"]]
    for f in FEATURES:
        if row[f] > Z_THRESHOLD:
            ev.append(dict(detector="peer", signal=f, z=round(float(row[f]), 1),
                           value=round(float(feats_row[f]), 3), peer_median=round(float(med[f]), 3),
                           text=f"{FEATURE_LABEL[f]} is {feats_row[f]:.3g} vs a specialty median of "
                                f"{med[f]:.3g} (modified z = {row[f]:.1f})"))
    if row["ts_volume_flag"]:
        ev.append(dict(detector="timeseries", signal="volume_ts", z=round(float(row["ts_volume_max_z"]), 1),
                       value=row["ts_volume_peak_visits"], peer_median=row["ts_volume_trailing_median"],
                       text=f"monthly visits reached {row['ts_volume_peak_visits']:.0f} in "
                            f"{row['ts_volume_peak_month']} vs a trailing 6-month median of "
                            f"{row['ts_volume_trailing_median']:.0f} (z = {row['ts_volume_max_z']:.1f}); "
                            f"anomalous months: {row['ts_spike_months'].replace(';', ', ')}"))
    if row["shift_flag"]:
        ev.append(dict(detector="timeseries", signal="em_shift", z=round(float(row["shift_z"]), 1),
                       value=round(float(row["shift_after"]), 3), peer_median=round(float(row["shift_before"]), 3),
                       text=f"share of level 4-5 E/M visits rose from {row['shift_before']:.2f} to "
                            f"{row['shift_after']:.2f} starting {row['shift_month']} (two-proportion z = "
                            f"{row['shift_z']:.1f})"))
    if row.get("iso_flag", False):
        ev.append(dict(detector="isoforest", signal="multivariate", z=round(float(row["iso_score"]), 3),
                       value=None, peer_median=None,
                       text=f"multivariate billing profile is isolated from peers (Isolation Forest "
                            f"score {row['iso_score']:.3f}, ranked {int(row['iso_rank'])} of {int(row['n_providers'])})"))
    ev.sort(key=lambda e: -(e["z"] if e["detector"] != "isoforest" else 0))
    return ev


def critic(evidence: list[dict], n_claims: int, n_det: int) -> tuple[list[dict], str, str]:
    """Deterministic structural release gate: every packet must pass these checks before a case
    is opened. It verifies that the required elements are present and consistent, not that a
    claim is true; that is the human reviewer's job."""
    explainable = [e for e in evidence if e["detector"] != "isoforest"]
    max_z = max((e["z"] for e in explainable), default=0.0)
    checks = [
        dict(check="explainable signal present (not multivariate-only)", passed=bool(explainable)),
        dict(check="peer or trailing baseline attached to every signal",
             passed=bool(explainable) and all(e.get("peer_median") is not None for e in explainable)),
        dict(check=f"claim volume >= {MIN_CLAIMS_FOR_REVIEW} lines", passed=n_claims >= MIN_CLAIMS_FOR_REVIEW),
        dict(check=f"corroborated: 2+ detectors agree or one signal with z >= {STRONG_SINGLE_Z:g}",
             passed=n_det >= 2 or max_z >= STRONG_SINGLE_Z),
        dict(check="governing policy identified for every signal",
             passed=bool(explainable) and all(e["signal"] in POLICY_SOURCE for e in explainable)),
    ]
    failed = [c["check"] for c in checks if not c["passed"]]
    if failed:
        return checks, "WITHHOLD", failed[0]
    return checks, "REVIEW", "all critic checks passed"


def template_brief(pid: str, specialty: str, n_det: int, evidence: list[dict], disposition: str,
                   reason: str, required: list[str]) -> str:
    lead = [e for e in evidence if e["detector"] != "isoforest"] or evidence
    primary = lead[0]
    steps = []
    for e in lead:
        s = NEXT_STEP.get(e["signal"])
        if s and s not in steps:
            steps.append(s)
    lines = [f"Provider {pid} ({specialty}) is flagged by {n_det} of 3 detectors.",
             f"Primary pattern: {primary['text']}."]
    if len(lead) > 1:
        lines.append("Supporting evidence: " + "; ".join(e["text"] for e in lead[1:]) + ".")
    if any(e["detector"] == "isoforest" for e in evidence) and lead is not evidence:
        lines.append("The multivariate Isolation Forest also isolates this provider's profile.")
    lines.append("Governing policy: " + "; ".join(dict.fromkeys(POLICY_SOURCE[e["signal"]] for e in lead)) + ".")
    if disposition == "REVIEW":
        lines.append("Disposition: REVIEW (" + reason + "). Evidence to request: " + "; ".join(required) + ".")
        lines.append("Suggested next step: " + " ".join(steps[:2]))
    else:
        lines.append("Disposition: WITHHOLD (failed check: " + reason + "). No case is opened; "
                     "re-evaluate with next month's data or after analyst review.")
    lines.append("This is a screening signal, not a determination; a human reviewer decides.")
    return "\n".join(lines)


def run_pipeline(seed: int = SEED) -> dict:
    rng = np.random.default_rng(seed)
    t0 = time.time()
    claims, truth = generate_claims(rng)
    feats, monthly = build_features(claims)
    z, peer_medians = detector_peer(feats)
    ts = detector_timeseries(monthly)
    iso = detector_isoforest(z, seed=seed)
    res = (z.merge(ts, on="provider_id").merge(iso, on="provider_id")
            .merge(feats[["provider_id", "n_claims"]], on="provider_id"))
    res["iso_rank"] = res["iso_score"].rank(ascending=False, method="first").astype(int)
    res["n_providers"] = len(res)
    res["n_detectors"] = res[["peer_flag", "ts_flag", "iso_flag"]].sum(axis=1).astype(int)
    res["max_signal_z"] = res[["peer_max_z", "ts_volume_max_z", "shift_z"]].max(axis=1)
    res = res.sort_values(["n_detectors", "max_signal_z", "iso_score"], ascending=False).reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res = res.merge(truth[["provider_id", "archetype"]], on="provider_id")   # for SCORING only
    feats_idx = feats.set_index("provider_id")
    packets = {}
    for _, r in res[res["n_detectors"] >= 1].iterrows():
        ev = build_evidence(r, feats_idx.loc[r["provider_id"]], peer_medians)
        checks, disposition, reason = critic(ev, int(r["n_claims"]), int(r["n_detectors"]))
        lead = [e for e in ev if e["detector"] != "isoforest"] or ev
        required = list(dict.fromkeys(REQUIRED_EVIDENCE[e["signal"]] for e in lead))
        packets[r["provider_id"]] = dict(
            provider_id=r["provider_id"], specialty=r["specialty"], rank=int(r["rank"]),
            n_detectors=int(r["n_detectors"]), n_claims=int(r["n_claims"]), evidence=ev,
            policy_source=list(dict.fromkeys(POLICY_SOURCE[e["signal"]] for e in lead)),
            required_evidence=required, critic_checks=checks, disposition=disposition,
            disposition_reason=reason, brief_source="template",
            brief=template_brief(r["provider_id"], r["specialty"], int(r["n_detectors"]), ev,
                                 disposition, reason, required))
    res["disposition"] = res["provider_id"].map(lambda p: packets.get(p, {}).get("disposition", "-"))
    return dict(claims=claims, truth=truth, feats=feats, monthly=monthly, results=res,
                packets=packets, peer_medians=peer_medians, seconds=time.time() - t0)


# --------------------------------------------------------------------------
# 5. Scorecard and dashboard
# --------------------------------------------------------------------------
def scorecard(res: pd.DataFrame, k: int) -> dict:
    n_true = int((res["archetype"] != "normal").sum())
    top = res.head(k)
    tp = int((top["archetype"] != "normal").sum())
    strong = res[res["n_detectors"] >= 2]
    return dict(k=k, n_true=n_true, tp=tp,
                precision_at_k=tp / k, recall_at_k=tp / n_true,
                n_two_plus=int(len(strong)),
                precision_two_plus=float((strong["archetype"] != "normal").mean()) if len(strong) else 0.0,
                recall_two_plus=int((strong["archetype"] != "normal").sum()) / n_true,
                recall_by_archetype={a: float((res.head(k)["archetype"] == a).sum() / N_PER_ARCHETYPE)
                                     for a in ARCHETYPES})


def average_precision(res: pd.DataFrame) -> float:
    hits = (res["archetype"] != "normal").to_numpy()
    if hits.sum() == 0:
        return 0.0
    cum = np.cumsum(hits)
    return float(np.sum(cum[hits] / (np.flatnonzero(hits) + 1)) / hits.sum())


def robustness(n_seeds: int) -> dict:
    """Precision@K across seeds (fixed contamination) and across contamination settings (fixed seed)."""
    rows = []
    for seed in range(1, n_seeds + 1):
        res = run_pipeline(seed)["results"]
        rows.append(dict(seed=seed, **{f"p@{k}": float((res.head(k)["archetype"] != "normal").mean())
                                       for k in (5, 10, 15)}, AP=average_precision(res)))
    df = pd.DataFrame(rows)
    summary = {c: dict(median=float(df[c].median()), q1=float(df[c].quantile(0.25)), q3=float(df[c].quantile(0.75)))
               for c in ("p@5", "p@10", "p@15", "AP")}
    contamination = {}
    for cont in (0.03, 0.06, 0.10):
        global detector_isoforest
        orig = detector_isoforest
        detector_isoforest = lambda z, contamination=cont, seed=SEED, _o=orig: _o(z, contamination=contamination, seed=seed)
        try:
            res = run_pipeline(SEED)["results"]
        finally:
            detector_isoforest = orig
        contamination[str(cont)] = dict(p15=float((res.head(15)["archetype"] != "normal").mean()),
                                        n_iso_flagged=int(res["iso_flag"].sum()),
                                        n_two_plus=int((res["n_detectors"] >= 2).sum()))
    return dict(n_seeds=n_seeds, per_seed=rows, summary=summary, contamination_sensitivity=contamination)


def make_dashboard(state: dict, out_png: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    res, feats, monthly = state["results"], state["feats"], state["monthly"]
    colors = {"Family Medicine": "#1f77b4", "Cardiology": "#d62728",
              "Orthopedics": "#2ca02c", "Dermatology": "#9467bd"}
    flagged = res[res["n_detectors"] >= 2]["provider_id"]
    fig, ax = plt.subplots(2, 2, figsize=(14, 9.5))
    fig.suptitle("Claims Anomaly Radar - synthetic professional claims, 240 providers x 24 months",
                 fontsize=15, fontweight="bold")

    # (1) peer scatter
    a = ax[0, 0]
    for spec, col in colors.items():
        d = feats[feats["specialty"] == spec]
        a.scatter(d["em_high_share"], d["mod25_rate"], s=22, color=col, alpha=0.6, label=spec)
    d = feats[feats["provider_id"].isin(flagged)]
    a.scatter(d["em_high_share"], d["mod25_rate"], s=110, facecolors="none", edgecolors="black",
              linewidths=1.6, label="flagged by 2+ detectors")
    a.set_xlabel("Share of level 4-5 E/M visits")
    a.set_ylabel("Modifier-25 rate")
    a.set_title("A. Peer-group view: each dot is a provider")
    a.legend(fontsize=8, loc="upper left")

    # (2) ranked consensus
    a = ax[0, 1]
    top = res.head(20).iloc[::-1]
    bar_col = top["n_detectors"].map({3: "#b2182b", 2: "#ef8a62", 1: "#fddbc7", 0: "#dddddd"})
    a.barh(top["provider_id"], top["max_signal_z"].clip(upper=40), color=bar_col)
    for y, (_, r) in enumerate(top.iterrows()):
        a.text(min(r["max_signal_z"], 40) + 0.5, y, f"{r['n_detectors']}/3", va="center", fontsize=8)
    a.set_xlabel("Strongest signal (modified z, capped at 40)")
    a.set_title("B. Top 20 providers by consensus rank (label = detectors agreeing)")

    # (3) volume time series for the strongest volume anomaly
    a = ax[1, 0]
    vp = res.sort_values("ts_volume_max_z", ascending=False).iloc[0]
    spec = vp["specialty"]
    peers = monthly[monthly["provider_id"].isin(feats[feats["specialty"] == spec]["provider_id"])]
    band = peers.groupby("month")["visits"].quantile([0.1, 0.5, 0.9]).unstack()
    x = np.arange(len(band))
    a.fill_between(x, band[0.1], band[0.9], color="grey", alpha=0.25, label=f"{spec} peers (10th-90th pct)")
    a.plot(x, band[0.5], color="grey", lw=1.5, label="peer median")
    mine = monthly[monthly["provider_id"] == vp["provider_id"]].sort_values("month")
    a.plot(x, mine["visits"], color="#b2182b", lw=2.2, marker="o", ms=3, label=f"{vp['provider_id']}")
    for m in vp["ts_spike_months"].split(";"):
        if m:
            a.axvline(list(band.index).index(m), color="#b2182b", ls=":", lw=1)
    a.set_xticks(x[::3]); a.set_xticklabels(list(band.index)[::3], rotation=45, fontsize=8)
    a.set_ylabel("Visits per month")
    a.set_title(f"C. Time series: rolling-window volume anomaly (z = {vp['ts_volume_max_z']:.1f})")
    a.legend(fontsize=8)

    # (4) E/M level shift for the strongest change point
    a = ax[1, 1]
    sp = res.sort_values("shift_z", ascending=False).iloc[0]
    spec = sp["specialty"]
    peers = monthly[monthly["provider_id"].isin(feats[feats["specialty"] == spec]["provider_id"])].copy()
    peers["share"] = peers["high"] / peers["visits"].replace(0, np.nan)
    pm = peers.groupby("month")["share"].median()
    mine = monthly[monthly["provider_id"] == sp["provider_id"]].sort_values("month")
    a.plot(x, pm.values, color="grey", lw=1.5, label=f"{spec} peer median")
    a.plot(x, (mine["high"] / mine["visits"].replace(0, np.nan)).values, color="#b2182b", lw=2.2, marker="o", ms=3,
           label=sp["provider_id"])
    a.axvline(list(pm.index).index(sp["shift_month"]), color="#b2182b", ls="--", lw=1.2,
              label=f"change point {sp['shift_month']}")
    a.set_xticks(x[::3]); a.set_xticklabels(list(pm.index)[::3], rotation=45, fontsize=8)
    a.set_ylabel("Share of level 4-5 E/M visits")
    a.set_ylim(0, 1)
    a.set_title(f"D. Time series: E/M level shift (two-proportion z = {sp['shift_z']:.1f})")
    a.legend(fontsize=8, loc="upper left")

    fig.tight_layout(rect=(0, 0, 1, 0.96))
    fig.savefig(out_png, dpi=130)
    plt.close(fig)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------
def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Claims Anomaly Radar (synthetic payment-integrity POC)")
    ap.add_argument("--out", default="output", help="output folder (default: ./output)")
    ap.add_argument("--provider", help="print the auditor brief for one provider id, e.g. P0042")
    ap.add_argument("--top", type=int, default=15, help="K for the console table and precision@K")
    ap.add_argument("--llm", action="store_true", help="write briefs with an LLM (needs ANTHROPIC_API_KEY)")
    ap.add_argument("--seed", type=int, default=SEED)
    ap.add_argument("--seeds", type=int, default=0, help="robustness run over N seeds and 3 contamination settings")
    args = ap.parse_args(argv)

    print("Claims Anomaly Radar")
    print("=" * 72)
    state = run_pipeline(args.seed)
    res, packets = state["results"], state["packets"]
    print(f"synthetic claims generated : {len(state['claims']):,} lines, "
          f"{res['provider_id'].nunique()} providers, {len(MONTHS)} months  ({state['seconds']:.1f}s)")

    if args.provider:
        p = packets.get(args.provider)
        if p is None:
            print(f"{args.provider}: not flagged by any detector.")
        else:
            print(f"\nAuditor brief - rank {p['rank']}\n" + "-" * 72 + "\n" + p["brief"])
        return 0

    if args.seeds:
        rb = robustness(args.seeds)
        print(f"\nRobustness over {args.seeds} seeds (median [IQR])")
        print("-" * 72)
        for k, v in rb["summary"].items():
            print(f"{k:>5}: {v['median']:.2f} [{v['q1']:.2f}, {v['q3']:.2f}]")
        print("contamination sensitivity (seed 42): " + ", ".join(
            f"{c}: p@15={v['p15']:.2f}, iso flags={v['n_iso_flagged']}" for c, v in rb["contamination_sensitivity"].items()))
        Path(args.out).mkdir(parents=True, exist_ok=True)
        with open(Path(args.out) / "robustness.json", "w") as fh:
            json.dump(rb, fh, indent=2)
        print(f"written to {Path(args.out) / 'robustness.json'}")
        return 0

    if args.llm:
        from llm_brief import write_brief
        for pid in res.head(args.top)["provider_id"]:
            if pid in packets and packets[pid]["disposition"] == "REVIEW":   # the LLM only verbalises packets the critic passed
                packets[pid]["brief"], packets[pid]["brief_source"] = write_brief(packets[pid])

    # console table
    print(f"\nTop {args.top} providers by consensus rank")
    print("-" * 72)
    print(f"{'rank':>4} {'provider':<8} {'specialty':<16} {'det':>4} {'max z':>7}  {'primary signal':<16} disposition")
    for _, r in res.head(args.top).iterrows():
        ev = packets.get(r["provider_id"], {}).get("evidence", [])
        lead = next((e for e in ev if e["detector"] != "isoforest"), ev[0] if ev else None)
        primary = (lead["signal"] if lead else "-")
        print(f"{r['rank']:>4} {r['provider_id']:<8} {r['specialty']:<16} {r['n_detectors']:>3}/3 "
              f"{r['max_signal_z']:>7.1f}  {primary:<16} {r['disposition']}")
    n_rev = sum(p["disposition"] == "REVIEW" for p in packets.values())
    print(f"\ncritic dispositions      : {n_rev} REVIEW, {len(packets) - n_rev} WITHHOLD "
          f"(of {len(packets)} providers flagged by at least one detector)")

    sc = scorecard(res, args.top)
    print("\nScorecard against injected ground truth (used for scoring only)")
    print("-" * 72)
    print(f"true anomalous providers : {sc['n_true']} of {len(res)}   (fixed seed; a wiring check on designed "
          f"anomalies, not production accuracy - see --seeds)")
    print(f"precision@{sc['k']}             : {sc['precision_at_k']:.2f}   recall@{sc['k']}: {sc['recall_at_k']:.2f}")
    print(f"flagged by 2+ detectors  : {sc['n_two_plus']} providers, precision {sc['precision_two_plus']:.2f}, "
          f"recall {sc['recall_two_plus']:.2f}")
    print("recall by archetype      : " + ", ".join(f"{a} {v:.2f}" for a, v in sc["recall_by_archetype"].items()))

    # example briefs: one REVIEW, one WITHHOLD
    first = res.head(1)["provider_id"].iloc[0]
    print(f"\nExample auditor brief (rank 1, {first})\n" + "-" * 72 + "\n" + packets[first]["brief"])
    held = next((p for p in packets.values() if p["disposition"] == "WITHHOLD"), None)
    if held:
        print(f"\nExample withheld packet (rank {held['rank']}, {held['provider_id']})\n" + "-" * 72 + "\n" + held["brief"])

    # write outputs
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    state["claims"].to_csv(out / "claims_synthetic.csv", index=False)
    state["feats"].round(4).to_csv(out / "provider_features.csv", index=False)
    cols = ["rank", "provider_id", "specialty", "n_detectors", "disposition", "peer_flag", "ts_flag", "iso_flag",
            "peer_max_z", "ts_volume_max_z", "shift_z", "iso_score", "archetype"]
    res[cols].round(3).to_csv(out / "flags.csv", index=False)
    with open(out / "evidence.json", "w") as fh:
        json.dump(list(packets.values()), fh, indent=2, default=str)
    with open(out / "auditor_briefs.md", "w") as fh:
        fh.write("# Auditor briefs - Claims Anomaly Radar (synthetic data)\n\n")
        for pid in res.head(args.top)["provider_id"]:
            if pid in packets:
                fh.write(f"## Rank {packets[pid]['rank']}: {pid}\n\n{packets[pid]['brief']}\n\n")
    with open(out / "scorecard.json", "w") as fh:
        json.dump(sc, fh, indent=2)
    make_dashboard(state, out / "dashboard.png")
    print(f"\noutputs written to {out.resolve()}/  (claims_synthetic.csv, provider_features.csv, "
          f"flags.csv, evidence.json, auditor_briefs.md, scorecard.json, dashboard.png)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
