const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, LevelFormat, HeadingLevel, Header, Footer,
        PageNumber, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, VerticalAlign } = require("docx");

const FONT = "Calibri", NAVY = "1E2761", GRAY = "595959";
const t = (s, o = {}) => new TextRun({ text: s, font: FONT, size: 22, ...o });
const b = (s) => t(s, { bold: true });
const i = (s) => t(s, { italics: true });
const body = (runs, opts = {}) => new Paragraph({ spacing: { after: 80, line: 245 }, alignment: AlignmentType.JUSTIFIED, ...opts,
  children: (Array.isArray(runs) ? runs : [runs]).map(r => typeof r === "string" ? t(r) : r) });
const heading = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s, { bold: true, size: 24, color: NAVY })] });
const bullet = (lead, rest) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 50, line: 245 },
  alignment: AlignmentType.JUSTIFIED, children: [b(lead), t(rest)] });
const ref = (runs) => new Paragraph({ indent: { left: 720, hanging: 720 }, spacing: { after: 30, line: 224 },
  children: runs.map(r => typeof r === "string" ? t(r, { size: 18 }) : r) });
const ri = (s) => t(s, { size: 18, italics: true });

// --- strategic options table -------------------------------------------------
const COLS = [2150, 1150, 3560, 2500];                       // DXA, sum = 9360 (6.5 in)
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFC7DA" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, w, opts = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER,
  margins: { top: 50, bottom: 50, left: 90, right: 90 },
  shading: opts.head ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : (opts.tint ? { type: ShadingType.CLEAR, fill: "F2F5FB", color: "auto" } : undefined),
  children: [new Paragraph({ spacing: { after: 0, line: 224 }, children: [t(text, { size: 18, bold: !!opts.head || !!opts.bold, color: opts.head ? "FFFFFF" : undefined })] })] });
const row = (cells, opts = {}) => new TableRow({ cantSplit: true, tableHeader: !!opts.head,
  children: cells.map((c, k) => cell(c, COLS[k], { head: opts.head, tint: opts.tint, bold: k === 0 })) });
const optionsTable = new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COLS, rows: [
  row(["Option (builds on)", "Horizon", "Proposed delta", "Pilot gate"], { head: true }),
  row(["1. Evidence-and-abstention layer (Clinical Chart Validation, 360 Pattern Review leads)", "6 to 12 months, shadow mode first", "Given a lead and its policy, an agent returns cited facts and missing-evidence checks; a critic verifies; the packet is marked REVIEW or WITHHOLD. Never a determination, as Cotiviti's principle requires (Cotiviti, n.d.-a).", "Citation coverage; unsupported-claim rate; reviewer minutes per case; edit rate; overturn rate"]),
  row(["2. Time-aware change-point signals (360 Pattern Review provider scoring)", "12 to 18 months", "Rolling-window volume and change-point detectors added to peer scoring, ranked by detector agreement; the explainable-ensemble principle is supported by Shekhar et al. (2026), transfer to professional claims is untested.", "Leads accepted by FWA experts per quarter; precision of leads at audit"], { tint: true }),
  row(["3. Release gate for models and agents (AI Governance Committee, Risk Management Framework)", "Start now", "A product-level harness: pre-registered acceptance criteria, blinded and external validation, drift monitoring and an overturn-rate audit; OIG found Medicare Advantage plans overturned 95% of appealed skilled-nursing prior-authorization denials (OIG, 2026).", "Precision at K; recall on known schemes; false-positive cost; overturn rate"]),
] });

const doc = new Document({
  creator: "Penghua Wang", title: "Pattern Recognition for Payment Integrity: From Rules to Reasoning Agents",
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
    alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] }] },
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { font: FONT, size: 24, bold: true, color: NAVY },
      paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 0 } }],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1150, right: 1440, bottom: 1100, left: 1440, header: 560, footer: 560 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 },
      children: [t("Penghua Wang  |  Cotiviti Intern Assessment  |  Pattern Recognition for Payment Integrity", { size: 17, color: GRAY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [t("Page ", { size: 17, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: GRAY }),
                 t(" of ", { size: 17, color: GRAY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 17, color: GRAY })] })] }) },
    children: [
      new Paragraph({ spacing: { after: 40 }, children: [t("Pattern Recognition for Payment Integrity: From Rules to Reasoning Agents", { bold: true, size: 32, color: NAVY })] }),
      new Paragraph({ spacing: { after: 0 }, children: [t("Topic: Clinical Decision Making and Pattern Recognition in Health Care", { size: 19, color: GRAY })] }),
      new Paragraph({ spacing: { after: 0 }, children: [t("Penghua Wang, Ph.D. Candidate in Data Science and Analytics, University of Oklahoma", { size: 19, color: GRAY })] }),
      new Paragraph({ spacing: { after: 180 }, children: [t("Prepared for Cotiviti, Inc.  |  September 2026", { size: 19, color: GRAY })] }),

      heading("1. The concept"),
      body([t("Clinical decision making and pattern recognition in health care means using statistical and machine-learning methods to turn claims, clinical, and operational data into decisions about treatment, payment, and operations (TPO). "),
            i("Classification"), t(" asks whether a claim is payable as billed. "), i("Prediction"), t(" asks which claims will fail a medical record review. "), i("Inference"), t(" asks whether a provider's billing differs from peers by more than chance. "), i("Clustering"), t(" asks which providers share a billing profile. "), i("Time-series anomaly detection"), t(" asks when a provider's behavior changed. The newest layer is "), i("chain reasoning"), t(": large language models (LLMs) that reason through multi-step problems and, with tools, act as agents that retrieve policy, read records, and draft findings (Wei et al., 2022; Yao et al., 2023). The Centers for Medicare & Medicaid Services (CMS, 2026) estimated fiscal year 2025 improper payments at 6.55% ($28.83 billion) for Medicare fee-for-service and 6.12% ($37.39 billion) for Medicaid, while noting that improper payment is not a measure of fraud. Fraud itself is estimated at 3% to 10% of health spending (National Health Care Anti-Fraud Association [NHCAA], n.d.).")]),

      heading("2. Trends: past, present, and future"),
      body([b("Past. "), t("Payment integrity began with deterministic rules: coding edits, bundling logic, and frequency limits applied one claim at a time. Rules are precise and auditable, but they cannot see patterns that appear only across claims, providers, or months.")]),
      body([b("Present. "), t("Supervised models trained on audited outcomes now prioritize which claims and providers to review, and unsupervised methods such as peer-group outlier scoring and Isolation Forests surface unusual behavior without labels (du Preez et al., 2025). The strongest recent evidence favors ensembles: an unsupervised combination of coding-subspace, peer-expenditure, and regression detectors on 7.3 million Medicare inpatient claims placed 21 hospitals later named in Department of Justice fraud actions among its top 50, a near five-fold lift, with explainable rankings (Shekhar et al., 2026), although most published models still lack external validation (du Preez et al., 2025). Detection is also moving prepayment, and enforcement is becoming analytics-led: the 2025 National Health Care Fraud Takedown charged 324 defendants with $14.6 billion in intended loss, credited proactive analytics with preventing about $4.4 billion in payments, and announced a Health Care Fraud Data Fusion Center (U.S. Department of Justice [DOJ], 2025). Cotiviti (2026b) reports preventing or correcting more than $10 billion in payment errors in 2025 for more than 100 clients, including 23 of the 25 largest payers, and now intervenes as early as enrollment with Proactive COB (Cotiviti, 2026a).")]),
      body([b("Future. "), t("LLMs encode substantial clinical knowledge (Singhal et al., 2023), and agent designs are converging on a coder paired with a critic that verifies codes and rationale before output (Yin et al., 2026); the same pattern applies to policy citations. The end state is coexistence, not replacement: deterministic rules, statistical ranking, an agent that assembles evidence and policy citations, a critic that checks them, and a human auditor who decides.")]),

      heading("3. Opportunities"),
      bullet("Explainable triage. ", "Combining rule hits, peer z-scores, and change points into one evidence packet raises reviewer throughput and lowers provider abrasion, because every flag arrives with a reason."),
      bullet("Emerging-scheme discovery. ", "Unsupervised and time-series methods catch new patterns before a rule exists for them, which is exactly where rules are weakest."),
      bullet("Audit copilots. ", "An agent that drafts the records request, summarizes the chart against the policy, and cites both; whether it cuts reviewer minutes is testable in shadow mode."),
      bullet("Cross-payer signal. ", "Patterns invisible inside one plan become obvious across many; a vendor seeing claims from more than 100 payers holds a structural advantage, within contracts and de-identification."),

      heading("4. Threats"),
      bullet("False positives are expensive. ", "Every unfounded flag costs reviewer time and provider goodwill, so detectors need pre-specified precision targets and calibration."),
      bullet("LLM error and automation bias. ", "LLMs remain poor at direct medical coding (Soroush et al., 2024), and agents push through: in a 2026 test, frontier browser agents completed 94% to 95% of prior-authorization submissions but almost never withheld a deficient one (Nie et al., 2026)."),
      bullet("Bias. ", "Models trained on cost or utilization proxies can encode disparities, as Obermeyer et al. (2019) showed for a population-health algorithm; provider flags can likewise concentrate on safety-net practices."),
      bullet("Regulatory and legal exposure. ", "AI-assisted Medicare Advantage denials have drawn class actions and a congressional report (Raza et al., 2026), most AI prior-authorization studies lack external validation (Mousavi et al., 2026), and PHI in hosted LLMs needs business associate agreements."),

      heading("5. Strategic options for Cotiviti"),
      body([t("Cotiviti already fields most of this stack: 360 Pattern Review scores providers with AI and expert rules, Clinical Chart Validation uses machine learning to select charts for specialist review, and an AI Governance Committee and Risk Management Framework date from 2023, while generative-AI policy research is still internal (Cotiviti, n.d.-a, n.d.-b, n.d.-c). The options below are deltas on that base (Table 1).")]),
      new Paragraph({ spacing: { before: 40, after: 60 }, keepNext: true, children: [t("Table 1. Strategic options at a glance", { size: 19, bold: true, color: NAVY })] }),
      optionsTable,
      new Paragraph({ spacing: { after: 60 }, children: [] }),
      body([b("Recommendation. "), t("Start Options 3 and 1 together, with Option 1 in shadow mode for six weeks before any reviewer acts on it; expand only if reviewer minutes per case fall, the unsupported-claim rate stays under a pre-set ceiling, and precision at audit holds. Option 2 follows once thresholds are calibrated. The 2026 evidence sharpens the design: explainable ensembles beat single detectors, agents need a critic and a withhold path, and fewer than 40% of health organizations have detailed AI-use policies (Cotiviti & MedCity News, 2026). The proof of concept shows the pattern in miniature.")]),

      new Paragraph({ pageBreakBefore: true, spacing: { after: 160 }, alignment: AlignmentType.CENTER, children: [t("References", { bold: true, size: 24, color: NAVY })] }),
      ref(["Centers for Medicare & Medicaid Services. (2026, January 15). ", ri("Fiscal year 2025 improper payments fact sheet"), ". https://www.cms.gov/newsroom/fact-sheets/fiscal-year-2025-improper-payments-fact-sheet"]),
      ref(["Cotiviti. (n.d.-a). ", ri("AI that drives value responsibly"), ". Retrieved September 16, 2026, from https://www.cotiviti.com/about/responsible-ai-use"]),
      ref(["Cotiviti. (n.d.-b). ", ri("Detect FWA patterns: 360 Pattern Review"), ". Retrieved September 16, 2026, from https://www.cotiviti.com/solutions/payment-accuracy/360-pattern-review"]),
      ref(["Cotiviti. (n.d.-c). ", ri("Clinical Chart Validation"), ". Retrieved September 16, 2026, from https://www.cotiviti.com/solutions/payment-accuracy/clinical-chart-validation"]),
      ref(["Cotiviti. (2026a, August 13). ", ri("Cotiviti introduces AI-enabled Proactive COB to resolve coordination of benefits issues at enrollment"), " [Press release]. Business Wire. https://www.businesswire.com/news/home/20260813788823/en/Cotiviti-Introduces-AI-Enabled-Proactive-COB-To-Resolve-Coordination-of-Benefits-Issues-at-Enrollment"]),
      ref(["Cotiviti. (2026b, July 1). ", ri("Cotiviti recognized by Everest Group as the highest-designated Leader for market impact in the 2026 Pre-payment Integrity Solutions PEAK Matrix\u00AE Assessment"), " [Press release]. https://www.cotiviti.com/press-release/cotiviti-recognized-by-everest-group-as-the-highest-designated-leader-for-market-impact-in-the-2026-pre-payment-integrity-solutions-peak-matrix-assessment"]),
      ref(["Cotiviti & MedCity News. (2026). ", ri("2026 Healthcare AI Readiness Index"), ". https://info.cotiviti.com/2026-healthcare-ai-readiness-index"]),
      ref(["du Preez, A., Bhattacharya, S., Beling, P., & Bowen, E. (2025). Fraud detection in healthcare claims using machine learning: A systematic review. ", ri("Artificial Intelligence in Medicine, 160"), ", Article 103061. https://doi.org/10.1016/j.artmed.2024.103061"]),
      ref(["Mousavi, T., Shaya, F. T., & Cooke, C. E. (2026). Artificial intelligence in prior authorization and coverage decisions: A systematic review of methods, evidence gaps, and future implications for patient access. ", ri("Journal of Managed Care & Specialty Pharmacy, 32"), "(9), 1135\u20131153. https://doi.org/10.18553/jmcp.2026.32.9.1135"]),
      ref(["National Health Care Anti-Fraud Association. (n.d.). ", ri("The challenge of health care fraud"), ". Retrieved September 16, 2026, from https://www.nhcaa.org/tools-insights/about-health-care-fraud/the-challenge-of-health-care-fraud/"]),
      ref(["Nie, M., Chung, W., Waxler, J., Lee, M., Weng, C., Lewis, R., Ahimaz, P., Wang, K., & Liu, C. (2026). ", ri("Hard to halt: Automation bias in agent-driven sequencing prior authorization workflows"), " [Preprint]. medRxiv. https://doi.org/10.64898/2026.06.16.26355782"]),
      ref(["Obermeyer, Z., Powers, B., Vogeli, C., & Mullainathan, S. (2019). Dissecting racial bias in an algorithm used to manage the health of populations. ", ri("Science, 366"), "(6464), 447–453. https://doi.org/10.1126/science.aax2342"]),
      ref(["Raza, S., Gerke, S., Silcox, C., Hendricks-Sturrup, R., & Shachar, C. (2026). Medicare advantage becoming a disadvantage with use of artificial intelligence in prior authorization review. ", ri("npj Digital Medicine, 9"), ", Article 208. https://doi.org/10.1038/s41746-026-02387-x"]),
      ref(["Shekhar, S., Leder-Luis, J., & Akoglu, L. (2026). Can machine learning target health care fraud? Evidence from Medicare hospitalizations. ", ri("Journal of Policy Analysis and Management, 45"), "(1), Article e70078. https://doi.org/10.1002/pam.70078"]),
      ref(["Singhal, K., Azizi, S., Tu, T., Mahdavi, S. S., Wei, J., Chung, H. W., Scales, N., Tanwani, A., Cole-Lewis, H., Pfohl, S., Payne, P., Seneviratne, M., Gamble, P., Kelly, C., Babiker, A., Schärli, N., Chowdhery, A., Mansfield, P., Demner-Fushman, D., . . . Natarajan, V. (2023). Large language models encode clinical knowledge. ", ri("Nature, 620"), "(7972), 172–180. https://doi.org/10.1038/s41586-023-06291-2"]),
      ref(["Soroush, A., Glicksberg, B. S., Zimlichman, E., Barash, Y., Freeman, R., Charney, A. W., Nadkarni, G. N., & Klang, E. (2024). Large language models are poor medical coders — Benchmarking of medical code querying. ", ri("NEJM AI, 1"), "(5). https://doi.org/10.1056/AIdbp2300040"]),
      ref(["U.S. Department of Health and Human Services, Office of Inspector General. (2026, June 8). ", ri("Medicare Advantage organizations overturned nearly all appealed prior authorization denials for skilled nursing facility admission, raising concerns about initial denials"), " (OEI-09-24-00331). https://oig.hhs.gov/reports/all/2026/medicare-advantage-organizations-overturned-nearly-all-appealed-prior-authorization-denials-for-skilled-nursing-facility-admission-raising-concerns-about-initial-denials/"]),
      ref(["U.S. Department of Justice. (2025, June 30). ", ri("National health care fraud takedown results in 324 defendants charged in connection with over $14.6 billion in alleged fraud"), " [Press release]. https://www.justice.gov/opa/pr/national-health-care-fraud-takedown-results-324-defendants-charged-connection-over-146"]),
      ref(["Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi, E., Le, Q. V., & Zhou, D. (2022). Chain-of-thought prompting elicits reasoning in large language models. ", ri("Advances in Neural Information Processing Systems, 35"), ", 24824–24837."]),
      ref(["Yin, Z., Cao, Y., Wang, T., Chen, J., & Ma, F. (2026). ICDAGENT: Empowering agentic large language models for explainable medical coding. In ", ri("Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)"), " (pp. 14131\u201314149). Association for Computational Linguistics. https://doi.org/10.18653/v1/2026.acl-long.643"]),
      ref(["Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. In ", ri("International Conference on Learning Representations (ICLR 2023)"), ". https://arxiv.org/abs/2210.03629"]),
    ],
  }],
});
Packer.toBuffer(doc).then(buf => { fs.writeFileSync("Penghua_Wang_Report.docx", buf); console.log("wrote Penghua_Wang_Report.docx", buf.length, "bytes"); });
