import type { Assessment, CSFFunction } from "@/types/assessment";
import type { Organization, TechStack } from "@/types/organization";
import type { ForensicLogEntry } from "@/store";

const LN = "━".repeat(72);
const LN2 = "─".repeat(72);
const V = "3.1.0";

const SCORE_LABELS = [
  "Not Implemented",
  "Initial / Ad Hoc",
  "Developing / Defined",
  "Managed / Implemented",
  "Optimized / Adaptive",
];

interface ReportContext {
  assessment: Assessment;
  csf2: CSFFunction[];
  org: Organization;
  tech: TechStack;
  compliance: string[];
  forensics: ForensicLogEntry[];
}

function getRatingLabel(score: number): string {
  if (score >= 80) return "Fully Compliant";
  if (score >= 60) return "Substantially Compliant";
  if (score >= 40) return "Partially Compliant";
  return "Non-Compliant";
}

function getRatingDef(label: string): string {
  switch (label) {
    case "Fully Compliant":
      return "All requirements are met with documented evidence. Controls are implemented, operational, and supported by current documentation.";
    case "Substantially Compliant":
      return "Most requirements are met with documented evidence. Minor gaps exist that do not represent significant compliance risk.";
    case "Partially Compliant":
      return "Some requirements are met, but significant gaps remain. Controls may exist in limited form, lack documentation, or have not been fully implemented.";
    default:
      return "Requirements are not met. No controls, policies, or documentation exist to address the requirement. Immediate attention is required.";
  }
}

export function generateAssessmentReport(ctx: ReportContext): string {
  const { assessment: rpt, csf2, org, tech, compliance, forensics } = ctx;
  const now = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const orgName = org.name || "[Organization Name]";
  const overallRating = getRatingLabel(rpt.score);
  const CF = compliance.join(", ") || "As determined by organizational requirements";

  // Count ratings per function
  const fnRatings = rpt.fnScores.map((f) => ({
    fn: f.fn,
    score: f.score,
    rating: getRatingLabel(f.score),
  }));

  const fullCount = fnRatings.filter((f) => f.rating === "Fully Compliant").length;
  const substCount = fnRatings.filter((f) => f.rating === "Substantially Compliant").length;
  const partialCount = fnRatings.filter((f) => f.rating === "Partially Compliant").length;
  const nonCount = fnRatings.filter((f) => f.rating === "Non-Compliant").length;

  // Top gaps
  const criticalGaps = rpt.recs.filter((r) => r.w >= 3 && (rpt.answers[r.id] || 0) <= 1);
  const highGaps = rpt.recs.filter((r) => r.w >= 2 && (rpt.answers[r.id] || 0) <= 2 && !criticalGaps.includes(r));

  // Strengths
  const strengths = csf2.flatMap((fn) => fn.cats.flatMap((cat) => cat.qs))
    .filter((q) => (rpt.answers[q.id] || 0) >= 3)
    .sort((a, b) => b.w - a.w);

  let report = `${LN}

    ${orgName.toUpperCase()}
    CYBER RESILIENCE ASSESSMENT REPORT

    NIST Cybersecurity Framework (CSF) 2.0

${LN}

Report Date:        ${now}
Prepared by:        Dark Rock Labs — Sentry v${V}


${LN}
CONFIDENTIALITY STATEMENT
${LN}

This document contains confidential and proprietary information prepared by
Dark Rock Labs exclusively for ${orgName} ("the Organization"). The contents
of this report are intended solely for the use of the designated recipients
and may contain security vulnerability details, control gap assessments, and
sensitive organizational information.

This report shall not be reproduced, distributed, or disclosed to any third
party without the express written consent of both Dark Rock Labs and the
Organization. Unauthorized disclosure may result in legal liability and
compromise the security posture of the assessed organization.

The findings, opinions, and recommendations contained in this report are
based on the evidence, documentation, and information provided during the
assessment period. This assessment does not constitute a legal opinion,
regulatory certification, or guarantee of compliance.

Point of Contact
${LN2}
Company:            Dark Rock Labs
Platform:           Sentry Cyber Resilience Platform
Email:              alexander.bates@darkrocksecurity.com
Website:            darkrocksecurity.com
Report Date:        ${now}


${LN}
TABLE OF CONTENTS
${LN}

1.  Executive Summary
    1.1  Overview
    1.2  Assessment Scope and Methodology
    1.3  Compliance Maturity Rating System
    1.4  Assessment Summary
    1.5  Key Findings
    1.6  Summary Conclusion
2.  Detailed Assessment Results
${csf2.map((fn, i) => `    2.${i + 1}  ${fn.fn} (${fn.id})`).join("\n")}
3.  Prioritized Recommendations
4.  Appendix A — Technology Stack Reviewed
5.  Appendix B — Compliance Framework Alignment
${forensics.length > 0 ? "6.  Appendix C — Forensic Evidence Reviewed" : ""}


${LN}
1.  EXECUTIVE SUMMARY
${LN}

1.1  Overview
${LN2}

Dark Rock Labs was engaged to conduct an independent Cybersecurity
Resilience Assessment for ${orgName}. This assessment evaluates the
Organization's current cybersecurity posture against the NIST Cybersecurity
Framework (CSF) 2.0, encompassing all six core functions: Govern, Identify,
Protect, Detect, Respond, and Recover.

The assessment provides a comprehensive view of control maturity across
${csf2.reduce((a, fn) => a + fn.cats.reduce((b, cat) => b + cat.qs.length, 0), 0)} individual
controls organized into ${csf2.reduce((a, fn) => a + fn.cats.length, 0)} categories. Each
control was evaluated for implementation maturity on a five-tier scale
ranging from "Not Implemented" (0) to "Optimized / Adaptive" (4).

${org.industry ? `As an organization in the ${org.industry} sector, ${orgName} operates under
regulatory requirements including ${CF}. This assessment identifies areas
where existing controls and documentation can be strengthened to reduce
risk exposure and improve audit readiness.` : ""}

1.2  Assessment Scope and Methodology
${LN2}

The assessment scope encompasses all information systems, policies,
procedures, and controls within the ${orgName} environment. The assessment
was conducted through the following methodology:

  • Control Assessment: Each NIST CSF 2.0 control was evaluated against a
    five-tier maturity scale considering implementation status, documentation,
    operational effectiveness, and measurement capabilities.

  • Smart Stack Integration: Assessment questions were tailored based on the
    Organization's technology stack configuration to provide context-specific
    scoring (e.g., controls referencing ${tech.siem || "SIEM"} capabilities,
    ${tech.endpoint || "endpoint"} protection, and ${tech.identity || "identity"} management).

  • Input Validation: Automated validation checks detected potential scoring
    anomalies including uniformity bias, contradictions with declared
    technology stack, and statistical outliers.
${rpt.warnings.length > 0 ? `
  • Validation Warnings: ${rpt.warnings.length} validation warning${rpt.warnings.length !== 1 ? "s were" : " was"}
    identified during the assessment, indicating potential scoring
    inconsistencies that should be reviewed.` : ""}

  • Gap Analysis: Controls scoring below "Managed / Implemented" (3) were
    flagged for remediation and prioritized by risk weight and impact.

1.3  Compliance Maturity Rating System
${LN2}

Each control has been assessed using the following five-tier maturity scale:

  Score   Rating                     Definition
  ${"-".repeat(68)}
  0       Not Implemented            No controls exist. Immediate attention required.
  1       Initial / Ad Hoc           Informal or reactive practices. Not documented or
                                     repeatable.
  2       Developing / Defined       Policies and procedures exist but are not
                                     consistently implemented or measured.
  3       Managed / Implemented      Controls are documented, implemented, and
                                     measured. Meets baseline requirements.
  4       Optimized / Adaptive       Controls are continuously improved based on
                                     performance data and emerging threats.

Overall maturity ratings map to the following scale:

  Rating                   Score Range    Definition
  ${"-".repeat(68)}
  Fully Compliant          80 - 100       ${getRatingDef("Fully Compliant").substring(0, 60)}
  Substantially Compliant  60 - 79        ${getRatingDef("Substantially Compliant").substring(0, 60)}
  Partially Compliant      40 - 59        ${getRatingDef("Partially Compliant").substring(0, 60)}
  Non-Compliant             0 - 39        ${getRatingDef("Non-Compliant").substring(0, 60)}

1.4  Assessment Summary
${LN2}

  Function                Score    Rating
  ${"-".repeat(56)}
${fnRatings.map((f) => `  ${f.fn.padEnd(22)} ${f.score.toString().padEnd(8)} ${f.rating}`).join("\n")}
  ${"-".repeat(56)}
  OVERALL                 ${rpt.score.toString().padEnd(8)} ${overallRating}

  Rating Distribution:
  ${"-".repeat(40)}
  Fully Compliant:          ${fullCount}
  Substantially Compliant:  ${substCount}
  Partially Compliant:      ${partialCount}
  Non-Compliant:            ${nonCount}
  Total Functions:          ${fnRatings.length}

  Overall Compliance Posture: ${overallRating}
  Weighted Score: ${rpt.score}%

1.5  Key Findings
${LN2}

`;

  // Critical Gaps
  if (criticalGaps.length > 0) {
    report += `Critical Gaps (Immediate Attention Required)\n`;
    criticalGaps.forEach((g) => {
      report += `  • ${g.id}: ${g.q}\n    Current Rating: ${SCORE_LABELS[rpt.answers[g.id] || 0]}\n    Risk Weight: Critical\n\n`;
    });
  }

  // High Priority
  if (highGaps.length > 0) {
    report += `High-Priority Gaps\n`;
    highGaps.slice(0, 8).forEach((g) => {
      report += `  • ${g.id}: ${g.q}\n    Current Rating: ${SCORE_LABELS[rpt.answers[g.id] || 0]}\n\n`;
    });
  }

  // Strengths
  if (strengths.length > 0) {
    report += `Notable Strengths\n`;
    strengths.slice(0, 6).forEach((s) => {
      report += `  • ${s.id}: ${s.q}\n    Current Rating: ${SCORE_LABELS[rpt.answers[s.id] || 0]}\n\n`;
    });
  }

  // Warnings
  if (rpt.warnings.length > 0) {
    report += `Assessment Validation Warnings\n`;
    rpt.warnings.forEach((w) => {
      report += `  • [${w.type.toUpperCase()}] ${w.msg}\n\n`;
    });
  }

  // Summary Conclusion
  report += `1.6  Summary Conclusion
${LN2}

${rpt.score >= 70
    ? `${orgName} demonstrates a solid cybersecurity posture with mature controls
across most functions of the NIST CSF 2.0. The organization has established
foundational security governance and technical controls that align with
industry best practices.`
    : rpt.score >= 50
      ? `${orgName} has established foundational cybersecurity controls but
significant opportunities for improvement exist across multiple functions.
The organization should prioritize the recommendations in this report to
strengthen its security posture and reduce risk exposure.`
      : `${orgName} has identified critical gaps in cybersecurity controls that
require immediate attention. The assessment reveals areas of significant
risk that should be addressed as a matter of urgency to protect the
organization's assets, data, and operations.`}

The recommendations in this report are prioritized by risk impact and
designed to be achievable within practical timeframes, leveraging the
Organization's existing technology investments where possible.

`;

  // Section 2: Detailed Results
  report += `\n${LN}\n2.  DETAILED ASSESSMENT RESULTS\n${LN}\n\n`;
  report += `This section provides detailed findings for each NIST CSF 2.0 function,\norganized by category. Each finding includes the control reference,\nimplementation maturity rating, and current state observation.\n\n`;

  csf2.forEach((fn, fnIdx) => {
    report += `${LN2}\n2.${fnIdx + 1}  ${fn.fn} (${fn.id}) — ${fn.ico}\n${LN2}\n\n`;
    const fnScore = rpt.fnScores.find((f) => f.fn === fn.fn);
    report += `Function Score: ${fnScore?.score || 0}% — ${getRatingLabel(fnScore?.score || 0)}\n\n`;

    fn.cats.forEach((cat) => {
      const catScore = rpt.catScores.find((c) => c.cat === cat.n && c.fn === fn.fn);
      const catRating = getRatingLabel(catScore?.score || 0);
      report += `  ${cat.id}: ${cat.n}\n  Score: ${catScore?.score || 0}%  |  Rating: ${catRating}  |  Controls: ${cat.qs.length}\n  ${"-".repeat(60)}\n\n`;

      cat.qs.forEach((q) => {
        const score = rpt.answers[q.id] || 0;
        const rating = SCORE_LABELS[score];
        const riskLabel = q.w >= 3 ? "Critical" : q.w >= 2 ? "High" : "Standard";
        report += `  ${q.id}    Risk Weight: ${riskLabel}    Rating: ${rating}\n`;
        report += `  ${q.q}\n`;
        if (score < 3) {
          report += `  ► Gap: Control does not meet baseline maturity. Remediation recommended.\n`;
        } else if (score >= 4) {
          report += `  ✓ Strength: Control demonstrates optimized/adaptive maturity.\n`;
        }
        report += `\n`;
      });
    });
  });

  // Section 3: Prioritized Recommendations
  report += `\n${LN}\n3.  PRIORITIZED RECOMMENDATIONS\n${LN}\n\n`;
  report += `The following table presents remediation priorities organized by urgency\nand impact. Recommendations are designed to be achievable leveraging the\nOrganization's existing technology investments.\n\n`;
  report += `  #     Control ID   Remediation Action                                          Priority\n`;
  report += `  ${"-".repeat(85)}\n`;

  rpt.recs.forEach((r, i) => {
    const priority = i < 3 ? "CRITICAL" : i < 7 ? "HIGH" : "MEDIUM";
    report += `  ${(i + 1).toString().padEnd(5)} ${r.id.padEnd(12)} ${r.q.substring(0, 55).padEnd(57)} ${priority}\n`;
    report += `${" ".repeat(19)}Current: ${SCORE_LABELS[rpt.answers[r.id] || 0]}\n\n`;
  });

  // Appendix A: Tech Stack
  report += `\n${LN}\n4.  APPENDIX A — TECHNOLOGY STACK REVIEWED\n${LN}\n\n`;
  report += `The following technology stack was declared during the assessment and\nused for smart control scoring and gap analysis.\n\n`;
  const techEntries = Object.entries(tech).filter(([, v]) => v);
  if (techEntries.length > 0) {
    report += `  Category              Solution\n  ${"-".repeat(50)}\n`;
    techEntries.forEach(([k, v]) => {
      report += `  ${k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).padEnd(22)} ${v}\n`;
    });
  } else {
    report += `  No technology stack was configured during the assessment.\n`;
  }

  // Appendix B: Compliance
  report += `\n\n${LN}\n5.  APPENDIX B — COMPLIANCE FRAMEWORK ALIGNMENT\n${LN}\n\n`;
  report += `  Applicable Frameworks and Regulations:\n  ${"-".repeat(50)}\n`;
  if (compliance.length > 0) {
    compliance.forEach((c) => {
      report += `  • ${c}\n`;
    });
  } else {
    report += `  No compliance frameworks were declared during onboarding.\n`;
  }

  // Appendix C: Forensics (if any)
  if (forensics.length > 0) {
    report += `\n\n${LN}\n6.  APPENDIX C — FORENSIC EVIDENCE REVIEWED\n${LN}\n\n`;
    forensics.forEach((f, i) => {
      report += `  Evidence ${i + 1}: ${f.title}\n  ${"-".repeat(50)}\n`;
      report += `  Classification:  ${f.classification}\n`;
      report += `  Collected:       ${f.createdAt}\n`;
      report += `  Description:     ${f.description || "No description provided."}\n`;
      if (f.files.length > 0) {
        report += `  Files Reviewed:\n`;
        f.files.forEach((file) => {
          report += `    • ${file.name} (SHA256: ${file.sha256.substring(0, 32)}...)\n`;
        });
      }
      report += `\n`;
    });
  }

  // Footer
  report += `

${LN}

    END OF REPORT

    This Cyber Resilience Assessment Report was generated by
    Dark Rock Labs Sentry v${V} on ${now}.

    Organization:   ${orgName}
    Framework:      NIST Cybersecurity Framework (CSF) 2.0
    Overall Score:  ${rpt.score}/100
    Rating:         ${overallRating}

    Dark Rock Labs — Sentry Cyber Resilience Platform
    darkrocksecurity.com

    CONFIDENTIAL — Do not distribute without authorization.

${LN}
`;

  return report;
}
