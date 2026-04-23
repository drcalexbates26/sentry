import type { TechStack } from "@/types/organization";

const V = "3.1.0";

export function generatePolicy(id: string, O: string, D: string, tech: TechStack, CF: string): string {
  const NR = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const ln = "━".repeat(64);
  const ln2 = "─".repeat(64);
  const tk = (k: string) => tech[k] || "[To be configured]";

  const hdr = `${ln}\n${O.toUpperCase()}\n${id.toUpperCase()} POLICY\n${ln}\n\nDocument ID:        POL-${id.toUpperCase()}-001\nVersion:            1.0\nEffective Date:     ${D}\nDocument Owner:     Chief Information Security Officer (CISO)\nApproved By:        [Executive Leadership / Board of Directors]\nClassification:     CONFIDENTIAL\nReview Cycle:       Annual\nNext Review:        ${NR}\n\n`;
  const ftr = `\n${ln}\nSTATEMENT OF MANAGEMENT COMMITMENT\n${ln}\n\n${O} holds information security of paramount importance and is committed to\nsecuring customer, employee, and organizational data.\n\n${ln}\nEND OF DOCUMENT\nConfidential | ${O} | Dark Rock Labs Sentry v${V}\n${ln}`;

  const policies: Record<string, string> = {
    irp: hdr + `INCIDENT RESPONSE POLICY\n${ln2}\n\n1. PURPOSE\nThis policy establishes a formal incident management framework requiring\nall security incidents to be tracked, documented, and resolved.\n\nAligned to: NIST SP 800-61 Rev. 2, NIST CSF 2.0\n\n2. SCOPE\nApplies to all users of information systems within ${O}.\n\n3. INCIDENT CLASSIFICATION\nSeverity Levels: Low, Medium, High, Critical\n\n4. RESPONSE LIFECYCLE\nPhases: Preparation, Identification, Notification, Containment,\nAnalysis, Eradication, Recovery, Follow-Up\n\n5. TECHNOLOGY REFERENCES\nSIEM: ${tk("siem")} | EDR: ${tk("endpoint")} | Firewall: ${tk("firewall")}\nIdentity: ${tk("identity")} | MFA: ${tk("mfa")}\n\n6. EXTERNAL IR\nDark Rock Cybersecurity - IncidentResponse@Darkrocklabs.com\n\n7. REPORTING REQUIREMENTS\nDFARS: 72 hours | HIPAA: 60 days | State laws: 30-60 days\n\n8. COMPLIANCE: ${CF}\n` + ftr,

    isp: hdr + `INFORMATION SECURITY POLICY\n${ln2}\n\n1. PURPOSE AND SCOPE\nEstablishes the framework for protecting information assets at ${O}.\n\n2. SECURITY GOVERNANCE\nRisk Committee provides oversight. CISO leads security program.\n\n3. RISK MANAGEMENT\nAnnual enterprise-level risk assessments. Risk register maintained.\n\n4. ACCESS CONTROL\nLeast privilege. Identity platform: ${tk("identity")}\nMFA: ${tk("mfa")}\n\n5. DATA PROTECTION\nClassification: Public, Internal, Confidential, Restricted\nEncryption: AES-256 at rest, TLS 1.2+ in transit\n\n6. NETWORK SECURITY\nFirewall: ${tk("firewall")} | SIEM: ${tk("siem")}\n\n7. ENDPOINT SECURITY\nEDR: ${tk("endpoint")} | Patch SLAs: Critical 72hr, High 7d\n\n8. COMPLIANCE: ${CF}\n` + ftr,

    bcp: hdr + `BUSINESS CONTINUITY & DISASTER RECOVERY POLICY\n${ln2}\n\n1. PURPOSE\nMaintaining critical operations during and after disruptive events.\n\n2. BUSINESS IMPACT ANALYSIS\nTier 1 (Mission Critical): RTO 4hr, RPO 1hr\nTier 2 (Business Critical): RTO 24hr, RPO 4hr\nTier 3 (Business Operational): RTO 72hr, RPO 24hr\n\n3. BACKUP\nPrimary: ${tk("backup")} | Cloud: ${tk("cloud")}\n\n4. TESTING\nAnnual DR exercise. Quarterly backup tests.\n\n5. COMPLIANCE: ${CF}\n` + ftr,

    acl: hdr + `ACCESS CONTROL & TERMINATION POLICY\n${ln2}\n\n1. PURPOSE\nDefines requirements for granting, managing, and revoking access.\n\n2. IDENTITY\nPlatform: ${tk("identity")} | MFA: ${tk("mfa")}\n\n3. AUTHENTICATION\nMin 14-char complex passwords. MFA required for privileged access.\nAccount lockout after 5 failed attempts.\n\n4. LIFECYCLE\nProvisioning → Quarterly Review → Role Change → Termination\n\n5. COMPLIANCE: ${CF}\n` + ftr,

    dcl: hdr + `DATA CLASSIFICATION & GOVERNANCE POLICY\n${ln2}\n\n1. CLASSIFICATION LEVELS\nPublic → Internal → Confidential → Restricted\n\n2. HANDLING REQUIREMENTS\nRestricted: Encryption at rest/transit, need-to-know + MFA, CISO approval for external sharing\n\n3. DLP: ${tk("dlp") !== "None" ? tk("dlp") : "[To be implemented]"}\n\n4. COMPLIANCE: ${CF}\n` + ftr,

    brn: hdr + `BREACH NOTIFICATION POLICY\n${ln2}\n\n1. PURPOSE\nProcedures for identifying, assessing, and responding to data breaches.\n\n2. NOTIFICATION TIMELINES\nHIPAA: 60 days | GDPR: 72 hours | DFARS: 72 hours | State: 30-60 days\n\n3. BREACH RESPONSE TEAM\nCISO, Legal, Privacy Officer, HR Director, Communications Lead\nExternal: Dark Rock Cybersecurity, Insurance Carrier\n\n4. COMPLIANCE: ${CF}\n` + ftr,

    rsk: hdr + `RISK ASSESSMENT & TREATMENT POLICY\n${ln2}\n\n1. FRAMEWORK\nAnnual assessments. Risk Score = Impact × Likelihood\nCritical: 20-25 | High: 12-19 | Medium: 6-11 | Low: 1-5\n\n2. TREATMENT OPTIONS\nAccept | Mitigate | Transfer | Avoid\n\n3. VULNERABILITY SCANNING\n${tk("vulnerability") !== "None" ? tk("vulnerability") : "[To be implemented]"}\n\n4. COMPLIANCE: ${CF}\n` + ftr,

    pat: hdr + `PATCH MANAGEMENT POLICY\n${ln2}\n\n1. SCOPE\nAll systems including: ${tk("endpoint")} endpoints, ${tk("cloud")} cloud,\n${tk("firewall")} firewalls, ${tk("identity")} identity infra\n\n2. SLAs\nCritical (CVSS 9.0-10.0): 72 hours\nHigh (CVSS 7.0-8.9): 7 days\nMedium (CVSS 4.0-6.9): 30 days\nLow (CVSS 0.1-3.9): 90 days\n\n3. PROCESS\nIdentification → Assessment → Testing → Deployment → Verification\n\n4. COMPLIANCE: ${CF}\n` + ftr,
  };

  return policies[id] || `${hdr}[Policy content for ${id}]\n${ftr}`;
}
