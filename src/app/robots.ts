import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/customer/", "/tailor/"],
    },
    sitemap: "https://tailortrack.pk/sitemap.xml",
  };
}
