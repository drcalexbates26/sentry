import { useState, useEffect, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   DARK ROCK LABS :: SENTRY v3.0
   Cyber Resilience Platform
   ═══════════════════════════════════════════════════════════════════════════ */

const V="3.0.0";
const C={tl:"#00B4A6",tD:"#009A8E",ob:"#0A0E14",oL:"#0F1520",oM:"#151C28",pn:"#111827",pL:"#1A2332",pB:"#1E293B",
tx:"#E2E8F0",tM:"#94A3B8",tD2:"#64748B",w:"#FFF",r:"#EF4444",o:"#F97316",y:"#EAB308",g:"#22C55E",b:"#3B82F6",p:"#8B5CF6",cy:"#06B6D4"};

// ─── NIST CSF 2.0 FULL CONTROL SET ──────────────────────────────────────
const CSF2=[
{fn:"Govern",id:"GV",ico:"⚖️",cats:[
  {id:"GV.OC",n:"Organizational Context",qs:[{id:"GV.OC-01",q:"The organizational mission is understood and informs cybersecurity risk management",w:3},{id:"GV.OC-02",q:"Internal and external stakeholders are understood and their requirements are determined",w:2},{id:"GV.OC-03",q:"Legal, regulatory, and contractual requirements are understood and managed",w:3},{id:"GV.OC-04",q:"Critical objectives, capabilities, and services are understood and communicated",w:2},{id:"GV.OC-05",q:"Outcomes, capabilities, and services that depend on third parties are understood",w:2}]},
  {id:"GV.RM",n:"Risk Management Strategy",qs:[{id:"GV.RM-01",q:"Risk management objectives are established and agreed upon by organizational stakeholders",w:3},{id:"GV.RM-02",q:"Risk appetite and tolerance statements are established and communicated",w:3},{id:"GV.RM-03",q:"Cybersecurity risk management activities and outcomes are included in enterprise risk management",w:2},{id:"GV.RM-04",q:"Strategic direction for risk response is established and communicated",w:2}]},
  {id:"GV.RR",n:"Roles, Responsibilities & Authorities",qs:[{id:"GV.RR-01",q:"Organizational leadership is responsible and accountable for cybersecurity risk",w:3},{id:"GV.RR-02",q:"Roles and responsibilities for cybersecurity risk management are established and communicated",w:3},{id:"GV.RR-03",q:"Adequate resources are allocated commensurate with cybersecurity risk strategy",w:2},{id:"GV.RR-04",q:"Cybersecurity is included in human resources practices",w:2}]},
  {id:"GV.PO",n:"Policy",qs:[{id:"GV.PO-01",q:"Policy for managing cybersecurity risks is established based on organizational context and strategy",w:3},{id:"GV.PO-02",q:"Policy is reviewed, updated, and communicated with changes in requirements and environment",w:2}]},
  {id:"GV.SC",n:"Supply Chain Risk Management",qs:[{id:"GV.SC-01",q:"Cybersecurity supply chain risk management program is established and agreed upon",w:3},{id:"GV.SC-02",q:"Cybersecurity roles and responsibilities for suppliers and partners are established and communicated",w:2},{id:"GV.SC-03",q:"Supply chain risk management is integrated into broader risk management processes",w:2},{id:"GV.SC-04",q:"Suppliers are assessed and prioritized by criticality",w:2},{id:"GV.SC-05",q:"Requirements to address cybersecurity risks in supply chains are included in contracts",w:2}]},
]},
{fn:"Identify",id:"ID",ico:"🔎",cats:[
  {id:"ID.AM",n:"Asset Management",qs:[{id:"ID.AM-01",q:"Inventories of hardware managed by the organization are maintained",w:3},{id:"ID.AM-02",q:"Inventories of software, services, and systems managed by the organization are maintained",w:3},{id:"ID.AM-03",q:"Representations of authorized network communication and data flows are maintained",w:2},{id:"ID.AM-04",q:"Inventories of services provided by suppliers are maintained",w:2},{id:"ID.AM-05",q:"Assets are prioritized based on classification, criticality, and business value",w:3}]},
  {id:"ID.RA",n:"Risk Assessment",qs:[{id:"ID.RA-01",q:"Vulnerabilities in assets are identified, validated, and recorded",w:3},{id:"ID.RA-02",q:"Cyber threat intelligence is received from information sharing forums and sources",w:2},{id:"ID.RA-03",q:"Internal and external threats to the organization are identified and recorded",w:3},{id:"ID.RA-04",q:"Potential impacts and likelihoods of threats exploiting vulnerabilities are identified",w:3},{id:"ID.RA-05",q:"Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk",w:3}]},
  {id:"ID.IM",n:"Improvement",qs:[{id:"ID.IM-01",q:"Improvements are identified from evaluations of current security posture",w:2},{id:"ID.IM-02",q:"Improvements are identified from security tests and exercises including those with suppliers",w:2},{id:"ID.IM-03",q:"Improvements are identified from execution of operational processes, procedures, and activities",w:2}]},
]},
{fn:"Protect",id:"PR",ico:"🛡️",cats:[
  {id:"PR.AA",n:"Identity Mgmt, Auth & Access",qs:[{id:"PR.AA-01",q:"Identities and credentials for authorized users, services, and hardware are managed",w:3},{id:"PR.AA-02",q:"Identities are proofed and bound to credentials based on context of interactions",w:2},{id:"PR.AA-03",q:"Users, services, and hardware are authenticated commensurate with risk of transaction",w:3,smart:"identity"},{id:"PR.AA-04",q:"Identity assertions are protected, conveyed, and verified",w:2},{id:"PR.AA-05",q:"Access permissions, entitlements, and authorizations are managed per principles of least privilege and separation of duties",w:3},{id:"PR.AA-06",q:"Physical access to assets is managed, monitored, and enforced",w:2}]},
  {id:"PR.AT",n:"Awareness & Training",qs:[{id:"PR.AT-01",q:"Personnel are provided cybersecurity awareness and training to perform their duties",w:3},{id:"PR.AT-02",q:"Privileged users understand their roles and responsibilities",w:2}]},
  {id:"PR.DS",n:"Data Security",qs:[{id:"PR.DS-01",q:"Data-at-rest is protected",w:3,smart:"cloud"},{id:"PR.DS-02",q:"Data-in-transit is protected",w:3},{id:"PR.DS-03",q:"Assets are formally managed throughout removal, transfers, and disposition",w:2},{id:"PR.DS-10",q:"Confidentiality, integrity, and availability of data-in-use is protected",w:2}]},
  {id:"PR.PS",n:"Platform Security",qs:[{id:"PR.PS-01",q:"Configuration management practices are established and applied",w:3},{id:"PR.PS-02",q:"Software is maintained, replaced, and removed commensurate with risk",w:3,smart:"endpoint"},{id:"PR.PS-03",q:"Hardware is maintained, replaced, and removed commensurate with risk",w:2},{id:"PR.PS-04",q:"Log records are generated and made available for continuous monitoring",w:3,smart:"siem"},{id:"PR.PS-05",q:"Installation and execution of unauthorized software is prevented",w:2},{id:"PR.PS-06",q:"Secure software development practices are integrated into the SDLC",w:2}]},
  {id:"PR.IR",n:"Technology Infrastructure Resilience",qs:[{id:"PR.IR-01",q:"Networks and environments are protected from unauthorized logical access and usage",w:3,smart:"firewall"},{id:"PR.IR-02",q:"The organization's technology assets are protected from environmental threats",w:2},{id:"PR.IR-03",q:"Mechanisms are implemented to achieve resilience in normal and adverse situations",w:3,smart:"backup"},{id:"PR.IR-04",q:"Adequate resource capacity to ensure availability is maintained",w:2}]},
]},
{fn:"Detect",id:"DE",ico:"🔔",cats:[
  {id:"DE.CM",n:"Continuous Monitoring",qs:[{id:"DE.CM-01",q:"Networks and network services are monitored to find potentially adverse events",w:3,smart:"siem"},{id:"DE.CM-02",q:"The physical environment is monitored to find potentially adverse events",w:2},{id:"DE.CM-03",q:"Personnel activity and technology usage are monitored to find potentially adverse events",w:3},{id:"DE.CM-06",q:"External service provider activities and services are monitored",w:2},{id:"DE.CM-09",q:"Computing hardware and software are monitored to find potentially adverse events",w:3,smart:"endpoint"}]},
  {id:"DE.AE",n:"Adverse Event Analysis",qs:[{id:"DE.AE-02",q:"Potentially adverse events are analyzed to better understand associated activities",w:3},{id:"DE.AE-03",q:"Information is correlated from multiple sources",w:3,smart:"siem"},{id:"DE.AE-04",q:"The estimated impact and scope of adverse events are understood",w:2},{id:"DE.AE-06",q:"Information on adverse events is provided to authorized staff and tools",w:2},{id:"DE.AE-07",q:"Cyber threat intelligence and other contextual information are integrated into the analysis",w:2}]},
]},
{fn:"Respond",id:"RS",ico:"⚡",cats:[
  {id:"RS.MA",n:"Incident Management",qs:[{id:"RS.MA-01",q:"The incident response plan is executed in coordination with relevant third parties",w:3},{id:"RS.MA-02",q:"Incident reports are triaged and validated",w:3},{id:"RS.MA-03",q:"Incidents are categorized and prioritized",w:3},{id:"RS.MA-04",q:"Incidents are escalated or elevated as needed",w:2},{id:"RS.MA-05",q:"The criteria for initiating incident recovery are applied",w:2}]},
  {id:"RS.AN",n:"Incident Analysis",qs:[{id:"RS.AN-03",q:"Analysis is performed to determine what has taken place during an incident",w:3},{id:"RS.AN-06",q:"Actions performed during an investigation are recorded and the integrity of evidence is preserved",w:3},{id:"RS.AN-07",q:"Incident data and metadata are collected and the integrity and provenance are preserved",w:2},{id:"RS.AN-08",q:"An incident's magnitude is estimated and validated",w:2}]},
  {id:"RS.CO",n:"Incident Response Reporting & Comms",qs:[{id:"RS.CO-02",q:"Internal and external stakeholders are notified of incidents",w:3},{id:"RS.CO-03",q:"Information is shared with designated internal and external stakeholders",w:2}]},
  {id:"RS.MI",n:"Incident Mitigation",qs:[{id:"RS.MI-01",q:"Incidents are contained",w:3},{id:"RS.MI-02",q:"Incidents are eradicated",w:3}]},
]},
{fn:"Recover",id:"RC",ico:"🔄",cats:[
  {id:"RC.RP",n:"Incident Recovery Plan Execution",qs:[{id:"RC.RP-01",q:"The recovery portion of the incident response plan is executed once initiated",w:3},{id:"RC.RP-02",q:"Recovery actions are selected, scoped, and prioritized considering the criticality of affected assets",w:3},{id:"RC.RP-03",q:"The integrity of backups and other restoration assets is verified before using them",w:3,smart:"backup"},{id:"RC.RP-04",q:"Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms",w:2},{id:"RC.RP-05",q:"The integrity of restored assets is verified, systems and services restored, and normal operations confirmed",w:3}]},
  {id:"RC.CO",n:"Incident Recovery Communication",qs:[{id:"RC.CO-03",q:"Recovery activities and progress are communicated to internal and external stakeholders",w:2},{id:"RC.CO-04",q:"Public updates on recovery are shared using approved methods and messaging",w:2}]},
]},
];

const SCORE_LBL=["Not Implemented","Initial / Ad Hoc","Developing / Defined","Managed / Implemented","Optimized / Adaptive"];

// ─── PLAYBOOKS ───────────────────────────────────────────────────────────
const PLAYBOOKS=[
{id:"pb_ransom",cat:"Malware",name:"Ransomware Attack",sev:"Critical",icon:"💀",desc:"Ransomware has encrypted files or systems. Attackers may demand cryptocurrency payment. May involve double-extortion with data exfiltration prior to encryption.",
  iocs:["Encrypted files with unusual extensions (.locked, .crypt, .enc)","Ransom note files (README.txt, DECRYPT.html) on desktops and shares","Mass file modification events in short timeframe (seconds/minutes)","Disabled Volume Shadow Copy service and backup agents","Outbound traffic to known C2 infrastructure or Tor exit nodes","Scheduled tasks or services created for persistence","Anti-virus/EDR tampered with or disabled","PowerShell/WMI lateral movement activity"],
  contain:["Isolate ALL affected systems from network immediately (do NOT power off)","Disable affected user accounts and ALL service accounts on compromised systems","Block identified C2 IPs, domains, and URLs at firewall and DNS","Preserve encrypted file samples, ransom notes, and malware binaries","Do NOT pay ransom without explicit legal counsel and insurance guidance","Engage Dark Rock Cybersecurity IR team immediately","Notify cyber insurance carrier and invoke breach coach","Disable RDP and remote access to affected network segments","Capture volatile memory from affected systems before any reboot","Identify and isolate backup infrastructure to prevent encryption"],
  erad:["Identify and document initial access vector (phishing, RDP brute force, VPN vulnerability, supply chain)","Remove ALL persistence mechanisms: scheduled tasks, services, registry run keys, WMI subscriptions","Scan entire environment for threat actor tools (Cobalt Strike, Mimikatz, PsExec, etc.)","Rebuild ALL affected systems from known-clean gold images","Reset ALL credentials enterprise-wide if ANY lateral movement confirmed","Patch the specific vulnerability exploited for initial access across all systems","Review and harden Group Policy Objects for security baseline","Verify no backdoor accounts or unauthorized SSH keys remain"],
  recover:["Validate backup integrity BEFORE restoration (check for encryption/corruption)","Restore from last known-clean backup point (must predate initial compromise)","Prioritize restoration by business criticality tier (Tier 1 first)","Validate data integrity post-restoration with checksums and business owner review","Implement enhanced monitoring and threat hunting for minimum 90 days","Conduct full vulnerability scan post-recovery to verify hardened state","Update and test backup procedures based on incident findings"],
  mitre:["T1486 Data Encrypted for Impact","T1490 Inhibit System Recovery","T1059 Command and Scripting Interpreter","T1078 Valid Accounts","T1021 Remote Services","T1053 Scheduled Task/Job","T1562 Impair Defenses"]},
{id:"pb_bec",cat:"Social Engineering",name:"Business Email Compromise (BEC)",sev:"High",icon:"📧",desc:"Attacker has compromised or spoofed a business email account to conduct fraud, typically targeting wire transfers, payroll diversion, or sensitive data theft.",
  iocs:["Unusual email forwarding rules created (external forwarding, RSS feeds)","Login from anomalous geographic locations or impossible travel","Wire transfer requests with urgency language or executive impersonation","Vendor payment detail change requests without verbal verification","Inbox rules hiding sent items, deleted items, or specific keywords","MFA fatigue bombing or push notification acceptance from unknown device","OAuth application consent granted to unknown third-party application","Reply-to address differing from display name or expected domain"],
  contain:["Disable compromised email account immediately","Revoke ALL active sessions, refresh tokens, and app passwords","Review and remove ALL malicious inbox rules and forwarding rules","Contact financial institution immediately to halt or reverse fraudulent transfers","Notify affected business partners, vendors, and customers","Preserve full mailbox audit logs, Entra ID sign-in logs, and UAL","Block identified malicious IPs at conditional access level","Review and revoke ALL OAuth application consent grants on affected account"],
  erad:["Reset credentials with new strong password and MANDATORY MFA re-enrollment","Audit ALL email forwarding rules organization-wide (not just affected account)","Review ALL OAuth/app consent grants across entire tenant","Remove any attacker-created mail flow rules, transport rules, or connectors","Validate no persistence via OAuth tokens, service principals, or app registrations","Check for attacker-created mailbox delegation or folder permissions","Review Azure AD audit logs for administrative actions by compromised account"],
  recover:["Re-enable account with fresh credentials, enforced MFA, and conditional access","Implement phishing-resistant MFA (FIDO2/passkeys) for high-value accounts","Deploy advanced anti-phishing policies and link/attachment sandboxing","Conduct targeted security awareness training for affected department","Implement out-of-band verification requirement for all payment changes","Review and tighten conditional access policies based on findings"],
  mitre:["T1566 Phishing","T1114 Email Collection","T1098 Account Manipulation","T1534 Internal Spearphishing","T1199 Trusted Relationship"]},
{id:"pb_phish",cat:"Social Engineering",name:"Phishing / Credential Harvesting",sev:"High",icon:"🎣",desc:"Mass or targeted phishing campaign harvesting user credentials via spoofed login pages, malicious attachments, or social engineering to gain initial access.",
  iocs:["Multiple users reporting suspicious emails with similar lure content","Spike in failed authentication attempts followed by successful logins","Users accessing credential harvesting URLs identified by threat intel","MFA push notifications received without user-initiated login","New device enrollments in identity platform from unusual locations","Credential dumps on dark web or paste sites referencing organization domain","Phishing kit artifacts discovered on compromised web infrastructure"],
  contain:["Block sender domains, IPs, and URLs at email gateway and web proxy","Purge phishing emails from all mailboxes using admin search and destroy","Reset passwords for ALL users who clicked links or submitted credentials","Revoke sessions for ALL potentially affected accounts","Enable conditional access requiring compliant/known devices","Notify all staff about active phishing campaign with safe examples","Block identified phishing domains at DNS level organization-wide"],
  erad:["Identify full scope: how many users received, clicked, and submitted credentials","Audit authentication logs for use of harvested credentials","Check for persistence: forwarding rules, OAuth grants, MFA device changes","Remove any unauthorized MFA devices enrolled during compromise window","Scan endpoints of users who clicked for malware/payload delivery","Review and strengthen email authentication: SPF, DKIM, DMARC enforcement"],
  recover:["Force MFA re-enrollment for all affected users","Deploy phishing simulation to measure organizational awareness","Implement email banner warnings for external senders","Review and enhance email filtering rules based on campaign IOCs","Update security awareness training with campaign-specific examples","Consider moving to phishing-resistant authentication (passkeys/FIDO2)"],
  mitre:["T1566.001 Spearphishing Attachment","T1566.002 Spearphishing Link","T1556 Modify Authentication Process","T1078 Valid Accounts"]},
{id:"pb_sqli",cat:"OWASP Top 10",name:"A03: Injection Attack",sev:"High",icon:"💉",desc:"SQL, NoSQL, OS command, LDAP, or expression language injection exploiting application input handling vulnerabilities to access, modify, or exfiltrate data.",
  iocs:["WAF alerts for SQL injection patterns (UNION SELECT, OR 1=1, etc.)","Unusual or complex database queries in application logs","Database error messages exposed to end users in HTTP responses","Unexpected data exports, bulk queries, or database dump activity","New database user accounts or privilege escalations","Time-based or boolean-based blind injection traffic patterns","Application logs showing encoded/obfuscated input payloads"],
  contain:["Block attacking IP addresses at WAF and network firewall","Enable WAF SQL injection rule sets to full blocking mode","Take affected application offline if active data exfiltration confirmed","Revoke database credentials used by the compromised application service account","Create forensic snapshot/backup of affected database BEFORE any changes","Preserve web server access logs, application logs, and database audit logs"],
  erad:["Identify and patch ALL injection points in application source code","Implement parameterized queries / prepared statements for all database interactions","Deploy comprehensive input validation and output encoding","Review and harden database permissions to absolute minimum required (least privilege)","Remove any attacker-created database objects, users, or stored procedures","Implement stored procedure-only access pattern where feasible","Add application-layer rate limiting on sensitive endpoints"],
  recover:["Restore database to verified pre-compromise state if integrity compromised","Rotate ALL database credentials, connection strings, and API keys","Re-deploy hardened application code through CI/CD pipeline","Implement continuous DAST scanning in deployment pipeline","Schedule Dark Rock Labs penetration test to validate remediation","Review OWASP guidelines and update secure coding standards"],
  mitre:["T1190 Exploit Public-Facing Application","T1505 Server Software Component","T1070 Indicator Removal"]},
{id:"pb_bac",cat:"OWASP Top 10",name:"A01: Broken Access Control",sev:"High",icon:"🔓",desc:"Users acting outside intended permissions: horizontal privilege escalation (accessing other users' data), vertical privilege escalation (accessing admin functions), or IDOR vulnerabilities.",
  iocs:["Users accessing API resources outside their authorized scope","API responses returning data belonging to other users/tenants","Direct object reference manipulation detected in request logs","Unauthorized administrative function access by standard users","JWT/token tampering or replay attempts","Forced browsing to restricted URLs returning 200 instead of 403","Parameter manipulation changing user IDs, account numbers, or resource identifiers"],
  contain:["Disable affected API endpoints or application features immediately","Revoke ALL compromised user sessions and tokens","Implement emergency access control rules at API gateway/WAF level","Preserve complete access logs for the affected time window","Assess scope of unauthorized data access for breach notification purposes"],
  erad:["Implement server-side access control enforcement (never trust client-side only)","Apply deny-by-default for all resources and functions","Add object-level and function-level authorization checks on every endpoint","Implement rate limiting and anomaly detection on sensitive endpoints","Remove or properly restrict CORS configuration","Enforce JWT validation with proper signature verification and expiration","Add automated access control testing to CI/CD pipeline"],
  recover:["Re-deploy application with hardened authorization framework","Conduct comprehensive access control audit across all endpoints","Implement row-level security in database layer as defense-in-depth","Review and document all privilege levels with principle of least privilege","Notify affected users if their data was accessed by unauthorized parties","Schedule penetration test focused on access control validation"],
  mitre:["T1068 Exploitation for Privilege Escalation","T1078 Valid Accounts","T1190 Exploit Public-Facing Application"]},
{id:"pb_llm",cat:"AI/ML Threats",name:"LLM Compromise / Prompt Injection",sev:"High",icon:"🤖",desc:"Adversary exploiting LLM-integrated systems via direct or indirect prompt injection, training data poisoning, model theft, sensitive data disclosure through AI interfaces, or unauthorized tool/plugin invocation.",
  iocs:["Adversarial or jailbreak prompts detected in LLM input logs","LLM producing responses containing PII, credentials, or internal system details","Model behavior deviating significantly from baseline response patterns","Excessive API calls to LLM endpoints from single source or service account","Training data access from unauthorized accounts or unusual data pipeline activity","LLM invoking plugins or tools against endpoints not in approved list","Unusual embedding generation or vector database query patterns","Data exfiltration patterns through crafted multi-turn conversations"],
  contain:["Rate-limit or completely disable affected LLM endpoints","Revoke API keys and service account credentials associated with suspicious activity","Isolate LLM inference environment from production data sources and internal APIs","Block source IPs conducting prompt injection attacks at WAF/API gateway","Disable ALL compromised or suspicious plugins, tools, and function-calling integrations","Preserve complete LLM interaction logs, model artifacts, and training pipeline records","Review and restrict system prompt access to authorized personnel only"],
  erad:["Audit and sanitize ALL LLM system prompts for injection vectors and data leakage","Implement multi-layer input validation: regex filters, semantic analysis, and guardrails","Review and restrict LLM access to sensitive data sources, APIs, and internal services","Validate model integrity against known-good checksums and weights","Remove any unauthorized fine-tuning data, LoRA adapters, or model modifications","Implement output filtering and PII detection on all LLM responses","Review RAG pipeline for poisoned documents or embeddings","Audit tool/function definitions for overly permissive capabilities"],
  recover:["Restore LLM model from verified clean checkpoint if integrity compromised","Re-deploy with hardened prompt engineering guardrails and defense-in-depth","Implement human-in-the-loop approval for sensitive operations triggered by LLM","Deploy LLM-specific monitoring, anomaly detection, and content safety scanning","Update AI acceptable use policies and LLM security guidelines","Conduct red team exercise specifically targeting LLM attack surface","Implement canary tokens in sensitive data to detect future unauthorized access"],
  mitre:["T1059 Command and Scripting Interpreter","T1530 Data from Cloud Storage","T1119 Automated Collection","T1041 Exfiltration Over C2 Channel","T1190 Exploit Public-Facing Application"]},
{id:"pb_oauth",cat:"Identity & Access",name:"OAuth Token Compromise",sev:"Critical",icon:"🔑",desc:"Adversary has obtained, forged, or manipulated OAuth tokens to gain persistent unauthorized access to cloud services and APIs without requiring valid passwords. Enables bypass of MFA and conditional access policies.",
  iocs:["OAuth token usage from anomalous geographic locations or unknown device fingerprints","Consent grants to unfamiliar, recently registered, or suspicious OAuth applications","Refresh token activity outside normal business hours or from unexpected IP ranges","Bulk data access via Microsoft Graph API, Google API, or similar using delegated permissions","New OAuth app registrations with overly broad permission scopes (Mail.Read, Files.ReadWrite.All)","Token replay detected from multiple geographic locations simultaneously","Service principal credentials accessed or modified by non-admin accounts"],
  contain:["Revoke ALL refresh tokens for affected users immediately via admin portal","Revoke OAuth application consent grants for all suspicious applications","Block suspicious OAuth application Client IDs at identity provider level","Disable affected user accounts pending full investigation","Review and revoke ALL app registrations created in last 90 days","Implement conditional access requiring compliant/managed devices immediately","Capture and preserve OAuth consent audit logs and sign-in logs"],
  erad:["Audit ALL OAuth application consents across entire organization/tenant","Remove ALL unauthorized third-party application registrations and service principals","Implement OAuth application allow-listing (block all apps not explicitly approved)","Review and restrict default user consent settings (require admin approval)","Validate no backdoor service principals, certificates, or federated credentials exist","Rotate ALL client secrets, certificates, and credentials for legitimate applications","Review delegated and application permissions for all consented apps"],
  recover:["Re-enable accounts with fresh credentials and mandatory phishing-resistant MFA","Implement continuous access evaluation (CAE) policies","Deploy OAuth application governance and automated consent review tooling","Configure real-time alerts for new consent grants and app registrations","Restrict user consent to verified publisher applications only","Conduct organization-wide OAuth hygiene review with full permission audit","Update identity security playbook with token compromise scenarios"],
  mitre:["T1528 Steal Application Access Token","T1550.001 Application Access Token","T1098.003 Additional Cloud Roles","T1078.004 Cloud Accounts","T1098 Account Manipulation"]},
{id:"pb_cloud",cat:"Cloud Security",name:"Cloud Infrastructure Compromise",sev:"Critical",icon:"☁️",desc:"Unauthorized access to cloud infrastructure (AWS, Azure, GCP) via compromised credentials, misconfigured resources, exposed APIs, or exploited cloud-native services. May include cryptojacking, data exfiltration, or infrastructure abuse.",
  iocs:["Console logins from unexpected regions or IP addresses","New IAM users, roles, or access keys created without change request","Cloud resource creation in unusual regions (cryptojacking indicator)","S3 buckets, storage accounts, or GCS buckets with public access enabled","Security group / firewall rule changes allowing unrestricted inbound access","CloudTrail / Activity Log / Audit Log disabled or modified","Unusual API call patterns: high volume, reconnaissance-style enumeration","Lambda/Functions/Cloud Run deployments by unknown principals","Cost anomalies indicating unauthorized resource consumption"],
  contain:["Disable compromised IAM credentials and access keys immediately","Revert unauthorized security group and firewall rule changes","Terminate unauthorized compute instances and serverless functions","Enable CloudTrail/Activity Logging if disabled; preserve existing logs","Restrict console access to known IP ranges via conditional policies","Block lateral movement by isolating compromised VPCs/VNets","Snapshot affected instances for forensic analysis before termination"],
  erad:["Rotate ALL access keys, service account credentials, and secrets in affected account","Audit ALL IAM policies for overly permissive access (especially */*)","Remove unauthorized IAM users, roles, policies, and federated access","Review and remediate all public-facing resource misconfigurations","Implement SCPs/Azure Policy/Org Policies to prevent common misconfigs","Enable and enforce MFA for all console and CLI access","Review resource policies on storage, databases, and messaging services"],
  recover:["Deploy cloud security posture management (CSPM) tooling","Implement infrastructure-as-code with security guardrails (Terraform, CloudFormation)","Enable GuardDuty/Defender for Cloud/Security Command Center","Establish cloud security baseline with continuous compliance checking","Review and implement CIS Benchmarks for cloud provider","Implement cost alerts and anomaly detection for unauthorized usage","Conduct cloud-specific penetration test with Dark Rock Labs"],
  mitre:["T1078.004 Cloud Accounts","T1580 Cloud Infrastructure Discovery","T1537 Transfer Data to Cloud Account","T1496 Resource Hijacking","T1562 Impair Defenses"]},
{id:"pb_zeroday",cat:"Advanced Threats",name:"Zero-Day Exploitation",sev:"Critical",icon:"⚡",desc:"Exploitation of a previously unknown vulnerability with no available patch. Requires immediate containment and coordination with vendor and threat intelligence community.",
  iocs:["EDR/AV detecting unknown or novel exploit behavior (behavioral detection)","Crash dumps or application faults indicating memory corruption","Unusual process execution chains not matching normal application behavior","Network traffic patterns matching exploit delivery (heap sprays, ROP chains)","Vendor security advisory referencing active exploitation in the wild","Threat intelligence feeds flagging emerging CVE with no patch available","Anomalous privileged process creation from typically unprivileged applications"],
  contain:["Isolate affected systems and remove from network if actively exploited","Implement virtual patching via WAF or IPS rules if available","Disable or restrict access to the vulnerable service/application","Apply vendor-recommended mitigations or workarounds immediately","Increase monitoring sensitivity for affected system type across environment","Engage Dark Rock IR team for threat hunting across enterprise","Report to relevant ISACs and threat intelligence sharing communities","Coordinate with software vendor for emergency patch timeline"],
  erad:["Apply vendor patch immediately upon release (emergency change process)","Validate patch effectiveness through scanning and testing","Hunt for evidence of exploitation prior to patch across all affected systems","Review all systems running vulnerable software for compromise indicators","Remove any persistence mechanisms established via the exploit","Assess whether exploit was used for initial access or privilege escalation"],
  recover:["Verify patching across 100% of affected systems (no exceptions)","Conduct thorough threat hunt for any missed compromise indicators","Implement additional detection rules specific to the exploit technique","Update vulnerability management program to accelerate zero-day response","Review network segmentation to limit future zero-day blast radius","Document full timeline and submit to threat intelligence sharing partners"],
  mitre:["T1190 Exploit Public-Facing Application","T1203 Exploitation for Client Execution","T1068 Exploitation for Privilege Escalation","T1211 Exploitation for Defense Evasion"]},
{id:"pb_dataleak",cat:"Data Protection",name:"Data Leak / Accidental Exposure",sev:"High",icon:"📤",desc:"Sensitive organizational data exposed through misconfiguration, accidental sharing, lost devices, misdirected communications, or unsecured public repositories (GitHub, S3, etc.).",
  iocs:["Sensitive data discovered on public code repositories (GitHub, GitLab, Bitbucket)","Cloud storage resources found publicly accessible via external scanning","Sensitive documents shared externally via collaboration tools without restrictions","Customer or security researcher reports data accessible via public URL","DLP alerts for sensitive data transmitted to unauthorized destinations","Credentials, API keys, or certificates found in public repositories or paste sites","Employee reports accidental email to wrong recipient containing sensitive data"],
  contain:["Remove or restrict access to exposed data immediately (make private/delete)","Revoke ANY credentials, API keys, or certificates found in the exposure","Assess the exposure window: when was data first exposed and when was it discovered","Determine what data was exposed and its classification level","Identify whether the data was accessed by unauthorized parties during exposure","Preserve evidence of the exposure for breach notification assessment","Notify Legal and Compliance for breach determination"],
  erad:["Implement secret scanning in CI/CD pipelines (pre-commit hooks)","Deploy DLP policies to prevent sensitive data in unauthorized locations","Configure cloud storage defaults to private (block public access at org level)","Review and restrict external sharing permissions in collaboration tools","Implement data classification labels with automated policy enforcement","Audit all public-facing repositories and cloud resources for sensitive data","Review and restrict who can create publicly accessible resources"],
  recover:["Conduct breach notification assessment with Legal (was PII/PHI involved?)","Execute notification procedures if breach threshold met","Rotate ALL potentially exposed credentials and secrets across all environments","Implement automated sensitive data discovery and classification scanning","Deploy cloud security posture management for continuous misconfiguration detection","Enhance security awareness training focused on secure data handling","Review and update Data Classification Policy based on findings"],
  mitre:["T1567 Exfiltration Over Web Service","T1530 Data from Cloud Storage","T1213 Data from Information Repositories","T1537 Transfer Data to Cloud Account"]},
{id:"pb_supply",cat:"Supply Chain",name:"Supply Chain Compromise",sev:"Critical",icon:"📦",desc:"A vendor, supplier, or software dependency has been compromised, potentially introducing malicious code, backdoors, or unauthorized access into your environment through trusted update mechanisms.",
  iocs:["Vendor issues security advisory or breach notification","Unexpected behavior from vendor-managed or vendor-connected systems","Software update or patch with unusual signing certificate or timing","Anomalous network traffic to vendor infrastructure or new domains","SBOM analysis reveals compromised or hijacked dependency package","Community reports of supply chain attack affecting shared vendor/library","Unauthorized modifications to vendor-provided configuration or code"],
  contain:["Isolate ALL systems connected to or managed by the compromised vendor","Revoke ALL vendor access credentials, API keys, and VPN connections","Block ALL network connectivity to vendor infrastructure at firewall","Notify all internal stakeholders dependent on the vendor's services","Preserve logs showing all vendor access activity for forensic analysis","Identify all systems running the compromised software version","Notify your own downstream customers if you distribute affected software"],
  erad:["Remove ALL compromised vendor software, updates, or patches","Rebuild systems that executed compromised components from clean images","Audit ALL vendor access paths, API integrations, and data flows","Verify integrity of ALL software from the affected vendor using known-good hashes","Review SBOM for transitive dependency exposure across all applications","Validate no backdoors, web shells, or persistence mechanisms were installed","Review and update vendor risk assessment to Critical"],
  recover:["Restore affected systems from pre-compromise validated backups","Re-establish vendor access only with enhanced monitoring and controls","Implement software composition analysis (SCA) in build pipelines","Update vendor risk management program with supply chain-specific controls","Review and strengthen contractual security requirements with vendor","Implement vendor access monitoring with session recording for critical vendors","Conduct Dark Rock Labs assessment of vendor integration security"],
  mitre:["T1195 Supply Chain Compromise","T1199 Trusted Relationship","T1072 Software Deployment Tools","T1059 Command and Scripting Interpreter"]},
{id:"pb_insider",cat:"Insider Threat",name:"Insider Threat / Data Exfiltration",sev:"High",icon:"👤",desc:"Current or former employee, contractor, or business partner misusing authorized access to steal intellectual property, exfiltrate customer data, sabotage systems, or conduct fraud.",
  iocs:["Unusual data download volumes or patterns (bulk file access, large archives)","Access to systems, repositories, or data outside normal job responsibilities","Use of unauthorized cloud storage, USB drives, or personal email for company data","After-hours or weekend access to sensitive repositories or databases","Resignation or termination notice followed by spike in data access","Attempts to circumvent DLP controls or monitoring systems","Screenshots or screen recording software installed on workstation","Access to competitor job postings from corporate device (contextual indicator)"],
  contain:["Restrict affected user's access to absolute minimum required for current duties","Enable enhanced monitoring and session recording on all affected accounts","Block USB and ALL external storage device access on user's devices","Restrict cloud storage upload capabilities and external email attachments","Coordinate with HR and Legal BEFORE any confrontation or interview","Preserve ALL evidence of unauthorized activity with timestamps","Document chain of custody for all evidence collected","Consider whether user has access to evidence preservation systems"],
  erad:["Terminate ALL access immediately upon confirmation of malicious activity","Collect and secure ALL company devices, badges, and access tokens","Audit ALL systems accessed by the individual in last 90 days minimum","Revoke ANY shared credentials the individual may have known","Check for data staged for exfiltration (compressed archives, encrypted containers)","Review personal cloud storage and email for forwarded company data","Scan for any unauthorized remote access tools installed by the individual"],
  recover:["Conduct full access review for ALL users with similar role and permissions","Implement or enhance DLP controls based on exfiltration method used","Review and update insider threat detection program","Strengthen off-boarding and role-change access review procedures","Implement behavioral analytics (UEBA) for anomaly detection","Review and enhance need-to-know access controls and data segmentation","Coordinate with Legal on potential civil or criminal action"],
  mitre:["T1567 Exfiltration Over Web Service","T1052 Exfiltration Over Physical Medium","T1074 Data Staged","T1530 Data from Cloud Storage","T1213 Data from Information Repositories"]},
{id:"pb_ddos",cat:"Availability",name:"DDoS Attack",sev:"Medium",icon:"🌊",desc:"Volumetric, protocol, or application-layer distributed denial of service attack overwhelming infrastructure, bandwidth, or application processing capacity.",
  iocs:["Sudden dramatic spike in inbound network traffic volume","Complete or intermittent service unavailability for legitimate users","CDN / load balancer / WAF alerts for traffic anomalies","Unusual traffic patterns from concentrated geographic regions","SYN flood, UDP flood, or HTTP flood patterns in network monitoring","Application timeout errors and connection pool exhaustion across services","DNS amplification or reflection traffic targeting organization's infrastructure"],
  contain:["Activate DDoS mitigation service immediately (Cloudflare, AWS Shield, Akamai)","Implement geographic IP blocking for regions with no legitimate business traffic","Implement aggressive rate limiting at edge, load balancer, and application layers","Scale infrastructure horizontally if cloud-based (auto-scaling groups)","Enable challenge-based access (CAPTCHA) for critical application endpoints","Communicate service status to stakeholders via out-of-band channels","Coordinate with ISP for upstream traffic scrubbing if volumetric"],
  erad:["Identify and permanently block attack traffic patterns and source networks","Implement permanent rate limiting and traffic shaping rules","Configure auto-scaling policies and traffic thresholds for future attacks","Review and harden DNS configuration against amplification abuse","Implement anycast DNS for improved resilience"],
  recover:["Gradually restore full service access while monitoring for resumption","Continue elevated monitoring for minimum 72 hours post-attack","Document complete attack vectors, volumes, and duration for future planning","Conduct post-incident capacity planning and architecture review","Update DDoS response runbook with lessons learned","Review SLAs with DDoS mitigation and CDN providers"],
  mitre:["T1498 Network Denial of Service","T1499 Endpoint Denial of Service"]},
{id:"pb_xss",cat:"OWASP Top 10",name:"A07: Cross-Site Scripting (XSS)",sev:"Medium",icon:"🔗",desc:"Reflected, stored, or DOM-based XSS vulnerabilities allowing attackers to execute malicious scripts in victim browsers, steal session tokens, redirect users, or deface web content.",
  iocs:["User reports of unexpected page behavior, pop-ups, or redirections","WAF alerts for script injection patterns in request parameters","Session tokens or cookies appearing in server access logs","Content Security Policy (CSP) violation reports in browser consoles","Phishing campaigns using your legitimate domain with injected content","Stored malicious JavaScript found in database content or user-generated fields"],
  contain:["Identify and disable affected pages immediately if stored XSS is confirmed","Block attacking payloads at WAF layer with custom rules","Invalidate ALL active sessions for the affected application","Review CSP headers and tighten to restrict inline script execution","Remove stored malicious content from database if applicable"],
  erad:["Implement context-aware output encoding across entire application","Deploy comprehensive Content Security Policy headers (script-src, style-src)","Enable HttpOnly, Secure, and SameSite flags on ALL cookies","Conduct full application security review for ALL XSS vector types","Implement DOM sanitization libraries (DOMPurify or equivalent)","Add automated XSS testing to CI/CD pipeline (SAST + DAST)","Review and sanitize all user-generated content rendering paths"],
  recover:["Re-deploy hardened application with validated XSS protections","Notify affected users to change passwords and review account activity","Monitor for credential abuse from any stolen session tokens","Schedule comprehensive penetration test to validate remediation","Update secure coding training with XSS-specific examples","Review and update input validation and output encoding standards"],
  mitre:["T1189 Drive-by Compromise","T1059.007 JavaScript","T1539 Steal Web Session Cookie"]},
];

// ─── TECH OPTIONS ────────────────────────────────────────────────────────
const TECH={identity:["Microsoft Entra ID","Okta","Google Workspace","Ping Identity","JumpCloud","CyberArk","Other"],
endpoint:["CrowdStrike Falcon","Microsoft Defender for Endpoint","SentinelOne","Carbon Black","Sophos","Other"],
siem:["Microsoft Sentinel","Splunk","IBM QRadar","Elastic SIEM","Sumo Logic","LogRhythm","None"],
firewall:["Palo Alto Networks","Fortinet FortiGate","Cisco Firepower","pfSense","Check Point","Other"],
email:["Microsoft 365","Google Workspace","Proofpoint","Mimecast","Barracuda","Other"],
cloud:["Microsoft Azure","AWS","Google Cloud","Multi-Cloud","On-Premises Only","Hybrid"],
backup:["Veeam","Azure Backup","AWS Backup","Commvault","Rubrik","Datto","Other"],
mfa:["Microsoft Authenticator","Duo Security","YubiKey / Hardware Tokens","Okta Verify","Not Implemented"],
vulnerability:["Tenable Nessus","Qualys","Rapid7 InsightVM","Microsoft Defender VM","None"],
dlp:["Microsoft Purview","Symantec DLP","Digital Guardian","Forcepoint","None"]};

const COMP_OPTS=["NIST 800-53","NIST 800-171 / CMMC","FedRAMP","HIPAA","PCI DSS","SOC 2","ISO 27001","HITRUST","GDPR","SOX","DFARS","StateRAMP"];
const ROLES=["Administrator","Incident Owner","Incident Manager","Core IRT","Extended IRT","Read Only","Auditor"];
const IR_PHASES=[
{id:"prep",n:"Preparation",ico:"🛡️",steps:["Coordinate with IT on infrastructure changes","Conduct annual tabletop exercises","Incorporate lessons learned","Review/update contact lists and access controls","Maintain asset inventory and topologies"]},
{id:"ident",n:"Identification",ico:"🔍",steps:["Monitor all alert sources (EDR, SIEM, IDS, Identity)","Create incident case","Triage: Impact type (CIA + Credential Harvesting)","Determine data criticality (PII/FCI/CUI)","Calculate severity","Declare incident if Medium+"]},
{id:"notif",n:"Notification",ico:"📢",steps:["Coordinate with Legal first (Medium+)","Notify cyber insurance","Identify all stakeholders","DFARS: DIBNet within 72 hrs if CUI","Establish EOC with battle rhythm","Determine secure comms methods"]},
{id:"contain",n:"Containment",ico:"🚧",steps:["Isolate affected systems","Disable malicious processes/accounts","Firewall blocking rules","Update IDS/EDR signatures","Isolate LAN segments","Re-evaluate severity"]},
{id:"analysis",n:"Analysis",ico:"🔬",steps:["Build attack timeline","Map to MITRE ATT&CK","30-day account access review","Enterprise IOC sweep","Capture memory/disk images","Preserve logs and PCAPs","Assess data exposure"]},
{id:"erad",n:"Eradication",ico:"🧹",steps:["Remove adversary/malware completely","Full identity/PAM audit","Resolve root cause","Verify patching enterprise-wide","Heightened monitoring"]},
{id:"recover",n:"Recovery",ico:"🔄",steps:["Determine safe restore point","Prioritize restoration","Remediate architectural weaknesses","Rollback temporary actions","Validate all data integrity","Confirm system availability"]},
{id:"followup",n:"Follow-Up",ico:"📋",steps:["Post-mortem for Medium+ incidents","Identify control failures","Review policies/procedures","Document corrective actions","Update IRP with lessons learned"]},
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────
const Bd=({children,color:cl=C.tl,s})=><span style={{display:"inline-block",padding:"2px 9px",borderRadius:99,background:cl+"20",color:cl,fontSize:10,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",...s}}>{children}</span>;
const Bt=({children,onClick:oc,v="primary",sz="md",s,disabled:d})=>{
const base={display:"inline-flex",alignItems:"center",gap:6,cursor:d?"not-allowed":"pointer",border:"none",fontWeight:600,fontFamily:"inherit",transition:"all 0.12s",opacity:d?0.35:1,borderRadius:7,
fontSize:sz==="sm"?10:sz==="lg"?14:12,padding:sz==="sm"?"4px 11px":sz==="lg"?"12px 22px":"7px 16px"};
const vs={primary:{background:C.tl,color:C.ob},secondary:{background:C.pL,color:C.tx,border:`1px solid ${C.pB}`},danger:{background:C.r,color:"#fff"},
ghost:{background:"transparent",color:C.tl},outline:{background:"transparent",color:C.tl,border:`1px solid ${C.tl}40`}};
return <button onClick={d?undefined:oc} style={{...base,...vs[v],...s}}>{children}</button>};
const Cd=({children,s,onClick:oc})=><div onClick={oc} style={{background:C.pn,border:`1px solid ${C.pB}`,borderRadius:9,padding:18,cursor:oc?"pointer":"default",...s}}>{children}</div>;
const Pb=({value:vl,max:mx=100,color:cl=C.tl,h=5})=><div style={{background:C.oM,borderRadius:99,height:h,overflow:"hidden",width:"100%"}}><div style={{width:`${Math.min(vl/mx*100,100)}%`,height:"100%",background:cl,borderRadius:99,transition:"width 0.3s"}}/></div>;
const Ip=({label:l,value:vl,onChange:oc,placeholder:ph,type:t="text",ta,s:os,rows:rw})=>(
<div style={{marginBottom:12,...os}}>{l&&<label style={{display:"block",fontSize:10,color:C.tM,marginBottom:4,fontWeight:600,letterSpacing:"0.04em"}}>{l}</label>}
{ta?<textarea value={vl} onChange={e=>oc(e.target.value)} placeholder={ph} rows={rw||3} style={{width:"100%",padding:"7px 11px",background:C.oM,border:`1px solid ${C.pB}`,borderRadius:6,color:C.tx,fontSize:12,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
:<input type={t} value={vl} onChange={e=>oc(e.target.value)} placeholder={ph} style={{width:"100%",padding:"7px 11px",background:C.oM,border:`1px solid ${C.pB}`,borderRadius:6,color:C.tx,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>}</div>);
const Sl=({label:l,value:vl,onChange:oc,options:opts})=>(
<div style={{marginBottom:12}}>{l&&<label style={{display:"block",fontSize:10,color:C.tM,marginBottom:4,fontWeight:600,letterSpacing:"0.04em"}}>{l}</label>}
<select value={vl} onChange={e=>oc(e.target.value)} style={{width:"100%",padding:"7px 11px",background:C.oM,border:`1px solid ${C.pB}`,borderRadius:6,color:C.tx,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}><option value="">Select...</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>);
const Ck=({checked:ck,onChange:oc,label:l})=><label style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",fontSize:12,color:C.tx,padding:"4px 0",lineHeight:1.5}}>
<div onClick={()=>oc(!ck)} style={{width:16,height:16,borderRadius:3,border:`2px solid ${ck?C.tl:C.pB}`,background:ck?C.tl:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer"}}>{ck&&<span style={{color:C.ob,fontSize:10,fontWeight:800}}>✓</span>}</div><span>{l}</span></label>;
const Sc=({children,sub})=><div style={{marginBottom:18}}><h2 style={{color:C.w,fontSize:17,fontWeight:700,margin:0}}>{children}</h2>{sub&&<p style={{color:C.tM,fontSize:11,margin:"4px 0 0"}}>{sub}</p>}</div>;
const Gauge=({score,label:l,size:sz=110})=>{const cl=score>=80?C.g:score>=60?C.y:score>=40?C.o:C.r;const r=(sz-14)/2;const ci=2*Math.PI*r;const off=ci-(score/100)*ci;
return <div style={{textAlign:"center"}}><svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.oM} strokeWidth="6"/>
<circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={cl} strokeWidth="6" strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${sz/2} ${sz/2})`} style={{transition:"stroke-dashoffset 0.6s"}}/>
<text x={sz/2} y={sz/2-2} textAnchor="middle" fill={cl} fontSize={sz/5} fontWeight="700">{score}</text><text x={sz/2} y={sz/2+12} textAnchor="middle" fill={C.tM} fontSize={sz/14}>/100</text></svg>
{l&&<div style={{color:C.tM,fontSize:10,marginTop:2}}>{l}</div>}</div>};

// ─── MINI CHART ──────────────────────────────────────────────────────────
const MiniChart=({data,h=100})=>{const mx=Math.max(...data.map(d=>d.v),1);const bw=28;const gap=6;const w=data.length*(bw+gap)+30;
return <div style={{overflowX:"auto"}}><svg width={w} height={h+30}>{data.map((d,i)=>{const bh=(d.v/mx)*(h-8);const x=24+i*(bw+gap);const y=h-bh;
return <g key={i}><rect x={x} y={y} width={bw} height={bh} rx={3} fill={d.v>=5?C.r:d.v>=3?C.o:C.tl} opacity={0.8}/>
<text x={x+bw/2} y={h+14} textAnchor="middle" fill={C.tM} fontSize={8}>{d.l}</text>
<text x={x+bw/2} y={y-3} textAnchor="middle" fill={C.tx} fontSize={8} fontWeight="600">{d.v}</text></g>})}</svg></div>};

// ─── NAV ─────────────────────────────────────────────────────────────────
const NAV=[{id:"dash",l:"Dashboard",i:"◆"},{id:"onboard",l:"Onboarding",i:"▸"},{id:"assess",l:"Assessment",i:"◈"},
{id:"irplan",l:"IR Planner",i:"◉"},{id:"commander",l:"Commander",i:"★"},{id:"playbooks",l:"Playbooks",i:"▶"},
{id:"tickets",l:"Tickets",i:"▣"},{id:"tasks",l:"Tasks",i:"▦"},{id:"forensics",l:"Forensics",i:"◍"},
{id:"stakeholders",l:"Stakeholders",i:"◈"},{id:"policies",l:"Policies",i:"◇"},{id:"comms",l:"Comms",i:"◎"},{id:"access",l:"Access",i:"◐"},{id:"integrations",l:"Integrations",i:"⊕"}];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App(){
const [pg,setPg]=useState("dash");
const [st,setSt]=useState({
  onboardDone:false,org:{name:"",industry:"",size:"",website:"",contact:"",email:"",phone:""},tech:{},comp:[],
  assessments:[],currentAss:null,
  irData:{checked:{},notes:{},contacts:{core:[],extended:[],external:[]}},
  tickets:[],tasks:[],forensicLogs:[],lessons:[],cases:[],
  team:[{name:"Admin",email:"admin@org.com",role:"Administrator",active:true}],
  commander:{activeIncident:null,phases:{},hours:{},members:{}},
  stakeholders:{
    incidentCommander:[],ciso:[],securityEngineers:[],legalContact:[],riskContact:[],
    executivePOC:[],cyberInsuranceInternal:[],cyberInsuranceExternal:[],externalLegal:[],
    forensicsContact:[],hrContacts:[],prContact:[],privacyContact:[],lawEnforcement:[],keySystems:[]
  },
  metrics:Array.from({length:12},(_,i)=>({l:["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"][i],v:Math.floor(Math.random()*6)+1})),
});
const [sb,setSb]=useState(true);
const u=(fn)=>setSt(p=>typeof fn==='function'?fn(p):{...p,...fn});

// ─── DASHBOARD ───────────────────────────────────────────────────────
const Dashboard=()=>{
  const lastAss=st.assessments.length?st.assessments[st.assessments.length-1]:null;
  const openTasks=st.tasks.filter(t=>t.status!=="Done").length;
  const openTickets=st.tickets.filter(t=>t.status!=="Closed").length;
  const openCases=st.cases.filter(c=>c.status==="Open").length;
  const activeInc=st.commander.activeIncident;
  const totalContacts=Object.entries(st.stakeholders||{}).filter(([k])=>k!=="keySystems").reduce((s,e)=>s+(e[1]||[]).length,0);
  const totalSystems=(st.stakeholders?.keySystems||[]).length;
  const policiesCount=st.policiesGen?.length||0;
  const forensicCount=st.forensicLogs?.length||0;

  // Determine status
  const status=activeInc?"red":openCases>0||openTickets>2?"yellow":"green";
  const statusLabel=status==="red"?"ACTIVE INCIDENT":status==="yellow"?"ELEVATED AWARENESS":"ALL CLEAR";
  const statusDesc=status==="red"?`Incident "${activeInc.title}" is active. Commander engaged.`:status==="yellow"?`${openCases} open case${openCases!==1?"s":""} and ${openTickets} open ticket${openTickets!==1?"s":""} require attention.`:"No active incidents. Continue monitoring and preparedness activities.";

  // Days since last incident
  const closedCases=st.cases.filter(c=>c.status==="Closed");
  const lastIncDate=closedCases.length?new Date(closedCases[0].date):null;
  const daysSince=lastIncDate?Math.floor((new Date()-lastIncDate)/(86400000)):null;

  // Section header style
  const sh={color:C.tM,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10,display:"flex",alignItems:"center",gap:6};
  const dot=(c)=>({width:6,height:6,borderRadius:"50%",background:c,display:"inline-block"});

  return <div>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <h1 style={{color:C.w,fontSize:22,fontWeight:800,margin:0,letterSpacing:"-0.01em"}}>Sentry</h1>
        <p style={{color:C.tD2,fontSize:11,margin:"3px 0 0",fontWeight:500}}>Dark Rock Labs &middot; Cyber Resilience Platform</p>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {st.org?.name&&<Bd color={C.tl}>{st.org.name}</Bd>}
        <Bd color={C.tD2}>v{V}</Bd>
      </div>
    </div>

    {/* ─── STATUS PAGE ─────────────────────────────────────────────── */}
    <div style={{
      borderRadius:10,padding:0,marginBottom:20,overflow:"hidden",
      border:`1px solid ${status==="red"?C.r+"55":status==="yellow"?C.o+"44":C.g+"44"}`,
    }}>
      {/* Status Bar */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,
        padding:"16px 20px",
        background:status==="red"?`linear-gradient(135deg,#7f1d1d,#450a0a)`:status==="yellow"?`linear-gradient(135deg,#78350f,#451a03)`:`linear-gradient(135deg,#14532d,#052e16)`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {/* Status Light */}
          <div style={{position:"relative",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:status==="red"?C.r+"33":status==="yellow"?C.o+"33":C.g+"33",position:"absolute"}}/>
            <div style={{width:28,height:28,borderRadius:"50%",background:status==="red"?C.r:status==="yellow"?C.o:C.g,position:"relative",boxShadow:`0 0 20px ${status==="red"?C.r:status==="yellow"?C.o:C.g}66`}}/>
          </div>
          <div>
            <div style={{color:C.w,fontSize:16,fontWeight:800,letterSpacing:"0.04em"}}>{statusLabel}</div>
            <p style={{color:status==="red"?"#fecaca":status==="yellow"?"#fed7aa":"#bbf7d0",fontSize:11,margin:"3px 0 0",maxWidth:480}}>{statusDesc}</p>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {/* Days Since Counter */}
          <div style={{textAlign:"center",background:"rgba(0,0,0,0.25)",borderRadius:8,padding:"10px 18px",minWidth:80}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:800,color:C.w,lineHeight:1}}>
              {status==="red"?"0":daysSince!==null?daysSince:"—"}
            </div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>Days Without Incident</div>
          </div>

          {status==="red"&&<Bt v="danger" onClick={()=>setPg("commander")} s={{background:"#dc2626",fontWeight:700}}>Open Commander →</Bt>}
          {status!=="red"&&<Bt v="outline" sz="sm" onClick={()=>setPg("commander")} s={{borderColor:"rgba(255,255,255,0.3)",color:C.w}}>Declare Incident</Bt>}
        </div>
      </div>

      {/* Active Incident Detail (if red) */}
      {activeInc&&<div style={{padding:"12px 20px",background:C.pn,borderTop:`1px solid ${C.r}22`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:C.r,fontSize:12,fontWeight:700}}>●</span>
          <span style={{color:C.w,fontSize:12,fontWeight:700}}>{activeInc.title}</span>
          <Bd color={activeInc.severity==="Critical"?C.r:C.o}>{activeInc.severity}</Bd>
          <Bd color={C.b}>{activeInc.members?.length||0} Responders</Bd>
        </div>
        <span style={{color:C.tM,fontSize:10}}>Started: {activeInc.startTime?new Date(activeInc.startTime).toLocaleString():"—"}</span>
      </div>}
    </div>

    {/* ─── KPI GRID ────────────────────────────────────────────────── */}
    <div style={sh}><span style={dot(C.tl)}/>Operational Metrics</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:24}}>
      {[
        {l:"Resilience Score",v:lastAss?lastAss.score:"—",c:lastAss?(lastAss.score>=70?C.g:lastAss.score>=50?C.y:C.r):C.tD2,u:lastAss?"/100":""},
        {l:"Open Tickets",v:openTickets,c:openTickets>0?C.o:C.g,u:"active"},
        {l:"Open Tasks",v:openTasks,c:openTasks>3?C.r:openTasks>0?C.y:C.g,u:"pending"},
        {l:"Active Cases",v:openCases,c:openCases>0?C.o:C.g,u:"open"},
        {l:"Stakeholders",v:totalContacts,c:totalContacts>0?C.tl:C.tD2,u:"contacts"},
        {l:"Key Systems",v:totalSystems,c:totalSystems>0?C.b:C.tD2,u:"mapped"},
        {l:"Policies",v:policiesCount,c:policiesCount>0?C.p:C.tD2,u:"generated"},
        {l:"Forensic Logs",v:forensicCount,c:forensicCount>0?C.cy:C.tD2,u:"entries"},
      ].map((x,i)=>
        <Cd key={i} s={{textAlign:"center",padding:"14px 10px"}}>
          <div style={{fontSize:8,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,fontWeight:600}}>{x.l}</div>
          <div style={{fontSize:22,fontWeight:800,color:x.c,lineHeight:1}}>{x.v}</div>
          {x.u&&<div style={{fontSize:8,color:C.tD2,marginTop:3,fontWeight:500}}>{x.u}</div>}
        </Cd>
      )}
    </div>

    {/* ─── ASSESSMENT + CHART ROW ──────────────────────────────────── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
      {/* Resilience Summary */}
      <Cd>
        <div style={sh}><span style={dot(C.tl)}/>Resilience Assessment</div>
        {lastAss?<div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
            <Gauge score={lastAss.score} size={80} label=""/>
            <div>
              <div style={{color:C.w,fontSize:14,fontWeight:700}}>{lastAss.score>=80?"Strong":lastAss.score>=60?"Moderate":lastAss.score>=40?"Needs Improvement":"Critical Gaps"}</div>
              <div style={{color:C.tD2,fontSize:10,marginTop:2}}>Last assessed: {lastAss.date?.split(",")[0]}</div>
              <div style={{color:C.tD2,fontSize:10}}>Framework: NIST CSF 2.0</div>
              {lastAss.warnings?.length>0&&<Bd color={C.o} s={{marginTop:4}}>{lastAss.warnings.length} validation warnings</Bd>}
            </div>
          </div>
          {/* Function mini-bars */}
          {(lastAss.fnScores||[]).map(f=>{const cl=f.score>=80?C.g:f.score>=60?C.y:f.score>=40?C.o:C.r;
            return <div key={f.fn} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{color:C.tM,fontSize:10,fontWeight:600,width:62}}>{f.fn}</span>
              <div style={{flex:1}}><Pb value={f.score} color={cl} h={4}/></div>
              <span style={{color:cl,fontSize:10,fontWeight:700,width:30,textAlign:"right"}}>{f.score}%</span>
            </div>})}
          <Bt v="ghost" sz="sm" onClick={()=>setPg("assess")} s={{marginTop:8}}>View Full Report →</Bt>
        </div>
        :<div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{color:C.tD2,fontSize:11,marginBottom:10}}>No assessment completed yet.</div>
          <Bt sz="sm" onClick={()=>setPg("assess")}>Start Assessment →</Bt>
        </div>}
      </Cd>

      {/* Incident Trend */}
      <Cd>
        <div style={sh}><span style={dot(C.o)}/>Incident Trend — 12 Months</div>
        <MiniChart data={st.metrics}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <div style={{display:"flex",gap:10}}>
            <span style={{fontSize:8,color:C.tM}}>■ <span style={{color:C.tl}}>Normal</span></span>
            <span style={{fontSize:8,color:C.tM}}>■ <span style={{color:C.o}}>Elevated</span></span>
            <span style={{fontSize:8,color:C.tM}}>■ <span style={{color:C.r}}>Critical</span></span>
          </div>
          <span style={{fontSize:9,color:C.tD2}}>Total: {st.metrics.reduce((a,x)=>a+x.v,0)}</span>
        </div>
      </Cd>
    </div>

    {/* ─── IR READINESS + TASKS ROW ────────────────────────────────── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
      {/* IR Plan Status */}
      <Cd>
        <div style={sh}><span style={dot(C.o)}/>IR Plan Readiness</div>
        {IR_PHASES.map(ph=>{
          const done=ph.steps.filter((_,i)=>st.irData.checked[`${ph.id}_${i}`]).length;
          const pct=ph.steps.length?Math.round(done/ph.steps.length*100):0;
          const cl=pct>=100?C.g:pct>0?C.tl:C.tD2;
          return <div key={ph.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:10}}>{ph.ico}</span>
            <span style={{color:C.tM,fontSize:10,fontWeight:600,width:85}}>{ph.n}</span>
            <div style={{flex:1}}><Pb value={pct} color={cl} h={4}/></div>
            <span style={{color:cl,fontSize:9,fontWeight:700,width:28,textAlign:"right"}}>{pct}%</span>
          </div>})}
        <Bt v="ghost" sz="sm" onClick={()=>setPg("irplan")} s={{marginTop:8}}>Open IR Planner →</Bt>
      </Cd>

      {/* Tasks Summary */}
      <Cd>
        <div style={sh}><span style={dot(C.cy)}/>Remediation Tasks</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {["Backlog","In Progress","In Review","Done"].map(col=>{
            const count=st.tasks.filter(t=>t.status===col).length;
            const cl=col==="Done"?C.g:col==="In Progress"?C.tl:col==="In Review"?C.b:C.tD2;
            return <div key={col} style={{textAlign:"center",background:C.oM,borderRadius:6,padding:"8px 4px"}}>
              <div style={{fontSize:16,fontWeight:800,color:cl}}>{count}</div>
              <div style={{fontSize:7,color:C.tM,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{col}</div>
            </div>})}
        </div>
        {/* Critical/High tasks */}
        {st.tasks.filter(t=>t.status!=="Done"&&(t.priority==="Critical"||t.priority==="High")).slice(0,3).map((t,i)=>
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:`1px solid ${C.pB}`}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:t.priority==="Critical"?C.r:C.o,flexShrink:0}}/>
            <span style={{color:C.tx,fontSize:10,flex:1}}>{t.title.substring(0,50)}{t.title.length>50?"...":""}</span>
            <Bd color={t.priority==="Critical"?C.r:C.o}>{t.priority}</Bd>
          </div>)}
        <Bt v="ghost" sz="sm" onClick={()=>setPg("tasks")} s={{marginTop:8}}>Open Tasks Board →</Bt>
      </Cd>
    </div>

    {/* ─── PLAYBOOKS + LESSONS ROW ─────────────────────────────────── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
      {/* Active Playbooks */}
      <Cd>
        <div style={sh}><span style={dot(C.p)}/>Playbooks</div>
        {st.cases.filter(c=>c.playbook&&c.status==="Open").length>0?
          st.cases.filter(c=>c.playbook&&c.status==="Open").slice(0,3).map((c,i)=>{
            const pb=PLAYBOOKS.find(p=>p.id===c.playbook);
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.pB}`}}>
              <span style={{fontSize:12}}>{pb?.icon||"📋"}</span>
              <span style={{color:C.tx,fontSize:11,fontWeight:600,flex:1}}>{c.title}</span>
              <Bd color={C.r}>Active</Bd>
            </div>})
          :<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
            <span style={{color:C.g,fontSize:10}}>●</span>
            <span style={{color:C.tD2,fontSize:10}}>No active playbook engagements.</span>
          </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
          <span style={{color:C.tD2,fontSize:9}}>{PLAYBOOKS.length} playbooks available across {new Set(PLAYBOOKS.map(p=>p.cat)).size} categories</span>
          <Bt v="ghost" sz="sm" onClick={()=>setPg("playbooks")}>Browse →</Bt>
        </div>
      </Cd>

      {/* Lessons Learned */}
      <Cd>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",...sh}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={dot(C.y)}/>Lessons Learned</div>
          <Bt v="ghost" sz="sm" onClick={()=>{const t=prompt("Add lesson learned:");if(t)u(p=>({...p,lessons:[{text:t,date:new Date().toLocaleDateString(),src:"Manual"},...p.lessons]}))}}>+ Add</Bt>
        </div>
        {st.lessons.length===0
          ?<div style={{padding:"4px 0"}}><span style={{color:C.tD2,fontSize:10}}>No lessons captured. Lessons are recorded during IR follow-up phases.</span></div>
          :st.lessons.slice(0,4).map((l,i)=><div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${C.pB}`}}>
            <div style={{color:C.tx,fontSize:11,lineHeight:1.4}}>{l.text}</div>
            <div style={{color:C.tD2,fontSize:8,marginTop:2,fontWeight:500}}>{l.date} &middot; {l.src}</div>
          </div>)}
      </Cd>
    </div>

    {/* ─── ONBOARDING + STAKEHOLDERS ROW ───────────────────────────── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
      {/* Onboarding / Environment */}
      <Cd>
        <div style={sh}><span style={dot(st.onboardDone?C.g:C.o)}/>Environment Configuration</div>
        {st.onboardDone?<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
            {[
              {l:"Organization",v:st.org?.name||"—"},
              {l:"Industry",v:st.org?.industry||"—"},
              {l:"Identity",v:st.tech?.identity||"—"},
              {l:"Endpoint",v:st.tech?.endpoint||"—"},
              {l:"SIEM",v:st.tech?.siem||"—"},
              {l:"Firewall",v:st.tech?.firewall||"—"},
              {l:"Cloud",v:st.tech?.cloud||"—"},
              {l:"Backup",v:st.tech?.backup||"—"},
            ].map(x=><div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.pB}`}}>
              <span style={{color:C.tM,fontSize:9,fontWeight:600}}>{x.l}</span>
              <span style={{color:C.tx,fontSize:9,fontWeight:500}}>{x.v}</span>
            </div>)}
          </div>
          <div style={{marginTop:8}}>
            <span style={{color:C.tD2,fontSize:8}}>Compliance: </span>
            <span style={{color:C.tM,fontSize:8}}>{(st.comp||[]).join(" · ")||"None configured"}</span>
          </div>
          <Bt v="ghost" sz="sm" onClick={()=>setPg("onboard")} s={{marginTop:6}}>Edit Configuration →</Bt>
        </div>
        :<div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{color:C.o,fontSize:11,fontWeight:600,marginBottom:4}}>Onboarding Incomplete</div>
          <div style={{color:C.tD2,fontSize:10,marginBottom:10}}>Configure your tech stack for personalized assessments.</div>
          <Bt sz="sm" onClick={()=>setPg("onboard")}>Complete Setup →</Bt>
        </div>}
      </Cd>

      {/* Stakeholder Coverage */}
      <Cd>
        <div style={sh}><span style={dot(totalContacts>5?C.g:totalContacts>0?C.y:C.r)}/>Stakeholder Coverage</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 14px"}}>
          {[
            {l:"Incident Commander",k:"incidentCommander"},{l:"CISO / Security",k:"ciso"},
            {l:"Security Engineers",k:"securityEngineers"},{l:"Legal (Internal)",k:"legalContact"},
            {l:"Risk Management",k:"riskContact"},{l:"Executive POC",k:"executivePOC"},
            {l:"Insurance (Int)",k:"cyberInsuranceInternal"},{l:"Insurance (Ext)",k:"cyberInsuranceExternal"},
            {l:"External Legal",k:"externalLegal"},{l:"Forensics",k:"forensicsContact"},
            {l:"HR",k:"hrContacts"},{l:"PR / Comms",k:"prContact"},
            {l:"Privacy / DPO",k:"privacyContact"},
            {l:"Law Enforcement",k:"lawEnforcement"},
          ].map(x=>{
            const count=(st.stakeholders?.[x.k]||[]).length;
            return <div key={x.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.pB}`}}>
              <span style={{color:C.tM,fontSize:9,fontWeight:500}}>{x.l}</span>
              <span style={{width:5,height:5,borderRadius:"50%",background:count>0?C.g:C.r}}/>
            </div>})}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <span style={{color:C.tD2,fontSize:8}}>{totalContacts} contacts &middot; {totalSystems} systems mapped</span>
          <Bt v="ghost" sz="sm" onClick={()=>setPg("stakeholders")}>Manage →</Bt>
        </div>
      </Cd>
    </div>

    {/* ─── QUICK ACTIONS ───────────────────────────────────────────── */}
    <div style={sh}><span style={dot(C.b)}/>Quick Actions</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
      {[
        {l:"Assessment",d:"NIST CSF 2.0",c:C.tl,p:"assess"},
        {l:"IR Planner",d:"9-phase lifecycle",c:C.o,p:"irplan"},
        {l:"Commander",d:"Incident coordination",c:C.r,p:"commander"},
        {l:"Playbooks",d:`${PLAYBOOKS.length} scenarios`,c:C.p,p:"playbooks"},
        {l:"Tasks",d:"Kanban board",c:C.cy,p:"tasks"},
        {l:"Stakeholders",d:`${totalContacts} contacts`,c:C.y,p:"stakeholders"},
        {l:"Policies",d:`${policiesCount} generated`,c:C.b,p:"policies"},
        {l:"Forensics",d:"Evidence vault",c:C.tD2,p:"forensics"},
        {l:"Comms",d:"Out-of-band",c:C.g,p:"comms"},
        {l:"Integrations",d:"APIs & pen testing",c:C.p,p:"integrations"},
      ].map(x=><Cd key={x.p} onClick={()=>setPg(x.p)} s={{cursor:"pointer",borderLeft:`3px solid ${x.c}`,padding:"12px 14px"}}>
        <div style={{color:C.w,fontWeight:700,fontSize:11,marginBottom:2}}>{x.l}</div>
        <div style={{color:C.tD2,fontSize:9}}>{x.d}</div>
      </Cd>)}
    </div>
  </div>;
};

// ─── ONBOARDING WIZARD ───────────────────────────────────────────────
const Onboarding=()=>{
  const [step,setStep]=useState(st.onboardDone?4:0);
  const [org,setOrg]=useState(st.org);const [tech,setTech]=useState(st.tech);const [comp,setComp]=useState(st.comp);
  const inds=["Federal / Government","Defense / DIB","Healthcare","Financial Services","Technology","Manufacturing","Legal","Education","Energy","Retail","Other"];
  const szs=["1-50","51-200","201-500","501-1000","1001-5000","5000+"];
  const save=()=>{u(p=>({...p,org,tech,comp,onboardDone:true}));setStep(4)};
  const stps=["Welcome","Organization","Technology","Compliance","Complete"];
  return <div>
    <Sc sub="Configure your organization for personalized assessments and policies">Sentry Onboarding</Sc>
    {/* Progress */}
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28}}>
      {stps.map((s,i)=><div key={i} style={{flex:1,display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:i<=step?C.tl:C.oM,color:i<=step?C.ob:C.tD2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,marginBottom:4}}>{i<step?"✓":i+1}</div>
          <div style={{fontSize:9,color:i<=step?C.tl:C.tD2,fontWeight:600}}>{s}</div></div>
        {i<stps.length-1&&<div style={{height:2,flex:1,background:i<step?C.tl:C.oM,marginBottom:16}}/>}</div>)}
    </div>
    {step===0&&<Cd s={{textAlign:"center",borderColor:C.tl+"44"}}>
      <div style={{fontSize:44,marginBottom:12}}>🛡️</div>
      <h2 style={{color:C.w,margin:"0 0 8px",fontSize:20}}>Welcome to Sentry</h2>
      <p style={{color:C.tM,fontSize:12,maxWidth:480,margin:"0 auto 20px",lineHeight:1.6}}>Sentry by Dark Rock Labs is your cyber resilience command center. We'll walk you through setting up your organization profile, mapping your technology stack, and identifying your compliance requirements. This data powers personalized assessments, smart playbooks, and professional policy generation.</p>
      <Bt sz="lg" onClick={()=>setStep(1)}>Get Started →</Bt></Cd>}
    {step===1&&<Cd><h3 style={{color:C.w,marginTop:0,fontSize:14}}>Organization Profile</h3>
      <p style={{color:C.tM,fontSize:11,marginBottom:14}}>Tell us about your organization so we can tailor assessments and recommendations.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Ip label="Organization Name *" value={org.name} onChange={v=>setOrg(p=>({...p,name:v}))} placeholder="Acme Corp"/>
        <Sl label="Industry *" value={org.industry} onChange={v=>setOrg(p=>({...p,industry:v}))} options={inds}/>
        <Sl label="Organization Size *" value={org.size} onChange={v=>setOrg(p=>({...p,size:v}))} options={szs}/>
        <Ip label="Website" value={org.website} onChange={v=>setOrg(p=>({...p,website:v}))} placeholder="https://"/>
        <Ip label="Primary Security Contact *" value={org.contact} onChange={v=>setOrg(p=>({...p,contact:v}))} placeholder="Jane Doe, CISO"/>
        <Ip label="Contact Email *" value={org.email} onChange={v=>setOrg(p=>({...p,email:v}))} placeholder="ciso@acme.com"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}><Bt v="secondary" onClick={()=>setStep(0)}>← Back</Bt>
        <Bt onClick={()=>setStep(2)} disabled={!org.name||!org.industry||!org.contact}>Next: Technology →</Bt></div></Cd>}
    {step===2&&<Cd><h3 style={{color:C.w,marginTop:0,fontSize:14}}>Technology Stack</h3>
      <p style={{color:C.tM,fontSize:11,marginBottom:14}}>Map your current security stack. This enables smart assessment questions tailored to your tools.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        {Object.entries(TECH).map(([k,opts])=><Sl key={k} label={k.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())} value={tech[k]||""} onChange={v=>setTech(p=>({...p,[k]:v}))} options={opts}/>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}><Bt v="secondary" onClick={()=>setStep(1)}>← Back</Bt><Bt onClick={()=>setStep(3)}>Next: Compliance →</Bt></div></Cd>}
    {step===3&&<Cd><h3 style={{color:C.w,marginTop:0,fontSize:14}}>Compliance Requirements</h3>
      <p style={{color:C.tM,fontSize:11,marginBottom:14}}>Select all frameworks applicable to your organization. This drives assessment focus areas and policy alignment.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>{COMP_OPTS.map(f=><Ck key={f} label={f} checked={comp.includes(f)} onChange={v=>setComp(p=>v?[...p,f]:p.filter(x=>x!==f))}/>)}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}><Bt v="secondary" onClick={()=>setStep(2)}>← Back</Bt><Bt onClick={save}>Complete Setup ✓</Bt></div></Cd>}
    {step===4&&<Cd s={{textAlign:"center",borderColor:C.g+"44"}}><div style={{fontSize:40,marginBottom:8}}>✓</div>
      <h3 style={{color:C.g,marginTop:0}}>Onboarding Complete</h3>
      <p style={{color:C.tM,fontSize:12}}>Your profile powers personalized assessments, policies, and recommendations.</p>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12}}><Bt onClick={()=>setPg("assess")}>Start Assessment →</Bt><Bt v="secondary" onClick={()=>{setStep(0);u({onboardDone:false})}}>Edit Profile</Bt></div></Cd>}
  </div>;
};

// ─── ASSESSMENT ENGINE ───────────────────────────────────────────────
const Assessment=()=>{
  const [mode,setMode]=useState(st.assessments.length>0?"history":"new");
  const [ans,setAns]=useState({});const [activeFn,setActiveFn]=useState(0);
  const [showReport,setShowReport]=useState(null);

  const allQs=useMemo(()=>CSF2.flatMap(fn=>fn.cats.flatMap(cat=>cat.qs)),[]);
  const smartQs=useMemo(()=>{
    return allQs.map(q=>{
      let relevant=true;let hint="";
      if(q.smart&&st.tech[q.smart]){hint=`Your stack: ${st.tech[q.smart]}`}
      if(q.smart==="siem"&&st.tech.siem==="None")relevant=false;
      return {...q,relevant,hint};
    });
  },[st.tech]);
  
  const aCnt=allQs.filter(q=>ans[q.id]!==undefined).length;
  const calcScore=()=>{let tw=0,e=0;allQs.forEach(q=>{tw+=q.w*4;e+=(ans[q.id]||0)*q.w});return tw?Math.round(e/tw*100):0};
  const calcFnScore=(fn)=>{const fqs=fn.cats.flatMap(c=>c.qs);let tw=0,e=0;fqs.forEach(q=>{tw+=q.w*4;e+=(ans[q.id]||0)*q.w});return tw?Math.round(e/tw*100):0};
  const calcCatScore=(cat)=>{let tw=0,e=0;cat.qs.forEach(q=>{tw+=q.w*4;e+=(ans[q.id]||0)*q.w});return tw?Math.round(e/tw*100):0};

  // Input validation: detect anomalies
  const validateInputs=()=>{
    const warnings=[];const vals=Object.values(ans);
    if(vals.length>5){
      const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
      if(avg>3.8)warnings.push({type:"high_bias",msg:"Assessment shows uniformly high scores. Ensure responses reflect actual implementation maturity, not aspirational state."});
      if(avg<0.5)warnings.push({type:"low_bias",msg:"Assessment shows uniformly low scores. Consider whether some controls may be partially implemented."});
      const allSame=vals.every(v=>v===vals[0]);
      if(allSame&&vals.length>10)warnings.push({type:"uniform",msg:"All responses are identical. Please review each control individually for accurate results."});
    }
    // Check contradictions
    if(ans["PR.AA-03"]>=3&&st.tech.mfa==="Not Implemented")warnings.push({type:"contradiction",msg:"Authentication scored as Managed but MFA is marked as Not Implemented in your tech stack."});
    if(ans["DE.CM-01"]>=3&&st.tech.siem==="None")warnings.push({type:"contradiction",msg:"Network monitoring scored as Managed but no SIEM is configured in your tech stack."});
    if(ans["PR.PS-04"]>=3&&st.tech.siem==="None")warnings.push({type:"contradiction",msg:"Log generation scored as Managed but no SIEM/log platform is configured."});
    if(ans["RC.RP-03"]>=3&&st.tech.backup==="Other")warnings.push({type:"info",msg:"Backup integrity scored highly. Ensure backup testing documentation exists."});
    return warnings;
  };

  const submitAssessment=()=>{
    const score=calcScore();const warnings=validateInputs();
    const assessment={
      id:Date.now(),date:new Date().toLocaleString(),score,answers:{...ans},
      fnScores:CSF2.map(fn=>({fn:fn.fn,score:calcFnScore(fn)})),
      catScores:CSF2.flatMap(fn=>fn.cats.map(cat=>({cat:cat.n,fn:fn.fn,score:calcCatScore(cat)}))),
      warnings,orgName:st.org.name||"Organization",
      recs:allQs.filter(q=>(ans[q.id]||0)<3).sort((a,b)=>(b.w*(4-(ans[b.id]||0)))-(a.w*(4-(ans[a.id]||0)))).slice(0,15),
    };
    u(p=>({...p,assessments:[...p.assessments,assessment],currentAss:assessment}));
    setShowReport(assessment);setMode("report");
  };

  // ─── REPORT VIEW ─────────────────────────────────────────────────
  if(mode==="report"&&showReport){
    const rpt=showReport;const ir=rpt.score>=80?"Strong":rpt.score>=60?"Moderate":rpt.score>=40?"Needs Improvement":"Critical Gaps";
    const irc=rpt.score>=80?C.g:rpt.score>=60?C.y:rpt.score>=40?C.o:C.r;
    return <div>
      <Bt v="ghost" onClick={()=>setMode("history")} s={{marginBottom:14}}>← Assessment History</Bt>
      {/* Executive Summary Header */}
      <Cd s={{marginBottom:14,background:`linear-gradient(135deg,${C.tl}08,${C.pn})`,borderColor:C.tl+"33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:6}}>
          <div><div style={{fontSize:9,color:C.tM,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>SENTRY CYBER RESILIENCE ASSESSMENT REPORT</div>
            <h2 style={{color:C.w,margin:0,fontSize:18}}>{rpt.orgName}</h2>
            <div style={{color:C.tM,fontSize:11,marginTop:4}}>Assessment Date: {rpt.date} | Framework: NIST CSF 2.0</div></div>
          <Bt v="outline" sz="sm" onClick={()=>{
            const txt=`DARK ROCK LABS SENTRY\nCYBER RESILIENCE ASSESSMENT REPORT\n${"═".repeat(60)}\n\nOrganization: ${rpt.orgName}\nDate: ${rpt.date}\nFramework: NIST CSF 2.0\nOverall Score: ${rpt.score}/100\nInsurance Readiness: ${ir}\n\nEXECUTIVE SUMMARY\n${"─".repeat(40)}\n${rpt.score>=70?"The organization demonstrates a solid cybersecurity posture with mature controls across most functions.":"The organization has identified gaps in cybersecurity controls that require attention to reduce risk exposure."}\n\nFUNCTION SCORES\n${"─".repeat(40)}\n${rpt.fnScores.map(f=>`${f.fn}: ${f.score}/100`).join("\n")}\n\nTOP RECOMMENDATIONS\n${"─".repeat(40)}\n${rpt.recs.map((r,i)=>`${i+1}. [${r.id}] ${r.q} (Current: ${SCORE_LBL[rpt.answers[r.id]||0]})`).join("\n")}\n\n${rpt.warnings.length?`VALIDATION WARNINGS\n${"─".repeat(40)}\n${rpt.warnings.map(w=>w.msg).join("\n")}`:""}\n\n${"═".repeat(60)}\nGenerated by Dark Rock Labs Sentry v${V}\nConfidential\n`;
            const blob=new Blob([txt],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Sentry_Assessment_${rpt.orgName.replace(/\s/g,"_")}_${rpt.date.split(",")[0].replace(/\//g,"-")}.txt`;a.click();
          }}>Export Report</Bt></div></Cd>
      {/* Warnings */}
      {rpt.warnings.length>0&&<Cd s={{marginBottom:14,borderColor:C.o+"44",borderLeft:`3px solid ${C.o}`}}>
        <h3 style={{color:C.o,marginTop:0,fontSize:13}}>⚠️ Assessment Validation Warnings</h3>
        {rpt.warnings.map((w,i)=><div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${C.pB}`,color:C.tx,fontSize:11,lineHeight:1.5}}>
          <Bd color={w.type==="contradiction"?C.r:C.o} s={{marginRight:8}}>{w.type}</Bd>{w.msg}</div>)}</Cd>}
      {/* Score Cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
        <Cd s={{textAlign:"center"}}><Gauge score={rpt.score} label="Overall Score"/></Cd>
        <Cd s={{textAlign:"center"}}><div style={{fontSize:9,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Insurance Readiness</div>
          <div style={{fontSize:24,fontWeight:700,color:irc}}>{ir}</div>
          <p style={{color:C.tD2,fontSize:10,marginTop:6}}>Share with your insurance broker</p></Cd>
        <Cd s={{textAlign:"center"}}><div style={{fontSize:9,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Controls Assessed</div>
          <div style={{fontSize:24,fontWeight:700,color:C.tl}}>{allQs.length}</div>
          <p style={{color:C.tD2,fontSize:10,marginTop:6}}>Across {CSF2.length} functions</p></Cd>
      </div>
      {/* Function Breakdown */}
      <Cd s={{marginBottom:14}}><h3 style={{color:C.w,marginTop:0,fontSize:13}}>Function Breakdown</h3>
        {rpt.fnScores.map(f=>{const cl=f.score>=80?C.g:f.score>=60?C.y:f.score>=40?C.o:C.r;const fn=CSF2.find(x=>x.fn===f.fn);
          return <div key={f.fn} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.pB}`}}>
            <span style={{fontSize:14,width:22}}>{fn?.ico}</span><span style={{color:C.tx,fontSize:12,fontWeight:500,width:100}}>{f.fn}</span>
            <div style={{flex:1}}><Pb value={f.score} color={cl} h={7}/></div><span style={{color:cl,fontWeight:700,fontSize:13,width:45,textAlign:"right"}}>{f.score}%</span></div>})}</Cd>
      {/* Category Detail */}
      <Cd s={{marginBottom:14}}><h3 style={{color:C.w,marginTop:0,fontSize:13}}>Category Detail</h3>
        {rpt.catScores.map(c=>{const cl=c.score>=80?C.g:c.score>=60?C.y:c.score>=40?C.o:C.r;
          return <div key={c.cat+c.fn} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",borderBottom:`1px solid ${C.pB}`}}>
            <Bd s={{minWidth:30,textAlign:"center"}}>{c.fn.slice(0,2)}</Bd><span style={{color:C.tx,fontSize:11,flex:1}}>{c.cat}</span>
            <div style={{width:120}}><Pb value={c.score} color={cl} h={5}/></div><span style={{color:cl,fontWeight:600,fontSize:11,width:35,textAlign:"right"}}>{c.score}%</span></div>})}</Cd>
      {/* Recommendations */}
      <Cd><h3 style={{color:C.w,marginTop:0,fontSize:13}}>Priority Recommendations</h3>
        {rpt.recs.map((r,i)=><div key={r.id} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.pB}`,alignItems:"flex-start"}}>
          <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:i<3?C.r+"22":i<7?C.o+"22":C.y+"22",color:i<3?C.r:i<7?C.o:C.y,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>#{i+1}</div>
          <div><div style={{display:"flex",gap:4,marginBottom:2}}><Bd>{r.id}</Bd><Bd color={C.o}>{SCORE_LBL[rpt.answers[r.id]||0]}</Bd></div>
            <div style={{color:C.tx,fontSize:11}}>{r.q}</div>
            <Bt v="ghost" sz="sm" s={{marginTop:4}} onClick={()=>{u(p=>({...p,tasks:[{id:Date.now(),title:`Remediate: ${r.id} - ${r.q.substring(0,60)}`,priority:r.w>=3?"High":"Medium",status:"Backlog",assignee:"",updates:[],created:new Date().toLocaleDateString(),source:"Assessment"},...p.tasks]}))}}>Create Task →</Bt></div></div>)}</Cd>
    </div>;
  }

  // ─── HISTORY VIEW ────────────────────────────────────────────────
  if(mode==="history"){
    return <div><Sc sub="Track your resilience posture over time">Assessment History</Sc>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><Bt onClick={()=>{setAns({});setActiveFn(0);setMode("new")}}>+ New Assessment</Bt></div>
      {st.assessments.length===0?<Cd s={{textAlign:"center"}}><p style={{color:C.tD2,fontSize:12}}>No assessments completed yet. Start your first NIST CSF 2.0 assessment.</p>
        <Bt s={{marginTop:10}} onClick={()=>setMode("new")}>Start Assessment</Bt></Cd>
      :st.assessments.map(a=><Cd key={a.id} s={{marginBottom:10,cursor:"pointer"}} onClick={()=>{setShowReport(a);setMode("report")}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:C.w,fontSize:13,fontWeight:600}}>{a.orgName} Assessment</div>
            <div style={{color:C.tD2,fontSize:10,marginTop:2}}>{a.date} | {allQs.length} controls assessed</div></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Gauge score={a.score} size={50}/>
            {a.warnings.length>0&&<Bd color={C.o}>{a.warnings.length} warnings</Bd>}</div></div></Cd>)}</div>;
  }

  // ─── ASSESSMENT QUIZ ─────────────────────────────────────────────
  const fn=CSF2[activeFn];const score=calcScore();
  return <div><Sc sub="NIST CSF 2.0 Interactive Assessment">Cyber Resilience Assessment</Sc>
    {/* Progress */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <div style={{flex:1}}><Pb value={aCnt} max={allQs.length}/></div>
      <span style={{color:C.tM,fontSize:11,whiteSpace:"nowrap"}}>{aCnt}/{allQs.length} controls</span>
      <span style={{color:C.tl,fontSize:11,fontWeight:600}}>Score: {score}</span></div>
    {/* Function Tabs */}
    <div style={{display:"flex",gap:3,marginBottom:16,flexWrap:"wrap"}}>
      {CSF2.map((f,i)=>{const fs=calcFnScore(f);const fc=fs>=80?C.g:fs>=60?C.y:fs>=40?C.o:f.cats.flatMap(c=>c.qs).some(q=>ans[q.id]!==undefined)?C.r:C.tD2;
        return <button key={f.id} onClick={()=>setActiveFn(i)} style={{padding:"6px 12px",borderRadius:6,border:"none",cursor:"pointer",
          background:activeFn===i?C.tl+"22":"transparent",color:activeFn===i?C.tl:C.tM,fontSize:11,fontWeight:600,fontFamily:"inherit",
          borderBottom:activeFn===i?`2px solid ${C.tl}`:"2px solid transparent",display:"flex",alignItems:"center",gap:5}}>
          <span>{f.ico}</span>{f.fn}{ans[f.cats[0]?.qs[0]?.id]!==undefined&&<span style={{width:6,height:6,borderRadius:"50%",background:fc,display:"inline-block"}}/>}</button>})}
    </div>
    {/* Controls */}
    {fn.cats.map(cat=><Cd key={cat.id} s={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><h3 style={{color:C.w,margin:0,fontSize:13}}>{cat.n}</h3><Bd>{cat.qs.length}</Bd></div>
      {cat.qs.map(q=>{const sm=smartQs.find(sq=>sq.id===q.id);
        return <div key={q.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.pB}`}}>
          <div style={{display:"flex",gap:4,marginBottom:4,flexWrap:"wrap"}}><Bd>{q.id}</Bd>{q.w===3&&<Bd color={C.o}>Critical</Bd>}
            {sm?.hint&&<Bd color={C.cy}>{sm.hint}</Bd>}{sm&&!sm.relevant&&<Bd color={C.tD2}>N/A for your stack</Bd>}</div>
          <p style={{color:C.tx,fontSize:12,margin:"0 0 8px",lineHeight:1.5}}>{q.q}</p>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{SCORE_LBL.map((lb,v)=><button key={v} onClick={()=>setAns(p=>({...p,[q.id]:v}))}
            style={{padding:"3px 9px",borderRadius:5,cursor:"pointer",border:`1px solid ${ans[q.id]===v?C.tl:C.pB}`,background:ans[q.id]===v?C.tl+"22":"transparent",
              color:ans[q.id]===v?C.tl:C.tM,fontSize:10,fontWeight:500,fontFamily:"inherit"}}>{v}: {lb}</button>)}</div></div>})}
    </Cd>)}
    {/* Submit Bar */}
    <div style={{position:"sticky",bottom:0,background:C.ob,padding:"10px 0",borderTop:`1px solid ${C.pB}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {activeFn>0&&<Bt v="secondary" sz="sm" onClick={()=>setActiveFn(p=>p-1)}>← Prev</Bt>}
          {activeFn<CSF2.length-1&&<Bt v="secondary" sz="sm" onClick={()=>setActiveFn(p=>p+1)}>Next →</Bt>}</div>
        <Bt onClick={submitAssessment} disabled={aCnt<allQs.length*0.3}>Submit Assessment ({aCnt}/{allQs.length})</Bt></div></div>
  </div>;
};

// ─── IR PLANNER ──────────────────────────────────────────────────────
const IRPlanner=()=>{
  const [tab,setTab]=useState("lifecycle");
  const ir=st.irData;const upIR=(fn)=>{const n=typeof fn==='function'?fn(ir):{...ir,...fn};u(p=>({...p,irData:n}))};
  return <div><Sc sub="Full 9-phase NIST 800-61 lifecycle with Dark Rock forensics">IR Planner</Sc>
    <div style={{display:"flex",gap:3,marginBottom:16,flexWrap:"wrap",borderBottom:`1px solid ${C.pB}`,paddingBottom:6}}>
      {["lifecycle","severity","contacts","eoc","emergency"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"5px 12px",borderRadius:"5px 5px 0 0",border:"none",cursor:"pointer",background:tab===t?C.tl+"22":"transparent",color:tab===t?C.tl:C.tM,fontSize:11,fontWeight:600,fontFamily:"inherit",textTransform:"capitalize"}}>{t}</button>)}</div>
    {tab==="lifecycle"&&IR_PHASES.map(ph=>{const ckCnt=ph.steps.filter((_,i)=>ir.checked[`${ph.id}_${i}`]).length;
      return <Cd key={ph.id} s={{marginBottom:12,borderLeft:`3px solid ${ckCnt===ph.steps.length?C.g:C.tl}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{ph.ico}</span><h3 style={{color:C.w,margin:0,fontSize:13}}>{ph.n}</h3></div>
          <Bd color={ckCnt===ph.steps.length?C.g:C.tM}>{ckCnt}/{ph.steps.length}</Bd></div>
        {ph.steps.map((s,i)=><Ck key={i} label={s} checked={!!ir.checked[`${ph.id}_${i}`]} onChange={()=>upIR(p=>({...p,checked:{...p.checked,[`${ph.id}_${i}`]:!p.checked[`${ph.id}_${i}`]}}))}/>)}
        <div style={{display:"flex",gap:6,marginTop:8}}>
          <Bt v="outline" sz="sm" onClick={()=>u(p=>({...p,tickets:[{id:Date.now(),title:`${ph.n} Phase Ticket`,status:"Open",severity:"Medium",phase:ph.n,assignee:"",created:new Date().toLocaleDateString(),details:"",actions:[]},...p.tickets]}))}>Generate Ticket</Bt>
          <Bt v="ghost" sz="sm" onClick={()=>{const l=prompt("Lesson learned:");if(l)u(p=>({...p,lessons:[{text:l,date:new Date().toLocaleDateString(),src:ph.n},...p.lessons],tasks:[{id:Date.now(),title:l.substring(0,80),priority:"Medium",status:"Backlog",assignee:"",updates:[],created:new Date().toLocaleDateString(),source:`Lesson: ${ph.n}`},...p.tasks]}))}}>+ Lesson → Task</Bt></div></Cd>})}
    {tab==="severity"&&<div>{SEV_LEVELS.map(l=><div key={l.lv} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.pB}`}}>
      <Bd color={l.c} s={{minWidth:55,textAlign:"center"}}>{l.lv}</Bd>
      <div><p style={{color:C.tx,fontSize:12,margin:"0 0 3px"}}>{l.desc}</p><p style={{color:C.tD2,fontSize:10,margin:0,fontStyle:"italic"}}>{l.act}</p></div></div>)}</div>}
    {tab==="contacts"&&<div>
      <Cd s={{marginBottom:12,borderColor:C.tl+"33"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🛡️</span>
        <div><div style={{color:C.tl,fontWeight:700,fontSize:12}}>Dark Rock Cybersecurity - External IR</div><div style={{color:C.tM,fontSize:10}}>ir@darkrockcyber.com</div></div></div></Cd>
      {["core","extended","external"].map(team=><Cd key={team} s={{marginBottom:12}}>
        <h4 style={{color:C.w,marginTop:0,fontSize:12}}>{team==="core"?"Core IRT":team==="extended"?"Extended IRT":"External Partners"}</h4>
        {(ir.contacts[team]||[]).map((c,i)=><div key={i} style={{fontSize:11,padding:"4px 0",borderBottom:`1px solid ${C.pB}`,color:C.tx}}><strong>{c.name}</strong> - {c.role} ({c.email})
          <Bt v="ghost" sz="sm" onClick={()=>upIR(p=>({...p,contacts:{...p.contacts,[team]:p.contacts[team].filter((_,idx)=>idx!==i)}}))}>✕</Bt></div>)}
        <Bt v="outline" sz="sm" s={{marginTop:6}} onClick={()=>{const n=prompt("Name:");const r=prompt("Role:");const e=prompt("Email:");if(n)upIR(p=>({...p,contacts:{...p.contacts,[team]:[...p.contacts[team],{name:n,role:r||"",email:e||""}]}}))}}>+ Add</Bt></Cd>)}</div>}
    {tab==="eoc"&&<Cd><h3 style={{color:C.w,marginTop:0,fontSize:13}}>Battle Rhythm</h3>
      <div style={{marginBottom:10}}><div style={{color:C.tl,fontSize:11,fontWeight:600,marginBottom:4}}>First 72 Hours</div>
        {["8:30 AM - Morning Update","12:00 PM - Midday Update","4:30 PM - EOD Update"].map(t=><div key={t} style={{padding:"3px 0",color:C.tx,fontSize:11}}>🕐 {t}</div>)}</div>
      <div><div style={{color:C.tl,fontSize:11,fontWeight:600,marginBottom:4}}>After 72 Hours</div>
        <div style={{color:C.tx,fontSize:11}}>🕐 4:30 PM Daily + ad hoc</div></div>
      <p style={{color:C.tM,fontSize:11,marginTop:12,lineHeight:1.5}}>If admin accounts compromised, use out-of-band communications. Mark all correspondence "Privileged and Confidential" if directed by counsel.</p></Cd>}
    {tab==="emergency"&&<Cd s={{background:`linear-gradient(135deg,#7f1d1d,#450a0a)`,border:`1px solid ${C.r}33`,textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:8}}>🚨</div><h2 style={{color:"#fca5a5",margin:"0 0 8px",fontSize:16}}>Active Incident</h2>
      <p style={{color:"#fecaca",fontSize:11,maxWidth:400,margin:"0 auto 14px"}}>Contact Dark Rock immediately.</p>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}><Bt v="danger" onClick={()=>window.open("mailto:ir@darkrockcyber.com?subject=ACTIVE+INCIDENT","_blank")}>📧 Email IR Team</Bt><Bt v="outline" s={{borderColor:"#fca5a5",color:"#fca5a5"}} onClick={()=>setPg("commander")}>Launch Commander</Bt></div></Cd>}
  </div>;
};

// ─── INCIDENT COMMANDER ──────────────────────────────────────────────
const Commander=()=>{
const defaultInc={title:"",severity:"High",startTime:"",members:[],phaseStatus:{},findings:[],summaries:[],
  iocs:[],affectedUsers:[],affectedAssets:[],affectedRegions:[],privacyConcern:false,
  attorneyPrivilege:false,privilegeEnforcedBy:"",privilegeEnforcedAt:"",
  timeline:[],workstreams:{},escalation:[],expenses:[],documents:[],
  internalCostRate:150,notifications:[]};
const [inc,setInc]=useState(st.commander.activeIncident||{...defaultInc});
const [editing,setEditing]=useState(!st.commander.activeIncident);
const [elapsed,setElapsed]=useState("");
const [deadlines,setDeadlines]=useState([]);
const [tab,setTab]=useState("overview");
const [newFinding,setNewFinding]=useState("");
const [newIoc,setNewIoc]=useState("");

useEffect(()=>{
  if(!inc.startTime||editing)return;
  const tick=()=>{
    const start=new Date(inc.startTime);const now=new Date();const diff=now-start;
    if(diff<0){setElapsed("00:00:00");return}
    const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);const s=Math.floor((diff%60000)/1000);
    setElapsed(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`);
    const eh=diff/3600000;
    setDeadlines([
      {label:"Internal Management",hrs:1,status:eh>=1?"OVERDUE":eh>=0.75?"WARNING":"ON TRACK",template:"management"},
      {label:"Legal Counsel",hrs:2,status:eh>=2?"OVERDUE":eh>=1.5?"WARNING":"ON TRACK",template:"legal"},
      {label:"Executive Leadership",hrs:4,status:eh>=4?"OVERDUE":eh>=3?"WARNING":"ON TRACK",template:"executive"},
      {label:"Cyber Insurance Carrier",hrs:24,status:eh>=24?"OVERDUE":eh>=18?"WARNING":"ON TRACK",template:"insurance"},
      {label:"Board / Audit Committee",hrs:48,status:eh>=48?"OVERDUE":eh>=36?"WARNING":"ON TRACK",template:"board"},
      {label:"DFARS DIBNet Report",hrs:72,status:eh>=72?"OVERDUE":eh>=60?"WARNING":"ON TRACK",template:"dfars"},
      {label:"HIPAA Notification",hrs:1440,status:eh>=1440?"OVERDUE":eh>=1200?"WARNING":"ON TRACK",template:"hipaa"},
    ]);
  };tick();const iv=setInterval(tick,1000);return()=>clearInterval(iv);
},[inc.startTime,editing]);

const save=(d)=>{const data=d||inc;u(p=>({...p,commander:{...p.commander,activeIncident:data}}))};
const addTL=(event)=>{setInc(p=>{const n={...p,timeline:[...p.timeline,{time:new Date().toLocaleString(),event,elapsed}]};return n})};
const totalHrs=inc.members.reduce((a,m)=>a+m.hours,0);
const intCost=totalHrs*(inc.internalCostRate||150);
const extCost=(inc.expenses||[]).reduce((a,e)=>a+e.amount,0);
const totalCost=intCost+extCost;
const sevC=inc.severity==="Critical"?C.r:inc.severity==="High"?C.o:C.y;
const priv=inc.attorneyPrivilege?"ATTORNEY-CLIENT PRIVILEGED AND CONFIDENTIAL\n":"CONFIDENTIAL\n";

const genNotif=(type)=>{
  const hdr=`${priv}${"─".repeat(50)}\nINCIDENT: ${inc.title} | ${inc.severity}\nElapsed: ${elapsed} | ${new Date().toLocaleString()}\n${"─".repeat(50)}\n\n`;
  const scope=`WHAT: ${inc.iocs.length>0?inc.iocs.slice(0,3).join("; "):"Under investigation"}\nWHO: ${inc.affectedUsers.length} affected users, ${inc.affectedAssets.length} affected assets\nWHERE: ${inc.affectedRegions.join(", ")||"Under assessment"}\nWHEN: Declared ${inc.startTime?new Date(inc.startTime).toLocaleString():"pending"}\nWHY: ${inc.findings.length>0?inc.findings[inc.findings.length-1].text:"Analysis in progress"}\n`;
  const status=`\nACTIONS COMPLETED:\n${st.tasks.filter(t=>t.status==="Done").slice(0,5).map((t,i)=>`  ${i+1}. ${t.title}`).join("\n")||"  Response underway"}\n\nIN PROGRESS:\n${st.tasks.filter(t=>t.status==="In Progress").slice(0,5).map((t,i)=>`  ${i+1}. ${t.title}`).join("\n")||"  Being assigned"}\n`;
  const templates={
    management:`TO: Management Team\n\n${hdr}SITUATION REPORT\n\n${scope}${status}\nNext update per battle rhythm.\n`,
    executive:`TO: Executive Leadership\n\n${hdr}EXECUTIVE BRIEFING\n\n${scope}\nIMPACT: ${inc.privacyConcern?"Privacy concern identified. ":""}Team: ${inc.members.length} responders, ${totalHrs.toFixed(1)}hrs.\nCOST TO DATE: $${totalCost.toLocaleString()}\n${status}`,
    legal:`TO: Legal Counsel\n\n${hdr}${inc.attorneyPrivilege?`Privilege invoked by ${inc.privilegeEnforcedBy} at ${inc.privilegeEnforcedAt}\n\n`:""}LEGAL NOTIFICATION\n\n${scope}\nPrivacy concern: ${inc.privacyConcern?"YES":"Under assessment"}\nPlease advise on: privilege scope, notification obligations, evidence preservation.\n`,
    insurance:`TO: Cyber Insurance Carrier\n\n${hdr}CLAIM NOTIFICATION\n\n${scope}\nAffected systems: ${inc.affectedAssets.length}\nRequest: Breach coach and forensics activation per policy.\n`,
    board:`TO: Board / Audit Committee\n\n${hdr}BOARD NOTIFICATION\n\n${scope}\nTeam: ${inc.members.length} | Hours: ${totalHrs.toFixed(1)} | Cost: $${totalCost.toLocaleString()}\n${status}`,
    dfars:`TO: DoD DIBNet\n\n${hdr}DFARS 252.204-7012 REPORT\n\nCUI/CDI potentially affected. Report submitted within 72hr window.\n${scope}`,
    hipaa:`TO: HHS / Affected Individuals\n\n${hdr}HIPAA BREACH NOTIFICATION\n\nPHI potentially compromised.\n${scope}`,
  };
  return templates[type]||templates.management;
};

const genSummary=()=>{
  const ts=new Date().toLocaleString();
  const done=st.tasks.filter(t=>t.status==="Done");const prog=st.tasks.filter(t=>t.status==="In Progress");const back=st.tasks.filter(t=>t.status==="Backlog");
  const txt=`${priv}${"━".repeat(60)}\nTACTICAL SUMMARY: ${inc.title}\n${"━".repeat(60)}\nTimestamp: ${ts} | Severity: ${inc.severity} | Elapsed: ${elapsed}\nTeam: ${inc.members.length} | Hours: ${totalHrs.toFixed(1)} | Cost: $${totalCost.toLocaleString()}\n${inc.attorneyPrivilege?`Privilege: ACTIVE (${inc.privilegeEnforcedBy})\n`:""}\n${"─".repeat(60)}\nIOCs (${inc.iocs.length})\n${inc.iocs.map((x,i)=>`  ${i+1}. ${x}`).join("\n")||"  Under investigation"}\n\nScope: ${inc.affectedUsers.length} users, ${inc.affectedAssets.length} assets, Regions: ${inc.affectedRegions.join(", ")||"TBD"}\nPrivacy: ${inc.privacyConcern?"YES":"No"}\n\nPHASES\n${IR_PHASES.map(p=>`  ${p.n.padEnd(16)} ${"█".repeat(Math.floor((inc.phaseStatus[p.id]||0)/5))}${"░".repeat(20-Math.floor((inc.phaseStatus[p.id]||0)/5))} ${inc.phaseStatus[p.id]||0}%`).join("\n")}\n\nFINDINGS (${inc.findings.length})\n${inc.findings.map((f,i)=>`  ${i+1}. [${f.time}] ${f.text}`).join("\n")||"  In progress"}\n\nCOMPLETED (${done.length})\n${done.slice(0,8).map((t,i)=>`  ${i+1}. ${t.title}`).join("\n")||"  Underway"}\n\nIN PROGRESS (${prog.length})\n${prog.slice(0,8).map((t,i)=>`  ${i+1}. ${t.title} [${t.assignee||"Unassigned"}]`).join("\n")||"  None"}\n\nOUTSTANDING (${back.length})\n${back.slice(0,8).map((t,i)=>`  ${i+1}. ${t.title} [${t.priority}]`).join("\n")||"  None"}\n\nDEADLINES\n${deadlines.map(d=>`  [${d.status}] ${d.label}`).join("\n")}\n\nTIMELINE\n${(inc.timeline||[]).slice(-10).map(t=>`  [${t.time}] ${t.event}`).join("\n")||"  No events"}\n\n${"━".repeat(60)}\nDark Rock Labs Sentry v${V}\n${"━".repeat(60)}`;
  const entry={id:Date.now(),timestamp:ts,elapsed,text:txt};
  setInc(p=>({...p,summaries:[entry,...(p.summaries||[])]}));
  return txt;
};

// ─── INCIDENT CREATION ──────────────────────────────────────────
if(editing){return <div><Sc sub="Declare and configure incident command">Incident Commander</Sc>
  <Cd s={{marginBottom:14}}>
    <h3 style={{color:C.w,marginTop:0,fontSize:14}}>Declare Incident</h3>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
      <Ip label="Incident Title *" value={inc.title} onChange={v=>setInc(p=>({...p,title:v}))} placeholder="Ransomware - Server Farm Alpha"/>
      <Sl label="Severity *" value={inc.severity} onChange={v=>setInc(p=>({...p,severity:v}))} options={["Low","Medium","High","Critical"]}/>
      <Ip label="Start Time *" value={inc.startTime} onChange={v=>setInc(p=>({...p,startTime:v}))} type="datetime-local"/>
      <Ip label="Internal Cost Rate ($/hr)" value={inc.internalCostRate?.toString()||"150"} onChange={v=>setInc(p=>({...p,internalCostRate:parseFloat(v)||150}))} type="number"/>
    </div>
    <Ip label="Initial IOCs (one per line)" value={(inc.iocs||[]).join("\n")} onChange={v=>setInc(p=>({...p,iocs:v.split("\n").filter(x=>x.trim())}))} ta rows={3} placeholder="Encrypted files with .locked extension&#10;C2 traffic to 185.x.x.x&#10;Ransom note DECRYPT.html"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
      <Ip label="Affected Users (comma-separated)" value={(inc.affectedUsers||[]).join(", ")} onChange={v=>setInc(p=>({...p,affectedUsers:v.split(",").map(x=>x.trim()).filter(Boolean)}))} placeholder="jdoe, asmith"/>
      <Ip label="Affected Assets (comma-separated)" value={(inc.affectedAssets||[]).join(", ")} onChange={v=>setInc(p=>({...p,affectedAssets:v.split(",").map(x=>x.trim()).filter(Boolean)}))} placeholder="SRV-DB01, WS-FIN-12"/>
      <Ip label="Affected Regions" value={(inc.affectedRegions||[]).join(", ")} onChange={v=>setInc(p=>({...p,affectedRegions:v.split(",").map(x=>x.trim()).filter(Boolean)}))} placeholder="US-East, EU-West"/>
    </div>
    <div style={{display:"flex",gap:16,padding:"8px 0"}}><Ck checked={inc.privacyConcern} onChange={v=>setInc(p=>({...p,privacyConcern:v}))} label="Privacy Concern (PII/PHI involved)"/></div>
    <div style={{display:"flex",gap:12,padding:"8px 0",borderTop:`1px solid ${C.pB}`,alignItems:"center",flexWrap:"wrap"}}>
      <Ck checked={inc.attorneyPrivilege} onChange={v=>setInc(p=>({...p,attorneyPrivilege:v}))} label="Attorney-Client Privilege"/>
      {inc.attorneyPrivilege&&<Ip label="Enforced By" value={inc.privilegeEnforcedBy||""} onChange={v=>setInc(p=>({...p,privilegeEnforcedBy:v,privilegeEnforcedAt:new Date().toLocaleString()}))} placeholder="Legal counsel name" s={{marginBottom:0,flex:1}}/>}
    </div>
    <Bt s={{marginTop:12}} onClick={()=>{save(inc);setEditing(false);addTL("Incident declared: "+inc.title)}} disabled={!inc.title||!inc.startTime}>Activate Command →</Bt>
  </Cd></div>}

// ─── ACTIVE INCIDENT ────────────────────────────────────────────
const tabs=["overview","timeline","escalation","workstreams","expenses","notifications","summaries"];
return <div><Sc sub="Real-time coordination, escalation, and reporting">Incident Commander</Sc>

  {/* Header */}
  <Cd s={{marginBottom:14,borderLeft:`3px solid ${sevC}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {inc.attorneyPrivilege&&<Bd color={C.r} s={{fontSize:7}}>ATTORNEY-CLIENT PRIVILEGE</Bd>}
          {inc.privacyConcern&&<Bd color={C.p} s={{fontSize:7}}>PRIVACY CONCERN</Bd>}
        </div>
        <h2 style={{color:C.w,margin:"3px 0 0",fontSize:16}}>{inc.title}</h2>
        <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
          <Bd color={sevC}>{inc.severity}</Bd><Bd color={C.g}>ACTIVE</Bd>
          <Bd color={C.b}>{inc.members.length} Responders</Bd><Bd color={C.tl}>{inc.iocs.length} IOCs</Bd>
        </div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{textAlign:"center",background:C.oM,borderRadius:8,padding:"8px 14px",border:`1px solid ${C.pB}`}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:800,color:C.w}}>{elapsed||"00:00:00"}</div>
          <div style={{fontSize:7,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em"}}>Elapsed</div></div>
        <div style={{textAlign:"center"}}><div style={{color:C.tl,fontSize:16,fontWeight:700}}>${totalCost.toLocaleString()}</div>
          <div style={{fontSize:7,color:C.tM,textTransform:"uppercase"}}>Cost</div></div>
      </div>
    </div>
  </Cd>

  {/* SLA Tickers */}
  <Cd s={{marginBottom:14}}>
    <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Reporting Deadlines</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:5}}>
      {deadlines.map((d,i)=>{const tc=d.status==="OVERDUE"?C.r:d.status==="WARNING"?C.o:C.g;
        const ic=d.status==="OVERDUE"?"🔴":d.status==="WARNING"?"🟡":"🟢";
        return <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:5,background:d.status!=="ON TRACK"?tc+"10":"transparent",border:`1px solid ${tc}22`}}>
          <span style={{fontSize:10}}>{ic}</span>
          <div style={{flex:1}}><div style={{color:C.tx,fontSize:9,fontWeight:600}}>{d.label}</div>
            <div style={{color:C.tD2,fontSize:7}}>{d.hrs<24?d.hrs+"hr":Math.round(d.hrs/24)+"d"}</div></div>
          <Bd color={tc} s={{fontSize:7}}>{d.status}</Bd>
          {d.status!=="ON TRACK"&&<Bt v="ghost" sz="sm" s={{fontSize:7,padding:"1px 4px"}} onClick={()=>{const t=genNotif(d.template);navigator.clipboard?.writeText(t);addTL(`Notification sent: ${d.label}`);setInc(p=>({...p,notifications:[...p.notifications,{type:d.label,time:new Date().toLocaleString()}]}));alert("Copied.")}}>📋</Bt>}
        </div>})}
    </div>
  </Cd>

  {/* Tabs */}
  <div style={{display:"flex",gap:2,marginBottom:14,borderBottom:`1px solid ${C.pB}`,paddingBottom:5,flexWrap:"wrap"}}>
    {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",borderRadius:"5px 5px 0 0",border:"none",cursor:"pointer",background:tab===t?C.tl+"22":"transparent",color:tab===t?C.tl:C.tM,fontSize:10,fontWeight:600,fontFamily:"inherit",textTransform:"capitalize",borderBottom:tab===t?`2px solid ${C.tl}`:"2px solid transparent"}}>{t}</button>)}</div>

  {/* OVERVIEW TAB */}
  {tab==="overview"&&<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Cd><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>IOCs</div>
        <Bt sz="sm" v="ghost" onClick={()=>{if(newIoc.trim()){setInc(p=>({...p,iocs:[...p.iocs,newIoc]}));addTL("IOC: "+newIoc);setNewIoc("")}}}>+ Add</Bt></div>
        <Ip label="" value={newIoc} onChange={setNewIoc} placeholder="Add IOC..." s={{marginBottom:4}}/>
        {inc.iocs.map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.pB}`}}>
          <span style={{color:C.tx,fontSize:10}}>{x}</span>
          <Bt v="ghost" sz="sm" s={{color:C.r,fontSize:8,padding:"0 3px"}} onClick={()=>setInc(p=>({...p,iocs:p.iocs.filter((_,idx)=>idx!==i)}))}>✕</Bt></div>)}</Cd>
      <Cd><div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Scope</div>
        {[{l:"Users",v:inc.affectedUsers},{l:"Assets",v:inc.affectedAssets},{l:"Regions",v:inc.affectedRegions}].map(x=>
          <div key={x.l} style={{marginBottom:6}}><div style={{color:C.tD2,fontSize:8,fontWeight:600}}>{x.l} ({x.v.length})</div>
            <div style={{color:C.tx,fontSize:10}}>{x.v.join(", ")||"Under assessment"}</div></div>)}
        <div style={{display:"flex",gap:6,marginTop:6}}>{inc.privacyConcern&&<Bd color={C.p}>Privacy</Bd>}{inc.attorneyPrivilege&&<Bd color={C.r}>Privilege</Bd>}</div></Cd>
    </div>
    <Cd s={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Key Findings</div>
      <Bt sz="sm" v="ghost" onClick={()=>{if(newFinding.trim()){setInc(p=>({...p,findings:[...p.findings,{text:newFinding,time:new Date().toLocaleString()}]}));addTL("Finding: "+newFinding);setNewFinding("")}}}>+ Log</Bt></div>
      <Ip label="" value={newFinding} onChange={setNewFinding} placeholder="Document finding..." s={{marginBottom:4}}/>
      {inc.findings.map((f,i)=><div key={i} style={{padding:"3px 0",borderBottom:`1px solid ${C.pB}`,fontSize:10}}>
        <span style={{color:C.tl}}>[{f.time}]</span> <span style={{color:C.tx}}>{f.text}</span></div>)}</Cd>
    <Cd s={{marginBottom:12}}><div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Phases</div>
      {IR_PHASES.map(ph=>{const pct=inc.phaseStatus[ph.id]||0;const cl=pct>=100?C.g:pct>0?C.tl:C.tD2;
        return <div key={ph.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${C.pB}`}}>
          <span style={{fontSize:9}}>{ph.ico}</span><span style={{color:C.tx,fontSize:10,width:90}}>{ph.n}</span>
          <div style={{flex:1}}><Pb value={pct} color={cl} h={4}/></div>
          <input type="range" min="0" max="100" value={pct} onChange={e=>{const v=parseInt(e.target.value);setInc(p=>({...p,phaseStatus:{...p.phaseStatus,[ph.id]:v}}));if(v===100)addTL(`Phase complete: ${ph.n}`)}} style={{width:45,accentColor:C.tl}}/>
          <span style={{color:cl,fontWeight:700,fontSize:9,width:28,textAlign:"right"}}>{pct}%</span></div>})}</Cd>
    <Cd><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Team</div>
      <Bt sz="sm" onClick={()=>{const n=prompt("Name:");const r=prompt("Role:");if(n){setInc(p=>({...p,members:[...p.members,{name:n,role:r||"Responder",hours:0}]}));addTL(`${n} joined`)}}}>+ Add</Bt></div>
      {inc.members.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${C.pB}`}}>
        <div style={{flex:1}}><span style={{color:C.w,fontSize:10,fontWeight:600}}>{m.name}</span><span style={{color:C.tD2,fontSize:8,marginLeft:4}}>{m.role}</span></div>
        <Ip label="" value={m.hours.toString()} onChange={v=>setInc(p=>({...p,members:p.members.map((x,idx)=>idx===i?{...x,hours:parseFloat(v)||0}:x)}))} type="number" s={{marginBottom:0,width:55}}/>
        <Bt v="ghost" sz="sm" onClick={()=>{const t=prompt(`Task for ${m.name}:`);if(t){u(p=>({...p,tickets:[{id:Date.now(),title:t,status:"Open",severity:inc.severity,phase:"Commander",assignee:m.name,created:new Date().toLocaleDateString(),details:`Incident: ${inc.title}`,actions:[]},...p.tickets]}));addTL(`Task→${m.name}: ${t}`)}}}>+Task</Bt></div>)}</Cd>
  </div>}

  {/* TIMELINE TAB */}
  {tab==="timeline"&&<Cd>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Incident Timeline</div>
      <Bt sz="sm" onClick={()=>{const e=prompt("Event:");if(e)addTL(e)}}>+ Event</Bt></div>
    {(inc.timeline||[]).length===0?<p style={{color:C.tD2,fontSize:10}}>Events appear as the incident progresses.</p>
    :(inc.timeline||[]).map((t,i)=><div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.pB}`}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:8,flexShrink:0}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:C.tl}}/>
        {i<inc.timeline.length-1&&<div style={{width:1,flex:1,background:C.pB,marginTop:2}}/>}</div>
      <div><div style={{color:C.tD2,fontSize:8,fontWeight:600}}>{t.time} · {t.elapsed}</div>
        <div style={{color:C.tx,fontSize:10,marginTop:1}}>{t.event}</div></div></div>)}</Cd>}

  {/* ESCALATION TAB */}
  {tab==="escalation"&&<Cd>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Escalation Tree</div>
      {(inc.escalation||[]).length===0&&<Bt sz="sm" onClick={()=>setInc(p=>({...p,escalation:[
        {role:"Security Engineering",owner:"",status:"Pending",p:1},{role:"Incident Commander",owner:"",status:"Pending",p:2},
        {role:"CISO",owner:"",status:"Pending",p:3},{role:"Legal Counsel",owner:"",status:"Pending",p:4},
        {role:"Privacy Officer",owner:"",status:"Pending",p:5},{role:"Cyber Insurance",owner:"",status:"Pending",p:6},
        {role:"Executive Leadership",owner:"",status:"Pending",p:7},{role:"Dark Rock Forensics",owner:"",status:"Pending",p:8},
        {role:"External Legal",owner:"",status:"Pending",p:9},{role:"HR",owner:"",status:"Pending",p:10},
        {role:"PR / Communications",owner:"",status:"Pending",p:11},{role:"Law Enforcement",owner:"",status:"Pending",p:12},
      ]}))} >Generate Tree</Bt>}</div>
    {(inc.escalation||[]).map((e,i)=>{const sc=e.status==="Complete"?C.g:e.status==="In Progress"?C.tl:C.tD2;
      return <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:`1px solid ${C.pB}`}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:sc+"22",color:sc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{e.p}</div>
        <div style={{flex:1,minWidth:80}}><div style={{color:C.w,fontSize:10,fontWeight:600}}>{e.role}</div></div>
        <Ip label="" value={e.owner||""} onChange={v=>setInc(p=>({...p,escalation:p.escalation.map((x,idx)=>idx===i?{...x,owner:v}:x)}))} placeholder="Owner" s={{marginBottom:0,width:100}}/>
        <select value={e.status} onChange={ev=>{const v=ev.target.value;setInc(p=>({...p,escalation:p.escalation.map((x,idx)=>idx===i?{...x,status:v}:x)}));if(v==="Complete")addTL(`Escalation: ${e.role} complete`)}}
          style={{padding:"3px 6px",background:C.oM,border:`1px solid ${C.pB}`,borderRadius:4,color:sc,fontSize:9,fontFamily:"inherit"}}>
          <option>Pending</option><option>In Progress</option><option>Complete</option><option>N/A</option></select>
      </div>})}</Cd>}

  {/* WORKSTREAMS TAB */}
  {tab==="workstreams"&&<div>
    {[{k:"Security",r:"Security Engineering"},{k:"Legal",r:"Legal Counsel"},{k:"Executive",r:"Executive Leadership"},
      {k:"Insurance",r:"Cyber Insurance"},{k:"Forensics",r:"Dark Rock Forensics"},{k:"HR",r:"Human Resources"},
      {k:"PR",r:"Public Relations"},{k:"Privacy",r:"Privacy Officer"}].map(ws=>{
      const d=inc.workstreams[ws.k]||{tasks:[],docs:[],accomplishments:[],risks:[]};
      const dn=d.tasks.filter(t=>t.done).length;const pct=d.tasks.length?Math.round(dn/d.tasks.length*100):0;
      return <Cd key={ws.k} s={{marginBottom:10,borderLeft:`3px solid ${pct>=100?C.g:pct>0?C.tl:C.tD2}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div><div style={{color:C.w,fontSize:11,fontWeight:700}}>{ws.r}</div>
            <div style={{display:"flex",gap:4,marginTop:2}}><Bd color={pct>=100?C.g:C.tl}>{pct}%</Bd><Bd color={C.tD2}>{dn}/{d.tasks.length}</Bd>
              {d.risks.length>0&&<Bd color={C.r}>{d.risks.length} risks</Bd>}</div></div>
          <Bt sz="sm" v="outline" onClick={()=>{const t=prompt(`Task for ${ws.r}:`);if(t)setInc(p=>({...p,workstreams:{...p.workstreams,[ws.k]:{...d,tasks:[...d.tasks,{text:t,done:false,ts:new Date().toLocaleString()}]}}))}}>+ Task</Bt></div>
        {d.risks.map((r,i)=><div key={i} style={{color:C.r,fontSize:9,padding:"1px 0"}}>⚠ {r}</div>)}
        {d.tasks.map((t,i)=><Ck key={i} label={t.text} checked={t.done} onChange={v=>{
          setInc(p=>({...p,workstreams:{...p.workstreams,[ws.k]:{...d,tasks:d.tasks.map((x,idx)=>idx===i?{...x,done:v}:x)}}}));
          if(v)addTL(`WS ${ws.r}: ${t.text} ✓`)}}/>)}
        <div style={{display:"flex",gap:3,marginTop:4}}>
          <Bt v="ghost" sz="sm" onClick={()=>{const a=prompt("Accomplishment:");if(a)setInc(p=>({...p,workstreams:{...p.workstreams,[ws.k]:{...d,accomplishments:[...d.accomplishments,{text:a,ts:new Date().toLocaleString()}]}}}))}}>✓ Win</Bt>
          <Bt v="ghost" sz="sm" onClick={()=>{const r=prompt("Risk/dependency:");if(r)setInc(p=>({...p,workstreams:{...p.workstreams,[ws.k]:{...d,risks:[...d.risks,r]}}}))}}>⚠ Risk</Bt>
          <Bt v="ghost" sz="sm" onClick={()=>{const n=prompt("Document:");if(n)setInc(p=>({...p,workstreams:{...p.workstreams,[ws.k]:{...d,docs:[...d.docs,{name:n,ts:new Date().toLocaleString(),ver:"1.0"}]}}}))}}>📄 Doc</Bt></div>
        {d.accomplishments.length>0&&<div style={{marginTop:4,borderTop:`1px solid ${C.pB}`,paddingTop:4}}>
          {d.accomplishments.map((a,i)=><div key={i} style={{color:C.g,fontSize:9}}>✓ {a.text} <span style={{color:C.tD2}}>({a.ts})</span></div>)}</div>}
        {d.docs.length>0&&<div style={{marginTop:4,borderTop:`1px solid ${C.pB}`,paddingTop:4}}>
          {d.docs.map((doc,i)=><div key={i} style={{color:C.b,fontSize:9}}>📄 {doc.name} <span style={{color:C.tD2}}>v{doc.ver} · {doc.ts}</span></div>)}</div>}
      </Cd>})}</div>}

  {/* EXPENSES TAB */}
  {tab==="expenses"&&<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
      <Cd s={{textAlign:"center",padding:12}}><div style={{fontSize:7,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Internal</div>
        <div style={{fontSize:18,fontWeight:800,color:C.tl}}>${intCost.toLocaleString()}</div>
        <div style={{fontSize:7,color:C.tD2}}>{totalHrs.toFixed(1)}hrs × ${inc.internalCostRate}/hr</div></Cd>
      <Cd s={{textAlign:"center",padding:12}}><div style={{fontSize:7,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>External</div>
        <div style={{fontSize:18,fontWeight:800,color:C.o}}>${extCost.toLocaleString()}</div>
        <div style={{fontSize:7,color:C.tD2}}>{inc.expenses.length} items</div></Cd>
      <Cd s={{textAlign:"center",padding:12}}><div style={{fontSize:7,color:C.tM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Total</div>
        <div style={{fontSize:18,fontWeight:800,color:C.w}}>${totalCost.toLocaleString()}</div></Cd>
    </div>
    <Cd><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>External Expenses</div>
      <Bt sz="sm" onClick={()=>{const v=prompt("Vendor:");const d=prompt("Description:");const a=prompt("Amount ($):");if(v&&a){setInc(p=>({...p,expenses:[...p.expenses,{vendor:v,description:d||"",amount:parseFloat(a)||0,date:new Date().toLocaleDateString()}]}));addTL(`Expense: ${v} $${a}`)}}}>+ Add</Bt></div>
      {inc.expenses.length===0?<p style={{color:C.tD2,fontSize:9}}>No external expenses. Add legal, forensics, PR costs.</p>
      :inc.expenses.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.pB}`}}>
        <div><div style={{color:C.w,fontSize:10,fontWeight:600}}>{e.vendor}</div><div style={{color:C.tD2,fontSize:8}}>{e.description}</div></div>
        <div style={{textAlign:"right"}}><div style={{color:C.o,fontSize:10,fontWeight:700}}>${e.amount.toLocaleString()}</div><div style={{color:C.tD2,fontSize:7}}>{e.date}</div></div></div>)}</Cd>
  </div>}

  {/* NOTIFICATIONS TAB */}
  {tab==="notifications"&&<div>
    <Cd s={{marginBottom:12}}>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Generate Notification</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6}}>
        {[{k:"management",l:"Management",i:"👔"},{k:"executive",l:"Executive",i:"🏛️"},{k:"legal",l:"Legal",i:"⚖️"},{k:"insurance",l:"Insurance",i:"📋"},{k:"board",l:"Board",i:"📊"}].map(n=>
          <Cd key={n.k} s={{padding:10,cursor:"pointer"}} onClick={()=>{const t=genNotif(n.k);navigator.clipboard?.writeText(t);addTL(`Notification: ${n.l}`);setInc(p=>({...p,notifications:[...p.notifications,{type:n.l,time:new Date().toLocaleString()}]}));alert(`${n.l} notification copied.`)}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{n.i}</span>
              <div><div style={{color:C.w,fontSize:10,fontWeight:600}}>{n.l}</div><div style={{color:C.tD2,fontSize:7}}>Click to copy</div></div></div></Cd>)}</div></Cd>
    {inc.notifications.length>0&&<Cd>
      <div style={{fontSize:9,color:C.tM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Notification Log</div>
      {inc.notifications.map((n,i)=><div key={i} style={{padding:"3px 0",borderBottom:`1px solid ${C.pB}`,fontSize:9}}>
        <span style={{color:C.tl}}>[{n.time}]</span> <span style={{color:C.tx}}>{n.type}</span></div>)}</Cd>}</div>}

  {/* SUMMARIES TAB */}
  {tab==="summaries"&&<div>
    <Bt s={{marginBottom:12}} onClick={()=>genSummary()}>Generate Tactical Summary</Bt>
    {(inc.summaries||[]).map((s,i)=><Cd key={s.id} s={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <div style={{display:"flex",gap:4}}><Bd color={C.p}>#{(inc.summaries||[]).length-i}</Bd><span style={{color:C.tM,fontSize:8}}>{s.timestamp}</span></div>
        <div style={{display:"flex",gap:3}}>
          <Bt v="ghost" sz="sm" onClick={()=>{navigator.clipboard?.writeText(s.text);alert("Copied.")}}>Copy</Bt>
          <Bt v="outline" sz="sm" onClick={()=>{const blob=new Blob([s.text],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Summary_${s.timestamp.replace(/[/: ,]/g,"_")}.txt`;a.click();}}>Export</Bt></div></div>
      <pre style={{background:C.oM,borderRadius:5,padding:10,color:C.tx,fontSize:8,lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",maxHeight:200,overflow:"auto",margin:0}}>{s.text}</pre></Cd>)}</div>}

  {/* Actions */}
  <div style={{display:"flex",gap:6,marginTop:14,flexWrap:"wrap"}}>
    <Bt v="outline" onClick={()=>{save();alert("Saved.")}}>Save</Bt>
    <Bt v="secondary" onClick={()=>setEditing(true)}>Edit Details</Bt>
    <Bt v="danger" onClick={()=>{if(confirm("Close incident?")){genSummary();addTL("Closed");
      u(p=>({...p,commander:{...p.commander,activeIncident:null},cases:[{title:inc.title,date:new Date().toLocaleDateString(),status:"Closed",cost:totalCost,members:inc.members.length},...p.cases]}));
      setEditing(true);setInc({...defaultInc})}}}>Close Incident</Bt>
  </div>
</div>;
};

// ─── PLAYBOOKS ───────────────────────────────────────────────────────
const PlaybooksMod=()=>{
  const [sel,setSel]=useState(null);const [filter,setFilter]=useState("All");
  const [pbChecks,setPbChecks]=useState({});
  const [assignModal,setAssignModal]=useState(null);
  const [incTitle,setIncTitle]=useState("");
  const [incSev,setIncSev]=useState("High");
  const [incAssignee,setIncAssignee]=useState("");

  const cats=["All",...new Set(PLAYBOOKS.map(p=>p.cat))];
  const filtered=filter==="All"?PLAYBOOKS:PLAYBOOKS.filter(p=>p.cat===filter);

  const togglePbCheck=(pbId,phase,idx)=>{
    const key=`${pbId}_${phase}_${idx}`;
    setPbChecks(p=>({...p,[key]:!p[key]}));
  };

  const getPbProgress=(pbId)=>{
    const pb=PLAYBOOKS.find(p=>p.id===pbId);if(!pb)return 0;
    const allSteps=[...pb.iocs,...pb.contain,...pb.erad,...pb.recover];
    const phases=[{k:"iocs",d:pb.iocs},{k:"contain",d:pb.contain},{k:"erad",d:pb.erad},{k:"recover",d:pb.recover}];
    let total=0,done=0;
    phases.forEach(ph=>ph.d.forEach((_,i)=>{total++;if(pbChecks[`${pbId}_${ph.k}_${i}`])done++}));
    return total?Math.round(done/total*100):0;
  };

  const assignToIncident=(pb)=>{
    const caseId=Date.now();
    const subtasks=[];
    [{k:"iocs",l:"IOC Verification",d:pb.iocs},{k:"contain",l:"Containment",d:pb.contain},{k:"erad",l:"Eradication",d:pb.erad},{k:"recover",l:"Recovery",d:pb.recover}].forEach(phase=>{
      phase.d.forEach((step,i)=>{
        subtasks.push({
          id:caseId+i+phase.k.charCodeAt(0),title:`[${phase.l}] ${step}`,
          priority:phase.k==="contain"?"Critical":phase.k==="erad"?"High":"Medium",
          status:"Backlog",assignee:incAssignee||"",updates:[],
          created:new Date().toLocaleDateString(),source:`Playbook: ${pb.name}`
        });
      });
    });
    const masterTicket={
      id:caseId,title:incTitle||`Incident: ${pb.name}`,status:"Open",
      severity:incSev,phase:"Playbook Activated",assignee:incAssignee||"",
      created:new Date().toLocaleDateString(),
      details:`Playbook activated: ${pb.name}\nSeverity: ${pb.sev}\nCategory: ${pb.cat}\n\nDescription: ${pb.desc}\n\nMITRE ATT&CK: ${pb.mitre.join(", ")}\n\nSubtasks created: ${subtasks.length}`,
      actions:[{text:`Playbook "${pb.name}" activated with ${subtasks.length} subtasks`,by:"System",time:new Date().toLocaleTimeString()}],
      playbookId:pb.id,subtaskCount:subtasks.length
    };
    u(p=>({
      ...p,
      tickets:[masterTicket,...p.tickets],
      tasks:[...subtasks,...p.tasks],
      cases:[{title:incTitle||`Incident: ${pb.name}`,date:new Date().toLocaleDateString(),status:"Open",type:"Incident",playbook:pb.id,ticketId:caseId},...p.cases]
    }));
    setAssignModal(null);setIncTitle("");setIncSev("High");setIncAssignee("");
    setSel(null);
    alert(`Incident created with ${subtasks.length} subtasks in the Tasks board and 1 master ticket.`);
  };

  // Active playbook assignments
  const activeAssignments=st.cases.filter(c=>c.playbook&&c.status==="Open");

  if(sel){
    const pb=PLAYBOOKS.find(p=>p.id===sel);if(!pb)return null;
    const progress=getPbProgress(pb.id);
    const phases=[
      {k:"iocs",t:"Indicators of Compromise",sub:"Verify each IOC against your environment",d:pb.iocs,c:C.r,ico:"🔍"},
      {k:"contain",t:"Containment Actions",sub:"Execute containment steps to stop the threat",d:pb.contain,c:C.o,ico:"🚧"},
      {k:"erad",t:"Eradication Steps",sub:"Remove the adversary and remediate root cause",d:pb.erad,c:C.y,ico:"🧹"},
      {k:"recover",t:"Recovery Procedures",sub:"Restore operations and validate integrity",d:pb.recover,c:C.g,ico:"🔄"},
    ];

    return <div>
      <Bt v="ghost" onClick={()=>setSel(null)} s={{marginBottom:12}}>← Back to Playbooks</Bt>

      {/* Playbook Header */}
      <Cd s={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:22}}>{pb.icon}</span>
              <h2 style={{color:C.w,margin:0,fontSize:17}}>{pb.name}</h2>
            </div>
            <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
              <Bd>{pb.cat}</Bd>
              <Bd color={pb.sev==="Critical"?C.r:pb.sev==="High"?C.o:C.y}>{pb.sev}</Bd>
              <Bd color={progress>=100?C.g:progress>0?C.tl:C.tD2}>{progress}% Complete</Bd>
            </div>
            <p style={{color:C.tM,fontSize:12,margin:0,lineHeight:1.5,maxWidth:600}}>{pb.desc}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <Bt onClick={()=>setAssignModal(pb)}>🚨 Assign to Incident</Bt>
            <Bt v="outline" sz="sm" onClick={()=>{
              const txt=`SENTRY PLAYBOOK EXECUTION REPORT\n${"═".repeat(50)}\nPlaybook: ${pb.name}\nCategory: ${pb.cat}\nSeverity: ${pb.sev}\nProgress: ${progress}%\nDate: ${new Date().toLocaleString()}\n\n${phases.map(ph=>`${ph.t}\n${"─".repeat(40)}\n${ph.d.map((s,i)=>`  [${pbChecks[`${pb.id}_${ph.k}_${i}`]?"✓":" "}] ${s}`).join("\n")}`).join("\n\n")}\n\nMITRE ATT&CK: ${pb.mitre.join(", ")}\n`;
              const blob=new Blob([txt],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Sentry_Playbook_${pb.name.replace(/\s/g,"_")}.txt`;a.click();
            }}>Export Checklist</Bt>
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{marginTop:12}}><Pb value={progress} color={progress>=100?C.g:C.tl} h={6}/></div>
      </Cd>

      {/* Assign Modal */}
      {assignModal&&<Cd s={{marginBottom:14,borderColor:C.r+"44",background:`linear-gradient(135deg,${C.r}06,${C.pn})`}}>
        <h3 style={{color:C.w,marginTop:0,fontSize:14}}>🚨 Assign Playbook to Active Incident</h3>
        <p style={{color:C.tM,fontSize:11,marginBottom:12}}>
          This will create a master incident ticket and {[...assignModal.iocs,...assignModal.contain,...assignModal.erad,...assignModal.recover].length} individual subtasks
          in the Tasks board, one for each playbook step. Subtasks can be assigned, tracked, and completed independently.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Ip label="Incident Title" value={incTitle} onChange={setIncTitle} placeholder={`Incident: ${assignModal.name}`}/>
          <Sl label="Severity" value={incSev} onChange={setIncSev} options={["Low","Medium","High","Critical"]}/>
          <Ip label="Primary Assignee" value={incAssignee} onChange={setIncAssignee} placeholder="Incident Manager name"/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          <Bt v="danger" onClick={()=>assignToIncident(assignModal)}>Create Incident + {[...assignModal.iocs,...assignModal.contain,...assignModal.erad,...assignModal.recover].length} Subtasks</Bt>
          <Bt v="secondary" onClick={()=>setAssignModal(null)}>Cancel</Bt>
        </div>
      </Cd>}

      {/* Checklist Phases */}
      {phases.map(ph=>{
        const phDone=ph.d.filter((_,i)=>pbChecks[`${pb.id}_${ph.k}_${i}`]).length;
        return <Cd key={ph.k} s={{marginBottom:12,borderLeft:`3px solid ${ph.c}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14}}>{ph.ico}</span>
              <div>
                <h3 style={{color:C.w,margin:0,fontSize:13}}>{ph.t}</h3>
                <p style={{color:C.tD2,fontSize:10,margin:"2px 0 0"}}>{ph.sub}</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Bd color={phDone===ph.d.length?C.g:phDone>0?ph.c:C.tD2}>{phDone}/{ph.d.length}</Bd>
              <div style={{width:60}}><Pb value={phDone} max={ph.d.length} color={phDone===ph.d.length?C.g:ph.c} h={4}/></div>
            </div>
          </div>
          {ph.d.map((step,i)=>{
            const isChecked=!!pbChecks[`${pb.id}_${ph.k}_${i}`];
            return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.pB}`}}>
              <div onClick={()=>togglePbCheck(pb.id,ph.k,i)} style={{
                width:18,height:18,borderRadius:4,border:`2px solid ${isChecked?C.g:C.pB}`,
                background:isChecked?C.g:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",flexShrink:0,marginTop:1,transition:"all 0.12s"
              }}>{isChecked&&<span style={{color:C.ob,fontSize:11,fontWeight:800}}>✓</span>}</div>
              <span style={{color:isChecked?C.tD2:C.tx,fontSize:11,lineHeight:1.5,textDecoration:isChecked?"line-through":"none",transition:"all 0.12s"}}>
                <span style={{color:ph.c,fontWeight:600,marginRight:6}}>{i+1}.</span>{step}
              </span>
            </div>;
          })}
        </Cd>;
      })}

      {/* MITRE ATT&CK */}
      <Cd><h3 style={{color:C.w,marginTop:0,fontSize:13}}>MITRE ATT&CK Mapping</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {pb.mitre.map(m=><Bd key={m} color={C.b}>{m}</Bd>)}
        </div>
      </Cd>
    </div>;
  }

  return <div>
    <Sc sub={`${PLAYBOOKS.length} scenario playbooks with interactive checklists and incident assignment`}>Playbooks</Sc>

    {/* Active Assignments */}
    {activeAssignments.length>0&&<Cd s={{marginBottom:14,borderLeft:`3px solid ${C.r}`}}>
      <h3 style={{color:C.w,marginTop:0,fontSize:13}}>🔴 Active Playbook Assignments</h3>
      {activeAssignments.map((a,i)=>{
        const pb=PLAYBOOKS.find(p=>p.id===a.playbook);
        return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.pB}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span>{pb?.icon||"📋"}</span>
            <span style={{color:C.tx,fontSize:12,fontWeight:600}}>{a.title}</span>
            <Bd color={C.o}>{a.status}</Bd>
          </div>
          <span style={{color:C.tD2,fontSize:10}}>{a.date}</span>
        </div>;
      })}
    </Cd>}

    {/* Filter */}
    <div style={{display:"flex",gap:3,marginBottom:16,flexWrap:"wrap"}}>
      {cats.map(c=><Bt key={c} v={filter===c?"primary":"secondary"} sz="sm" onClick={()=>setFilter(c)}>
        {c} ({c==="All"?PLAYBOOKS.length:PLAYBOOKS.filter(p=>p.cat===c).length})
      </Bt>)}
    </div>

    {/* Playbook Grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
      {filtered.map(pb=>{
        const progress=getPbProgress(pb.id);
        const isAssigned=activeAssignments.some(a=>a.playbook===pb.id);
        return <Cd key={pb.id} onClick={()=>setSel(pb.id)} s={{
          cursor:"pointer",
          borderLeft:`3px solid ${pb.sev==="Critical"?C.r:pb.sev==="High"?C.o:C.y}`,
          borderColor:isAssigned?C.r+"44":undefined
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:18}}>{pb.icon}</span>
              <h4 style={{color:C.w,margin:0,fontSize:12}}>{pb.name}</h4>
            </div>
            {isAssigned&&<Bd color={C.r}>ACTIVE</Bd>}
          </div>
          <div style={{display:"flex",gap:3,marginBottom:6,flexWrap:"wrap"}}>
            <Bd>{pb.cat}</Bd>
            <Bd color={pb.sev==="Critical"?C.r:pb.sev==="High"?C.o:C.y}>{pb.sev}</Bd>
            <Bd color={C.tD2}>{pb.iocs.length+pb.contain.length+pb.erad.length+pb.recover.length} steps</Bd>
          </div>
          <p style={{color:C.tM,fontSize:10,margin:"0 0 8px",lineHeight:1.4}}>{pb.desc.substring(0,100)}...</p>
          {progress>0&&<Pb value={progress} color={progress>=100?C.g:C.tl} h={3}/>}
        </Cd>;
      })}
    </div>
  </div>;
};

// ─── TICKETS ─────────────────────────────────────────────────────────
const Tickets=()=>{
  const [sel,setSel]=useState(null);const [showNew,setShowNew]=useState(false);
  const [nf,setNf]=useState({title:"",severity:"Medium",phase:"",assignee:"",details:""});
  if(sel){const tk=st.tickets.find(t=>t.id===sel);if(!tk)return null;
    return <div><Bt v="ghost" onClick={()=>setSel(null)} s={{marginBottom:12}}>← Back</Bt>
      <Cd s={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div><h2 style={{color:C.w,margin:"0 0 4px",fontSize:15}}>{tk.title}</h2>
            <div style={{display:"flex",gap:4}}><Bd color={tk.severity==="Critical"?C.r:C.o}>{tk.severity}</Bd><Bd color={tk.status==="Open"?C.o:tk.status==="Closed"?C.g:C.b}>{tk.status}</Bd></div></div>
          <div style={{display:"flex",gap:6}}>
            <Bt v="outline" sz="sm" onClick={()=>{const txt=`SENTRY INCIDENT TICKET\n${"═".repeat(50)}\nID: ${tk.id}\nTitle: ${tk.title}\nSeverity: ${tk.severity}\nStatus: ${tk.status}\nPhase: ${tk.phase||"N/A"}\nAssignee: ${tk.assignee||"Unassigned"}\nCreated: ${tk.created}\n\nDetails:\n${tk.details||"None"}\n\nActions:\n${(tk.actions||[]).map((a,i)=>`${i+1}. [${a.time}] ${a.by}: ${a.text}`).join("\n")||"None"}\n`;
              const blob=new Blob([txt],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Sentry-Ticket-${tk.id}.txt`;a.click()}}>Export</Bt>
            <Sl value={tk.status} onChange={v=>u(p=>({...p,tickets:p.tickets.map(t=>t.id===tk.id?{...t,status:v}:t)}))} options={["Open","In Progress","Contained","Resolved","Closed"]}/></div></div></Cd>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Cd><h4 style={{color:C.w,marginTop:0,fontSize:12}}>Details</h4>
          <Ip label="Assignee" value={tk.assignee||""} onChange={v=>u(p=>({...p,tickets:p.tickets.map(t=>t.id===tk.id?{...t,assignee:v}:t)}))} placeholder="Assign..."/>
          <Ip label="Details" value={tk.details||""} onChange={v=>u(p=>({...p,tickets:p.tickets.map(t=>t.id===tk.id?{...t,details:v}:t)}))} ta placeholder="Full details..." rows={4}/></Cd>
        <Cd><h4 style={{color:C.w,marginTop:0,fontSize:12}}>Action Log</h4>
          {(tk.actions||[]).map((a,i)=><div key={i} style={{padding:"4px 0",borderBottom:`1px solid ${C.pB}`,fontSize:10}}>
            <span style={{color:C.tl}}>[{a.time}]</span> <span style={{color:C.tM}}>{a.by}:</span> <span style={{color:C.tx}}>{a.text}</span></div>)}
          <Bt v="outline" sz="sm" s={{marginTop:6}} onClick={()=>{const t=prompt("Action:");const b=prompt("By:");if(t)u(p=>({...p,tickets:p.tickets.map(tk2=>tk2.id===tk.id?{...tk2,actions:[...(tk2.actions||[]),{text:t,by:b||"Unknown",time:new Date().toLocaleTimeString()}]}:tk2)}))}}>+ Log Action</Bt></Cd>
      </div></div>}
  return <div><Sc sub="Phase-based incident tracking">Tickets</Sc>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Bt onClick={()=>setShowNew(true)}>+ New Ticket</Bt></div>
    {showNew&&<Cd s={{marginBottom:12,borderColor:C.tl+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Ip label="Title" value={nf.title} onChange={v=>setNf(p=>({...p,title:v}))}/>
        <Sl label="Severity" value={nf.severity} onChange={v=>setNf(p=>({...p,severity:v}))} options={["Low","Medium","High","Critical"]}/>
        <Sl label="Phase" value={nf.phase} onChange={v=>setNf(p=>({...p,phase:v}))} options={IR_PHASES.map(p=>p.n)}/>
        <Ip label="Assignee" value={nf.assignee} onChange={v=>setNf(p=>({...p,assignee:v}))}/></div>
      <Ip label="Details" value={nf.details} onChange={v=>setNf(p=>({...p,details:v}))} ta/>
      <div style={{display:"flex",gap:6}}><Bt onClick={()=>{u(p=>({...p,tickets:[{id:Date.now(),...nf,status:"Open",created:new Date().toLocaleDateString(),actions:[]},...p.tickets]}));setShowNew(false);setNf({title:"",severity:"Medium",phase:"",assignee:"",details:""})}}>Create</Bt><Bt v="secondary" onClick={()=>setShowNew(false)}>Cancel</Bt></div></Cd>}
    {st.tickets.map(tk=><Cd key={tk.id} onClick={()=>setSel(tk.id)} s={{cursor:"pointer",marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:C.w,fontSize:12,fontWeight:600}}>{tk.title}</div><div style={{color:C.tD2,fontSize:9,marginTop:2}}>{tk.created} · {tk.assignee||"Unassigned"}</div></div>
        <div style={{display:"flex",gap:4}}><Bd color={tk.severity==="Critical"?C.r:C.o}>{tk.severity}</Bd><Bd color={tk.status==="Closed"?C.g:C.o}>{tk.status}</Bd></div></div></Cd>)}</div>;
};

// ─── KANBAN TASKS ────────────────────────────────────────────────────
const Tasks=()=>{
  const cols=["Backlog","In Progress","In Review","Done"];
  const priColors={Critical:C.r,High:C.o,Medium:C.y,Low:C.g};
  const [showNew,setShowNew]=useState(false);const [nf,setNf]=useState({title:"",priority:"Medium",assignee:""});
  const [editId,setEditId]=useState(null);
  const moveTask=(id,newStatus)=>u(p=>({...p,tasks:p.tasks.map(t=>t.id===id?{...t,status:newStatus}:t)}));

  return <div><Sc sub="Kanban board for remediation tracking from lessons learned and assessments">Tasks</Sc>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12,gap:6}}>
      <Bt onClick={()=>setShowNew(true)}>+ New Task</Bt></div>
    {showNew&&<Cd s={{marginBottom:12,borderColor:C.tl+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}>
        <Ip label="Title" value={nf.title} onChange={v=>setNf(p=>({...p,title:v}))}/>
        <Sl label="Priority" value={nf.priority} onChange={v=>setNf(p=>({...p,priority:v}))} options={["Low","Medium","High","Critical"]}/>
        <Ip label="Assignee" value={nf.assignee} onChange={v=>setNf(p=>({...p,assignee:v}))}/></div>
      <div style={{display:"flex",gap:6}}><Bt onClick={()=>{if(nf.title){u(p=>({...p,tasks:[{id:Date.now(),...nf,status:"Backlog",updates:[],created:new Date().toLocaleDateString(),source:"Manual"},...p.tasks]}));setShowNew(false);setNf({title:"",priority:"Medium",assignee:""})}}}>Create</Bt><Bt v="secondary" onClick={()=>setShowNew(false)}>Cancel</Bt></div></Cd>}
    {/* Kanban Board */}
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols.length},1fr)`,gap:12,minHeight:300}}>
      {cols.map(col=>{const colTasks=st.tasks.filter(t=>t.status===col);
        return <div key={col} style={{background:C.oL,borderRadius:8,padding:10,border:`1px solid ${C.pB}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{color:C.tM,margin:0,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em"}}>{col}</h4>
            <Bd color={col==="Done"?C.g:C.tM}>{colTasks.length}</Bd></div>
          {colTasks.map(task=><div key={task.id} style={{background:C.pn,borderRadius:7,padding:10,marginBottom:8,borderLeft:`3px solid ${priColors[task.priority]||C.tl}`,cursor:"pointer"}}
            onClick={()=>setEditId(editId===task.id?null:task.id)}>
            <div style={{color:C.w,fontSize:11,fontWeight:600,marginBottom:4}}>{task.title}</div>
            <div style={{display:"flex",gap:3,marginBottom:4}}><Bd color={priColors[task.priority]}>{task.priority}</Bd>
              {task.assignee&&<Bd color={C.b}>{task.assignee}</Bd>}</div>
            <div style={{color:C.tD2,fontSize:9}}>{task.source||"Manual"} · {task.created}</div>
            {editId===task.id&&<div style={{marginTop:8,borderTop:`1px solid ${C.pB}`,paddingTop:8}} onClick={e=>e.stopPropagation()}>
              {/* Updates */}
              {(task.updates||[]).map((up,i)=><div key={i} style={{fontSize:9,color:C.tM,padding:"2px 0"}}>[{up.date}] {up.text}</div>)}
              <Bt v="ghost" sz="sm" s={{marginTop:4}} onClick={()=>{const t=prompt("Update:");if(t)u(p=>({...p,tasks:p.tasks.map(tk=>tk.id===task.id?{...tk,updates:[...(tk.updates||[]),{text:t,date:new Date().toLocaleDateString()}]}:tk)}))}}>+ Update</Bt>
              <div style={{display:"flex",gap:3,marginTop:6,flexWrap:"wrap"}}>
                {cols.filter(c=>c!==col).map(c=><Bt key={c} v="secondary" sz="sm" onClick={()=>moveTask(task.id,c)}>→ {c}</Bt>)}</div>
            </div>}
          </div>)}</div>})}</div>
  </div>;
};

// ─── FORENSICS ───────────────────────────────────────────────────────
const Forensics=()=>{
  const [showNew,setShowNew]=useState(false);const [nf,setNf]=useState({title:"",classification:"Confidential",caseRef:"",description:"",encKey:""});
  return <div><Sc sub="Encrypted evidence vault with chain-of-custody">Forensic Logs</Sc>
    <Bt s={{marginBottom:12}} onClick={()=>setShowNew(true)}>+ New Entry</Bt>
    {showNew&&<Cd s={{marginBottom:12,borderColor:C.cy+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Ip label="Title" value={nf.title} onChange={v=>setNf(p=>({...p,title:v}))} placeholder="Memory dump - SRV01"/>
        <Sl label="Classification" value={nf.classification} onChange={v=>setNf(p=>({...p,classification:v}))} options={["Internal","Confidential","Restricted","Privileged & Confidential"]}/>
        <Ip label="Case Ref" value={nf.caseRef} onChange={v=>setNf(p=>({...p,caseRef:v}))} placeholder="CASE-2026-001"/>
        <Ip label="Encryption Key" value={nf.encKey} onChange={v=>setNf(p=>({...p,encKey:v}))} type="password" placeholder="Required"/></div>
      <Ip label="Chain of Custody Notes" value={nf.description} onChange={v=>setNf(p=>({...p,description:v}))} ta placeholder="Collected by [Name] from [System]. SHA256: ..."/>
      <div style={{display:"flex",gap:6}}><Bt onClick={()=>{if(nf.title){u(p=>({...p,forensicLogs:[{id:Date.now(),...nf,created:new Date().toLocaleString(),locked:!!nf.encKey},...p.forensicLogs]}));setShowNew(false);setNf({title:"",classification:"Confidential",caseRef:"",description:"",encKey:""})}}}>Save</Bt><Bt v="secondary" onClick={()=>setShowNew(false)}>Cancel</Bt></div></Cd>}
    {st.forensicLogs.map(log=><Cd key={log.id} s={{marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{log.locked&&<span>🔒</span>}<span style={{color:C.w,fontSize:12,fontWeight:600}}>{log.title}</span></div>
      <div style={{display:"flex",gap:4}}><Bd color={C.cy}>{log.classification}</Bd>{log.caseRef&&<Bd>{log.caseRef}</Bd>}<Bd color={C.tD2}>{log.created}</Bd></div>
      {log.description&&<p style={{color:C.tM,fontSize:10,margin:"6px 0 0"}}>{log.description}</p>}</Cd>)}</div>;
};

// ─── STAKEHOLDERS ────────────────────────────────────────────────────
const Stakeholders=()=>{
  const sk=st.stakeholders;
  const [editGroup,setEditGroup]=useState(null);
  const [editSys,setEditSys]=useState(null);
  const [nf,setNf]=useState({firstName:"",lastName:"",title:"",responsibilities:"",email:"",cell:""});
  const [nsf,setNsf]=useState({systemName:"",category:"",owner:"",ownerEmail:"",ownerCell:"",criticality:"High",notes:""});

  const GROUPS=[
    {key:"incidentCommander",label:"Incident Commander",icon:"★",desc:"Primary authority for strategic incident decisions. Communicates with executive leadership.",color:C.r},
    {key:"ciso",label:"CISO / Security Leadership",icon:"🛡️",desc:"Chief Information Security Officer and security leadership team responsible for overall security posture.",color:C.tl},
    {key:"securityEngineers",label:"Security Engineers",icon:"⚙️",desc:"Technical security staff responsible for detection, analysis, containment, and eradication activities.",color:C.b},
    {key:"legalContact",label:"Legal Counsel (Internal)",icon:"⚖️",desc:"Internal legal team coordinating privilege, regulatory obligations, and contractual requirements.",color:C.p},
    {key:"riskContact",label:"Risk Management",icon:"📊",desc:"Enterprise risk management team assessing business impact and risk exposure during incidents.",color:C.o},
    {key:"executivePOC",label:"Executive Points of Contact",icon:"👔",desc:"C-suite and board-level contacts for escalation, strategic decisions, and stakeholder communications.",color:C.y},
    {key:"cyberInsuranceInternal",label:"Cyber Insurance (Internal)",icon:"📋",desc:"Internal contacts responsible for managing the cyber insurance relationship and initiating claims.",color:C.cy},
    {key:"cyberInsuranceExternal",label:"Cyber Insurance (External)",icon:"🏢",desc:"Insurance carrier contacts, claims adjusters, and breach coach assignments.",color:C.cy},
    {key:"externalLegal",label:"External Legal Counsel",icon:"🏛️",desc:"Outside counsel specializing in data breach, regulatory response, and litigation management.",color:C.p},
    {key:"forensicsContact",label:"Approved Forensics Provider",icon:"🔬",desc:"Pre-approved digital forensics and incident response firms for evidence collection and analysis.",color:C.r},
    {key:"hrContacts",label:"Human Resources",icon:"👥",desc:"HR leadership for insider threat coordination, employee notifications, and personnel actions.",color:C.g},
    {key:"prContact",label:"Public Relations / Communications",icon:"📣",desc:"Internal and external PR contacts for media relations, public statements, and stakeholder messaging.",color:C.o},
    {key:"privacyContact",label:"Privacy Officer / Data Protection",icon:"🔏",desc:"Privacy officer, data protection officer (DPO), and privacy counsel responsible for breach notification determinations, PII/PHI impact assessment, data subject rights, and regulatory privacy obligations (GDPR, CCPA, HIPAA Privacy Rule).",color:C.cy},
    {key:"lawEnforcement",label:"Law Enforcement",icon:"🚔",desc:"Law enforcement contacts at local, state, and federal levels. Coordinate with Legal before engaging. Local: Contact your jurisdictional police department cybercrime unit. State: Contact your state attorney general's office cyber division. Federal: FBI IC3 (ic3.gov), FBI local field office, US Secret Service (financial crimes), CISA (critical infrastructure).",color:C.b},
  ];

  const SYS_CATEGORIES=["Financial Systems","HR / HCM Systems","Production / Operations","Infrastructure / Network","Data Management / Storage","Cloud Platforms","Identity / Access Management","Email / Collaboration","Customer-Facing Applications","Development / DevOps","Physical Security","Telecommunications","Other"];

  const addPerson=(groupKey)=>{
    if(!nf.firstName||!nf.lastName)return;
    const person={...nf,id:Date.now()};
    u(p=>({...p,stakeholders:{...p.stakeholders,[groupKey]:[...p.stakeholders[groupKey],person]}}));
    setNf({firstName:"",lastName:"",title:"",responsibilities:"",email:"",cell:""});
  };

  const removePerson=(groupKey,personId)=>{
    u(p=>({...p,stakeholders:{...p.stakeholders,[groupKey]:p.stakeholders[groupKey].filter(x=>x.id!==personId)}}));
  };

  const addSystem=()=>{
    if(!nsf.systemName)return;
    const sys={...nsf,id:Date.now()};
    u(p=>({...p,stakeholders:{...p.stakeholders,keySystems:[...p.stakeholders.keySystems,sys]}}));
    setNsf({systemName:"",category:"",owner:"",ownerEmail:"",ownerCell:"",criticality:"High",notes:""});
    setEditSys(null);
  };

  const removeSystem=(sysId)=>{
    u(p=>({...p,stakeholders:{...p.stakeholders,keySystems:p.stakeholders.keySystems.filter(x=>x.id!==sysId)}}));
  };

  const totalContacts=GROUPS.reduce((sum,g)=>(sk[g.key]||[]).length+sum,0);
  const totalSystems=(sk.keySystems||[]).length;

  const exportStakeholders=()=>{
    let txt=`DARK ROCK LABS SENTRY\nSTAKEHOLDER DIRECTORY\n${"═".repeat(60)}\n\nOrganization: ${st.org?.name||"[Organization]"}\nGenerated: ${new Date().toLocaleString()}\nClassification: CONFIDENTIAL\n\n`;
    GROUPS.forEach(g=>{
      const people=sk[g.key]||[];
      if(people.length>0){
        txt+=`${"─".repeat(60)}\n${g.label.toUpperCase()}\n${g.desc}\n${"─".repeat(60)}\n`;
        people.forEach((p,i)=>{
          txt+=`\n  ${i+1}. ${p.firstName} ${p.lastName}\n     Title: ${p.title||"N/A"}\n     Responsibilities: ${p.responsibilities||"N/A"}\n     Email: ${p.email||"N/A"}\n     Cell: ${p.cell||"N/A"}\n`;
        });
        txt+="\n";
      }
    });
    if((sk.keySystems||[]).length>0){
      txt+=`${"─".repeat(60)}\nKEY SYSTEMS CONTACTS\n${"─".repeat(60)}\n`;
      sk.keySystems.forEach((s,i)=>{
        txt+=`\n  ${i+1}. ${s.systemName} [${s.category}] - ${s.criticality}\n     Owner: ${s.owner||"N/A"}\n     Email: ${s.ownerEmail||"N/A"}\n     Cell: ${s.ownerCell||"N/A"}\n     Notes: ${s.notes||"N/A"}\n`;
      });
    }
    txt+=`\n${"═".repeat(60)}\nConfidential - Dark Rock Labs Sentry v${V}\n`;
    const blob=new Blob([txt],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Sentry_Stakeholder_Directory_${(st.org?.name||"org").replace(/\s/g,"_")}.txt`;a.click();
  };

  return <div>
    <Sc sub="Incident response stakeholder directory with contact details and system owners">Stakeholders</Sc>

    {/* Summary Bar */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{display:"flex",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><Bd color={C.tl}>{totalContacts} Contacts</Bd><Bd color={C.b}>{totalSystems} Systems</Bd></div>
      </div>
      <Bt v="outline" sz="sm" onClick={exportStakeholders}>Export Directory</Bt>
    </div>

    {/* Dark Rock Default Card */}
    <Cd s={{marginBottom:16,background:`linear-gradient(135deg,${C.tl}08,${C.pn})`,borderColor:C.tl+"33"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:40,height:40,borderRadius:8,background:C.tl+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🛡️</div>
        <div style={{flex:1}}>
          <div style={{color:C.tl,fontWeight:700,fontSize:13}}>Dark Rock Cybersecurity - Pre-Approved IR Partner</div>
          <div style={{color:C.tM,fontSize:11,marginTop:2}}>Forensics, incident response, containment, and recovery support</div>
          <div style={{display:"flex",gap:16,marginTop:6,flexWrap:"wrap"}}>
            <span style={{color:C.tx,fontSize:11}}>📧 ir@darkrockcyber.com</span>
            <span style={{color:C.tx,fontSize:11}}>🌐 darkrockcyber.com</span>
            <span style={{color:C.tx,fontSize:11}}>📞 On retainer</span>
          </div>
        </div>
      </div>
    </Cd>

    {/* Stakeholder Groups */}
    {GROUPS.map(g=>{
      const people=sk[g.key]||[];
      const isEditing=editGroup===g.key;
      return <Cd key={g.key} s={{marginBottom:12,borderLeft:`3px solid ${g.color}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:people.length>0||isEditing?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{g.icon}</span>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <h3 style={{color:C.w,margin:0,fontSize:13}}>{g.label}</h3>
                <Bd color={people.length>0?C.g:C.tD2}>{people.length}</Bd>
              </div>
              <p style={{color:C.tM,fontSize:10,margin:"3px 0 0",lineHeight:1.4,maxWidth:500}}>{g.desc}</p>
            </div>
          </div>
          <Bt v={isEditing?"secondary":"outline"} sz="sm" onClick={()=>setEditGroup(isEditing?null:g.key)}>
            {isEditing?"Close":"+ Add"}
          </Bt>
        </div>

        {/* Contact List */}
        {people.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderTop:`1px solid ${C.pB}`}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              <span style={{color:C.w,fontSize:12,fontWeight:700}}>{p.firstName} {p.lastName}</span>
              {p.title&&<Bd color={g.color}>{p.title}</Bd>}
            </div>
            {p.responsibilities&&<div style={{color:C.tM,fontSize:10,marginBottom:4,lineHeight:1.4}}>
              <span style={{color:C.tD2,fontWeight:600}}>Responsibilities:</span> {p.responsibilities}</div>}
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {p.email&&<span style={{color:C.tx,fontSize:10}}>📧 {p.email}</span>}
              {p.cell&&<span style={{color:C.tx,fontSize:10}}>📱 {p.cell}</span>}
            </div>
          </div>
          <Bt v="ghost" sz="sm" onClick={()=>removePerson(g.key,p.id)} s={{color:C.r,flexShrink:0}}>✕</Bt>
        </div>)}

        {/* Add Form */}
        {isEditing&&<div style={{background:C.oM,borderRadius:7,padding:14,marginTop:8,borderTop:`1px solid ${C.pB}`}}>
          <div style={{fontSize:10,color:C.tl,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Add {g.label} Contact</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Ip label="First Name *" value={nf.firstName} onChange={v=>setNf(p=>({...p,firstName:v}))} placeholder="Jane"/>
            <Ip label="Last Name *" value={nf.lastName} onChange={v=>setNf(p=>({...p,lastName:v}))} placeholder="Doe"/>
            <Ip label="Title" value={nf.title} onChange={v=>setNf(p=>({...p,title:v}))} placeholder="VP of Security"/>
            <Ip label="Email" value={nf.email} onChange={v=>setNf(p=>({...p,email:v}))} placeholder="jane.doe@org.com"/>
            <Ip label="Personal Cell Phone" value={nf.cell} onChange={v=>setNf(p=>({...p,cell:v}))} placeholder="(555) 123-4567"/>
          </div>
          <Ip label="Responsibilities" value={nf.responsibilities} onChange={v=>setNf(p=>({...p,responsibilities:v}))} ta rows={2} placeholder="Primary responsibilities during an incident..."/>
          <div style={{display:"flex",gap:6}}>
            <Bt onClick={()=>addPerson(g.key)} disabled={!nf.firstName||!nf.lastName}>Add Contact</Bt>
            <Bt v="secondary" onClick={()=>{setEditGroup(null);setNf({firstName:"",lastName:"",title:"",responsibilities:"",email:"",cell:""})}}>Cancel</Bt>
          </div>
        </div>}
      </Cd>;
    })}

    {/* Key Systems Section */}
    <div style={{marginTop:24}}>
      <Sc sub="Critical systems and their owners for rapid incident coordination">Key Systems Contacts</Sc>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <Bt onClick={()=>setEditSys(editSys?"":"new")}>{editSys?"Cancel":"+ Add System"}</Bt>
      </div>

      {editSys&&<Cd s={{marginBottom:14,borderColor:C.b+"44"}}>
        <div style={{fontSize:10,color:C.b,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Add Key System</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Ip label="System Name *" value={nsf.systemName} onChange={v=>setNsf(p=>({...p,systemName:v}))} placeholder="SAP ERP, Workday, AWS Production"/>
          <Sl label="Category *" value={nsf.category} onChange={v=>setNsf(p=>({...p,category:v}))} options={SYS_CATEGORIES}/>
          <Sl label="Criticality" value={nsf.criticality} onChange={v=>setNsf(p=>({...p,criticality:v}))} options={["Critical","High","Medium","Low"]}/>
          <Ip label="System Owner Name" value={nsf.owner} onChange={v=>setNsf(p=>({...p,owner:v}))} placeholder="John Smith"/>
          <Ip label="Owner Email" value={nsf.ownerEmail} onChange={v=>setNsf(p=>({...p,ownerEmail:v}))} placeholder="john.smith@org.com"/>
          <Ip label="Owner Cell Phone" value={nsf.ownerCell} onChange={v=>setNsf(p=>({...p,ownerCell:v}))} placeholder="(555) 987-6543"/>
        </div>
        <Ip label="Notes" value={nsf.notes} onChange={v=>setNsf(p=>({...p,notes:v}))} ta rows={2} placeholder="Recovery priorities, dependencies, vendor contacts..."/>
        <Bt onClick={addSystem} disabled={!nsf.systemName||!nsf.category}>Add System</Bt>
      </Cd>}

      {(sk.keySystems||[]).length===0?<Cd s={{textAlign:"center"}}><p style={{color:C.tD2,fontSize:11}}>No key systems added. Add critical systems for rapid incident coordination.</p></Cd>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {(sk.keySystems||[]).map(sys=>{
          const critColor=sys.criticality==="Critical"?C.r:sys.criticality==="High"?C.o:sys.criticality==="Medium"?C.y:C.g;
          return <Cd key={sys.id} s={{borderLeft:`3px solid ${critColor}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{color:C.w,fontSize:13,fontWeight:700,marginBottom:3}}>{sys.systemName}</div>
                <div style={{display:"flex",gap:4}}><Bd color={C.b}>{sys.category}</Bd><Bd color={critColor}>{sys.criticality}</Bd></div>
              </div>
              <Bt v="ghost" sz="sm" onClick={()=>removeSystem(sys.id)} s={{color:C.r}}>✕</Bt>
            </div>
            {sys.owner&&<div style={{marginTop:8,borderTop:`1px solid ${C.pB}`,paddingTop:6}}>
              <div style={{color:C.tx,fontSize:11,fontWeight:600}}>{sys.owner}</div>
              <div style={{display:"flex",gap:12,marginTop:3,flexWrap:"wrap"}}>
                {sys.ownerEmail&&<span style={{color:C.tM,fontSize:10}}>📧 {sys.ownerEmail}</span>}
                {sys.ownerCell&&<span style={{color:C.tM,fontSize:10}}>📱 {sys.ownerCell}</span>}
              </div>
            </div>}
            {sys.notes&&<p style={{color:C.tD2,fontSize:10,margin:"6px 0 0",lineHeight:1.4}}>{sys.notes}</p>}
          </Cd>;
        })}
      </div>}
    </div>
  </div>;
};

// ─── POLICIES (BIG 4 QUALITY) ────────────────────────────────────────
const Policies=()=>{
  const [sel,setSel]=useState(null);const [gen,setGen]=useState({});
  const O=st.org?.name||"[Organization Name]";const D=new Date().toISOString().split("T")[0];
  const NR=new Date(Date.now()+365*24*3600*1000).toISOString().split("T")[0];
  const T=st.tech||{};const CF=(st.comp||[]).join(", ")||"As determined by organizational requirements";
  const tk=(k)=>T[k]||"[To be configured]";
  const ln="━".repeat(64);const ln2="─".repeat(64);
  const hdr=(id,title)=>`${ln}\n${O.toUpperCase()}\n${title.toUpperCase()}\n${ln}\n\nDocument ID:        POL-${id.toUpperCase()}-001\nVersion:            1.0\nEffective Date:     ${D}\nDocument Owner:     Chief Information Security Officer (CISO)\nApproved By:        [Executive Leadership / Board of Directors]\nClassification:     CONFIDENTIAL\nReview Cycle:       Annual (or upon significant change to environment)\nNext Review:        ${NR}\n\n${ln}\nDOCUMENT REVISION HISTORY\n${ln}\n\nVersion  | Date       | Author               | Description\n---------|------------|-----------------------|----------------------------------\n1.0      | ${D} | [Author Name]         | Initial policy release\n         |            |                       |\n         |            |                       |\n\n${ln}\nSTAKEHOLDER REVIEW & APPROVAL\n${ln}\n\nRole                     | Name             | Signature        | Date\n-------------------------|------------------|------------------|----------\nCISO                     |                  |                  |\nCEO / COO                |                  |                  |\nGeneral Counsel          |                  |                  |\nCompliance Officer       |                  |                  |\nVP of Technology         |                  |                  |\nHR Director              |                  |                  |\n\n`;
  const ftr=`\n${ln}\nSTATEMENT OF MANAGEMENT COMMITMENT\n${ln}\n\n${O} holds information security of paramount importance and is committed to\nsecuring customer, employee, and organizational data. Leadership has issued this\npolicy to ensure all regulatory and best practice requirements are followed to\nprotect all sensitive information. Failure to abide by the security controls\noutlined within this policy may result in disciplinary action including, but not\nlimited to, termination of employment, civil or criminal charges.\n\n${ln}\nEND OF DOCUMENT\nConfidential | ${O} | Dark Rock Labs Sentry v${V}\n${ln}`;

  const templates=[
    {id:"irp",n:"Incident Response Policy",i:"🚨",d:"NIST 800-61 aligned IRP with full lifecycle, severity matrix, roles, EOC procedures, and reporting requirements"},
    {id:"isp",n:"Information Security Policy",i:"🔐",d:"Comprehensive ISP: governance structure, risk management, access control, data protection, and compliance"},
    {id:"bcp",n:"Business Continuity & Disaster Recovery",i:"🏗️",d:"BIA methodology, RTO/RPO targets, continuity strategies, recovery procedures, and testing requirements"},
    {id:"acl",n:"Access Control & Termination Policy",i:"🔓",d:"Least privilege, RBAC, MFA, account lifecycle, privileged access, and offboarding procedures"},
    {id:"dcl",n:"Data Classification & Governance",i:"📊",d:"Four-tier classification schema with handling, retention, and secure disposal procedures"},
    {id:"brn",n:"Breach Notification Policy",i:"📣",d:"Breach definitions, risk assessment, notification timelines (HIPAA/GDPR/state), and templates"},
    {id:"rsk",n:"Risk Assessment & Treatment Policy",i:"⚖️",d:"Enterprise risk framework, assessment methodology, risk register, and treatment plans"},
    {id:"pat",n:"Patch Management Policy",i:"🩹",d:"Vulnerability classification, remediation SLAs, testing, deployment, and exception handling"},
  ];

  const genPolicy=(id)=>{
    const P={
irp:hdr(id,"Incident Response Policy")+`
${ln}
1. PURPOSE
${ln}

This Information Security Incident Response Policy establishes a formal incident
management framework requiring all security incidents to be tracked, documented,
and resolved in a complete, accurate, and timely manner. This policy implicitly
acknowledges malicious actions from thinking human adversaries and proposes a
structured methodology for detection, response, and recovery.

This policy is structured and informed by:
  - NIST SP 800-61 Rev. 2 (Computer Security Incident Handling Guide)
  - NIST Cybersecurity Framework (CSF) 2.0
  - SANS Incident Handling Process
  - Industry best practices and threat intelligence

This document shall be reviewed annually and updated to reflect changes in the
threat landscape, regulatory environment, and organizational infrastructure.

${ln}
2. SCOPE
${ln}

This policy applies to all users of information systems within ${O}, including
but not limited to: employees, contractors, business associates, vendors,
partners, and interns who handle organizational information or use organizational
information assets.

This policy applies to all information systems, applications, networks, and data
repositories owned, operated, or managed by ${O}, including cloud-hosted services,
third-party managed systems, and hybrid environments.

${ln}
3. DEFINITIONS
${ln}

  Information Security Vulnerability: A weakness in an information system,
  security procedures, internal controls, or implementation that could be
  exploited to gain unauthorized access or disrupt critical processing.

  Information Security Incident: A suspected, attempted, successful, or imminent
  threat of unauthorized access, use, disclosure, breach, modification, or
  destruction of information; interference with IT operations; or significant
  violation of security policy.

  Data Breach: An incident resulting in confirmed unauthorized access to or
  disclosure of protected data including PII, PHI, FCI, or CUI.

  Indicator of Compromise (IOC): An artifact observed on a network or system
  that indicates with high confidence a computer intrusion has occurred.

  Adversary Tradecraft: The tactics, techniques, and procedures (TTPs) employed
  by threat actors, as cataloged by the MITRE ATT&CK framework.

${ln}
4. ORGANIZATIONAL PRIORITIES
${ln}

The following priorities guide all incident response decisions and resource
allocation, ordered from highest to lowest:

  Priority 1: Protect human life and safety
  Priority 2: Protect critical business operations, highly sensitive data,
               CUI, PII, and mission-critical systems
  Priority 3: Protect other business operations, sensitive data, and networks
  Priority 4: Restore functionality and return to a secure operating environment
  Priority 5: Preserve evidence in a forensically viable manner

${ln}
5. ROLES AND RESPONSIBILITIES
${ln}

5.1 IRT Leadership

  Incident Owner: Has authority to make strategic decisions during an incident,
  including whether to isolate systems, disconnect infrastructure, or engage
  external resources. The default Incident Owner is the ISSO unless otherwise
  designated. The Incident Owner communicates with Executive Leadership and
  applicable stakeholders. Ownership may transfer based on incident scope.

  Incident Manager: Executes the operational details of the incident response.
  Responsible for Emergency Operations Center (EOC) standup, setting response
  and recovery priorities, controlling information and communications flow,
  and directing IRT members. If legal privilege is invoked, legal counsel
  becomes joint Incident Manager.

5.2 Core Incident Response Team

  The Core IRT is composed of personnel at the forefront of every response:
  - Information System Owner (ISO)
  - Information System Architect (ISA)
  - Information System Security Officer (ISSO)
  - Compliance Officer (CO)
  - Legal Representative
  - External Communications Representative
  - Affected Business Unit / Market Representative

5.3 Extended Incident Response Team

  Personnel engaged on an as-needed basis based on incident specifics:
  - Chief Information Security Officer (CISO)
  - Chief Product Security Officer / Chief Privacy Officer
  - Internal Communications and Marketing
  - System and Application Owners
  - Law Enforcement Liaison
  - Procurement and Contracting
  - Human Resources and Finance Representatives

5.4 External Incident Response Team

  Organizations external to ${O} providing specialized support:
  - Dark Rock Cybersecurity (Forensics & IR Support)
  - Cybersecurity Insurance Provider and Breach Coach
  - External Legal Counsel (Breach-specialized)
  - External Public Relations / Crisis Communications

${ln}
6. INCIDENT CLASSIFICATION
${ln}

6.1 Impact Assessment

  Determine impact across four dimensions:
  - Availability: Has or could information become unavailable when needed?
  - Confidentiality: Has or could information be accessed by unauthorized parties?
  - Integrity: Has or could data be altered? Is information trustworthy?
  - Credential Harvesting: Activities such as credential dumping, privilege
    escalation, admin account creation, or lateral movement should be treated
    as highest criticality regardless of systems involved.

6.2 Data Criticality Classification

  PII (Personal Identifiable Information): Any information attributable to an
  individual including name, address, SSN, financial accounts, or any combination
  thereof enabling identification.

  FCI (Federal Contract Information): Information not intended for public release,
  provided by or generated for the Government under contract.

  CUI (Controlled Unclassified Information): Unclassified information within the
  U.S. Federal government requiring safeguarding per NARA standards.

6.3 Severity Levels

  Low: No significant impact expected. Potential availability impact only.
  Action: Case may be closed at IRT Incident Manager discretion.

  Medium: Potential but unconfirmed loss of confidentiality or data integrity.
  Action: Declare incident. Notify legal counsel and cyber insurance carrier.

  High: Confirmed loss of confidentiality, data integrity, or significant
  availability issue. Action: Full IRT activation. All lifecycle phases required.

  Critical: Threat to operation, safety, or reputation with element of surprise
  requiring rapid decision-making. Action: Full IRT plus executive engagement.

${ln}
7. INCIDENT RESPONSE LIFECYCLE
${ln}

${O} follows a nine-step incident response lifecycle:

  Phase 1 - Preparation
    Develop, document, review, and test security and IR procedures. Maintain
    environment topologies, asset inventories, and contact lists. Conduct
    tabletop exercises at least annually with all Core IRT members. Coordinate
    with IT on planned infrastructure changes.

  Phase 2 - Identification
    Detect, assess, verify, and classify incidents. Monitor alert sources
    including ${tk("siem")} SIEM, ${tk("endpoint")} EDR, ${tk("firewall")}
    firewalls, ${tk("identity")} identity monitoring, and external threat feeds.
    Create incident case with detection details.

  Phase 3 - Notification
    Notify stakeholders per severity-driven escalation matrix. Coordinate
    with Legal before additional notifications (Medium+). Notify cyber
    insurance carrier. For CUI incidents, report to DIBNet within 72 hours
    per DFARS 252.204-7012. Establish Virtual EOC.

  Phase 4 - Initial Containment
    Immediate tactical actions: isolate hosts, disable malicious processes
    and accounts, establish blocking firewall rules, update IDS signatures
    and ${tk("endpoint")} EDR definitions, isolate LAN segments.

  Phase 5 - Analysis
    Build attack timeline and map to MITRE ATT&CK. Conduct 30-day account
    access lookback. Enterprise-wide IOC sweep via ${tk("endpoint")}. Capture
    memory and disk forensic images. Preserve logs, NetFlow, PCAPs.

  Phase 6 - Containment
    Comprehensive containment based on analysis: disconnect from internet if
    credential harvesting confirmed, block C2 infrastructure, reset ALL
    affected credentials, enterprise-wide artifact sweep.

  Phase 7 - Eradication
    Remove adversary and malware completely. Full privileged access and
    identity management audit. Resolve root cause.

  Phase 8 - Recovery
    Restore operations from validated clean restore points. Prioritize by
    business criticality. Validate data integrity across all systems.

  Phase 9 - Follow-Up
    Post-mortem for all Medium+ incidents. Identify control failures. Update
    policies and procedures. Document corrective actions.

${ln}
8. EMERGENCY OPERATIONS CENTER (EOC)
${ln}

8.1 Battle Rhythm
  First 72 Hours: Updates at 8:30 AM, 12:00 PM, 4:30 PM (local time)
  After 72 Hours: Daily at 4:30 PM plus ad hoc meetings as required
  Attendance: Core IRT required; Extended as situation warrants

8.2 Information Flow
  The EOC controls all information ingress and egress. Requests from
  stakeholders, extended IRT, and executive leadership flow through the EOC.
  Daily updates are coordinated with Legal to maintain privilege.

8.3 Communications Security
  If the adversary has compromised identity infrastructure (${tk("identity")}),
  do NOT assume any authentication-dependent system remains secure. Establish
  out-of-band communications immediately (Signal, satellite phone, or
  in-person). If legal privilege applies, mark all correspondence
  "Privileged and Confidential" in the subject line.

${ln}
9. REPORTING REQUIREMENTS
${ln}

  DFARS 252.204-7012: Report CUI incidents to DIBNet within 72 hours.
    Portal: https://dibnet.dod.mil
    DIB Hotline: 410.981.0104 | Toll Free: 877.838.2174
    DC3 Contact: DC3.DCISE@us.af.mil

  HIPAA (if applicable): Notify HHS within 60 days for breaches affecting
  500+ individuals. Individual notification without unreasonable delay.

  State Breach Laws: Comply with applicable state notification requirements.
  Many states require notification within 30-60 days of discovery.

  Evidence Preservation: Maintain all affected system images and monitoring
  data for minimum 90 days from incident report submission.

${ln}
10. APPLICABLE FRAMEWORKS
${ln}

  This policy is aligned to: ${CF}

${ln}
11. POLICY COMPLIANCE AND ENFORCEMENT
${ln}

  All ${O} personnel are required to comply with this policy. Violations
  may result in disciplinary action up to and including termination of
  employment, civil or criminal prosecution. Exceptions to this policy
  require written approval from the CISO and must be documented in the
  risk register with compensating controls identified.

  This policy shall be reviewed at least annually by the CISO, or upon
  significant changes to the threat environment, regulatory landscape,
  or organizational structure.
${ftr}`,

isp:hdr(id,"Information Security Policy")+`
${ln}
1. PURPOSE AND SCOPE
${ln}

1.1 Purpose

This Information Security Policy establishes the framework for protecting
information assets at ${O}. It defines security roles, responsibilities, and
minimum security controls required across all organizational systems,
applications, infrastructure, and data stores. This policy is the overarching
governance document from which all subordinate security policies derive authority.

1.2 Scope

This policy applies to all ${O} employees, contractors, consultants, vendors,
and third parties with access to organizational systems, applications,
infrastructure, or data. All personnel are required to read, acknowledge, and
comply with this policy. Violations may result in disciplinary action.

${ln}
2. SECURITY GOVERNANCE
${ln}

2.1 Security Organization

${O} maintains an organizational structure with clear lines of authority and
accountability for information security. A Risk Committee consisting of internal
personnel and at least one independent member provides oversight of internal
security controls and meets at least quarterly with formal minutes maintained.

Responsibilities of the Risk Committee include:
  - Approving and monitoring adherence to all security policies
  - Ensuring data handling responsibilities are assigned and communicated
  - Overseeing the annual enterprise risk assessment
  - Reviewing and approving risk treatment decisions

2.2 Security Roles

  CISO: Overall security program leadership, policy approval, risk oversight,
  and security budget management. Reports to executive leadership.

  Systems Administrators: Implement baseline configuration standards for all
  in-scope system components. Manage user access to ${O} information systems
  containing Confidential and Restricted data.

  End Users (Employees, Consultants): Adhere to data protection policies,
  procedures, and practices. Report instances of non-compliance to the
  security team immediately.

  Vendors and Third Parties: Comply with all applicable user requirements.
  Avoid any measure that alters standards protecting customer data. Complete
  due diligence assessments per the Vendor Management Policy. Immediately
  notify ${O} of any policy violations involving organizational data.

2.3 Policy Review

The CISO is responsible for reviewing all security policies at least annually
to ensure they remain accurate and reflect current threats, regulatory
requirements, and organizational changes.

${ln}
3. RISK MANAGEMENT
${ln}

${O} conducts enterprise-level risk assessments annually or upon significant
changes to the environment. The assessment evaluates threats to and
vulnerabilities of organizational assets considering security, availability,
integrity, and confidentiality requirements.

Risk assessment scope includes:
  - Internal controls: policies, procedures, business processes, technical
    safeguards, and administrative controls
  - Human resource practices: hiring, termination, and discipline procedures
  - Physical and facility controls
  - Systems and applications processing confidential data
  - Third-party and supply chain risk exposure

A risk register documenting identified risks with mitigation strategies,
risk owners, and treatment timelines is maintained by executive management.
High and Critical risks are reviewed quarterly by the Risk Committee.

${ln}
4. ACCESS CONTROL
${ln}

4.1 Principle of Least Privilege

Access is provisioned via a deny-all methodology. Users gain access only upon
receiving formal, independent approval based on documented business need.
Administrative access to production servers and databases is restricted to
personnel with validated job function requirements.

Current identity platform: ${tk("identity")}

4.2 Multi-Factor Authentication

MFA is required for:
  - All privileged and administrative access
  - All remote access to organizational systems
  - Access to systems processing Confidential or Restricted data
  - Cloud management consoles and SaaS administration

Current MFA solution: ${tk("mfa")}

4.3 Password Requirements

  - Minimum 14 characters, complex (upper, lower, number, special)
  - Unique per system (no password reuse)
  - Stored only in organization-approved password managers
  - Changed immediately upon suspicion of compromise
  - Shared accounts used only with documented business justification

4.4 Account Lifecycle

Accounts are provisioned through formal request and approval workflows.
Access reviews are conducted quarterly for privileged accounts and semi-
annually for standard accounts. Accounts are disabled immediately upon
termination and within 24 hours of role change.

${ln}
5. DATA PROTECTION
${ln}

5.1 Classification Levels

  Public: No confidentiality requirements. Available without restriction.
  Internal: Available to employees and authorized non-employees with
    business need-to-know.
  Confidential: Sensitive within ${O}. Restricted distribution with
    encryption required for external transmission.
  Restricted: Highest sensitivity. Strict access controls, encryption at
    rest and in transit, and audit logging required.

5.2 Encryption Standards

  Data at Rest: AES-256 or equivalent for Confidential and Restricted data
  Data in Transit: TLS 1.2+ for all external communications
  Key Management: Keys stored separately from encrypted data with defined
    rotation schedules

${ln}
6. NETWORK SECURITY
${ln}

Networks are segmented using ${tk("firewall")} firewalls between trusted and
untrusted zones. All traffic and protocols are explicitly blocked except those
required for documented business operations. Firewall rules are reviewed at
least annually by IT management.

${tk("siem")!=="None"?`Security monitoring is provided via ${tk("siem")} SIEM with`:"Security monitoring shall be implemented with"} correlation rules for:
  - Unauthorized access attempts
  - Lateral movement indicators
  - Data exfiltration patterns
  - Anomalous authentication events

${ln}
7. ENDPOINT SECURITY
${ln}

All endpoints must run ${tk("endpoint")} endpoint protection with current
definitions. Systems must meet baseline hardening standards aligned to
CIS Benchmarks. Patch management follows defined SLAs:
  Critical: 72 hours | High: 7 days | Medium: 30 days | Low: 90 days

${ln}
8. INCIDENT MANAGEMENT
${ln}

Reference: ${O} Incident Response Policy (POL-IRP-001)
All suspected security incidents must be reported immediately to the
security team. The Incident Response Plan governs all phases of detection,
containment, eradication, recovery, and follow-up activities.

${ln}
9. COMPLIANCE
${ln}

Applicable frameworks and regulations: ${CF}

${O} maintains compliance documentation, conducts regular assessments, and
engages external auditors as required by applicable frameworks.

${ln}
10. ENFORCEMENT
${ln}

Violations may result in disciplinary action up to and including termination
of employment. Every user and vendor is responsible for identifying and
mitigating risks associated with the protection of confidential information.
Exceptions require documented risk acceptance approved by the CISO.
${ftr}`,

bcp:hdr(id,"Business Continuity & Disaster Recovery Policy")+`
${ln}
1. PURPOSE
${ln}

This policy establishes requirements for maintaining critical business
operations during and after disruptive events, and defines the technical
recovery procedures for IT infrastructure and data at ${O}.

${ln}
2. SCOPE
${ln}

All critical business functions, supporting IT infrastructure, third-party
dependencies, and data repositories owned or managed by ${O}.

${ln}
3. BUSINESS IMPACT ANALYSIS (BIA)
${ln}

${O} conducts a Business Impact Analysis at least annually to:
  - Identify and prioritize critical business processes
  - Determine Recovery Time Objectives (RTO) for each critical process
  - Determine Recovery Point Objectives (RPO) for data systems
  - Establish Maximum Tolerable Downtime (MTD) thresholds
  - Identify dependencies between systems and processes
  - Quantify financial and operational impact of disruptions

System Tier Classification:
  Tier 1 (Mission Critical): RTO 4 hours, RPO 1 hour
  Tier 2 (Business Critical): RTO 24 hours, RPO 4 hours
  Tier 3 (Business Operational): RTO 72 hours, RPO 24 hours
  Tier 4 (Administrative): RTO 1 week, RPO 48 hours

${ln}
4. CONTINUITY STRATEGIES
${ln}

4.1 Data Backup and Replication
  Primary backup solution: ${tk("backup")}
  Cloud platform: ${tk("cloud")}
  Backups are encrypted, tested quarterly, and stored in geographically
  separate locations from production data.

4.2 Recovery Procedures
  - Determine safest restore point from forensic evidence
  - Restore by system tier priority
  - Validate data integrity before returning to production
  - Compare timestamps across systems (threat actors manipulate timestamps)
  - Confirm restore point predates earliest known compromise

4.3 Communication Plans
  - Emergency notification via out-of-band channels
  - Stakeholder communication templates maintained and tested
  - Customer/partner communication coordinated through PR

4.4 Personnel Succession
  - Critical roles have documented backup personnel
  - Cross-training requirements for Tier 1 system administrators
  - Emergency contact information maintained offline

${ln}
5. TESTING AND MAINTENANCE
${ln}

  - Annual full DR exercise with documented results
  - Quarterly backup restoration tests (minimum one Tier 1 system)
  - Tabletop exercises for business continuity scenarios
  - Plan updates within 30 days of any significant infrastructure change
  - Lessons learned integrated into plan updates
${ftr}`,

acl:hdr(id,"Access Control & Termination Policy")+`
${ln}
1. PURPOSE AND SCOPE
${ln}

This policy defines requirements for granting, managing, reviewing, and
revoking access to ${O} data, systems, facilities, and networks. It applies
to all organizational assets and approved devices utilized by personnel
acting on behalf of ${O}.

Identity platform: ${tk("identity")}
MFA solution: ${tk("mfa")}

${ln}
2. ACCESS CONTROL REQUIREMENTS
${ln}

2.1 Principle of Least Privilege
${O} adheres to the principle of least privilege. Users are granted minimum
access based on role-based schemes with documented business justification.
Systems use deny-all methodology; access is granted only upon formal approval.

2.2 Unique Accounts
All users receive unique credentials traceable to the individual. Shared
accounts require documented business justification, CISO approval, and
passwords stored exclusively in the organization-approved password manager.

2.3 Authentication Requirements
  - Minimum 14-character complex passwords
  - MFA required for: privileged access, remote access, cloud consoles,
    systems processing Confidential/Restricted data
  - Account lockout after 5 failed attempts (30-minute lockout)
  - Session timeout after 15 minutes of inactivity for sensitive systems

2.4 Privileged Access Management
  - Administrative accounts are separate from standard user accounts
  - Privileged access requires approval from system owner and security team
  - Privileged sessions are logged and monitored
  - Standing privileges are minimized; just-in-time access is preferred

${ln}
3. ACCESS LIFECYCLE
${ln}

3.1 Provisioning: Formal request, manager approval, security review
3.2 Quarterly Review: All privileged accounts reviewed for continued need
3.3 Semi-Annual Review: All standard accounts reviewed
3.4 Role Change: Access modified within 24 hours of role change notification
3.5 Termination: Access disabled immediately upon separation notification.
    All organizational devices collected. Remote wipe initiated for mobile
    devices. Shared credentials rotated. VPN and remote access revoked.
    Badge/physical access deactivated.

${ln}
4. REMOTE ACCESS
${ln}

Remote access requires: approved VPN, MFA authentication, compliant device
with current endpoint protection (${tk("endpoint")}), and encrypted connection.
Split tunneling is prohibited for organizational VPN connections.

${ln}
5. THIRD-PARTY ACCESS
${ln}

Third-party access requires: vendor risk assessment, contractual security
requirements, designated sponsor, defined access scope and duration,
monitoring and logging, and timely deprovisioning upon engagement completion.
${ftr}`,

dcl:hdr(id,"Data Classification & Governance Policy")+`
${ln}
1. PURPOSE
${ln}

This policy establishes the framework for classifying, handling, storing,
transmitting, retaining, and disposing of information assets at ${O} based
on their sensitivity and business value.

${ln}
2. CLASSIFICATION LEVELS
${ln}

  PUBLIC: Information approved for public release. No confidentiality
  requirements. Available without restriction.
  Examples: Marketing materials, public website content, press releases.

  INTERNAL: Information for internal use by employees and authorized
  non-employees. Not intended for public disclosure but would cause
  minimal harm if disclosed.
  Examples: Internal memos, org charts, non-sensitive project documentation.

  CONFIDENTIAL: Sensitive business information whose unauthorized disclosure
  could cause significant harm to ${O} or its stakeholders.
  Examples: Financial records, customer data, strategic plans, contracts,
  employee records, intellectual property.

  RESTRICTED: Highest sensitivity. Unauthorized disclosure could cause
  severe harm including regulatory penalties, significant financial loss,
  or harm to individuals.
  Examples: PII, PHI, CUI, FCI, authentication credentials, encryption
  keys, security configurations, incident response data.

${ln}
3. HANDLING REQUIREMENTS
${ln}

                  | Public   | Internal  | Confidential | Restricted
  ----------------|----------|-----------|--------------|------------
  Labeling        | Optional | Required  | Required     | Required
  Encryption Rest | No       | No        | Required     | Required
  Encryption Trans| No       | TLS       | TLS 1.2+     | TLS 1.2+
  Access Control  | None     | Role-based| Need-to-know | Need-to-know+MFA
  Sharing External| Allowed  | NDA req.  | Approval req.| CISO approval
  Storage         | Any      | Approved  | Encrypted    | Encrypted+audited
  Printing        | Allowed  | Allowed   | Controlled   | Prohibited
  Disposal        | Standard | Shred     | Cross-cut    | Certified dest.

${ln}
4. DATA OWNERSHIP AND INVENTORY
${ln}

All information assets shall have designated owners responsible for:
  - Assigning appropriate classification
  - Approving access to the data
  - Ensuring handling requirements are followed
  - Reviewing classification annually

An asset inventory shall be maintained with classification, owner, location,
and retention requirements for all information assets.

${ln}
5. RETENTION AND DISPOSAL
${ln}

Data is retained per regulatory requirements and business need. When no
longer required, data is disposed of using methods appropriate to its
classification. Disposal of Confidential and Restricted data requires
documented certification of destruction.

DLP platform: ${tk("dlp")!=="None"?tk("dlp"):"[To be implemented]"}
${ftr}`,

brn:hdr(id,"Breach Notification Policy")+`
${ln}
1. PURPOSE
${ln}

This policy establishes procedures for identifying, assessing, and
responding to data breaches at ${O}, including notification to affected
individuals, regulatory authorities, and business partners within
legally mandated timeframes.

${ln}
2. BREACH DEFINITION
${ln}

A breach is the acquisition, access, use, or disclosure of protected
information in a manner not permitted that compromises the security or
privacy of the information.

Exclusions (must meet all criteria):
  - Unintentional acquisition by authorized employee in good faith within
    scope of duties, with no further unauthorized use or disclosure
  - Inadvertent disclosure between authorized persons at ${O} with no
    further unauthorized disclosure
  - Good faith belief that the unauthorized recipient could not reasonably
    retain the information

An incident is presumed to be a breach unless ${O} demonstrates low
probability of compromise based on risk assessment of:
  - Nature and extent of information involved
  - Unauthorized person involved
  - Whether information was actually acquired or viewed
  - Extent to which risk has been mitigated

${ln}
3. NOTIFICATION TIMELINES
${ln}

  HIPAA (if applicable):
    - Supervisory Authority: 72 hours from discovery (Article 33)
    - Affected Individuals: Without unreasonable delay, no later than
      60 calendar days from discovery
    - HHS: Within 60 days for breaches affecting 500+ individuals;
      annually for breaches affecting fewer than 500

  GDPR (if applicable):
    - Supervisory Authority: 72 hours from awareness
    - Data Subjects: Without undue delay if high risk to rights/freedoms

  State Laws:
    - Comply with all applicable state breach notification statutes
    - Most states require notification within 30-60 days

  DFARS 252.204-7012:
    - Report CUI incidents to DoD via DIBNet within 72 hours

${ln}
4. NOTIFICATION CONTENT
${ln}

Notifications shall include:
  - Description of the breach in plain language
  - Types of personal data involved
  - Name and contact details of the DPO or security contact
  - Description of likely consequences
  - Description of measures taken or proposed to address the breach
  - Recommendations for affected individuals to protect themselves

${ln}
5. BREACH RESPONSE TEAM
${ln}

The Breach Response Team consists of: CISO, Legal Counsel, Privacy Officer,
HR Director, and Communications Lead. The team is responsible for all
time-critical decisions and coordinates with Dark Rock Cybersecurity for
forensic support and the cyber insurance carrier for breach coach services.
${ftr}`,

rsk:hdr(id,"Risk Assessment & Treatment Policy")+`
${ln}
1. PURPOSE AND SCOPE
${ln}

This policy guides ${O} in performing risk assessments to account for threats,
vulnerabilities, likelihood, and impact to organizational assets, personnel,
customers, vendors, and partners. Assessments consider security, availability,
integrity, and confidentiality requirements.

${ln}
2. RISK ASSESSMENT FRAMEWORK
${ln}

${O} conducts assessments of risk including the likelihood and impact of
unauthorized access, use, disclosure, disruption, modification, or destruction
of organizational systems, applications, infrastructure, and data.

The risk assessment process is coordinated by the CISO and includes:
  - Identification and evaluation of information assets
  - Identification of threats and threat sources
  - Identification and assessment of vulnerabilities
  - Determination of likelihood and impact of exploitation
  - Calculation of inherent and residual risk levels

${ln}
3. ASSESSMENT METHODOLOGY
${ln}

3.1 Frequency
  - Comprehensive assessment: At least annually
  - Event-driven assessment: Upon significant changes to environment,
    threat landscape, or after a significant security incident
  - Continuous assessment: Ongoing vulnerability scanning and monitoring

3.2 Scope
  - Internal controls, policies, procedures, and technical safeguards
  - Human resource practices and personnel security
  - Physical and facility controls
  - Systems and applications processing sensitive data
  - Third-party and supply chain risks
  - Emerging technology risks (AI/ML, cloud, IoT)

3.3 Risk Scoring
  Impact: Critical (5), High (4), Medium (3), Low (2), Minimal (1)
  Likelihood: Almost Certain (5), Likely (4), Possible (3),
              Unlikely (2), Rare (1)
  Risk Score = Impact x Likelihood
  Critical: 20-25 | High: 12-19 | Medium: 6-11 | Low: 1-5

${ln}
4. RISK TREATMENT
${ln}

  Accept: Risk is within tolerance. Documented approval from risk owner
  and CISO required. Accepted risks reviewed quarterly.

  Mitigate: Implement controls to reduce likelihood or impact. Treatment
  plan with timeline, owner, and compensating controls documented.

  Transfer: Risk transferred via insurance, contractual terms, or
  outsourcing to qualified third party.

  Avoid: Eliminate the activity creating the risk.

${ln}
5. RISK REGISTER
${ln}

All identified risks are documented in the organizational risk register with:
  - Risk description and category
  - Asset(s) affected
  - Threat source and vulnerability
  - Inherent risk score (before controls)
  - Current controls and their effectiveness
  - Residual risk score (after controls)
  - Treatment decision and plan
  - Risk owner and review date

The risk register is reviewed quarterly by the Risk Committee.

${ln}
6. CONTINUOUS MONITORING
${ln}

Vulnerability scanning: ${tk("vulnerability")!=="None"?tk("vulnerability"):"[To be implemented]"}
Frequency: Critical systems weekly; all systems monthly minimum.
Findings prioritized and remediated per Patch Management Policy SLAs.
${ftr}`,

pat:hdr(id,"Patch Management Policy")+`
${ln}
1. PURPOSE
${ln}

This policy establishes requirements for the timely identification,
evaluation, testing, and deployment of security patches and updates across
all ${O} information systems to reduce vulnerability exposure.

${ln}
2. SCOPE
${ln}

All operating systems, applications, firmware, network devices, and
cloud services owned or managed by ${O}, including:
  - Endpoint systems managed by ${tk("endpoint")}
  - Cloud infrastructure on ${tk("cloud")}
  - Network devices including ${tk("firewall")} firewalls
  - Identity infrastructure (${tk("identity")})
  - All server operating systems and middleware

${ln}
3. VULNERABILITY CLASSIFICATION AND SLAs
${ln}

  Critical (CVSS 9.0-10.0):
    SLA: 72 hours from release or identification
    Scope: All affected systems without exception
    Approval: Emergency change process; CISO notification required

  High (CVSS 7.0-8.9):
    SLA: 7 calendar days
    Scope: All affected systems
    Approval: Standard change process with expedited review

  Medium (CVSS 4.0-6.9):
    SLA: 30 calendar days
    Scope: All affected systems during next maintenance window
    Approval: Standard change process

  Low (CVSS 0.1-3.9):
    SLA: 90 calendar days
    Scope: Included in next scheduled maintenance cycle
    Approval: Standard change process

${ln}
4. PATCH PROCESS
${ln}

  Step 1 - Identification: Automated scanning via ${tk("vulnerability")!=="None"?tk("vulnerability"):"vulnerability management platform"}.
           Vendor advisories monitored. Threat intelligence feeds reviewed.

  Step 2 - Assessment: Evaluate applicability, severity, and potential impact.
           Determine systems affected and prioritize by criticality.

  Step 3 - Testing: Patches tested in non-production environment before
           deployment. Regression testing for critical applications.
           Results documented with rollback plan.

  Step 4 - Deployment: Scheduled deployment during approved maintenance
           window. Emergency patches follow expedited change process.
           Deployment progress tracked and verified.

  Step 5 - Verification: Post-deployment scanning to confirm remediation.
           Application functionality validated. Monitoring for issues.

${ln}
5. EXCEPTIONS
${ln}

Systems that cannot be patched within SLA require:
  - Documented risk acceptance approved by CISO
  - Compensating controls identified and implemented
  - Exception reviewed monthly until resolved
  - Risk documented in the organizational risk register

${ln}
6. METRICS AND REPORTING
${ln}

  - Patch compliance rate by severity (target: 95%+ within SLA)
  - Mean time to patch by severity
  - Exception count and aging report
  - Systems with critical/high vulnerabilities outstanding
  - Monthly reporting to CISO; quarterly to Risk Committee
${ftr}`,
    };
    const result=P[id]||`${hdr(id,templates.find(t=>t.id===id)?.n||"Policy")}[Policy content]\n${ftr}`;
    setGen(p=>({...p,[id]:result}));
    u(p=>({...p,policiesGen:[...new Set([...p.policiesGen,id])]}));
  };

  if(sel&&gen[sel]){
    const t=templates.find(x=>x.id===sel);
    return <div><Bt v="ghost" onClick={()=>setSel(null)} s={{marginBottom:12}}>← Back to Templates</Bt>
      <Cd s={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div>
            <h3 style={{color:C.w,margin:"0 0 4px",fontSize:16}}>{t?.n}</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Bd color={C.g}>Generated</Bd>
              <Bd color={C.tl}>POL-{sel.toUpperCase()}-001</Bd>
              <Bd color={C.b}>v1.0</Bd>
              <Bd color={C.tM}>{D}</Bd>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Bt v="outline" sz="sm" onClick={()=>{
              const blob=new Blob([gen[sel]],{type:"text/plain"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");
              a.href=url;
              a.download=`${O.replace(/\s/g,"_")}_${t?.n.replace(/\s/g,"_")}_v1.0.txt`;
              a.click();URL.revokeObjectURL(url);
            }}>Export TXT</Bt>
          </div>
        </div>
        <div style={{background:C.oM,borderRadius:8,padding:4}}>
          <pre style={{
            padding:20,color:C.tx,fontSize:11,lineHeight:1.75,
            whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono','Fira Code',monospace",
            maxHeight:600,overflow:"auto",margin:0
          }}>{gen[sel]}</pre>
        </div>
      </Cd>
    </div>;
  }

  return <div>
    <Sc sub="Professional security policy documents with version control, stakeholder approval, and technology-specific integration">Policy Generator</Sc>
    <Cd s={{marginBottom:16,borderLeft:`3px solid ${C.tl}`,padding:14}}>
      <p style={{color:C.tM,fontSize:11,margin:0,lineHeight:1.6}}>
        Each policy is generated with your organization profile ({O}), technology stack integrations, and compliance framework alignment ({CF}).
        Documents include revision history, stakeholder approval blocks, numbered section hierarchy, and enforcement provisions.
      </p>
    </Cd>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
      {templates.map(t=><Cd key={t.id} onClick={()=>{if(!gen[t.id])genPolicy(t.id);setSel(t.id)}}
        s={{cursor:"pointer",borderColor:gen[t.id]?C.g+"33":C.pB,transition:"border-color 0.15s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <span style={{fontSize:24}}>{t.i}</span>
          {gen[t.id]?<Bd color={C.g}>Generated</Bd>:<Bd color={C.tD2}>Click to generate</Bd>}
        </div>
        <h4 style={{color:C.w,margin:"10px 0 4px",fontSize:13}}>{t.n}</h4>
        <p style={{color:C.tM,fontSize:10,margin:0,lineHeight:1.4}}>{t.d}</p>
      </Cd>)}
    </div>
  </div>;
};

// ─── COMMS / ACCESS / INTEGRATIONS (compact) ─────────────────────────
const Comms=()=><div><Sc sub="Out-of-band communication for compromised environments">Secure Communications</Sc>
  <Cd s={{marginBottom:12,borderLeft:`3px solid ${C.o}`}}><p style={{color:C.tM,fontSize:11,margin:0}}><strong style={{color:C.o}}>Warning:</strong> If identity infrastructure is compromised, use out-of-band channels immediately.</p></Cd>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
    {[{n:"Signal",i:"📱",s:"Recommended"},{n:"WhatsApp",i:"💬",s:"Available"},{n:"Zoom",i:"📹",s:"Available"},{n:"WebEx",i:"🖥️",s:"Available"},{n:"Satellite Phone",i:"📡",s:"Standby"},{n:"In-Person EOC",i:"🏢",s:"Always Available"}].map(ch=>
      <Cd key={ch.n}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>{ch.i}</span><div><div style={{color:C.w,fontWeight:600,fontSize:12}}>{ch.n}</div><Bd color={C.g}>{ch.s}</Bd></div></div>
        <Bt v="outline" sz="sm" s={{width:"100%"}}>Configure</Bt></Cd>)}</div></div>;

const Access=()=><div><Sc sub="Role-based access controls">Access Control</Sc>
  <Cd s={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={{color:C.w,margin:0,fontSize:13}}>Team</h3>
    <Bt sz="sm" onClick={()=>{const n=prompt("Name:");const e=prompt("Email:");const r=prompt("Role ("+ROLES.join(", ")+"):");if(n)u(p=>({...p,team:[...p.team,{name:n,email:e||"",role:r||"Core IRT",active:true}]}))}}>+ Add</Bt></div>
    {st.team.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.pB}`}}>
      <span style={{color:C.w,fontSize:11}}><strong>{m.name}</strong> <span style={{color:C.tD2}}>({m.email})</span></span>
      <Bd color={m.role==="Administrator"?C.r:C.tl}>{m.role}</Bd></div>)}</Cd></div>;

const Integrations=()=><div><Sc sub="Connect stack, pen test tool, APIs">Integrations</Sc>
  <Cd s={{marginBottom:12,borderColor:C.tl+"33"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:8,background:C.tl+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔴</div>
      <div><h3 style={{color:C.w,margin:0,fontSize:14}}>Dark Rock Labs Penetration Testing</h3><p style={{color:C.tM,fontSize:11,margin:"2px 0 8px"}}>On-demand pen testing integrated with Sentry.</p>
        <div style={{display:"flex",gap:6}}><Bt sz="sm">Launch Tool →</Bt><Bt v="secondary" sz="sm">Schedule</Bt></div></div></div></Cd>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
    {[{n:"SIEM",i:"📊",a:["REST","Syslog","Webhook"]},{n:"EDR/XDR",i:"🛡️",a:["CrowdStrike","Defender","SentinelOne"]},
      {n:"SOAR",i:"⚙️",a:["XSOAR","Splunk SOAR"]},{n:"GRC",i:"📋",a:["SCF Connect","ServiceNow"]},
      {n:"Ticketing",i:"🎫",a:["ServiceNow","Jira"]},{n:"Threat Intel",i:"🔍",a:["MISP","VirusTotal"]}].map(x=>
      <Cd key={x.n}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>{x.i}</span><span style={{color:C.w,fontWeight:600,fontSize:12}}>{x.n}</span><Bd color={C.g}>Available</Bd></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:8}}>{x.a.map(a=><Bd key={a} color={C.b}>{a}</Bd>)}</div>
        <Bt v="outline" sz="sm" s={{width:"100%"}}>Configure</Bt></Cd>)}</div></div>;

// ─── RENDER ──────────────────────────────────────────────────────────
const mods={dash:Dashboard,onboard:Onboarding,assess:Assessment,irplan:IRPlanner,commander:Commander,
  playbooks:PlaybooksMod,tickets:Tickets,tasks:Tasks,forensics:Forensics,stakeholders:Stakeholders,policies:Policies,
  comms:Comms,access:Access,integrations:Integrations};
const Mod=mods[pg]||Dashboard;

return <div style={{minHeight:"100vh",background:C.ob,fontFamily:"'Figtree','Source Sans 3',-apple-system,sans-serif",color:C.tx,display:"flex"}}>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  {/* Sidebar */}
  <aside style={{width:sb?200:48,flexShrink:0,background:C.oL,borderRight:`1px solid ${C.pB}`,transition:"width 0.12s",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>
    <div style={{padding:sb?"14px 14px 10px":"14px 6px 10px",borderBottom:`1px solid ${C.pB}`}}>
      <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}} onClick={()=>setSb(!sb)}>
        <div style={{width:30,height:30,borderRadius:6,flexShrink:0,background:`linear-gradient(135deg,${C.tl},${C.tD})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:C.ob}}>S</div>
        {sb&&<div><div style={{color:C.w,fontWeight:700,fontSize:12}}>Sentry</div><div style={{color:C.tl,fontSize:8,fontWeight:700,letterSpacing:"0.14em"}}>DARK ROCK LABS</div></div>}</div></div>
    <nav style={{flex:1,padding:"6px 4px",overflowY:"auto"}}>
      {NAV.map(item=><button key={item.id} onClick={()=>setPg(item.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:sb?"6px 10px":"6px 0",justifyContent:sb?"flex-start":"center",borderRadius:6,border:"none",cursor:"pointer",marginBottom:1,background:pg===item.id?C.tl+"18":"transparent",color:pg===item.id?C.tl:C.tM,fontSize:11,fontWeight:pg===item.id?600:400,fontFamily:"inherit"}}>
        <span style={{fontSize:11,width:16,textAlign:"center",flexShrink:0}}>{item.i}</span>{sb&&<span>{item.l}</span>}</button>)}</nav>
    {sb&&<div style={{padding:"10px 14px",borderTop:`1px solid ${C.pB}`}}><div style={{fontSize:8,color:C.tD2}}>v{V}</div></div>}
  </aside>
  <main style={{flex:1,padding:"20px 28px",maxWidth:1020,overflow:"auto"}}><Mod/></main>
</div>;
}
