import type { MetadataRoute } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";

type NameSummary = {
  name: string;
  name_normalized: string;
  gender: "female" | "male";
  latest_year: number;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const lastModified = new Date("2026-05-14");

const coreRoutes = [
  "/",
  "/calculator",
  "/compare",
  "/methodology",
  "/name/female/helena",
  "/name/male/antoni",
];

function dataPath(fileName: string) {
  return path.join(process.cwd(), "public", "data", fileName);
}

async function readNameSummaries() {
  const content = await readFile(dataPath("name_summaries.json"), "utf-8");
  return JSON.parse(content) as NameSummary[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const summaries = await readNameSummaries();
  const profileRoutes = summaries
    .slice()
    .sort((a, b) => {
      return (
        a.gender.localeCompare(b.gender) ||
        a.name_normalized.localeCompare(b.name_normalized)
      );
    })
    .map((summary) => `/name/${summary.gender}/${summary.name_normalized}`);

  const uniqueRoutes = Array.from(new Set([...coreRoutes, ...profileRoutes]));

  return uniqueRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/name/") ? 0.55 : 0.7,
  }));
}
