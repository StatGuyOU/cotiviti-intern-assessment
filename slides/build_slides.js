const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";           // 10 x 5.625 in
pres.author = "Penghua Wang";
pres.title = "Pattern Recognition for Payment Integrity";

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", RED = "B2182B", GRAY = "595959", TINT = "F2F5FB", ROSE = "FBEFEF", INK = "1F2937";
const F = "Calibri";

function radar(slide, cx, cy, r, lineColor, dot) {
  [1, 0.66, 0.33].forEach(k => slide.addShape(pres.ShapeType.ellipse, {
    x: cx - r * k, y: cy - r * k, w: 2 * r * k, h: 2 * r * k, fill: { type: "none" }, line: { color: lineColor, width: 1 } }));
  if (dot) slide.addShape(pres.ShapeType.ellipse, { x: dot[0] - 0.09, y: dot[1] - 0.09, w: 0.18, h: 0.18, fill: { color: RED }, line: { color: RED, width: 0 } });
}
function title(slide, text, sub) {
  slide.addText(text, { x: 0.5, y: 0.3, w: 8.4, h: 0.6, fontFace: F, fontSize: 30, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "top" });
  if (sub) slide.addText(sub, { x: 0.5, y: 0.88, w: 8.4, h: 0.32, fontFace: F, fontSize: 13, color: GRAY, isTextBox: true, margin: 0, valign: "top" });
  radar(slide, 9.3, 0.55, 0.28, ICE, [9.42, 0.45]);
}
function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 }, rectRadius: 0.08 });
}
function circleNum(slide, x, y, n, fill, txt) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color: fill }, line: { color: fill, width: 0 } });
  slide.addText(String(n), { x, y, w: 0.42, h: 0.42, fontFace: F, fontSize: 15, bold: true, color: txt, align: "center", valign: "middle", isTextBox: true, margin: 0 });
}
const bullets = (items, size = 13, color = INK) => items.map((s, k) => ({ text: s, options: { bullet: true, breakLine: k < items.length - 1, fontFace: F, fontSize: size, color, paraSpaceAfter: 6 } }));

// ---------- 1. Title ----------
let s = pres.addSlide();
s.background = { color: NAVY };
radar(s, 7.6, 2.9, 1.9, "4C5B9A", [8.45, 2.05]);
s.addText("Pattern Recognition for Payment Integrity", { x: 0.6, y: 1.25, w: 5.9, h: 1.5, fontFace: F, fontSize: 36, bold: true, color: WHITE, isTextBox: true, margin: 0, valign: "top" });
s.addText("From rules to reasoning agents", { x: 0.6, y: 2.8, w: 5.9, h: 0.5, fontFace: F, fontSize: 20, color: ICE, isTextBox: true, margin: 0 });
s.addText("Topic: Clinical Decision Making and Pattern Recognition in Health Care", { x: 0.6, y: 4.25, w: 6.4, h: 0.32, fontFace: F, fontSize: 12, color: ICE, isTextBox: true, margin: 0 });
s.addText("Penghua Wang  |  Ph.D. Candidate, Data Science and Analytics, University of Oklahoma", { x: 0.6, y: 4.6, w: 6.6, h: 0.32, fontFace: F, fontSize: 12, color: WHITE, isTextBox: true, margin: 0 });
s.addText("Prepared for Cotiviti, Inc.  |  September 2026", { x: 0.6, y: 4.92, w: 6.4, h: 0.32, fontFace: F, fontSize: 12, color: ICE, isTextBox: true, margin: 0 });
s.addNotes("Hi, I'm Penghua Wang. I'm a PhD candidate in data science with a master's in statistics, and this is my Cotiviti intern assessment. I chose the topic clinical decision making and pattern recognition in health care, and I focused it on payment integrity: how statistics, machine learning, and now reasoning agents find the claims and providers that deserve a closer look. I'll cover the report in about two minutes, then show a working proof of concept.");

// ---------- 2. Why it matters ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "Why it matters", "Improper payment is not a measure of fraud; fraud alone is estimated at 3-10% of spending (NHCAA)");
s.addChart(pres.ChartType.bar, [{ name: "Improper payments, FY2025 ($B)",
  labels: ["Medicaid", "Medicare FFS", "Medicare Part C", "Medicare Part D"], values: [37.39, 28.83, 23.67, 4.23] }],
  { x: 0.5, y: 1.3, w: 5.2, h: 3.9, barDir: "col", chartColors: [NAVY], showLegend: false,
    showTitle: true, title: "CMS improper payment estimates, FY2025 ($ billions)", titleFontSize: 13, titleColor: NAVY, titleFontFace: F,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: INK, dataLabelFormatCode: "$0.0",
    catAxisLabelFontSize: 11, catAxisLabelColor: INK, catAxisLabelFontFace: F, valAxisLabelFontSize: 10, valAxisLabelColor: GRAY,
    valGridLine: { color: "E5E7EB", size: 0.5 }, catGridLine: { style: "none" }, valAxisMaxVal: 45, valAxisLabelFormatCode: "$0" });
const stats = [
  ["$14.6B", "Intended loss in the 2025 National Health Care Fraud Takedown: 324 defendants; proactive analytics stopped about $4.4B"],
  ["95%", "of appealed Medicare Advantage skilled-nursing prior-authorization denials were overturned (OIG, 2026)"],
];
stats.forEach((st, k) => {
  const x = 6.0, y = 1.3 + k * 2.0;
  card(s, x, y, 3.5, 1.8, TINT);
  s.addText(st[0], { x: x + 0.25, y: y + 0.12, w: 3.0, h: 0.7, fontFace: F, fontSize: 36, bold: true, color: RED, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(st[1], { x: x + 0.25, y: y + 0.85, w: 3.05, h: 0.9, fontFace: F, fontSize: 11.5, color: INK, isTextBox: true, margin: 0, valign: "top" });
});
s.addText("Sources: CMS (2026) Fiscal Year 2025 Improper Payments Fact Sheet; U.S. Department of Justice (2025); HHS-OIG (2026) OEI-09-24-00331; NHCAA.", { x: 0.5, y: 5.25, w: 9, h: 0.3, fontFace: F, fontSize: 9, color: GRAY, isTextBox: true, margin: 0 });
s.addNotes("CMS estimated improper payments of 28.8 billion dollars in Medicare fee-for-service and 37.4 billion in Medicaid for fiscal 2025. Improper does not mean fraudulent, but fraud alone is estimated at three to ten percent of spending, and enforcement is now analytics-led: the 2025 national takedown charged 324 defendants with 14.6 billion in intended loss. And when skilled-nursing denials were appealed, OIG found Medicare Advantage plans overturned 95 percent of them, which is why overturn rate matters later in this talk.");

// ---------- 3. Concept ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "The concept: five questions, one stack", "Pattern recognition for treatment, payment and operations (TPO)");
const qs = [["Classification", "Is this claim payable as billed?"], ["Prediction", "Which claims will fail a medical record review?"],
  ["Inference", "Does this provider differ from peers by more than chance?"], ["Clustering", "Which providers share a billing profile?"],
  ["Time series", "When did a provider's behavior change?"]];
qs.forEach((q, k) => {
  const y = 1.4 + k * 0.74;
  circleNum(s, 0.5, y, k + 1, NAVY, WHITE);
  s.addText([{ text: q[0] + "  ", options: { bold: true, color: NAVY, fontSize: 15 } }, { text: q[1], options: { color: INK, fontSize: 13 } }],
    { x: 1.05, y: y - 0.02, w: 4.9, h: 0.46, fontFace: F, isTextBox: true, margin: 0, valign: "middle" });
});
card(s, 6.3, 1.4, 3.2, 3.6, NAVY);
s.addText("The new layer: chain reasoning", { x: 6.55, y: 1.6, w: 2.7, h: 0.6, fontFace: F, fontSize: 17, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText("LLM agents that retrieve policy, read records and draft findings (Wei et al., 2022; Yao et al., 2023).\n\nDetectors find the signal. The agent assembles the evidence and the policy citations. A human auditor makes the determination.",
  { x: 6.55, y: 2.25, w: 2.7, h: 2.6, fontFace: F, fontSize: 12.5, color: ICE, isTextBox: true, margin: 0, valign: "top" });
s.addNotes("The topic breaks into five questions. Classification: is this claim payable as billed? Prediction: which claims will fail a record review? Inference: is this provider different from peers by more than chance? Clustering: who shares a billing profile? And time series: when did behavior change? The new layer on top is chain reasoning, where a language model with tools assembles evidence and explains it.");

// ---------- 4. Trends ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "Trends: from rules to reasoning agents", "Past, present and future of pattern recognition in payment integrity");
s.addShape(pres.ShapeType.line, { x: 1.95, y: 1.85, w: 6.1, h: 0, line: { color: ICE, width: 3 } });
const stages = [
  ["Past", "Deterministic rules", ["Coding edits, bundling logic, frequency limits", "Precise and auditable", "Blind to patterns across claims, providers and months"]],
  ["Present", "Statistical models", ["Supervised triage on audited outcomes", "Explainable unsupervised ensembles: 5x lift in overlap with DOJ-action hospitals (Shekhar et al., 2026)", "Earlier intervention: Cotiviti's Proactive COB acts at enrollment (2026)"]],
  ["Future", "Reasoning agents", ["LLMs encode clinical knowledge (Singhal et al., 2023)", "Coder + critic agents (Yin et al., 2026); the same pattern for policy citations", "Coexistence, not replacement: rules, ranking, agent, critic, human"]],
];
stages.forEach((st, k) => {
  const cx = 1.95 + k * 3.05;
  s.addShape(pres.ShapeType.ellipse, { x: cx - 0.2, y: 1.65, w: 0.4, h: 0.4, fill: { color: k === 2 ? RED : NAVY }, line: { color: WHITE, width: 2 } });
  s.addText(st[0], { x: cx - 1.0, y: 1.28, w: 2.0, h: 0.35, fontFace: F, fontSize: 15, bold: true, color: k === 2 ? RED : NAVY, align: "center", isTextBox: true, margin: 0 });
  card(s, cx - 1.45, 2.3, 2.9, 2.9, TINT);
  s.addText(st[1], { x: cx - 1.25, y: 2.42, w: 2.5, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText(bullets(st[2], 12), { x: cx - 1.25, y: 2.85, w: 2.55, h: 2.25, fontFace: F, isTextBox: true, margin: 0, valign: "top" });
});
s.addNotes("Rules came first: precise, but blind across claims and months. Today, statistical models rank providers, and a 2026 study on seven million Medicare claims showed explainable ensembles give a five-fold lift in targeting. The future is coexistence, not replacement: rules, statistical ranking, an agent that assembles evidence, a critic that checks it, and a human who decides.");

// ---------- 5. Opportunities and threats ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "Opportunities and threats");
card(s, 0.5, 1.3, 4.4, 3.7, TINT);
s.addText("Opportunities", { x: 0.75, y: 1.45, w: 3.9, h: 0.45, fontFace: F, fontSize: 20, bold: true, color: NAVY, isTextBox: true, margin: 0 });
s.addText(bullets([
  "Explainable triage: rule hits, peer z-scores and change points in one evidence packet",
  "Emerging-scheme discovery where no rule exists yet",
  "Cross-payer signal across 100+ payers, within contracts and de-identification"], 15),
  { x: 0.75, y: 1.95, w: 3.95, h: 2.9, fontFace: F, isTextBox: true, margin: 0, valign: "top" });
card(s, 5.1, 1.3, 4.4, 3.7, ROSE);
s.addText("Threats", { x: 5.35, y: 1.45, w: 3.9, h: 0.45, fontFace: F, fontSize: 20, bold: true, color: RED, isTextBox: true, margin: 0 });
s.addText(bullets([
  "False positives cost reviewer time and provider goodwill",
  "Automation bias: browser agents almost never withheld a deficient prior-auth submission (Nie et al., 2026)",
  "AI-assisted denials are in court and before Congress (Raza et al., 2026); 95% of appealed SNF denials overturned (OIG, 2026)"], 15),
  { x: 5.35, y: 1.95, w: 3.95, h: 2.9, fontFace: F, isTextBox: true, margin: 0, valign: "top" });
s.addNotes("The opportunities: explainable triage, emerging-scheme discovery, audit copilots, and cross-payer signal. The threats: false positives cost reviewer time and provider goodwill; agents push work through, and a 2026 study found frontier browser agents almost never withheld a deficient submission; bias can cluster flags on safety-net practices; and AI-assisted denials are already in court.");

// ---------- 6. Three deltas ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "Three deltas on what Cotiviti already has", "Not new products: extensions of 360 Pattern Review, Clinical Chart Validation and the AI governance program");
const hdr = ["Option", "Already at Cotiviti", "Proposed delta", "Pilot gate"];
const colX = [0.5, 2.25, 4.55, 7.45], colW = [1.65, 2.2, 2.8, 2.05];
hdr.forEach((h, k) => s.addText(h, { x: colX[k], y: 1.3, w: colW[k], h: 0.32, fontFace: F, fontSize: 13, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" }));
const rowsD = [
  ["1. Evidence-and-abstention layer", "Clinical Chart Validation: ML-prioritised charts, specialist review; 360 Pattern Review leads", "Agent returns cited facts and missing-evidence checks for a lead; critic verifies; packet marked REVIEW or WITHHOLD; never a determination", "6-week shadow mode: citation coverage, unsupported-claim rate, reviewer minutes, edit rate, overturn rate"],
  ["2. Time-aware change-point signals", "360 Pattern Review: provider scoring with AI and expert rules, prepay and postpay", "Rolling-window volume and change-point detectors added to peer scoring; rank by detector agreement", "Leads accepted by FWA experts per quarter; precision of leads at audit"],
  ["3. Release gate for models and agents", "AI Governance Committee since 2023; AI Risk Management Framework; AI Center of Excellence", "Product-level harness: pre-registered acceptance criteria, blinded and external validation, drift monitoring, overturn-rate audit", "Precision at K; recall on known schemes; false-positive cost; overturn rate"],
];
rowsD.forEach((r, i) => {
  const y = 1.68 + i * 1.02;
  card(s, 0.5, y, 9.0, 0.94, i === 1 ? TINT : "F7F8FC");
  r.forEach((txt, k) => s.addText(txt, { x: colX[k] + 0.08, y: y + 0.05, w: colW[k] - 0.16, h: 0.84, fontFace: F, fontSize: k === 0 ? 12 : 10.5, bold: k === 0, color: k === 0 ? NAVY : INK, isTextBox: true, margin: 0, valign: "middle" }));
});
card(s, 0.5, 4.78, 9.0, 0.5, NAVY);
s.addText([{ text: "Recommendation: ", options: { bold: true, color: WHITE } }, { text: "start 3 and 1 together; Option 1 runs six weeks in shadow mode before any reviewer acts on its output.", options: { color: ICE } }],
  { x: 0.75, y: 4.78, w: 8.5, h: 0.5, fontFace: F, fontSize: 12.5, isTextBox: true, margin: 0, valign: "middle" });
s.addNotes("Cotiviti already runs 360 Pattern Review, Clinical Chart Validation, and an AI governance program, so my options are deltas, not new products. One: an evidence-and-abstention layer for existing leads, run in shadow mode, that returns cited facts and marks each packet review or withhold. Two: time-aware change-point signals added to provider scoring. Three: a release gate for every model and agent, with overturn rate as the headline metric, because OIG found Medicare Advantage plans overturned ninety-five percent of appealed skilled-nursing denials. Start with three and one together.");

// ---------- 7. POC architecture ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "Proof of concept: Claims Anomaly Radar", "A small version of Options 2 and 1, built to prove the pattern, not to ship");
const flow = [
  ["Synthetic claims", "295K lines, 240 providers x 24 months, 15 injected anomalies"],
  ["Provider features", "E/M mix, level-5 share, modifier-25 rate, duplicates, de-duplicated volume, variability, paid per visit"],
  ["Three complementary detectors", "A: peer-group robust z   B: time series (spikes, level shift)   C: Isolation Forest"],
  ["Consensus rank", "Detectors agreeing, then signal strength; evidence packet per provider"],
  ["Critic and disposition", "Explainable signal, baseline, claim volume, corroboration, governing policy: REVIEW or WITHHOLD"],
  ["Auditor brief + scorecard", "Plain-English brief with policy and evidence to request; precision against ground truth"],
];
flow.forEach((f, k) => {
  const y = 1.3 + k * 0.64;
  card(s, 0.5, y, 2.8, 0.52, k === 2 || k === 4 ? RED : NAVY);
  s.addText(f[0], { x: 0.65, y, w: 2.55, h: 0.52, fontFace: F, fontSize: 12.5, bold: true, color: WHITE, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(f[1], { x: 3.55, y, w: 5.9, h: 0.52, fontFace: F, fontSize: 11.5, color: INK, isTextBox: true, margin: 0, valign: "middle" });
  if (k < flow.length - 1) s.addShape(pres.ShapeType.downArrow, { x: 1.78, y: y + 0.52, w: 0.24, h: 0.12, fill: { color: ICE }, line: { color: ICE, width: 0 } });
});
s.addText("One Python file, four dependencies, about six seconds per run, six tests. No PHI, no API keys. Ground truth is used only for scoring, never for detection.",
  { x: 0.5, y: 5.15, w: 9, h: 0.3, fontFace: F, fontSize: 10.5, italic: true, color: GRAY, isTextBox: true, margin: 0 });
s.addNotes("The proof of concept is a small version of options two and one, on synthetic claims. It generates about 295 thousand claim lines for 240 providers over 24 months, with fifteen injected anomalies. Three complementary detectors run: peer-group robust z-scores within specialty, time-series spike and change-point tests, and an Isolation Forest. Providers rank by how many detectors agree. Then a deterministic critic checks every packet and marks it review or withhold. The scorecard uses the injected ground truth only for scoring: fourteen of fifteen designed anomalies in the top fifteen on this seed. That is a wiring check, not production accuracy, so the robustness mode reports the spread across twenty seeds.");

// ---------- 8. Dashboard ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "What the radar finds");
s.addImage({ path: "../poc/output/dashboard.png", x: 0.5, y: 1.05, w: 6.55, h: 4.44 });
const notes8 = [["A", "Peer view within specialty; providers flagged by two or more detectors are circled"], ["B", "Consensus ranking; label shows how many detectors agree"], ["C", "A four-month volume spike that a snapshot would miss"], ["D", "An E/M level shift with the detected change point"]];
notes8.forEach((n, k) => {
  const y = 1.2 + k * 1.05;
  circleNum(s, 7.3, y, n[0], k >= 2 ? RED : NAVY, WHITE);
  s.addText(n[1], { x: 7.82, y: y - 0.08, w: 1.75, h: 0.9, fontFace: F, fontSize: 11, color: INK, isTextBox: true, margin: 0, valign: "top" });
});
s.addNotes("The dashboard shows the same story. Panel A is the peer view, with flagged providers circled. Panel B is the consensus ranking. Panel C is a volume spike that a snapshot would miss, and panel D is an E/M level shift with the detected change point.");

// ---------- 9. Auditor brief + scorecard ----------
s = pres.addSlide(); s.background = { color: WHITE };
title(s, "What the auditor sees", "python claims_radar.py --provider P0039   |   python claims_radar.py --provider P0036");
card(s, 0.5, 1.3, 5.9, 2.55, TINT);
s.addText([
  { text: "P0039 (Family Medicine), 3 of 3 detectors.  Disposition: REVIEW", options: { bold: true, color: NAVY, breakLine: true, paraSpaceAfter: 4 } },
  { text: "Primary pattern: ", options: { bold: true } }, { text: "share of level 4-5 E/M visits rose from 0.45 to 0.76 starting 2025-01 (two-proportion z = 13.7).", options: { breakLine: true, paraSpaceAfter: 4 } },
  { text: "Governing policy: ", options: { bold: true } }, { text: "CMS Claims Processing Manual Ch. 12 Sec. 30.6; AMA 2021 E/M guidelines.", options: { breakLine: true, paraSpaceAfter: 4 } },
  { text: "Evidence to request: ", options: { bold: true } }, { text: "documentation for 30 level 4-5 visits dated after the change point.", options: { breakLine: true, paraSpaceAfter: 4 } },
  { text: "A human reviewer decides.", options: { italic: true, color: GRAY } },
], { x: 0.75, y: 1.42, w: 5.4, h: 2.35, fontFace: F, fontSize: 11.5, color: INK, isTextBox: true, margin: 0, valign: "top" });
card(s, 0.5, 4.0, 5.9, 1.3, ROSE);
s.addText([
  { text: "P0036 (Family Medicine), 1 of 3 detectors.  Disposition: WITHHOLD", options: { bold: true, color: RED, breakLine: true, paraSpaceAfter: 4 } },
  { text: "Failed check: corroborated (2+ detectors or one signal with z >= 8). No case is opened; re-evaluate with next month's data. This was the only non-anomalous provider in the top 15.", options: {} },
], { x: 0.75, y: 4.1, w: 5.4, h: 1.1, fontFace: F, fontSize: 11.5, color: INK, isTextBox: true, margin: 0, valign: "top" });
const sc = [["14 / 15", "designed anomalies in the top 15 (fixed seed)"], ["0.93", "median precision@15 over 20 seeds [0.93, 0.95]; p@10 = 1.00"], ["0.99", "median average precision over 20 seeds"], ["~6 s", "per run; 6 tests; no effect of contamination 0.03-0.10"]];
sc.forEach((c, k) => {
  const y = 1.3 + k * 0.98;
  s.addText(c[0], { x: 6.7, y, w: 1.4, h: 0.55, fontFace: F, fontSize: 24, bold: true, color: k < 2 ? RED : NAVY, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(c[1], { x: 8.1, y, w: 1.5, h: 0.75, fontFace: F, fontSize: 10.5, color: INK, isTextBox: true, margin: 0, valign: "middle" });
});
s.addText("A wiring check on designed anomalies, not production accuracy; real claims need calibration on audited outcomes.", { x: 6.7, y: 5.2, w: 2.9, h: 0.35, fontFace: F, fontSize: 9, color: GRAY, isTextBox: true, margin: 0 });
s.addNotes("This is what an auditor sees for a withheld packet: the pattern, the governing policy, the failed check, and no case opened. A review packet adds the evidence to request and a next step. With the optional LLM flag, a model writes the prose, but only for packets the critic passed, and the statistics still decide.");

// ---------- 10. Close ----------
s = pres.addSlide(); s.background = { color: NAVY };
radar(s, 7.6, 2.9, 1.9, "4C5B9A", [8.45, 2.05]);
s.addText("Takeaways", { x: 0.6, y: 0.6, w: 5.9, h: 0.6, fontFace: F, fontSize: 30, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText(bullets([
  "Payment integrity is moving from rules to models to reasoning agents",
  "The winners will explain every flag, measure every model, and give agents a critic and a withhold path",
  "A useful anomaly radar fits in one Python file; the hard part is calibration and governance"], 15, ICE),
  { x: 0.6, y: 1.35, w: 5.8, h: 2.4, fontFace: F, isTextBox: true, margin: 0, valign: "top" });
s.addText("Report, code, slides and video: github.com/StatGuyOU/cotiviti-intern-assessment", { x: 0.6, y: 4.2, w: 6.4, h: 0.35, fontFace: F, fontSize: 12, color: ICE, isTextBox: true, margin: 0 });
s.addText("Thank you  |  Penghua Wang", { x: 0.6, y: 4.6, w: 6.4, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText("Ph.D. Candidate, Data Science and Analytics, University of Oklahoma  |  M.S. Statistics", { x: 0.6, y: 4.95, w: 6.6, h: 0.32, fontFace: F, fontSize: 12, color: ICE, isTextBox: true, margin: 0 });
s.addNotes("Payment integrity is moving from rules to models to reasoning agents. The winners will explain every flag, measure every model, and give agents a critic and a withhold path. Everything, including report, code, slides, and this video, is in the repository at github.com/StatGuyOU/cotiviti-intern-assessment. Thank you.");

pres.writeFile({ fileName: "Penghua_Wang_Slides.pptx" }).then(f => console.log("wrote", f));
