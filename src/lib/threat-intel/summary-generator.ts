import type { ThreatIntelItem } from "@/types/threat-intel";

// ─── Structured recommendation shape ────────────────────────────────────
// Surfaces priority + timeline + verification so the UI can render a
// proper playbook instead of a flat checklist. Keeps a `text` field so the
// legacy callers (ticket creation in ThreatIntelModule.tsx) can still pass
// a plain string.
export interface StructuredRecommendation {
  /** Short imperative line — used as the ticket title when made actionable. */
  text: string;
  /** When this should be done. Drives the badge color. */
  priority: "Now" | "24h" | "This Week" | "Ongoing";
  /** Why it's at this priority — one sentence the reader can defend to their boss. */
  why: string;
  /** Concrete verification step — how the responder confirms the action took effect. */
  verify: string;
  /** Which IR phase this fits under (drives task tagging). */
  irPhase: "prep" | "ident" | "notif" | "contain" | "analysis" | "erad" | "recover" | "followup";
}

// ─── Threat-type inference from text ───────────────────────────────────
// Many RSS feed items arrive without rich tags. To make every event get a
// customized playbook, we scan title + description for known indicators and
// synthesize tag-like classifications. The order matters: more specific
// patterns are checked first so e.g. "Active Directory" routes to identity,
// not authbypass.
const INFERENCE_PATTERNS: { tag: string; rx: RegExp[] }[] = [
  { tag: "ransomware",     rx: [/\bransom(?:ware)?\b/i, /\b(LockBit|BlackCat|ALPHV|Cl0p|Akira|Royal|Play|Medusa)\b/i, /\bdouble[\s-]?extortion\b/i, /\bencryption (of|attack)\b/i] },
  { tag: "phishing",       rx: [/\bphish(?:ing)?\b/i, /\bspear[\s-]?phish/i, /\bcredential harvest/i, /\bsmishing\b/i, /\bvishing\b/i, /\bAiTM\b/i, /\badversary[\s-]in[\s-]the[\s-]middle\b/i, /\bbusiness email compromise\b/i, /\bBEC\b/i] },
  { tag: "supply-chain",   rx: [/\bsupply[\s-]?chain\b/i, /\b(SolarWinds|XZ|Kaseya|MOVEit|3CX)\b/i, /\btrojan(?:ized)? (update|build|package)/i, /\bdependency confusion\b/i, /\btyposquat/i, /\b(NPM|PyPI|RubyGems|crates\.io) (package|malicious)/i] },
  { tag: "zero-day",       rx: [/\bzero[\s-]?day\b/i, /\b0[\s-]?day\b/i, /\bunpatched\b/i, /\bno (fix|patch) (?:is )?available\b/i] },
  { tag: "rce",            rx: [/\bremote code execution\b/i, /\bRCE\b/i, /\barbitrary code execution\b/i, /\bunauthenticated (command|code) execution\b/i, /\bcommand injection\b/i] },
  { tag: "privesc",        rx: [/\bprivilege escalation\b/i, /\bLPE\b/i, /\belevation of privilege\b/i, /\bEoP\b/i, /\b(root|SYSTEM|administrator) (access|escalation)\b/i] },
  { tag: "authbypass",     rx: [/\bauthentication bypass\b/i, /\bauth[\s-]?bypass\b/i, /\blogin bypass\b/i, /\bunauthenticated\b/i] },
  { tag: "identity",       rx: [/\bActive Directory\b/i, /\bAD\b/, /\bKerberos\b/i, /\bOAuth\b/i, /\bSAML\b/i, /\bSSO\b/i, /\bMFA\b/i, /\bsession (hijack|token)\b/i, /\bidentity (provider|theft)\b/i, /\bcredential (theft|stuffing)\b/i] },
  { tag: "xss",            rx: [/\bcross[\s-]?site scripting\b/i, /\bXSS\b/i, /\bstored XSS\b/i, /\breflected XSS\b/i] },
  { tag: "ddos",           rx: [/\bDDoS\b/i, /\bdenial[\s-]of[\s-]service\b/i, /\bbotnet\b/i, /\bamplification attack\b/i] },
  { tag: "data-exposure",  rx: [/\bdata (breach|leak|exposure)\b/i, /\bPII exposed\b/i, /\bdatabase (exposed|leaked)\b/i, /\bS3 bucket\b/i, /\bunsecured (database|bucket|API)\b/i] },
  { tag: "deserialization",rx: [/\bdeserialization\b/i, /\binsecure deserialization\b/i, /\bunsafe (eval|pickle)\b/i] },
  { tag: "ssrf",           rx: [/\bSSRF\b/i, /\bserver[\s-]side request forgery\b/i] },
  { tag: "sqli",           rx: [/\bSQL injection\b/i, /\bSQLi\b/i] },
  { tag: "webshell",       rx: [/\bweb[\s-]?shell\b/i, /\bChinaChopper\b/i, /\bbackdoor (uploaded|installed)\b/i] },
  { tag: "vpn-edge",       rx: [/\b(VPN|SSL[\s-]?VPN|SSL VPN|GlobalProtect|AnyConnect|FortiGate|Pulse Secure|Ivanti Connect Secure|NetScaler|ADC)\b/i, /\bedge (appliance|device)\b/i] },
  { tag: "container",      rx: [/\b(Docker|Kubernetes|K8s|container escape|runc|containerd|Helm)\b/i] },
  { tag: "cloud",          rx: [/\b(AWS|Azure|GCP|S3|EC2|IAM|EKS|EKS|Lambda|Cloud Run|GKE)\b/i, /\bcloud (workload|account|tenant)\b/i] },
  { tag: "iot",            rx: [/\bIoT\b/i, /\bembedded (device|firmware)\b/i, /\b(router|camera|NVR|firmware) vulnerab/i] },
  { tag: "browser",        rx: [/\b(Chrome|Firefox|Safari|Edge|browser) (vulnerab|0[\s-]?day|exploit)/i, /\bv8 engine\b/i, /\bSpiderMonkey\b/i] },
  { tag: "windows",        rx: [/\bWindows\b/i, /\bMicrosoft Defender\b/i, /\bExchange Server\b/i, /\bSMB\b/, /\bMSHTML\b/i, /\bPrint Spooler\b/i] },
  { tag: "linux",          rx: [/\b(Linux kernel|systemd|GLIBC|sudo|polkit|OpenSSH|OpenSSL)\b/i] },
];

// Re-export so the inference logic is testable and unit-coverable.
export function inferTags(item: ThreatIntelItem): string[] {
  const text = `${item.title}\n${item.description}`;
  const seen = new Set(item.tags.map((t) => t.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-")));
  for (const p of INFERENCE_PATTERNS) {
    if (seen.has(p.tag)) continue;
    if (p.rx.some((r) => r.test(text))) seen.add(p.tag);
  }
  return [...seen];
}

// ─── Plain-English narratives by tag ───────────────────────────────────
// When a feed item carries a tag we recognize, surface a specific
// real-world explanation. This is what makes the daily briefing actually
// useful — readers learn what the threat *means*, not just its rank.
const TAG_NARRATIVES: Record<string, { what: string; risk: string; detect: string }> = {
  ransomware: {
    what: "A ransomware campaign or new variant. Operators typically gain initial access via phishing, exposed RDP, or unpatched edge appliances; escalate privileges using AD misconfigurations or credential dumps; then deploy ransomware across the domain through scheduled tasks or Group Policy.",
    risk: "Encryption of business-critical systems with multi-day-to-week recovery times. Modern ransomware also exfiltrates data before encryption, creating extortion leverage even when backups are intact.",
    detect: "Watch for: unexpected encryption/.[ext] file renames; shadow copy deletion (`vssadmin delete shadows`); mass file access from a single account; Cobalt Strike beacons in EDR; outbound connections to known C2 IPs in the past 7 days.",
  },
  phishing: {
    what: "Credential harvesting or malware delivery via email. Modern campaigns use lookalike domains, OAuth consent abuse, and AI-generated lures that bypass legacy keyword filters.",
    risk: "Single-click credential theft leads to MFA-resistant session token replay (AiTM kits). Once an attacker has a valid session, they can register their own MFA device and persist for weeks.",
    detect: "Watch for: inbound mail from newly-registered domains; high-volume clicks on the same external URL within a 60-minute window; sign-ins from unfamiliar ASNs within 30 minutes of a click; new MFA device registrations.",
  },
  identity: {
    what: "Identity-provider, authentication-flow, or session-handling vulnerability. Adversaries target this layer because it's the master key — compromise one identity and lateral movement becomes trivial.",
    risk: "Privilege escalation, session hijacking, and persistence that survives password resets. Identity breaches are often invisible to endpoint EDR because the activity looks like the real user.",
    detect: "Watch for: impossible-travel sign-ins; legacy auth (POP/IMAP/SMTP) usage; new app consent grants; admin role assignments outside the change window; OAuth tokens with unusually long lifetimes.",
  },
  "supply-chain": {
    what: "Compromise of a software dependency, build pipeline, or signing infrastructure. The attacker doesn't breach you — they breach a vendor you trust, then ride the trust relationship in.",
    risk: "Trojanized updates execute with the privilege of the legitimate vendor process. Detection is hard because the binary signs valid and the network traffic looks like normal software calling home.",
    detect: "Watch for: unexpected outbound traffic from build agents; vendor binaries spawning shells or scripting hosts; SBOM mismatches against known-good baselines; new code-signing certificates issued.",
  },
  "zero-day": {
    what: "Vulnerability with no vendor patch available. Often discovered in active exploitation — meaning some adversary already has weaponized exploit code while defenders have nothing to patch.",
    risk: "The window between disclosure and patch is the most dangerous time in vulnerability management. Mass-exploitation campaigns typically begin within 72 hours of public disclosure.",
    detect: "Apply virtual patches (WAF / IPS signatures) immediately. Hunt for exploitation artifacts published in the original disclosure. Monitor egress for C2 beacons matching the threat actor's known patterns.",
  },
  rce: {
    what: "Remote code execution — an attacker can run arbitrary commands on a vulnerable system, typically without authentication.",
    risk: "RCE is the most severe vulnerability class because it grants direct shell access. Once an attacker has code execution, they can install persistence, dump credentials, and pivot laterally.",
    detect: "Watch for: unusual child processes spawned by web servers (cmd.exe, powershell.exe, sh, bash); new scheduled tasks; outbound connections from server processes that normally don't initiate them.",
  },
  privesc: {
    what: "Privilege escalation — a local user (or a compromised low-privilege account) can elevate to administrator or system-level access.",
    risk: "Combined with any initial-access vulnerability, this gives the attacker full control. Even if your edge is hardened, an insider or commodity malware infection becomes a domain-admin compromise.",
    detect: "Watch for: token manipulation events (Windows event 4672); UAC bypass artifacts; new service installations by non-admin accounts; sudden membership changes in privileged groups.",
  },
  authbypass: {
    what: "Authentication bypass — attackers can access protected functionality without valid credentials.",
    risk: "Direct route to data exposure. Often combined with internet-facing surfaces (VPNs, management interfaces, admin portals) for maximum impact.",
    detect: "Watch for: successful access to authenticated endpoints without a preceding login event; unusual session token values; API calls from accounts that have not signed in recently.",
  },
  xss: {
    what: "Cross-site scripting — attackers can execute JavaScript in another user's browser session against a trusted site.",
    risk: "Session hijacking, credential phishing within a trusted UI, and account takeover. Particularly dangerous on admin panels where the victim has elevated privileges.",
    detect: "Watch for: WAF blocks on `<script>`, `javascript:`, or event handler payloads; outbound traffic from admin sessions to unexpected domains; modified DOM artifacts in CSP-violation reports.",
  },
  ddos: {
    what: "Distributed denial-of-service — coordinated traffic flood designed to exhaust bandwidth, connection state, or application resources. Often paired with extortion or used as a smokescreen for intrusion activity elsewhere.",
    risk: "Customer-facing service unavailability, regulatory exposure under SLA contracts, and operational cost spikes from auto-scaling. The most common second-order risk is responder fatigue diverting attention from a quieter intrusion happening at the same time.",
    detect: "Watch for: sudden spikes in connection counts; geographic concentration of source IPs; unusual user-agent strings; CDN/WAF rate-limit triggers; correlated alerts elsewhere in the stack that may be the real objective.",
  },
  "data-exposure": {
    what: "Data left accessible without authentication — unsecured database, public storage bucket, or leaked API. Often the result of misconfiguration rather than a targeted attack.",
    risk: "Regulatory exposure (GDPR, CCPA, HIPAA), customer notification obligations, and reputational damage. Once exposed data is indexed by search engines or scraped, the breach is effectively permanent regardless of remediation speed.",
    detect: "Watch for: cloud configuration drift in IAM and storage policies; new public S3 buckets or Azure blob containers; database services bound to public interfaces; secrets in version control history.",
  },
  deserialization: {
    what: "Insecure deserialization — application processes attacker-supplied serialized data and executes embedded payloads during reconstruction. Common in Java, .NET, Python pickle, and PHP applications.",
    risk: "Often results in unauthenticated RCE on the application server, then lateral movement using application-tier credentials. Hard to patch reactively — the fix typically requires code changes, not configuration.",
    detect: "Watch for: unusual process spawns by Java/IIS/Tomcat workers; magic-byte signatures in HTTP body content (e.g. `\\xac\\xed` for Java serialized objects, `<?xml` with serialized payloads); WAF alerts on deserialization gadget chains.",
  },
  ssrf: {
    what: "Server-side request forgery — attacker tricks the server into making requests to internal services they shouldn't reach. Often the first step in cloud metadata service abuse.",
    risk: "Theft of cloud IAM credentials via instance metadata services (IMDS), internal port scanning, and pivot points into databases reachable only from the application tier.",
    detect: "Watch for: outbound HTTP requests from application servers to internal IP ranges (169.254.169.254, RFC1918); unusual access patterns to cloud metadata endpoints; new HTTP clients invoked from web tiers.",
  },
  sqli: {
    what: "SQL injection — attacker can manipulate database queries by injecting SQL through user inputs.",
    risk: "Direct data exfiltration, authentication bypass, and in some database engines, OS command execution. One of the oldest vulnerability classes — also one of the most frequently exploited.",
    detect: "Watch for: WAF blocks on classic SQLi payloads (UNION SELECT, OR 1=1, ' OR '); unusual SELECT volumes from the application's database account; new schema enumeration queries.",
  },
  webshell: {
    what: "Persistent web-based backdoor uploaded by an attacker. Allows the attacker to return whenever they want with a single HTTP request, often bypassing edge controls.",
    risk: "Long-term unauthorized access that survives reboots, patches, and credential rotations. Web shells are commonly missed in IR scoping because they look like legitimate web content.",
    detect: "Watch for: recently modified files in web roots; PHP/JSP/ASP files with eval/exec/system/passthru functions; unusual outbound or file-system calls from web-server worker processes; web logs hitting unusual file paths repeatedly.",
  },
  "vpn-edge": {
    what: "Vulnerability in an internet-facing edge appliance (VPN, SSL VPN, gateway, load balancer). These devices are the front door of the network — when they fall, attackers walk in unauthenticated.",
    risk: "Edge appliance compromise typically grants pre-auth network access and a foothold for lateral movement. Historically these vulnerabilities are mass-scanned and exploited within days of disclosure.",
    detect: "Watch for: unusual VPN sign-ins (new ASNs, off-hours, geographic anomalies); unexpected configuration changes; admin sessions from non-management networks; capture forensic images BEFORE patching to preserve evidence of compromise.",
  },
  container: {
    what: "Container or orchestration platform vulnerability (Docker, Kubernetes, runc, containerd, Helm). Affects how workloads are isolated or how they communicate with the host.",
    risk: "Container escape grants attacker code execution on the host node, which in cloud environments often means access to the cloud control plane via the node's service account.",
    detect: "Watch for: unusual process spawns inside containers; modified container images; Kubernetes audit log entries showing unexpected RBAC bindings or privileged pod creations; new service accounts with cluster-admin.",
  },
  cloud: {
    what: "Cloud provider, platform, or workload vulnerability affecting AWS / Azure / GCP services. The blast radius often extends across all customers of the affected service.",
    risk: "Compromise of cloud control plane is the highest-impact failure mode in modern environments — single misconfiguration can expose every workload in a tenant. Detection windows tend to be long because cloud logs are voluminous and rarely reviewed end-to-end.",
    detect: "Watch for: new IAM principals or role assumptions; unusual CloudTrail / Activity Log entries; cross-region API calls outside normal patterns; service account keys created or downloaded.",
  },
  iot: {
    what: "Vulnerability in an embedded device, IoT appliance, network device firmware, or operational technology (OT). Often unpatchable, often forgotten in asset inventory.",
    risk: "These devices have long deployment lifetimes, weak update mechanisms, and frequently reside on flat networks that allow lateral movement. They're popular initial-access targets for nation-state and botnet operators.",
    detect: "Watch for: management traffic from unfamiliar IPs; firmware version drift from baseline; unexpected outbound connections from segregated VLANs; new device fingerprints on the network.",
  },
  browser: {
    what: "Browser engine vulnerability (V8, SpiderMonkey, WebKit, or a major browser). Exploitable simply by visiting a malicious page.",
    risk: "Drive-by compromise of any user who can browse the open web. Targeted campaigns deliver these via watering-hole sites or malvertising; mass campaigns use them for credential theft and crypto-stealers.",
    detect: "Watch for: EDR alerts on browser child process anomalies; outbound traffic patterns matching known exploit kits; users visiting newly-registered domains with high session counts; browser crash reports correlated to specific URLs.",
  },
  windows: {
    what: "Microsoft Windows ecosystem vulnerability — kernel, system component, Exchange, Active Directory, or related service.",
    risk: "Most enterprise environments run Windows on critical infrastructure (domain controllers, Exchange, file servers). A Windows server vulnerability often becomes an Active Directory compromise within hours.",
    detect: "Watch for: lateral movement via SMB / WinRM / RDP; unusual scheduled task or service installations; Group Policy modifications; Exchange ECP/EWS exploitation patterns; Defender XDR alerts on the affected component.",
  },
  linux: {
    what: "Linux kernel, glibc, sudo, OpenSSH, OpenSSL, or core system utility vulnerability. Affects servers across virtually all distributions.",
    risk: "Production Linux servers are typically the most sensitive workloads (databases, application backends, ingress controllers). Kernel and system-utility vulnerabilities often allow local-to-root privilege escalation that compounds with any unauthenticated foothold.",
    detect: "Watch for: setuid binary modifications; auditd events for unexpected privilege transitions; new SSH keys in authorized_keys files; unusual processes spawned by long-running daemons.",
  },
};

// Vendor-specific hunting guidance — when a feed item names a vendor, surface
// concrete telemetry sources the responder can query right now.
const VENDOR_PLAYBOOKS: Record<string, string> = {
  microsoft: "Pull Microsoft Defender XDR alerts in `AdvancedHunting` for the affected product; query UAL for suspicious sign-ins via Microsoft 365 Compliance Center; check Entra ID audit log for new app registrations.",
  cisco: "Check Cisco Talos advisories for the CVE; query EDR for the affected device family; verify IOS-XE / ASA / Firepower devices against the affected version list before the next maintenance window.",
  fortinet: "Pull FortiGate logs for the affected proxy or VPN service; verify versions against the Fortinet PSIRT advisory; assume internet-facing devices are compromised until proven otherwise — FortiGate appliances are repeat targets.",
  vmware: "Audit vCenter access logs; verify SSO is not exposed to the internet; check ESXi hosts for new local accounts; review NSX firewall rules for recent changes.",
  citrix: "Treat Citrix NetScaler / ADC vulnerabilities as critical until proven otherwise — historically these are mass-exploited within days. Snapshot for forensics before patching.",
  oracle: "Apply quarterly CPU patches; verify Oracle Cloud / E-Business Suite versions; pull database audit logs for the affected modules.",
  apache: "Identify all reverse proxies, web servers, and Tomcat instances; check for vulnerable middleware deployed via container images; review WAF rules.",
  atlassian: "Check Confluence / Jira / Bitbucket against Atlassian Security Advisories; rotate API tokens; review app marketplace add-ons for new permissions.",
  ivanti: "Treat Ivanti edge appliances as compromise-pending until patched. Capture forensic images before remediation — pattern of campaigns shows persistent access well after patching.",
  juniper: "Verify Junos OS versions against PSIRT; review SSH access logs on edge devices; check for unauthorized configuration changes.",
};

// ─── Executive Summary ──────────────────────────────────────────────────
export function generateExecutiveSummary(item: ThreatIntelItem): string {
  const cvss = item.cvssScore ? `CVSS ${item.cvssScore}` : "Unscored";
  const cls = item.severityRank;
  const score = item.riskScore;

  const narratives = collectNarratives(item);
  const vendorHunts = collectVendorPlaybooks(item);

  let s = `THREAT ASSESSMENT: ${item.title}\n${"━".repeat(72)}\n\n`;
  s += `Classification: ${cls}  |  Risk Score: ${score}/100  |  ${cvss}\n`;
  s += `Source: ${item.feedSource}  |  Published: ${item.publishedAt}\n\n`;

  // ── Urgency banner ───────────────────────────────────────────────────
  if (item.isZeroDay) {
    s += `⚠ ZERO-DAY VULNERABILITY\n`;
    s += `No vendor patch is available. The window between disclosure and patch\n`;
    s += `is the most dangerous time in vulnerability management — mass exploitation\n`;
    s += `typically begins within 72 hours. Apply virtual patches (WAF/IPS) now.\n\n`;
  }
  if (item.isActivelyExploited) {
    s += `● ACTIVELY EXPLOITED IN THE WILD\n`;
    s += `This vulnerability is confirmed under attack right now. Treat patching as\n`;
    s += `an emergency change, not a maintenance-window activity. If you operate the\n`;
    s += `affected product on internet-facing infrastructure, assume scanning has\n`;
    s += `already begun.\n\n`;
  }

  // ── Plain-English overview ───────────────────────────────────────────
  s += `WHAT THIS IS\n${"─".repeat(72)}\n`;
  s += `${item.description}\n\n`;
  if (narratives.length > 0) {
    s += `In plain terms:\n\n`;
    narratives.forEach((n) => {
      s += `${wrap(n.what, 72)}\n\n`;
    });
  }

  // ── Real-world impact ────────────────────────────────────────────────
  s += `WHY IT MATTERS\n${"─".repeat(72)}\n`;
  if (narratives.length > 0) {
    narratives.forEach((n) => {
      s += `${wrap(n.risk, 72)}\n\n`;
    });
  } else {
    s += `${wrap(genericRisk(item), 72)}\n\n`;
  }

  // ── Affected scope ───────────────────────────────────────────────────
  if (item.affectedVendors.length > 0 || item.affectedProducts.length > 0) {
    s += `AFFECTED SCOPE\n${"─".repeat(72)}\n`;
    if (item.affectedVendors.length > 0) {
      s += `Vendors:  ${item.affectedVendors.join(", ")}\n`;
    }
    if (item.affectedProducts.length > 0) {
      s += `Products: ${item.affectedProducts.join(", ")}\n`;
    }
    s += `\nIf any of these are in your environment, treat this as an active\n`;
    s += `risk. If they are not, this assessment helps you stay informed of\n`;
    s += `the broader threat landscape relevant to your industry.\n\n`;
  }

  // ── Detection guidance ───────────────────────────────────────────────
  s += `WHAT TO LOOK FOR\n${"─".repeat(72)}\n`;
  if (narratives.length > 0) {
    narratives.forEach((n) => {
      s += `${wrap(n.detect, 72)}\n\n`;
    });
  } else {
    s += `${wrap(genericDetection(item), 72)}\n\n`;
  }
  if (vendorHunts.length > 0) {
    s += `Vendor-specific hunting steps:\n\n`;
    vendorHunts.forEach((v) => {
      s += `  • ${wrap(v, 70).replace(/\n/g, "\n    ")}\n`;
    });
    s += `\n`;
  }

  // ── Impact / Likelihood / Risk ───────────────────────────────────────
  s += `RISK MATH\n${"─".repeat(72)}\n`;
  s += `  Impact:     ${item.impactScore}/10 — ${impactLabel(item.impactScore)}\n`;
  s += `  Likelihood: ${item.likelihoodScore}/10 — ${likelihoodLabel(item.likelihoodScore)}\n`;
  s += `  Risk Score: ${item.riskScore}/100  (computed weighted)\n\n`;

  // ── Technical details ────────────────────────────────────────────────
  if (item.cveId || item.cvssVector || item.cweId) {
    s += `TECHNICAL DETAILS\n${"─".repeat(72)}\n`;
    if (item.cveId) s += `  CVE ID:        ${item.cveId}\n`;
    if (item.cvssScore) s += `  CVSS Score:    ${item.cvssScore}\n`;
    if (item.cvssVector) s += `  CVSS Vector:   ${item.cvssVector}\n`;
    if (item.cweId) s += `  CWE:           ${item.cweId}\n`;
    s += `\n`;
  }
  if (item.mitreAttackIds.length > 0) {
    s += `MITRE ATT&CK MAPPING\n${"─".repeat(72)}\n`;
    item.mitreAttackIds.forEach((id) => {
      s += `  • ${id}\n`;
    });
    s += `\n`;
  }

  // ── Action plan (uses the structured recommendations) ───────────────
  s += `ACTION PLAN\n${"─".repeat(72)}\n`;
  const recs = generateStructuredRecommendations(item);
  const byPriority: Record<string, StructuredRecommendation[]> = { Now: [], "24h": [], "This Week": [], Ongoing: [] };
  recs.forEach((r) => byPriority[r.priority].push(r));
  (["Now", "24h", "This Week", "Ongoing"] as const).forEach((p) => {
    if (byPriority[p].length === 0) return;
    s += `\n${p === "Now" ? "▶ DO NOW" : p === "24h" ? "▶ NEXT 24 HOURS" : p === "This Week" ? "▶ THIS WEEK" : "▶ ONGOING"}\n`;
    byPriority[p].forEach((r, i) => {
      s += `  ${i + 1}. ${r.text}\n`;
      s += `     Why:    ${r.why}\n`;
      s += `     Verify: ${r.verify}\n\n`;
    });
  });

  s += `${"━".repeat(72)}\nDark Rock Labs · Sentry — Threat Intelligence\n`;
  return s;
}

// ─── Backward-compatible flat string recommendations ───────────────────
// Used by ThreatIntelModule.markApplicable for ticket creation. We keep
// the legacy signature working while the UI consumes the structured form.
export function generateRecommendations(item: ThreatIntelItem): string[] {
  return generateStructuredRecommendations(item).map((r) => r.text);
}

// ─── Structured recommendations (new) ──────────────────────────────────
export function generateStructuredRecommendations(item: ThreatIntelItem): StructuredRecommendation[] {
  const recs: StructuredRecommendation[] = [];
  const score = item.riskScore;
  // Use inferred tags so untagged items still get customized recommendations.
  const tags = new Set(inferTags(item));
  const vendors = item.affectedVendors.map((v) => v.toLowerCase());

  // ── NOW (within hours) ────────────────────────────────────────────────
  if (item.isActivelyExploited || item.isZeroDay || score >= 80) {
    if (item.isZeroDay) {
      recs.push({
        text: "Apply virtual patching at the WAF/IPS layer",
        priority: "Now",
        why: "No vendor patch exists. Virtual patches block the exploit pattern at the edge while you wait for a real fix.",
        verify: "Confirm the WAF rule logs blocks on test traffic that matches the published exploit signature; verify no legitimate traffic is being false-positive blocked.",
        irPhase: "contain",
      });
    } else {
      recs.push({
        text: "Apply vendor patch or emergency mitigation",
        priority: "Now",
        why: "Active exploitation or critical risk score. Treat this as an emergency change — not a maintenance-window item.",
        verify: "Patch advisory confirms the affected version is no longer present on inventoried hosts; vulnerability scan rescans the asset and reports clean.",
        irPhase: "contain",
      });
    }
    recs.push({
      text: "Hunt your environment for indicators of compromise",
      priority: "Now",
      why: "If this is being exploited in the wild, assume scanning has reached you. The goal is to confirm you are not already compromised, not just to patch.",
      verify: "EDR/SIEM queries cover the past 30 days against the IOCs published with the advisory; any matches escalated to an incident.",
      irPhase: "ident",
    });
    if (vendors.length > 0) {
      const vendorList = item.affectedVendors.slice(0, 3).join(", ");
      recs.push({
        text: `Inventory all instances of ${vendorList} in your environment`,
        priority: "Now",
        why: "You cannot patch what you do not know exists. Shadow installs and forgotten appliances are the most common sources of post-patch compromise.",
        verify: "Asset inventory tool returns the same count as a fresh credentialed network scan plus a query of the EDR endpoint catalog.",
        irPhase: "ident",
      });
    }
  }

  // ── 24h ──────────────────────────────────────────────────────────────
  if (score >= 50) {
    recs.push({
      text: "Issue stakeholder communication summarizing this threat",
      priority: "24h",
      why: "Leadership needs to know what you are doing and why before they hear about it from the news. Pre-empts the 'why didn't security tell us?' meeting.",
      verify: "Email or Slack post acknowledged by IT leadership; documented in the security operations daily log.",
      irPhase: "ident",
    });
  }
  if (tags.has("phishing")) {
    recs.push({
      text: "Send a security-awareness advisory to all staff",
      priority: "24h",
      why: "Active phishing campaigns succeed when users have not been primed. A short, specific advisory ('we are seeing X — do not click Y') outperforms generic training.",
      verify: "Communication delivered via primary channel; sample of users can articulate the specific threat when surveyed.",
      irPhase: "ident",
    });
  }
  if (tags.has("ransomware")) {
    recs.push({
      text: "Validate backup integrity and confirm restoration runbook is current",
      priority: "24h",
      why: "Ransomware response is bounded by your ability to restore. A backup you have not tested in 90 days is not a backup — it is hope.",
      verify: "Restore a sample dataset to a clean environment within RTO; checksum verifies against source.",
      irPhase: "recover",
    });
  }
  if (tags.has("identity") || tags.has("authbypass")) {
    recs.push({
      text: "Review authentication logs for the past 30 days",
      priority: "24h",
      why: "Identity attacks blend in with legitimate user activity. Retrospective review catches the slow-burn intrusion that real-time alerting missed.",
      verify: "Sign-in logs, MFA registration events, and admin role assignments reviewed by an analyst; any anomaly converted to a finding.",
      irPhase: "ident",
    });
  }
  // ── Threat-class specific recommendations ────────────────────────────
  if (tags.has("vpn-edge")) {
    recs.push({
      text: "Capture a forensic image of affected edge appliances before patching",
      priority: "Now",
      why: "Edge appliance vulnerabilities are mass-scanned and exploited fast. Patching without imaging destroys evidence of pre-existing compromise — and these devices are repeatedly observed compromised before disclosure.",
      verify: "Image captured to write-once storage; chain-of-custody recorded in Sentry Forensics; device replaced or factory-reset before being returned to service.",
      irPhase: "contain",
    });
  }
  if (tags.has("rce") && score >= 50) {
    recs.push({
      text: "Block exploit traffic patterns at the WAF/IPS layer",
      priority: "Now",
      why: "Pre-auth RCE on internet-facing surfaces is the worst-case scenario. Edge rules buy patching time and create a tripwire if exploitation is attempted.",
      verify: "WAF/IPS shows blocks on test payloads matching the published exploit; the affected endpoint is no longer reachable from untrusted networks.",
      irPhase: "contain",
    });
  }
  if (tags.has("webshell")) {
    recs.push({
      text: "Scan web roots for recently-modified files and unexpected scripts",
      priority: "Now",
      why: "Web shells outlive patching. If an attacker dropped one before you patched, you still have a backdoor — and they look like normal application files.",
      verify: "File integrity baseline rerun against web servers; unfamiliar PHP/JSP/ASP/ASPX files quarantined and analyzed; web-server worker processes inspected for unusual child processes.",
      irPhase: "ident",
    });
  }
  if (tags.has("sqli") || tags.has("deserialization") || tags.has("ssrf")) {
    recs.push({
      text: "Audit the application's database / service account permissions",
      priority: "24h",
      why: `${tags.has("sqli") ? "SQL injection" : tags.has("ssrf") ? "SSRF" : "Deserialization"} consequences scale with what the compromised account can reach. Least-privilege limits blast radius even when the bug is exploited.`,
      verify: "Account permissions documented; any unused privileges revoked; database row-level access reviewed against current application requirements.",
      irPhase: "contain",
    });
  }
  if (tags.has("xss")) {
    recs.push({
      text: "Verify Content-Security-Policy and HTTPOnly cookie flags",
      priority: "24h",
      why: "CSP is the most cost-effective XSS mitigation. HTTPOnly cookies prevent the most damaging follow-on (session hijacking via document.cookie) even if a payload lands.",
      verify: "CSP header present and not in report-only mode; session cookies set with HttpOnly + Secure + SameSite; sample admin pages tested against benign XSS payloads.",
      irPhase: "contain",
    });
  }
  if (tags.has("ddos")) {
    recs.push({
      text: "Validate DDoS protection and confirm capacity headroom",
      priority: "24h",
      why: "DDoS attacks are increasingly used as smokescreens for intrusion activity elsewhere. Confirm both mitigation and broader monitoring.",
      verify: "CDN/scrubbing service confirms automatic rate-limit triggers; runbook for emergency upstream filter exists and is current; other security tooling is monitored for correlated alerts during any DDoS event.",
      irPhase: "contain",
    });
    recs.push({
      text: "Brief customer support and legal on potential SLA impact",
      priority: "24h",
      why: "DDoS events that cause outages trigger SLA credits and customer notification obligations. Better to pre-empt than to react.",
      verify: "Support team has prepared customer communication template; legal has reviewed SLA contracts for the at-risk customer tier.",
      irPhase: "ident",
    });
  }
  if (tags.has("data-exposure")) {
    recs.push({
      text: "Audit cloud storage and database public-access configurations",
      priority: "Now",
      why: "If this vulnerability class is in the news, attackers are scanning for the same pattern in your environment right now. The fix is usually misconfiguration, not patching.",
      verify: "All S3/Azure Blob/GCS buckets reviewed for public access; database services bound only to private interfaces; cloud security posture (CSPM) scan rerun and reviewed.",
      irPhase: "contain",
    });
    recs.push({
      text: "Engage legal counsel for breach-notification analysis",
      priority: "24h",
      why: "Data exposure carries regulatory clocks (GDPR 72-hour notification, US state breach laws). Counsel involvement preserves privilege and ensures you don't miss a notification window.",
      verify: "Legal has scoped potential regulatory obligations; data-classification confirms whether PII/PHI/CUI is in scope; notification timeline documented if required.",
      irPhase: "notif",
    });
  }
  if (tags.has("container") || tags.has("cloud")) {
    recs.push({
      text: "Review cloud audit logs and Kubernetes RBAC for unusual changes",
      priority: "24h",
      why: "Container and cloud control-plane compromises don't always trigger endpoint alerts — the evidence lives in the audit log, which most teams don't watch in real time.",
      verify: "CloudTrail / Activity Log / GCP Audit Logs queried for IAM, RBAC, and service-account changes in the past 30 days; any unfamiliar changes investigated.",
      irPhase: "ident",
    });
  }
  if (tags.has("iot")) {
    recs.push({
      text: "Inventory affected devices and confirm they aren't on flat networks",
      priority: "This Week",
      why: "IoT/OT devices are often forgotten, often unpatchable, and often share the network with critical systems. Network segmentation is the durable mitigation when patching isn't possible.",
      verify: "Affected devices located in asset inventory; VLAN segmentation reviewed; firewall rules audited for east-west isolation between IT and OT segments.",
      irPhase: "contain",
    });
  }
  if (tags.has("browser")) {
    recs.push({
      text: "Push the browser auto-update policy to enforce within 24 hours",
      priority: "24h",
      why: "Browser zero-days deliver drive-by compromise to anyone who browses the web. Default auto-update timelines (7-14 days) are too slow during active campaigns.",
      verify: "Group Policy / MDM enforces the patched version; reports show >95% endpoint compliance; older versions blocked from accessing internal apps.",
      irPhase: "contain",
    });
  }
  if (tags.has("windows")) {
    recs.push({
      text: "Run targeted Defender / EDR hunting against the affected component",
      priority: "24h",
      why: "Microsoft typically publishes hunting queries alongside their security updates. Use them — they're calibrated to the exact exploit pattern.",
      verify: "Advanced Hunting queries from MSRC bulletin executed against last 30 days of data; any matches triaged and escalated.",
      irPhase: "ident",
    });
  }
  if (tags.has("linux")) {
    recs.push({
      text: "Identify exposure on critical Linux infrastructure first",
      priority: "Now",
      why: "Production Linux servers (databases, ingress controllers, app backends) carry your most sensitive workloads. Patch order should follow blast radius, not alphabetical hostnames.",
      verify: "Inventory cross-referenced against criticality tier; top 20% by criticality patched first; remaining hosts scheduled within the SLA window for high-severity Linux CVEs.",
      irPhase: "erad",
    });
  }

  // ── This Week ────────────────────────────────────────────────────────
  if (score >= 30) {
    recs.push({
      text: "Update detection rules with new IOCs and TTPs",
      priority: "This Week",
      why: "Yesterday's signatures will not catch tomorrow's variants. Operationalize the intelligence — do not just read it.",
      verify: "SIEM/EDR rule list shows new entries dated within this week; test alert fires on a benign sample of the IOC pattern.",
      irPhase: "prep",
    });
  }
  if (tags.has("supply-chain")) {
    recs.push({
      text: "Review SBOM for affected dependency and rebuild affected artifacts",
      priority: "This Week",
      why: "Compromised dependencies persist as long as your artifacts are deployed. Rebuilding from clean sources removes the trojan.",
      verify: "SBOM check confirms the dependency version is updated; CI pipeline rebuilds and re-signs artifacts; deployed environments updated.",
      irPhase: "erad",
    });
  }
  if (item.mitreAttackIds.length > 0) {
    recs.push({
      text: "Run tabletop exercise against the MITRE ATT&CK techniques in this advisory",
      priority: "This Week",
      why: "Reading about a technique is not the same as defending against it. A 60-minute tabletop with the responders surfaces the gaps before an attacker does.",
      verify: "Tabletop notes capture at least three lessons learned; lessons logged in Sentry IR Planner and converted to tasks.",
      irPhase: "prep",
    });
  }

  // ── Ongoing ──────────────────────────────────────────────────────────
  recs.push({
    text: "Monitor for escalation in exploitation activity",
    priority: "Ongoing",
    why: "A medium today can become a critical tomorrow if a public exploit drops. The risk score is a snapshot, not a forecast.",
    verify: "Sentry threat-feed refresh scheduled; threat hunters subscribed to the relevant vendor advisory mailing lists.",
    irPhase: "prep",
  });

  return recs;
}

// ─── Daily Briefing ──────────────────────────────────────────────────────
// Produces a leadership-grade morning briefing from the day's items.
// Designed for a 60-second read: what changed, what to do, what to watch.
export interface DailyBriefingInput {
  items: ThreatIntelItem[];
  orgName?: string;
  orgIndustry?: string;
}

export function generateDailyBriefing({ items, orgName, orgIndustry }: DailyBriefingInput): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Look back 24 hours for "today's" items.
  const last24h = items.filter((i) => {
    const pub = new Date(i.publishedAt).getTime();
    return now.getTime() - pub <= 24 * 3600 * 1000;
  });
  const last7d = items.filter((i) => {
    const pub = new Date(i.publishedAt).getTime();
    return now.getTime() - pub <= 7 * 86400 * 1000;
  });

  const newCritical = last24h.filter((i) => i.severityRank === "Critical" || i.isZeroDay);
  const exploited = items.filter((i) => i.isActivelyExploited);
  const topThree = items
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  let b = `DAILY THREAT BRIEFING\n${"━".repeat(72)}\n\n`;
  b += `${dateStr}\n`;
  if (orgName) b += `Prepared for: ${orgName}${orgIndustry ? ` · ${orgIndustry}` : ""}\n`;
  b += `Classification: INTERNAL — for security operations and leadership\n\n`;

  // ── 60-second posture summary ─────────────────────────────────────────
  b += `THE 60-SECOND READ\n${"─".repeat(72)}\n`;
  b += postureSentence(items, last24h, newCritical, exploited);
  b += `\n\n`;

  // ── New threats since yesterday ───────────────────────────────────────
  if (last24h.length > 0) {
    b += `NEW IN THE PAST 24 HOURS (${last24h.length})\n${"─".repeat(72)}\n`;
    last24h
      .slice()
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .forEach((i, idx) => {
        const tag = i.isZeroDay ? " [0-DAY]" : i.isActivelyExploited ? " [EXPLOITED]" : "";
        b += `  ${idx + 1}. [${i.severityRank}/${i.riskScore}] ${i.cveId ? i.cveId + " — " : ""}${shorten(i.title, 70)}${tag}\n`;
        b += `       Source: ${i.feedSource}\n`;
      });
    b += `\n`;
  } else {
    b += `NEW IN THE PAST 24 HOURS\n${"─".repeat(72)}\n  No new items pulled in the last 24 hours.\n\n`;
  }

  // ── Top 3 priorities today ────────────────────────────────────────────
  b += `TODAY'S TOP THREE PRIORITIES\n${"─".repeat(72)}\n`;
  if (topThree.length === 0) {
    b += `  No items in the queue. Use this window to clear technical debt in the\n  Tasks board and run a tabletop exercise.\n\n`;
  } else {
    topThree.forEach((i, idx) => {
      b += `\n  ${idx + 1}. ${i.cveId ? i.cveId + " — " : ""}${shorten(i.title, 65)}\n`;
      b += `     ${i.severityRank} · Risk ${i.riskScore}/100 · ${i.feedSource}\n`;
      const recs = generateStructuredRecommendations(i).filter((r) => r.priority === "Now" || r.priority === "24h").slice(0, 2);
      recs.forEach((r) => {
        b += `       → [${r.priority}] ${r.text}\n`;
      });
    });
    b += `\n`;
  }

  // ── Actively exploited watchlist ──────────────────────────────────────
  if (exploited.length > 0) {
    b += `ACTIVELY EXPLOITED — TREAT AS EMERGENCY\n${"─".repeat(72)}\n`;
    exploited.slice(0, 5).forEach((i) => {
      b += `  • ${i.cveId ? i.cveId + " — " : ""}${shorten(i.title, 70)}\n`;
    });
    b += `\n`;
  }

  // ── What to communicate today ─────────────────────────────────────────
  b += `WHAT TO COMMUNICATE TODAY\n${"─".repeat(72)}\n`;
  b += communicationGuidance(newCritical, exploited, last7d);
  b += `\n`;

  // ── What to watch this week ───────────────────────────────────────────
  b += `\nWHAT TO WATCH THIS WEEK\n${"─".repeat(72)}\n`;
  b += watchGuidance(last7d, items);
  b += `\n`;

  // ── Footer ────────────────────────────────────────────────────────────
  b += `\n${"━".repeat(72)}\n`;
  b += `Items reviewed: ${items.length} (${last24h.length} in last 24h, ${last7d.length} in last 7d)\n`;
  b += `Generated: ${now.toLocaleString()}\n`;
  b += `Dark Rock Labs · Sentry — Threat Intelligence\n`;
  return b;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function collectNarratives(item: ThreatIntelItem): { what: string; risk: string; detect: string }[] {
  const matched: { what: string; risk: string; detect: string }[] = [];
  const seen = new Set<string>();
  // Pull tags from both the explicit list AND the inferred classification
  // based on title/description scanning. This is what makes the playbook
  // customize for every event, even untagged ones.
  const allTags = inferTags(item);
  // Order matters for readability — keep narratives in this canonical order
  // so the most-actionable framing is at the top. zero-day / exploited
  // framing first, then attack type, then technical class, then platform.
  const order = [
    "zero-day", "rce", "privesc", "authbypass", "deserialization", "ssrf", "sqli", "xss", "webshell",
    "ransomware", "phishing", "supply-chain", "ddos", "data-exposure",
    "identity", "vpn-edge", "container", "cloud", "iot", "browser", "windows", "linux",
  ];
  for (const key of order) {
    if (allTags.includes(key) && TAG_NARRATIVES[key] && !seen.has(key)) {
      matched.push(TAG_NARRATIVES[key]);
      seen.add(key);
    }
  }
  // Pull in zero-day narrative implicitly when the flag is set even if it
  // didn't match the inference patterns (e.g. CISA KEV-flagged items).
  if (item.isZeroDay && !seen.has("zero-day")) {
    matched.unshift(TAG_NARRATIVES["zero-day"]);
    seen.add("zero-day");
  }
  // Cap at 3 narratives so the summary doesn't run too long for items that
  // hit many patterns (e.g. "RCE in Windows Active Directory via SMB").
  return matched.slice(0, 3);
}

function collectVendorPlaybooks(item: ThreatIntelItem): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of item.affectedVendors) {
    const key = v.toLowerCase().split(/[\s-]/)[0];
    if (VENDOR_PLAYBOOKS[key] && !seen.has(key)) {
      out.push(VENDOR_PLAYBOOKS[key]);
      seen.add(key);
    }
  }
  return out;
}

function genericRisk(item: ThreatIntelItem): string {
  if (item.severityRank === "Critical") {
    return "A critical-rated vulnerability typically translates to direct compromise — unauthenticated RCE, privilege escalation, or data exposure. The realistic worst case is full system control by an unauthenticated attacker.";
  }
  if (item.severityRank === "High") {
    return "A high-rated vulnerability usually requires some authentication or interaction but leads to significant impact: lateral movement, data theft, or sustained access. Treat any internet-facing exposure as urgent.";
  }
  return "This advisory describes a defensible risk that should still be tracked. The most common reason a medium becomes a critical is that defenders deprioritized it until a public exploit dropped.";
}

function genericDetection(item: ThreatIntelItem): string {
  if (item.cveId) {
    return `Search EDR/SIEM telemetry for indicators referenced in ${item.cveId} advisories. Pay attention to recent process creation patterns on the affected software and unusual outbound connections from the affected services.`;
  }
  return "Build detections around the published TTPs. Pull the IOCs from the source advisory link and operationalize them as SIEM/EDR queries.";
}

function impactLabel(s: number): string {
  if (s >= 8) return "Critical business impact expected if exploited";
  if (s >= 5) return "Moderate business impact possible";
  return "Limited business impact anticipated";
}

function likelihoodLabel(s: number): string {
  if (s >= 8) return "Active exploitation confirmed or imminent";
  if (s >= 5) return "Exploitation likely within days to weeks";
  return "Exploitation possible but not yet observed";
}

function postureSentence(
  all: ThreatIntelItem[],
  last24: ThreatIntelItem[],
  newCritical: ThreatIntelItem[],
  exploited: ThreatIntelItem[],
): string {
  if (newCritical.length === 0 && exploited.length === 0) {
    return `The threat landscape is stable today. ${all.length} item${all.length === 1 ? "" : "s"} are in the queue, ${last24.length} added in the last 24 hours. No new critical or actively exploited items — use this quiet window to clear remediation tasks and run a tabletop.`;
  }
  if (newCritical.length > 0 && exploited.length > 0) {
    return `Elevated posture today. ${newCritical.length} new critical or zero-day item${newCritical.length === 1 ? "" : "s"} arrived in the last 24 hours, and ${exploited.length} item${exploited.length === 1 ? " is" : "s are"} confirmed under active exploitation. Patch decisions made before noon will pay dividends.`;
  }
  if (newCritical.length > 0) {
    return `Sharpened posture today. ${newCritical.length} new critical or zero-day item${newCritical.length === 1 ? " arrived" : "s arrived"} in the last 24 hours. Verify your inventory against the affected products before standing up new mitigations.`;
  }
  return `Active posture today. ${exploited.length} item${exploited.length === 1 ? " is" : "s are"} confirmed under active exploitation. If any are in your environment, treat patching as an emergency change.`;
}

function communicationGuidance(
  newCritical: ThreatIntelItem[],
  exploited: ThreatIntelItem[],
  weekly: ThreatIntelItem[],
): string {
  if (newCritical.length === 0 && exploited.length === 0) {
    return `  Light week. A short note to leadership ("we reviewed N advisories, no urgent action required") reinforces that security is paying attention without burning attention budget.`;
  }
  let out = "";
  if (newCritical.length > 0) {
    out += `  • Brief IT/Engineering leadership on the ${newCritical.length} new critical / zero-day item${newCritical.length === 1 ? "" : "s"} — they need to know what is being patched and what trade-offs are accepted.\n`;
  }
  if (exploited.length > 0) {
    out += `  • Escalate actively-exploited items to the IC and (if applicable) to legal counsel. Public exploitation activity that touches your stack can trigger insurance and disclosure obligations.\n`;
  }
  if (weekly.length > 5) {
    out += `  • Schedule a 30-minute review with the security team for the ${weekly.length} items pulled this week — pattern-spot for shared root causes (same vendor? same auth flaw?).\n`;
  }
  return out;
}

function watchGuidance(weekly: ThreatIntelItem[], all: ThreatIntelItem[]): string {
  const ransomCount = all.filter((i) => i.tags.some((t) => t.toLowerCase() === "ransomware")).length;
  const phishCount = all.filter((i) => i.tags.some((t) => t.toLowerCase() === "phishing")).length;
  const supplyChainCount = all.filter((i) => i.tags.some((t) => t.toLowerCase() === "supply-chain")).length;

  let out = "";
  if (ransomCount > 3) {
    out += `  • Ransomware volume is elevated (${ransomCount} items tracked). Validate backups this week and verify restoration runbooks.\n`;
  }
  if (phishCount > 3) {
    out += `  • Phishing activity is sustained (${phishCount} items tracked). Refresh awareness messaging and review email-security rules.\n`;
  }
  if (supplyChainCount > 0) {
    out += `  • ${supplyChainCount} supply-chain advisor${supplyChainCount === 1 ? "y" : "ies"} in the feed. Review your SBOMs and rotate any shared signing keys flagged.\n`;
  }
  if (out.length === 0) {
    out = `  • Stable threat mix this week. Use the time to run a tabletop exercise (Sentry IR Planner has 14 playbooks ready), refresh detection rules, and clear remediation tasks in the Tasks board.\n`;
  }
  out += `  • Refresh Sentry threat feeds tomorrow morning at the same time. Daily rhythm builds the muscle memory that catches a 4am Friday zero-day before the world wakes up.\n`;
  return out;
}

function shorten(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function wrap(text: string, width: number): string {
  // Simple word-wrap. Keeps the executive summary readable in a fixed-width
  // viewer (the existing UI renders the summary inside a <pre>).
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
