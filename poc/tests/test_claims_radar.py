"""Smoke tests for Claims Anomaly Radar. Run from poc/:  python -m pytest -q"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import claims_radar as cr  # noqa: E402


def test_pipeline_runs_and_is_deterministic():
    a = cr.run_pipeline(seed=42)
    b = cr.run_pipeline(seed=42)
    assert len(a["claims"]) == len(b["claims"]) > 100_000
    assert a["results"]["provider_id"].tolist() == b["results"]["provider_id"].tolist()


def test_injected_anomalies_rank_first():
    res = cr.run_pipeline(seed=42)["results"]
    top = res.head(15)
    assert (top["archetype"] != "normal").mean() >= 0.8       # precision@15
    assert (res["n_detectors"] >= 2).sum() >= 10


def test_every_flagged_provider_has_an_evidence_packet_and_brief():
    state = cr.run_pipeline(seed=42)
    for pid, packet in state["packets"].items():
        assert packet["evidence"], pid
        assert "human reviewer decides" in packet["brief"]
        for e in packet["evidence"]:
            assert {"detector", "signal", "z", "text"} <= e.keys()


def test_ground_truth_is_not_used_by_detectors():
    """Detectors only see claims-derived features; the archetype column joins in after ranking."""
    import inspect
    for fn in (cr.build_features, cr.detector_peer, cr.detector_timeseries, cr.detector_isoforest):
        assert "archetype" not in inspect.getsource(fn)


def test_critic_dispositions_are_explicit_and_traceable():
    state = cr.run_pipeline(seed=42)
    packets = state["packets"].values()
    dispositions = {p["disposition"] for p in packets}
    assert dispositions <= {"REVIEW", "WITHHOLD"} and "REVIEW" in dispositions
    for p in packets:
        assert p["policy_source"] and p["required_evidence"] and p["critic_checks"]
        if p["disposition"] == "WITHHOLD":
            assert any(not c["passed"] for c in p["critic_checks"])
        else:
            assert all(c["passed"] for c in p["critic_checks"])
        assert "Disposition:" in p["brief"]


def test_critic_is_not_vacuous_on_multivariate_only_or_defective_packets():
    """The gate must fail closed: no explainable evidence, a missing baseline, or an unknown
    policy mapping each produce WITHHOLD with the specific check failed."""
    iso_only = [dict(detector="isoforest", signal="multivariate", z=0.6, value=None, peer_median=None, text="x")]
    checks, disp, _ = cr.critic(iso_only, n_claims=1000, n_det=1)
    by = {c["check"]: c["passed"] for c in checks}
    assert disp == "WITHHOLD"
    assert not by["explainable signal present (not multivariate-only)"]
    assert not by["peer or trailing baseline attached to every signal"]
    assert not by["governing policy identified for every signal"]

    no_baseline = [dict(detector="peer", signal="mod25_rate", z=9.0, value=0.6, peer_median=None, text="x")]
    _, disp, reason = cr.critic(no_baseline, n_claims=1000, n_det=2)
    assert disp == "WITHHOLD" and "baseline" in reason

    unknown_policy = [dict(detector="peer", signal="not_a_signal", z=9.0, value=1.0, peer_median=0.1, text="x")]
    _, disp, reason = cr.critic(unknown_policy, n_claims=1000, n_det=2)
    assert disp == "WITHHOLD" and "policy" in reason

    good = [dict(detector="peer", signal="mod25_rate", z=9.0, value=0.6, peer_median=0.3, text="x")]
    _, disp, _ = cr.critic(good, n_claims=1000, n_det=2)
    assert disp == "REVIEW"
