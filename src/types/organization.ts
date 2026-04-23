export interface Organization {
  id?: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  techStack: TechStack;
  compliance: string[];
}

export interface TechStack {
  identity: string;
  endpoint: string;
  siem: string;
  firewall: string;
  email: string;
  cloud: string;
  backup: string;
  mfa: string;
  vulnerability: string;
  dlp: string;
  [key: string]: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}
