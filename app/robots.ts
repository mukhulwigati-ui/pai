import type { MetadataRoute } from "next";

// ============================================================================
// CONFIG
// ============================================================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.senyum.or.id";

// ============================================================================
// ROBOTS.TXT
// ============================================================================

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",

        // Semua halaman publik boleh dirayapi
        allow: "/",

        // Halaman internal / sistem tidak perlu masuk Google
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/login/",
          "/auth/",
          "/_next/",
        ],
      },
    ],

    // Sitemap utama Senyum.or.id
    sitemap: `${SITE_URL}/sitemap.xml`,

    // Menegaskan host utama
    host: SITE_URL,
  };
}