export interface PolicyTemplateInfo {
  id: string;
  n: string;
  i: string;
  d: string;
}

export const POLICY_TEMPLATES: PolicyTemplateInfo[] = [
  { id: "irp", n: "Incident Response Policy", i: "🚨", d: "NIST 800-61 aligned IRP with full lifecycle, severity matrix, roles, EOC procedures, and reporting requirements" },
  { id: "isp", n: "Information Security Policy", i: "🔐", d: "Comprehensive ISP: governance structure, risk management, access control, data protection, and compliance" },
  { id: "bcp", n: "Business Continuity & Disaster Recovery", i: "🏗️", d: "BIA methodology, RTO/RPO targets, continuity strategies, recovery procedures, and testing requirements" },
  { id: "acl", n: "Access Control & Termination Policy", i: "🔓", d: "Least privilege, RBAC, MFA, account lifecycle, privileged access, and offboarding procedures" },
  { id: "dcl", n: "Data Classification & Governance", i: "📊", d: "Four-tier classification schema with handling, retention, and secure disposal procedures" },
  { id: "brn", n: "Breach Notification Policy", i: "📣", d: "Breach definitions, risk assessment, notification timelines (HIPAA/GDPR/state), and templates" },
  { id: "rsk", n: "Risk Assessment & Treatment Policy", i: "⚖️", d: "Enterprise risk framework, assessment methodology, risk register, and treatment plans" },
  { id: "pat", n: "Patch Management Policy", i: "🩹", d: "Vulnerability classification, remediation SLAs, testing, deployment, and exception handling" },
];
