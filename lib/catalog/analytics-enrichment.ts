import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import type { AnalyticsEnrichment } from "@/lib/catalog/analytics";

const enrichmentPath = path.join(process.cwd(), "data/analytics/enrichment.json");

export const loadAnalyticsEnrichment = cache(async (): Promise<AnalyticsEnrichment> => {
  try {
    const raw = JSON.parse(await readFile(enrichmentPath, "utf8")) as AnalyticsEnrichment;
    return {
      generatedAt: raw.generatedAt ?? "",
      foundedByWikidata: raw.foundedByWikidata ?? {},
      breweryTypeByObdb: raw.breweryTypeByObdb ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { generatedAt: "", foundedByWikidata: {}, breweryTypeByObdb: {} };
    }
    throw error;
  }
});
