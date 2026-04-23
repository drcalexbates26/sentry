export const STAKEHOLDER_GROUPS = [
  { key: "incidentCommander", label: "Incident Commander", icon: "★", desc: "Primary authority for strategic incident decisions. Communicates with executive leadership.", color: "#EF4444" },
  { key: "ciso", label: "CISO / Security Leadership", icon: "🛡️", desc: "Chief Information Security Officer and security leadership team responsible for overall security posture.", color: "#00B4A6" },
  { key: "securityEngineers", label: "Security Engineers", icon: "⚙️", desc: "Technical security staff responsible for detection, analysis, containment, and eradication activities.", color: "#3B82F6" },
  { key: "legalContact", label: "Legal Counsel (Internal)", icon: "⚖️", desc: "Internal legal team coordinating privilege, regulatory obligations, and contractual requirements.", color: "#8B5CF6" },
  { key: "riskContact", label: "Risk Management", icon: "📊", desc: "Enterprise risk management team assessing business impact and risk exposure during incidents.", color: "#F97316" },
  { key: "executivePOC", label: "Executive Points of Contact", icon: "👔", desc: "C-suite and board-level contacts for escalation, strategic decisions, and stakeholder communications.", color: "#EAB308" },
  { key: "cyberInsuranceInternal", label: "Cyber Insurance (Internal)", icon: "📋", desc: "Internal contacts responsible for managing the cyber insurance relationship and initiating claims.", color: "#06B6D4" },
  { key: "cyberInsuranceExternal", label: "Cyber Insurance (External)", icon: "🏢", desc: "Insurance carrier contacts, claims adjusters, and breach coach assignments.", color: "#06B6D4" },
  { key: "externalLegal", label: "External Legal Counsel", icon: "🏛️", desc: "Outside counsel specializing in data breach, regulatory response, and litigation management.", color: "#8B5CF6" },
  { key: "forensicsContact", label: "Approved Forensics Provider", icon: "🔬", desc: "Pre-approved digital forensics and incident response firms for evidence collection and analysis.", color: "#EF4444" },
  { key: "hrContacts", label: "Human Resources", icon: "👥", desc: "HR leadership for insider threat coordination, employee notifications, and personnel actions.", color: "#22C55E" },
  { key: "prContact", label: "Public Relations / Communications", icon: "📣", desc: "Internal and external PR contacts for media relations, public statements, and stakeholder messaging.", color: "#F97316" },
  { key: "privacyContact", label: "Privacy Officer / Data Protection", icon: "🔏", desc: "Privacy officer, data protection officer (DPO), and privacy counsel for breach notification determinations, PII/PHI impact assessment, and regulatory privacy obligations.", color: "#06B6D4" },
  { key: "lawEnforcement", label: "Law Enforcement", icon: "🚔", desc: "Law enforcement contacts at local, state, and federal levels. Coordinate with Legal before engaging.", color: "#3B82F6" },
];

export const SYSTEM_CATEGORIES = [
  "Financial Systems", "HR / HCM Systems", "Production / Operations",
  "Infrastructure / Network", "Data Management / Storage", "Cloud Platforms",
  "Identity / Access Management", "Email / Collaboration",
  "Customer-Facing Applications", "Development / DevOps",
  "Physical Security", "Telecommunications", "Other",
];
