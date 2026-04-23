export const TECH_OPTIONS: Record<string, string[]> = {
  identity: ["Microsoft Entra ID", "Okta", "Google Workspace", "Ping Identity", "JumpCloud", "CyberArk", "Other"],
  endpoint: ["CrowdStrike Falcon", "Microsoft Defender for Endpoint", "SentinelOne", "Carbon Black", "Sophos", "Other"],
  siem: ["Microsoft Sentinel", "Splunk", "IBM QRadar", "Elastic SIEM", "Sumo Logic", "LogRhythm", "None"],
  firewall: ["Palo Alto Networks", "Fortinet FortiGate", "Cisco Firepower", "pfSense", "Check Point", "Other"],
  email: ["Microsoft 365", "Google Workspace", "Proofpoint", "Mimecast", "Barracuda", "Other"],
  cloud: ["Microsoft Azure", "AWS", "Google Cloud", "Multi-Cloud", "On-Premises Only", "Hybrid"],
  backup: ["Veeam", "Azure Backup", "AWS Backup", "Commvault", "Rubrik", "Datto", "Other"],
  mfa: ["Microsoft Authenticator", "Duo Security", "YubiKey / Hardware Tokens", "Okta Verify", "Not Implemented"],
  vulnerability: ["Tenable Nessus", "Qualys", "Rapid7 InsightVM", "Microsoft Defender VM", "None"],
  dlp: ["Microsoft Purview", "Symantec DLP", "Digital Guardian", "Forcepoint", "None"],
};

export const COMPLIANCE_OPTIONS = [
  "NIST 800-53", "NIST 800-171 / CMMC", "FedRAMP", "HIPAA", "PCI DSS",
  "SOC 2", "ISO 27001", "HITRUST", "GDPR", "SOX", "DFARS", "StateRAMP",
];

export const INDUSTRIES = [
  "Federal / Government", "Defense / DIB", "Healthcare", "Financial Services",
  "Technology", "Manufacturing", "Legal", "Education", "Energy", "Retail", "Other",
];

export const ORG_SIZES = ["1-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];

export const ROLES = [
  "Administrator", "Incident Owner", "Incident Manager",
  "Core IRT", "Extended IRT", "Read Only", "Auditor",
];
