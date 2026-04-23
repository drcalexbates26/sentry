export interface IRPhase {
  id: string;
  n: string;
  ico: string;
  steps: string[];
}

export const IR_PHASES: IRPhase[] = [
  { id: "prep", n: "Preparation", ico: "🛡️", steps: ["Coordinate with IT on infrastructure changes", "Conduct annual tabletop exercises", "Incorporate lessons learned", "Review/update contact lists and access controls", "Maintain asset inventory and topologies"] },
  { id: "ident", n: "Identification", ico: "🔍", steps: ["Monitor all alert sources (EDR, SIEM, IDS, Identity)", "Create incident case", "Triage: Impact type (CIA + Credential Harvesting)", "Determine data criticality (PII/FCI/CUI)", "Calculate severity", "Declare incident if Medium+"] },
  { id: "notif", n: "Notification", ico: "📢", steps: ["Coordinate with Legal first (Medium+)", "Notify cyber insurance", "Identify all stakeholders", "DFARS: DIBNet within 72 hrs if CUI", "Establish EOC with battle rhythm", "Determine secure comms methods"] },
  { id: "contain", n: "Containment", ico: "🚧", steps: ["Isolate affected systems", "Disable malicious processes/accounts", "Firewall blocking rules", "Update IDS/EDR signatures", "Isolate LAN segments", "Re-evaluate severity"] },
  { id: "analysis", n: "Analysis", ico: "🔬", steps: ["Build attack timeline", "Map to MITRE ATT&CK", "30-day account access review", "Enterprise IOC sweep", "Capture memory/disk images", "Preserve logs and PCAPs", "Assess data exposure"] },
  { id: "erad", n: "Eradication", ico: "🧹", steps: ["Remove adversary/malware completely", "Full identity/PAM audit", "Resolve root cause", "Verify patching enterprise-wide", "Heightened monitoring"] },
  { id: "recover", n: "Recovery", ico: "🔄", steps: ["Determine safe restore point", "Prioritize restoration", "Remediate architectural weaknesses", "Rollback temporary actions", "Validate all data integrity", "Confirm system availability"] },
  { id: "followup", n: "Follow-Up", ico: "📋", steps: ["Post-mortem for Medium+ incidents", "Identify control failures", "Review policies/procedures", "Document corrective actions", "Update IRP with lessons learned"] },
];

export const SEV_LEVELS = [
  { lv: "Low", desc: "No significant impact expected. Potential availability impact only.", act: "Case may be closed at IRT Incident Manager discretion.", c: "#22C55E" },
  { lv: "Medium", desc: "Potential but unconfirmed loss of confidentiality or data integrity.", act: "Declare incident. Notify legal counsel and cyber insurance carrier.", c: "#EAB308" },
  { lv: "High", desc: "Confirmed loss of confidentiality, data integrity, or significant availability issue.", act: "Full IRT activation. All lifecycle phases required.", c: "#F97316" },
  { lv: "Critical", desc: "Threat to operation, safety, or reputation with element of surprise requiring rapid decision-making.", act: "Full IRT plus executive engagement.", c: "#EF4444" },
];
