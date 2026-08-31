import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/review", "/en/review", "/nl/review"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
