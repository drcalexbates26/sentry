// Rich fictional data for the demo tenant. Idempotent — calling
// `buildDemoState()` always returns a complete fresh state blob;
// applying it via TenantState.upsert wipes any prior demo activity.

const NOW = () => new Date();
const DAYS_AGO = (n: number) => new Date(Date.now() - n * 86400000);

// ── Org & stack ────────────────────────────────────────────────────
const org = {
  name: "Acme Care Health",
  industry: "Healthcare",
  size: "251-1000",
  website: "https://acmecare.example.com",
  contactName: "Jordan Pierce",
  contactEmail: "ciso@acmecare.example.com",
  contactPhone: "(555) 240-1812",
  techStack: {},
  compliance: ["HIPAA", "HITRUST"],
};

const tech = {
  identity: "Okta",
  endpoint: "CrowdStrike Falcon",
  siem: "Splunk Enterprise Security",
  firewall: "Palo Alto Networks NGFW",
  email: "Microsoft Defender for Office 365",
  cloud: "AWS",
  backup: "Veeam",
  mfa: "Duo Security",
  vulnerability: "Tenable",
  dlp: "Microsoft Purview DLP",
};

const comp = ["HIPAA", "HITRUST", "PCI-DSS"];

const team = [
  { name: "Jordan Pierce", email: "ciso@acmecare.example.com", role: "CISO", active: true },
  { name: "Riley Chen", email: "riley.chen@acmecare.example.com", role: "Security Engineer", active: true },
  { name: "Morgan Patel", email: "morgan.patel@acmecare.example.com", role: "SOC Analyst", active: true },
];

// ── Stakeholders ───────────────────────────────────────────────────
const sh = (firstName: string, lastName: string, title: string, email: string, cell: string, responsibilities = "") => ({
  id: Math.floor(Math.random() * 1e10),
  firstName, lastName, title, email, cell, responsibilities,
});

const stakeholders = {
  incidentCommander: [sh("Jordan", "Pierce", "CISO", "jordan.pierce@acmecare.example.com", "(555) 240-1812", "Strategic incident decisions & executive comms")],
  ciso: [sh("Jordan", "Pierce", "CISO", "jordan.pierce@acmecare.example.com", "(555) 240-1812", "Security leadership")],
  securityEngineers: [
    sh("Riley", "Chen", "Senior Security Engineer", "riley.chen@acmecare.example.com", "(555) 240-2014", "Detection engineering, IR triage"),
    sh("Morgan", "Patel", "SOC Analyst (Tier 2)", "morgan.patel@acmecare.example.com", "(555) 240-2015"),
    sh("Avery", "Singh", "Cloud Security Engineer", "avery.singh@acmecare.example.com", "(555) 240-2017"),
  ],
  legalContact: [sh("Sam", "Rosenberg", "VP, Legal", "sam.rosenberg@acmecare.example.com", "(555) 240-3022", "Privilege & breach notification")],
  riskContact: [sh("Taylor", "Brooks", "VP, Enterprise Risk", "taylor.brooks@acmecare.example.com", "(555) 240-3041")],
  executivePOC: [sh("Casey", "Wong", "COO", "casey.wong@acmecare.example.com", "(555) 240-1010", "Board escalation")],
  cyberInsuranceInternal: [sh("Parker", "Hayes", "Director of Risk Operations", "parker.hayes@acmecare.example.com", "(555) 240-3050")],
  hrContacts: [sh("Drew", "Liu", "Chief People Officer", "drew.liu@acmecare.example.com", "(555) 240-4002")],
  privacyContact: [sh("Quinn", "Adams", "Privacy Officer / DPO", "quinn.adams@acmecare.example.com", "(555) 240-3080", "HIPAA breach determinations")],
  externalLegal: [sh("Lauren", "Maddox", "Partner, Breach Counsel", "lmaddox@example-counsel.com", "(212) 555-0101", "Pre-engaged outside counsel — Privileged & Confidential")],
  forensicsContact: [sh("Dark Rock", "Cybersecurity", "Pre-Approved IR Partner", "IncidentResponse@Darkrocklabs.com", "(800) 555-0177", "Surge IR capacity, forensics, ransomware negotiation")],
  prContact: [sh("Imani", "Ross", "Director, External Communications", "imani.ross@example-pr.com", "(212) 555-0202", "Crisis communications retainer")],
  cyberInsuranceExternal: [sh("Hartford", "Cyber", "Claims Adjuster", "claims@example-insurer.com", "(800) 555-0303")],
  lawEnforcement: [sh("FBI", "IC3", "Field Office (NY)", "tip-line@example-le.gov", "(212) 555-0500", "Coordinate with Legal before engaging")],
  keySystems: [
    { id: 1, systemName: "Patient Portal — Production", category: "Customer-Facing Applications", criticality: "Critical", owner: "Riley Chen", ownerEmail: "riley.chen@acmecare.example.com", ownerCell: "(555) 240-2014", notes: "Tier-0 PHI exposure. RTO: 1h, RPO: 15m." },
    { id: 2, systemName: "EHR Cluster (Primary)", category: "Production / Operations", criticality: "Critical", owner: "Avery Singh", ownerEmail: "avery.singh@acmecare.example.com", ownerCell: "(555) 240-2017", notes: "Tier-0. PHI. Air-gapped backup nightly." },
    { id: 3, systemName: "AWS Production Account", category: "Cloud Platforms", criticality: "Critical", owner: "Avery Singh", ownerEmail: "avery.singh@acmecare.example.com", ownerCell: "(555) 240-2017", notes: "Org-level guardrails via Control Tower." },
    { id: 4, systemName: "Microsoft 365 Tenant", category: "Email / Collaboration", criticality: "High", owner: "Morgan Patel", ownerEmail: "morgan.patel@acmecare.example.com", ownerCell: "(555) 240-2015", notes: "Conditional access enforced." },
    { id: 5, systemName: "Workday HCM", category: "HR / HCM Systems", criticality: "High", owner: "Drew Liu", ownerEmail: "drew.liu@acmecare.example.com", ownerCell: "(555) 240-4002" },
    { id: 6, systemName: "Snowflake — Analytics DW", category: "Data Management / Storage", criticality: "High", owner: "Avery Singh", ownerEmail: "avery.singh@acmecare.example.com", ownerCell: "(555) 240-2017", notes: "De-identified data only." },
  ],
  vendors: [
    { id: 101, category: "edr", vendorName: "CrowdStrike", productName: "Falcon Insight XDR", accountId: "CS-AC-220841", contactName: "Pat Reilly", contactEmail: "pat.reilly@example-cs.com", contactPhone: "(800) 555-0011", supportPortal: "https://supportportal.crowdstrike.com", supportTier: "Premium 24×7", slaResponse: "1 hour P1", isPrimary: true, notes: "Auto-isolation enabled on all servers." },
    { id: 102, category: "siem", vendorName: "Splunk", productName: "Enterprise Security 7.4", accountId: "SPL-9942", contactName: "Tessa Knox", contactEmail: "tknox@example-splunk.com", contactPhone: "(800) 555-0022", supportPortal: "https://splunk.com/support", supportTier: "Premier", slaResponse: "2 hours P1", isPrimary: true, notes: "ES with Risk-Based Alerting." },
    { id: 103, category: "identity", vendorName: "Okta", productName: "Workforce Identity Cloud", accountId: "OKT-AC-7723", contactName: "Devon Ahmadi", contactEmail: "devon.a@example-okta.com", contactPhone: "(800) 555-0033", supportPortal: "https://help.okta.com", supportTier: "Premium", slaResponse: "1 hour P1", isPrimary: true, notes: "FastPass + FIDO2 for all employees." },
    { id: 104, category: "microsoft365", vendorName: "Microsoft", productName: "M365 E5 Compliance + Security", accountId: "MS-1928442", contactName: "Robin Yamamoto", contactEmail: "ryamamoto@example-ms.com", contactPhone: "(800) 555-0044", supportPortal: "https://admin.microsoft.com", supportTier: "Premier", slaResponse: "30 min P1", isPrimary: true },
    { id: 105, category: "firewall", vendorName: "Palo Alto Networks", productName: "PA-5450 NGFW", accountId: "PAN-220-AC-13", contactName: "Sage Iverson", contactEmail: "siverson@example-pan.com", contactPhone: "(800) 555-0055", supportPortal: "https://support.paloaltonetworks.com", supportTier: "Premium", slaResponse: "2 hours P1", isPrimary: true },
    { id: 106, category: "backup", vendorName: "Veeam", productName: "Backup & Replication v12 + Hardened Linux Repo", accountId: "VEE-9912", contactName: "Cameron Pruitt", contactEmail: "cpruitt@example-veeam.com", contactPhone: "(800) 555-0066", supportTier: "Production 24×7", slaResponse: "2 hours P1", isPrimary: true, notes: "Immutable repos with object-lock enabled." },
    { id: 107, category: "dfir", vendorName: "Dark Rock Cybersecurity", productName: "IR Retainer (40 hours pre-paid)", accountId: "DR-RETAINER-2026", contactName: "Incident Response Desk", contactEmail: "IncidentResponse@Darkrocklabs.com", contactPhone: "(800) 555-0177", supportPortal: "https://darkrocksecurity.com", supportTier: "24×7 hotline", slaResponse: "30 minutes", isPrimary: true, notes: "Engaged via the IR Planner. Privileged & Confidential." },
    { id: 108, category: "ti", vendorName: "Recorded Future", productName: "Recorded Future Intelligence Cloud", accountId: "RF-AC-441", contactName: "Hollis Marsh", contactEmail: "hmarsh@example-rf.com", contactPhone: "(800) 555-0077", supportTier: "Standard", slaResponse: "Next business day" },
    { id: 109, category: "email", vendorName: "Proofpoint", productName: "TAP + Email Protection", accountId: "PP-9824", contactName: "Jamie Quinn", contactEmail: "jquinn@example-pp.com", contactPhone: "(800) 555-0088", supportTier: "Premium", slaResponse: "2 hours P1", isPrimary: true, notes: "URL Defense + Email Fraud Defense." },
    { id: 110, category: "vuln", vendorName: "Tenable", productName: "Tenable.io + Nessus Pro", accountId: "TEN-AC-3399", contactName: "Reese Lockwood", contactEmail: "rlockwood@example-ten.com", contactPhone: "(800) 555-0099", supportTier: "Standard", slaResponse: "Next business day", isPrimary: true },
  ],
};

// ── Assessments — 3 over time, showing improvement ─────────────────
const assessments = [
  {
    id: 1700000001, date: DAYS_AGO(180).toLocaleString(), score: 52,
    answers: {
      "PR.AA-01": 2, "PR.AA-02": 1, "PR.AA-03": 2, "PR.AA-04": 2, "PR.AA-05": 1, "PR.AA-06": 2,
      "PR.DS-01": 2, "PR.DS-02": 3, "PR.DS-03": 1, "PR.DS-10": 1,
      "PR.PS-01": 2, "PR.PS-02": 1, "PR.PS-03": 2, "PR.PS-04": 2, "PR.PS-05": 1, "PR.PS-06": 1,
      "PR.IR-01": 2, "PR.IR-02": 2, "PR.IR-03": 2, "PR.IR-04": 2,
      "DE.CM-01": 2, "DE.CM-02": 2, "DE.CM-03": 1, "DE.CM-06": 2, "DE.CM-09": 2,
      "DE.AE-02": 2, "DE.AE-03": 2, "DE.AE-04": 1, "DE.AE-06": 1, "DE.AE-07": 1,
      "RC.RP-01": 2, "RC.RP-02": 2, "RC.RP-03": 2, "RC.RP-04": 1, "RC.RP-05": 2,
    },
    fnScores: [
      { fn: "Identify", score: 48 }, { fn: "Protect", score: 50 }, { fn: "Detect", score: 49 },
      { fn: "Respond", score: 55 }, { fn: "Recover", score: 60 }, { fn: "Govern", score: 52 },
    ],
    catScores: [],
    warnings: [],
    orgName: "Acme Care Health",
    recs: [],
  },
  {
    id: 1700000002, date: DAYS_AGO(90).toLocaleString(), score: 64,
    answers: {
      "PR.AA-01": 3, "PR.AA-02": 2, "PR.AA-03": 3, "PR.AA-04": 3, "PR.AA-05": 2, "PR.AA-06": 3,
      "PR.DS-01": 3, "PR.DS-02": 3, "PR.DS-03": 2, "PR.DS-10": 2,
      "PR.PS-01": 2, "PR.PS-02": 2, "PR.PS-03": 2, "PR.PS-04": 3, "PR.PS-05": 1, "PR.PS-06": 2,
      "PR.IR-01": 3, "PR.IR-02": 2, "PR.IR-03": 3, "PR.IR-04": 2,
      "DE.CM-01": 3, "DE.CM-02": 2, "DE.CM-03": 2, "DE.CM-06": 2, "DE.CM-09": 3,
      "DE.AE-02": 3, "DE.AE-03": 2, "DE.AE-04": 2, "DE.AE-06": 2, "DE.AE-07": 2,
      "RC.RP-01": 3, "RC.RP-02": 2, "RC.RP-03": 3, "RC.RP-04": 2, "RC.RP-05": 3,
    },
    fnScores: [
      { fn: "Identify", score: 60 }, { fn: "Protect", score: 64 }, { fn: "Detect", score: 60 },
      { fn: "Respond", score: 65 }, { fn: "Recover", score: 70 }, { fn: "Govern", score: 65 },
    ],
    catScores: [],
    warnings: [],
    orgName: "Acme Care Health",
    recs: [],
  },
  {
    id: 1700000003, date: DAYS_AGO(15).toLocaleString(), score: 71,
    answers: {
      "PR.AA-01": 3, "PR.AA-02": 3, "PR.AA-03": 4, "PR.AA-04": 3, "PR.AA-05": 3, "PR.AA-06": 3,
      "PR.DS-01": 3, "PR.DS-02": 4, "PR.DS-03": 2, "PR.DS-10": 3,
      "PR.PS-01": 3, "PR.PS-02": 3, "PR.PS-03": 2, "PR.PS-04": 3, "PR.PS-05": 2, "PR.PS-06": 2,
      "PR.IR-01": 3, "PR.IR-02": 3, "PR.IR-03": 3, "PR.IR-04": 2,
      "DE.CM-01": 3, "DE.CM-02": 2, "DE.CM-03": 2, "DE.CM-06": 2, "DE.CM-09": 4,
      "DE.AE-02": 3, "DE.AE-03": 3, "DE.AE-04": 2, "DE.AE-06": 2, "DE.AE-07": 3,
      "RC.RP-01": 3, "RC.RP-02": 3, "RC.RP-03": 4, "RC.RP-04": 2, "RC.RP-05": 3,
    },
    fnScores: [
      { fn: "Identify", score: 68 }, { fn: "Protect", score: 72 }, { fn: "Detect", score: 68 },
      { fn: "Respond", score: 73 }, { fn: "Recover", score: 76 }, { fn: "Govern", score: 70 },
    ],
    catScores: [],
    warnings: [],
    orgName: "Acme Care Health",
    recs: [],
  },
];

// ── Active incident (simulated, so the dashboard isn't quiet) ──────
const activeIncident = {
  id: "INC-DEMO-001",
  title: "Suspicious Outbound C2 — Citrix VDA Cluster",
  severity: "High",
  status: "Active",
  startTime: DAYS_AGO(2).toISOString(),
  internalCostRate: 175,
  iocs: ["185.220.101.42", "demo-c2.example", "f3a5e8c2-malware-hash"],
  affectedUsers: ["jdoe@acmecare.example.com"],
  affectedAssets: ["VDA-PROD-04", "VDA-PROD-09"],
  affectedRegions: ["us-east-1"],
  privacyConcern: false,
  attorneyPrivilege: true,
  privilegeEnforcedBy: "Sam Rosenberg, VP Legal",
  privilegeEnforcedAt: DAYS_AGO(2).toLocaleString(),
  phaseStatus: { Detect: "complete", Analyze: "complete", Contain: "in_progress", Eradicate: "pending", Recover: "pending", "Lessons Learned": "pending" },
  findings: [
    { text: "Beaconing from VDA-PROD-04 to 185.220.101.42 every 60s. Confirmed via firewall + EDR.", time: DAYS_AGO(2).toLocaleString() },
    { text: "Initial vector: phishing email opened on shared service account. Email pulled by Proofpoint TAP.", time: DAYS_AGO(2).toLocaleString() },
    { text: "Lateral movement attempted to EHR network — blocked by segmentation rules.", time: DAYS_AGO(1).toLocaleString() },
  ],
  timeline: [
    { time: DAYS_AGO(2).toLocaleString(), event: "Incident declared from CrowdStrike high-confidence beacon detection", elapsed: "00:00:00" },
    { time: DAYS_AGO(2).toLocaleString(), event: "Affected hosts auto-isolated via Falcon", elapsed: "00:03:20" },
    { time: DAYS_AGO(1).toLocaleString(), event: "Privilege engaged. Outside counsel (Maddox) on bridge.", elapsed: "23:14:00" },
    { time: DAYS_AGO(1).toLocaleString(), event: "Forensic image captured of VDA-PROD-04 (chain-of-custody logged).", elapsed: "26:01:00" },
  ],
  workstreams: { containment: ["Riley Chen", "Morgan Patel"], forensics: ["Dark Rock IR Lead"], legal: ["Sam Rosenberg", "Lauren Maddox"] },
  escalation: [{ level: "EXEC", at: DAYS_AGO(2).toLocaleString(), by: "Jordan Pierce" }],
  expenses: [],
  summaries: [],
  notifications: [],
  members: [
    { name: "Jordan Pierce",     role: "Incident Commander", hours: 12 },
    { name: "Riley Chen",        role: "SOC Lead",           hours: 9 },
    { name: "Morgan Patel",      role: "Forensics",          hours: 7 },
    { name: "Sam Rosenberg",     role: "Legal",              hours: 3 },
    { name: "Dark Rock IR Lead", role: "External IR",        hours: 11 },
  ],
};

// ── Closed incident in the log ─────────────────────────────────────
// Realistic detection lag + recovery times for the demo:
//   Active incident:  startTime → declaredAt = ~3 hours (good MTTD)
//   Closed incident:  declaredAt 95d ago → closedAt 82d ago = 13d MTTR
//                     startTime ~7 hours before declaredAt (slower MTTD)
const incidentLog = [
  {
    incidentId: "INC-DEMO-001",
    title: activeIncident.title,
    severity: "High",
    masterTicketId: 9001,
    startTime: new Date(Date.now() - 2 * 86400000 - 3 * 3600000).toLocaleString(),
    declaredAt: DAYS_AGO(2).toLocaleString(),
    status: "Active" as const,
  },
  {
    incidentId: "INC-2026-PHISH-Q1",
    title: "Q1 Phishing Campaign — Credential Harvest",
    severity: "Medium",
    masterTicketId: 9002,
    startTime: new Date(Date.now() - 95 * 86400000 - 7 * 3600000).toLocaleString(),
    declaredAt: DAYS_AGO(95).toLocaleString(),
    closedAt: DAYS_AGO(82).toLocaleString(),
    status: "Closed" as const,
  },
];

// ── Tickets ────────────────────────────────────────────────────────
const t = (id: number, title: string, severity: string, status: string, phase: string, assignee: string, details = "", ticketType = "child"): Record<string, unknown> => ({
  id, title, severity, status, phase, assignee, details, actions: [], created: DAYS_AGO(2).toLocaleDateString(), ticketType,
});
const tickets = [
  t(9001, "[INCIDENT] Suspicious Outbound C2 — Citrix VDA Cluster", "High", "Open", "Containment", "Riley Chen", "Master ticket for active incident.", "master"),
  t(9101, "Block C2 IPs 185.220.101.42 + DNS sinkhole demo-c2.example", "Critical", "Closed", "Containment", "Riley Chen", "Edge + DNS rules pushed."),
  t(9102, "Reset VDA service account credentials & rotate Kerberos ticket", "Critical", "In Review", "Containment", "Avery Singh"),
  t(9103, "Forensic image VDA-PROD-04 + VDA-PROD-09", "High", "Closed", "Containment", "Dark Rock IR"),
  t(9104, "Identify scope of credential exposure via Splunk + Okta logs", "High", "Open", "Analyze", "Morgan Patel"),
  t(9105, "Patient-data impact determination (HIPAA breach assessment)", "High", "Open", "Analyze", "Quinn Adams"),
  t(9201, "[SECURITY EVENT] CISA Advisory AA26-001: Citrix Vulnerability", "High", "Open", "Triage", "Riley Chen", "Tracked from threat intel feed.", "security-event"),
  t(9202, "Patch out-of-band: M365 Defender XDR rule update", "Medium", "Done", "Remediation", "Morgan Patel"),
];

// ── Tasks (kanban distribution) ────────────────────────────────────
const task = (id: number, title: string, priority: string, status: string, assignee = "", source = "Assessment Hitlist") => ({
  id, title, priority, status, assignee, updates: [], created: DAYS_AGO(15).toLocaleDateString(), source, irPhase: "prep",
});
const tasks = [
  task(8001, "Enforce phishing-resistant MFA on legacy admin consoles", "High", "In Progress", "Riley Chen"),
  task(8002, "Review & tune Splunk ES detections to top 5 healthcare TTPs", "High", "Backlog", ""),
  task(8003, "Restrict outbound DNS to enterprise resolver only", "Medium", "In Review", "Avery Singh"),
  task(8004, "Quarterly restore drill — EHR cluster (Q2)", "Medium", "Backlog", "Avery Singh", "IR Plan Readiness"),
  task(8005, "Document RTO/RPO for Tier-0 systems and surface on dashboard", "Medium", "Done", "Riley Chen"),
  task(8006, "Roll out Microsoft Purview DLP to all Teams channels", "Low", "Backlog", "Morgan Patel"),
  task(8007, "Update HIPAA breach notification workflow for 60-day window", "High", "Done", "Quinn Adams", "Tabletop AAR"),
  task(8008, "Pilot Microsoft Defender for Cloud Apps on M365", "Medium", "In Progress", "Avery Singh"),
  task(8009, "Add tabletop dry-run exercise to Q3 calendar", "Low", "Backlog", ""),
  task(8010, "Train new SOC analysts on Falcon Insight workflows", "Low", "Done", "Riley Chen"),
  task(8011, "Privileged access review for AWS root accounts", "High", "In Progress", "Avery Singh"),
  task(8012, "Map Snowflake DW data classifications to access policies", "Medium", "Backlog", "Avery Singh"),
];

// ── Forensic logs ──────────────────────────────────────────────────
const forensicLogs = [
  {
    id: 7001,
    title: "VDA-PROD-04 — Memory Capture (Volatility-ready)",
    classification: "Privileged & Confidential" as const,
    incidentId: "INC-DEMO-001",
    incidentTitle: activeIncident.title,
    description: "Live memory acquisition via Falcon RTR. Hash matches CrowdStrike forensic hash on file.",
    chainOfCustody: "Acquired by R. Chen (1d ago); reviewed by Dark Rock IR (12h ago). Stored encrypted in evidence vault.",
    createdBy: "Riley Chen",
    createdAt: DAYS_AGO(1).toISOString(),
    accessList: ["Riley Chen", "Dark Rock IR Lead", "Sam Rosenberg"],
    files: [{ id: 1, name: "vda-prod-04.mem", size: 8589934592, type: "memory", sha256: "f3a5e8c20a1bff…", uploadedAt: DAYS_AGO(1).toISOString() }],
    locked: true,
  },
  {
    id: 7002,
    title: "Phishing Email — Q1 2026 Campaign Sample",
    classification: "Confidential" as const,
    incidentId: "INC-2026-PHISH-Q1",
    incidentTitle: "Q1 Phishing Campaign — Credential Harvest",
    description: "Original message + headers preserved. Used in lessons-learned briefing.",
    chainOfCustody: "Pulled from Proofpoint quarantine; read-only export.",
    createdBy: "Morgan Patel",
    createdAt: DAYS_AGO(95).toISOString(),
    accessList: ["Morgan Patel", "Quinn Adams"],
    files: [{ id: 2, name: "phishing-q1-headers.eml", size: 124000, type: "email", sha256: "9d12bc77…", uploadedAt: DAYS_AGO(95).toISOString() }],
    locked: false,
  },
];

// ── Lessons learned ────────────────────────────────────────────────
const lessons = [
  { text: "Tier-0 isolation rules saved EHR availability — keep micro-segmentation as a Q3 priority.", date: DAYS_AGO(1).toLocaleDateString(), src: "Active Incident IR" },
  { text: "Service accounts without MFA are still our largest gap; move to managed identities by Q4.", date: DAYS_AGO(80).toLocaleDateString(), src: "Q1 Phishing AAR" },
  { text: "Splunk RBA tuning cut alert volume 40% with no MTTR regression.", date: DAYS_AGO(60).toLocaleDateString(), src: "SOC Retrospective" },
  { text: "Tabletop revealed our breach-counsel notification path was undocumented. Added to runbook.", date: DAYS_AGO(45).toLocaleDateString(), src: "Tabletop AAR" },
];

// ── Tabletop exercise ──────────────────────────────────────────────
const tabletopExercises = [
  {
    id: 6001,
    title: "Ransomware on EHR — Tier-0 Recovery",
    date: DAYS_AGO(45).toISOString(),
    status: "Completed",
    exerciseType: "Light TTX",
    tlpLevel: "TLP:AMBER",
    scenario: "Ransomware encryption of EHR primary cluster during business hours; backups suspected of pre-encryption.",
    scope: "EHR cluster, recovery decision tree, breach counsel notification, member messaging.",
    facilitator: "Dark Rock — Drew Madsen",
    facilitatorOrg: "Dark Rock Cybersecurity",
    sponsor: "CISO",
    participants: [
      { name: "Jordan Pierce", title: "CISO", department: "Security", roleInExercise: "Incident Commander" },
      { name: "Riley Chen", title: "Sr. Security Eng.", department: "Security", roleInExercise: "Forensics Lead" },
      { name: "Sam Rosenberg", title: "VP Legal", department: "Legal", roleInExercise: "Legal/Privilege" },
    ],
    objectives: [
      { id: "obj1", title: "Activate command structure", description: "Bridge convened within 30 min", rating: "Met", notes: "" },
      { id: "obj2", title: "Validate backup integrity", description: "Confirm immutable repo before restore", rating: "Partially Met", notes: "Added immutability check automation as follow-up" },
      { id: "obj3", title: "Breach counsel engagement", description: "Outside counsel briefed; privilege invoked", rating: "Met", notes: "" },
    ],
    findings: [{ id: 1, finding: "Backup integrity check was a manual step. Now scripted.", priority: "High", nistMapping: "RC.RP-03", owner: "Avery Singh", status: "Resolved", notes: "", taskCreated: true }],
    lessonsLearned: [{ id: 1, text: "Document the breach-counsel notification path explicitly in runbook.", impact: "Faster legal alignment", recommendation: "Add to IR runbook v3.2", addedToDashboard: true }],
    actionItems: [{ id: 1, text: "Add backup integrity automation", owner: "Avery Singh", priority: "High", dueDate: DAYS_AGO(-15).toLocaleDateString(), status: "Complete" }],
    feedback: [],
    strengths: ["Containment muscle memory", "Comms clarity"],
    documents: [],
    notes: "Strong execution. Two real action items from objective #2.",
    rating: 4,
    playbookId: "ransomware",
    walkThroughData: [],
    source: "Internal",
  },
];

// ── Pen test request ───────────────────────────────────────────────
const penTestRequests = [
  {
    id: 5001,
    testType: "External Network",
    orgName: "Acme Care Health",
    contactEmail: "ciso@acmecare.example.com",
    status: "Under Review",
    submittedAt: DAYS_AGO(10).toISOString(),
    formData: { scope: "External-facing assets, patient portal, M365 tenant.", schedule: "Q3 2026" },
    notes: "Annual compliance test; coordinate with HITRUST audit window.",
    reviewer: "Dark Rock — Pen Test Coordinator",
    reviewNotes: "Pricing prepared; awaiting approval.",
    pricing: { amount: 28000, description: "Black-box external + light social engineering. 3 weeks.", sentAt: DAYS_AGO(7).toISOString() },
    approvedAt: "",
    approvedBy: "",
    tester: "",
    testerEmail: "",
    startedAt: "",
    completedAt: "",
    commsLog: [
      { id: 1, from: "Dark Rock", message: "Scoping call notes uploaded.", timestamp: DAYS_AGO(8).toISOString(), type: "note" },
      { id: 2, from: "Dark Rock", message: "Pricing sent.", timestamp: DAYS_AGO(7).toISOString(), type: "approval" },
    ],
    timeline: [{ event: "Submitted", timestamp: DAYS_AGO(10).toISOString(), by: "Jordan Pierce" }, { event: "Pricing sent", timestamp: DAYS_AGO(7).toISOString(), by: "Dark Rock" }],
    findings: [],
    reportTitle: "",
    reportUploadedAt: "",
  },
];

// ── Notification log ───────────────────────────────────────────────
const notificationLog = [
  {
    id: 4001,
    event: "Incident Declared — Suspicious Outbound C2",
    recipients: ["jordan.pierce@acmecare.example.com", "casey.wong@acmecare.example.com"],
    subject: "[CONFIDENTIAL] Active incident declared — bridge convening",
    body: "An active incident has been declared. Severity: HIGH. Bridge: 555-0001-INC. Privilege engaged.",
    timestamp: DAYS_AGO(2).toISOString(),
    privileged: true,
    module: "Commander",
  },
];

// ── IR plan (mostly checked off) ───────────────────────────────────
const irData = {
  checked: {
    "preparation_0": true, "preparation_1": true, "preparation_2": true, "preparation_3": true,
    "identification_0": true, "identification_1": true,
    "notification_0": true, "notification_1": true, "notification_2": true,
    "containment_0": true, "containment_1": true,
    "analysis_0": true,
    "eradication_0": false,
    "recovery_0": false,
    "follow_up_0": false,
  },
  notes: { preparation_0: "IR plan v3.1 ratified Q4 2025; bridge testing monthly." },
  contacts: {
    core: [{ name: "Jordan Pierce", role: "Incident Commander", email: "jordan.pierce@acmecare.example.com" }],
    extended: [{ name: "Sam Rosenberg", role: "Legal", email: "sam.rosenberg@acmecare.example.com" }],
    external: [{ name: "Dark Rock IR Desk", role: "External IR", email: "IncidentResponse@Darkrocklabs.com" }, { name: "Lauren Maddox", role: "Outside Counsel", email: "lmaddox@example-counsel.com" }],
  },
};

// ── Cases (playbook-driven) ────────────────────────────────────────
const cases = [
  { id: 3001, title: "Phishing Campaign — Q1 2026", playbook: "phishing", status: "Closed", date: DAYS_AGO(82).toLocaleString(), members: ["Riley Chen", "Morgan Patel"] },
  { id: 3002, title: "Suspicious Outbound C2 — VDA Cluster", playbook: "ransomware", status: "Open", date: DAYS_AGO(2).toLocaleString(), members: ["Riley Chen", "Dark Rock IR"] },
];

// ── Policies generated ─────────────────────────────────────────────
const policiesGen = ["acceptable-use", "incident-response", "access-control", "data-classification", "vendor-risk-management"];

// ── Real metrics (one incident this month, one historical) ─────────
const monthIdx = NOW().getMonth();
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const metrics = monthLabels.map((l, i) => ({
  l,
  v: i === monthIdx ? 1 : i === (monthIdx + 9) % 12 ? 1 : 0,
}));

export function buildDemoState() {
  return {
    onboardDone: true,
    org,
    tech,
    comp,
    team,
    assessments,
    irData,
    activeIncident,
    incidentLog,
    tickets,
    tasks,
    cases,
    stakeholders,
    forensicLogs,
    lessons,
    tabletopExercises,
    penTestRequests,
    notificationLog,
    policiesGen,
    metrics,
    themeMode: "dark",
  };
}
