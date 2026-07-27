import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/chat",
        "/settings",
        "/profile", // Base profile is protected
        "/api/",
        "/connections",
      ],
    },
    sitemap: "https://skillbuddy.ai/sitemap.xml",
  };
}
