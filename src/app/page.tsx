import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { Capabilities } from "@/components/marketing/Capabilities";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ModulesGrid } from "@/components/marketing/ModulesGrid";
import { Footer } from "@/components/marketing/Footer";
import { CookieConsent } from "@/components/marketing/CookieConsent";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sentry.darkrocklabs.com";
const TITLE = "Sentry by Dark Rock Labs — Cyber Resilience Platform";
const DESCRIPTION = "Sentry unifies cybersecurity assessment, incident command, playbooks, tabletop exercises, forensics, and stakeholder communication into a single workspace built for the way security teams actually operate.";
const OG_IMAGE = "/marketing/screenshots/homepage.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Sentry",
  authors: [{ name: "Dark Rock Labs", url: "https://darkrocklabs.com" }],
  creator: "Dark Rock Labs",
  publisher: "Dark Rock Labs",
  keywords: [
    "cyber resilience",
    "incident response",
    "incident commander",
    "NIST CSF 2.0",
    "cybersecurity assessment",
    "tabletop exercise",
    "forensics",
    "IR playbooks",
    "Dark Rock Labs",
    "Sentry",
    "MTTR",
    "MTTD",
    "security operations",
  ],
  alternates: { canonical: SITE_URL + "/" },
  openGraph: {
    type: "website",
    siteName: "Sentry by Dark Rock Labs",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL + "/",
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1440,
        height: 900,
        alt: "Sentry — cyber resilience platform dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "Dark Rock Labs",
      url: "https://darkrocklabs.com",
      logo: `${SITE_URL}/marketing/screenshots/homepage.png`,
      sameAs: [
        "https://darkrocklabs.com",
        "https://darkrocksecurity.com",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}#sentry`,
      name: "Sentry",
      alternateName: "Sentry by Dark Rock Labs",
      description: DESCRIPTION,
      url: SITE_URL,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE_URL}#organization` },
      offers: { "@type": "Offer", availability: "https://schema.org/InStock", price: "0", priceCurrency: "USD" },
      featureList: [
        "NIST CSF 2.0 Assessment with Resilience Hitlist",
        "Real-time Incident Commander",
        "14 IR Playbooks pre-mapped to phases",
        "Tabletop Exercise AAR Dashboard",
        "Forensic evidence vault with chain of custody",
        "Stakeholder + IR vendor directory across 22 categories",
        "MTTD and MTTR computed live from incident log",
        "Multi-tenant with row-level security isolation",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "Sentry",
      publisher: { "@id": `${SITE_URL}#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function MarketingHome() {
  return (
    <main style={{ background: "#0A0E14", minHeight: "100vh", color: "#E2E8F0" }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Hero />
      <Capabilities />
      <HowItWorks />
      <ModulesGrid />
      <Footer />
      <CookieConsent />
    </main>
  );
}
