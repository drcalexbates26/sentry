import type { MetadataRoute } from "next";
import { MODULES } from "@/components/marketing/module-data";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sentry.darkrocklabs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...MODULES.map((m) => ({
      url: `${SITE_URL}/modules/${m.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
