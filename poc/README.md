# Claims Anomaly Radar (proof of concept)

A small, end-to-end demonstrator of **pattern recognition for payment integrity**:
provider-level anomaly detection on professional claims, a deterministic critic that
marks every packet REVIEW or WITHHOLD, a plain-English auditor brief with the
governing policy and the evidence to request, and a scorecard against known ground truth.

Everything runs offline on **synthetic data**. No real claims, no PHI, no API keys.

## Quick start

```bash
pip install -r requirements.txt        # numpy, pandas, matplotlib, scikit-learn
python claims_radar.py                 # ~6 seconds; writes ./output
python claims_radar.py --provider P0039   # one auditor brief (REVIEW)
python claims_radar.py --provider P0036   # a withheld packet (WITHHOLD)
python claims_radar.py --seeds 20         # robustness over seeds and contamination (~50 s)
python -m pytest -q tests              # 6 tests (needs pytest)
```

A saved run is in `output/console_run.txt` if you would rather read than run.

## What it does

| Step | What happens |
|---|---|
| 1. Synthetic claims | 240 providers in 4 specialties x 24 months, about 295,000 claim lines (E/M codes 99212-99215, modifier 25, same-day procedures, exact duplicates). Fifteen providers carry an injected anomaly: steady upcoding, upcoding drift (level shift at month 13), a 4-month volume spike, modifier-25 overuse, or duplicate billing. |
| 2. Features | Per provider, on de-duplicated encounters (one patient, date and E/M code): share of level 4-5 visits, share of level-5 visits, mean E/M level, modifier-25 rate, visits per month, volume variability, paid per visit; exact-duplicate rate on all lines. |
| 3. Detector A: peer groups | Within-specialty robust z-scores (median / MAD, Iglewicz-Hoaglin modified z). Explainable, one number per feature. Eight features are scanned and any one over the cut-off flags, so this is uncalibrated screening, not a controlled false-positive rate. |
| 3. Detector B: time series | Rolling 6-month window outliers on monthly volume (with a Poisson noise floor) and a two-proportion change-point test for an E/M level shift. Catches what a snapshot cannot. |
| 3. Detector C: Isolation Forest | Multivariate, unsupervised, on the same peer-normalised feature matrix as A (so A and C are complementary views, not independent tests). Catches odd combinations. |
| 4. Consensus | Providers ranked by how many detectors agree, then by signal strength. Each flagged provider gets an evidence packet (`evidence.json`) with the governing policy and the evidence to request. |
| 4b. Critic | A deterministic structural release gate, five checks per packet: explainable signal present, baseline attached, at least 200 claim lines, corroboration (2+ detectors or one signal with z >= 8), governing policy identified. All pass: **REVIEW**; any fail: **WITHHOLD** (no case opened). It verifies that the required elements are present and consistent, not that a claim is true; that stays with the human reviewer. Briefs are in `auditor_briefs.md`. |
| 5. Scorecard | Precision / recall at K against the injected archetypes. Ground truth is used **only** here, never inside a detector. `--seeds N` repeats the run over N seeds and three contamination settings. |

With seed 42, 14 of the 15 injected providers rank in the top 15 and the one
non-anomalous provider that reached the top 15 is withheld by the critic. Over 20
seeds: precision@5 and @10 = 1.00, precision@15 median 0.93 [0.93, 0.95], average
precision 0.99 [0.97, 1.00]; changing the Isolation Forest contamination from 0.03
to 0.10 does not change precision@15. The injected anomalies are deliberately
clear, K equals the number of injected providers, and the contamination setting is
close to the true prevalence, so treat these as wiring checks, not estimates of
production accuracy.

## Outputs (`./output`)

`flags.csv` (ranked providers with dispositions), `provider_features.csv`,
`evidence.json` (packets with policy source, required evidence and critic checks),
`auditor_briefs.md`, `scorecard.json`, `robustness.json`, `dashboard.png`,
`console_run.txt`, and the regenerated `claims_synthetic.csv` (24 MB, git-ignored).

`tests/test_claims_radar.py` checks that the run is deterministic, that injected
anomalies rank first, that every flag carries an evidence packet, that dispositions
are traceable to a failed or passed check, that the gate fails closed on
multivariate-only, baseline-less or unmapped-policy packets, and that no detector
reads the ground-truth column.

## Optional: LLM-written briefs

`python claims_radar.py --llm` sends each REVIEW packet (never a withheld one) to
Claude (`claude-opus-5`, via the `anthropic` package; override with
`CLAIMS_RADAR_MODEL`) and asks for a 120-word auditor brief that uses only the facts
in the packet. The statistics decide what is anomalous and the critic decides what
is shown; the model only writes. Any API problem falls back to the template brief
and is labelled as such (`brief_source`).

## Design choices

* **Hack, don't over-engineer.** One file, four dependencies, no notebooks, no database.
* **Explainability first.** Every flag carries the feature, the provider's value, the peer median and the z-score.
* **Three views beat one.** Peer snapshot, time series and multivariate isolation each catch a different archetype; agreement between them is the confidence signal (they are complementary, not independent: A and C share features). The same idea at scale, an unsupervised ensemble of coding-subspace, peer-expenditure and regression detectors aggregated by voting, produced a near five-fold lift in DOJ-validated fraud targeting on 7.3 million Medicare inpatient claims (Shekhar, Leder-Luis & Akoglu, 2026, *Journal of Policy Analysis and Management*, https://doi.org/10.1002/pam.70078).
* **Abstain when the evidence is thin.** The critic withholds packets that lack an explainable signal, a baseline, volume, corroboration or a governing policy, because agents that push everything through are the documented failure mode (Nie et al., 2026).
* **Human decides.** The brief ends with "a human reviewer decides" on purpose.

## Limitations

Synthetic data has cleaner separation than real claims; thresholds (z > 3.5, volume
z > 4, shift z > 4, critic cut-offs) are heuristics that would need calibration on
audited outcomes; the change-point scan tests many cut points without a multiplicity
correction; specialty is the only peer-group dimension; the duplicate check matches
only patient, date and E/M code, so its next step is verification, not recovery; no
claim-level rules (NCCI edits, MUEs) are implemented. The
natural next step is the public CMS provider-level Medicare data, where ground truth
is partial and the Option 3 harness would set the thresholds.
