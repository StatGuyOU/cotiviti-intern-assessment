# Auditor briefs - Claims Anomaly Radar (synthetic data)

## Rank 1: P0201

Provider P0201 (Dermatology) is flagged by 3 of 3 detectors.
Primary pattern: monthly visits reached 223 in 2025-06 vs a trailing 6-month median of 70 (z = 18.2); anomalous months: 2025-06, 2025-07, 2025-08.
Supporting evidence: month-to-month volume variability is 0.637 vs a specialty median of 0.135 (modified z = 16.5).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Program Integrity Manual, Ch. 4 (benefit integrity: services not rendered).
Disposition: REVIEW (all critic checks passed). Evidence to request: scheduling capacity and staffing for the flagged months.
Suggested next step: Verify billed volume in the flagged months against scheduling capacity and beneficiary contact; screen for services not rendered.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 2: P0186

Provider P0186 (Dermatology) is flagged by 3 of 3 detectors.
Primary pattern: monthly visits reached 225 in 2025-06 vs a trailing 6-month median of 71 (z = 17.3); anomalous months: 2025-06, 2025-07, 2025-08.
Supporting evidence: month-to-month volume variability is 0.561 vs a specialty median of 0.135 (modified z = 14.0).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Program Integrity Manual, Ch. 4 (benefit integrity: services not rendered).
Disposition: REVIEW (all critic checks passed). Evidence to request: scheduling capacity and staffing for the flagged months.
Suggested next step: Verify billed volume in the flagged months against scheduling capacity and beneficiary contact; screen for services not rendered.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 3: P0205

Provider P0205 (Dermatology) is flagged by 3 of 3 detectors.
Primary pattern: month-to-month volume variability is 0.572 vs a specialty median of 0.135 (modified z = 14.4).
Supporting evidence: monthly visits reached 158 in 2025-06 vs a trailing 6-month median of 53 (z = 14.4); anomalous months: 2025-06, 2025-07, 2025-08.
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Program Integrity Manual, Ch. 4 (benefit integrity: services not rendered).
Disposition: REVIEW (all critic checks passed). Evidence to request: scheduling capacity and staffing for the flagged months.
Suggested next step: Verify billed volume in the flagged months against scheduling capacity and beneficiary contact; screen for services not rendered.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 4: P0039

Provider P0039 (Family Medicine) is flagged by 3 of 3 detectors.
Primary pattern: share of level 4-5 E/M visits rose from 0.45 to 0.76 starting 2025-01 (two-proportion z = 13.7).
Supporting evidence: share of level-5 (99215) visits is 0.22 vs a specialty median of 0.0954 (modified z = 3.5).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); AMA 2021 E/M guidelines.
Disposition: REVIEW (all critic checks passed). Evidence to request: documentation for 30 level 4-5 visits dated after the change point; documentation for a random sample of 30 level-5 visits.
Suggested next step: Focus the E/M documentation review on visits after the detected change point. Request documentation for a random sample of level 4-5 E/M visits and validate medical decision making / time against the 2021 AMA E/M guidelines.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 5: P0054

Provider P0054 (Family Medicine) is flagged by 3 of 3 detectors.
Primary pattern: share of level 4-5 E/M visits rose from 0.50 to 0.80 starting 2025-01 (two-proportion z = 11.0).
Supporting evidence: share of level-5 (99215) visits is 0.31 vs a specialty median of 0.0954 (modified z = 6.1); mean E/M level is 3.88 vs a specialty median of 3.47 (modified z = 4.0).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); AMA 2021 E/M guidelines.
Disposition: REVIEW (all critic checks passed). Evidence to request: documentation for 30 level 4-5 visits dated after the change point; documentation for a random sample of 30 level-5 visits; documentation for a random sample of 30 level 4-5 visits.
Suggested next step: Focus the E/M documentation review on visits after the detected change point. Request documentation for a random sample of level 4-5 E/M visits and validate medical decision making / time against the 2021 AMA E/M guidelines.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 6: P0114

Provider P0114 (Cardiology) is flagged by 2 of 3 detectors.
Primary pattern: exact-duplicate claim rate is 0.114 vs a specialty median of 0.00506 (modified z = 39.7).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: Payer duplicate-claim edit policy; CMS Medicare Claims Processing Manual, Ch. 1 (claim adjustments).
Disposition: REVIEW (all critic checks passed). Evidence to request: adjustment and reversal history for the duplicate claim groups.
Suggested next step: Verify adjustment and reversal history and the full claim attributes of the duplicate groups before considering an edit or a recovery.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 7: P0223

Provider P0223 (Dermatology) is flagged by 2 of 3 detectors.
Primary pattern: exact-duplicate claim rate is 0.11 vs a specialty median of 0.0048 (modified z = 33.2).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: Payer duplicate-claim edit policy; CMS Medicare Claims Processing Manual, Ch. 1 (claim adjustments).
Disposition: REVIEW (all critic checks passed). Evidence to request: adjustment and reversal history for the duplicate claim groups.
Suggested next step: Verify adjustment and reversal history and the full claim attributes of the duplicate groups before considering an edit or a recovery.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 8: P0191

Provider P0191 (Dermatology) is flagged by 2 of 3 detectors.
Primary pattern: exact-duplicate claim rate is 0.108 vs a specialty median of 0.0048 (modified z = 32.6).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: Payer duplicate-claim edit policy; CMS Medicare Claims Processing Manual, Ch. 1 (claim adjustments).
Disposition: REVIEW (all critic checks passed). Evidence to request: adjustment and reversal history for the duplicate claim groups.
Suggested next step: Verify adjustment and reversal history and the full claim attributes of the duplicate groups before considering an edit or a recovery.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 9: P0238

Provider P0238 (Dermatology) is flagged by 2 of 3 detectors.
Primary pattern: modifier-25 rate (E/M billed with a same-day procedure) is 0.661 vs a specialty median of 0.305 (modified z = 16.0).
Supporting evidence: paid amount per visit is 149 vs a specialty median of 121 (modified z = 5.4).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS NCCI Policy Manual for Medicare Services, Ch. I (modifier 25: significant, separately identifiable E/M service); Payer fee schedule and add-on procedure policy.
Disposition: REVIEW (all critic checks passed). Evidence to request: procedure and E/M notes for 30 same-day E/M + procedure pairs; add-on procedure documentation for a sample of 30 visits.
Suggested next step: Review same-day E/M + procedure pairs for modifier-25 support (a separately identifiable service must be documented). Compare the paid-code mix with peers and review add-on procedure billing.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 10: P0008

Provider P0008 (Family Medicine) is flagged by 2 of 3 detectors.
Primary pattern: modifier-25 rate (E/M billed with a same-day procedure) is 0.636 vs a specialty median of 0.0756 (modified z = 15.6).
Supporting evidence: paid amount per visit is 156 vs a specialty median of 118 (modified z = 7.1).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS NCCI Policy Manual for Medicare Services, Ch. I (modifier 25: significant, separately identifiable E/M service); Payer fee schedule and add-on procedure policy.
Disposition: REVIEW (all critic checks passed). Evidence to request: procedure and E/M notes for 30 same-day E/M + procedure pairs; add-on procedure documentation for a sample of 30 visits.
Suggested next step: Review same-day E/M + procedure pairs for modifier-25 support (a separately identifiable service must be documented). Compare the paid-code mix with peers and review add-on procedure billing.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 11: P0209

Provider P0209 (Dermatology) is flagged by 2 of 3 detectors.
Primary pattern: modifier-25 rate (E/M billed with a same-day procedure) is 0.635 vs a specialty median of 0.305 (modified z = 14.8).
Supporting evidence: paid amount per visit is 147 vs a specialty median of 121 (modified z = 5.1).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS NCCI Policy Manual for Medicare Services, Ch. I (modifier 25: significant, separately identifiable E/M service); Payer fee schedule and add-on procedure policy.
Disposition: REVIEW (all critic checks passed). Evidence to request: procedure and E/M notes for 30 same-day E/M + procedure pairs; add-on procedure documentation for a sample of 30 visits.
Suggested next step: Review same-day E/M + procedure pairs for modifier-25 support (a separately identifiable service must be documented). Compare the paid-code mix with peers and review add-on procedure billing.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 12: P0225

Provider P0225 (Dermatology) is flagged by 2 of 3 detectors.
Primary pattern: share of level-5 (99215) visits is 0.321 vs a specialty median of 0.0437 (modified z = 10.9).
Supporting evidence: paid amount per visit is 162 vs a specialty median of 121 (modified z = 8.0); mean E/M level is 4.02 vs a specialty median of 3.12 (modified z = 7.4); share of level 4-5 E/M visits is 0.75 vs a specialty median of 0.278 (modified z = 6.6).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); AMA 2021 E/M guidelines; Payer fee schedule and add-on procedure policy.
Disposition: REVIEW (all critic checks passed). Evidence to request: documentation for a random sample of 30 level-5 visits; add-on procedure documentation for a sample of 30 visits; documentation for a random sample of 30 level 4-5 visits.
Suggested next step: Request documentation for a random sample of level 4-5 E/M visits and validate medical decision making / time against the 2021 AMA E/M guidelines. Compare the paid-code mix with peers and review add-on procedure billing.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 13: P0042

Provider P0042 (Family Medicine) is flagged by 2 of 3 detectors.
Primary pattern: share of level-5 (99215) visits is 0.357 vs a specialty median of 0.0954 (modified z = 7.4).
Supporting evidence: mean E/M level is 4.13 vs a specialty median of 3.47 (modified z = 6.4); share of level 4-5 E/M visits is 0.801 vs a specialty median of 0.452 (modified z = 5.2); paid amount per visit is 144 vs a specialty median of 118 (modified z = 4.8).
The multivariate Isolation Forest also isolates this provider's profile.
Governing policy: CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); AMA 2021 E/M guidelines; Payer fee schedule and add-on procedure policy.
Disposition: REVIEW (all critic checks passed). Evidence to request: documentation for a random sample of 30 level-5 visits; documentation for a random sample of 30 level 4-5 visits; add-on procedure documentation for a sample of 30 visits.
Suggested next step: Request documentation for a random sample of level 4-5 E/M visits and validate medical decision making / time against the 2021 AMA E/M guidelines. Compare the paid-code mix with peers and review add-on procedure billing.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 14: P0128

Provider P0128 (Orthopedics) is flagged by 1 of 3 detectors.
Primary pattern: share of level 4-5 E/M visits rose from 0.53 to 0.81 starting 2025-01 (two-proportion z = 8.1).
Governing policy: CMS Medicare Claims Processing Manual, Ch. 12, Sec. 30.6 (E/M services); AMA 2021 E/M guidelines.
Disposition: REVIEW (all critic checks passed). Evidence to request: documentation for 30 level 4-5 visits dated after the change point.
Suggested next step: Focus the E/M documentation review on visits after the detected change point.
This is a screening signal, not a determination; a human reviewer decides.

## Rank 15: P0036

Provider P0036 (Family Medicine) is flagged by 1 of 3 detectors.
Primary pattern: month-to-month volume variability is 0.231 vs a specialty median of 0.142 (modified z = 3.8).
Governing policy: CMS Program Integrity Manual, Ch. 4 (benefit integrity: services not rendered).
Disposition: WITHHOLD (failed check: corroborated: 2+ detectors agree or one signal with z >= 8). No case is opened; re-evaluate with next month's data or after analyst review.
This is a screening signal, not a determination; a human reviewer decides.

