import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://skillbuddy.ai",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://skillbuddy.ai/sign-in",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: "https://skillbuddy.ai/sign-up",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: "https://skillbuddy.ai/discover", // If public
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://skillbuddy.ai/communities",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://skillbuddy.ai/teams",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://skillbuddy.ai/leaderboard",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];
}
