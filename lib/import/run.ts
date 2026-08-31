import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { mergeSourceRecords, type CatalogFile, type SourceRecord } from "@/lib/catalog/merge";
import { fetchOpenBreweryDb } from "@/lib/import/open-brewery-db";
import { fetchOpenStreetMapBreweries } from "@/lib/import/osm";
import { fetchWikidataBreweries } from "@/lib/import/wikidata";

export interface ImportResult {
  catalog: CatalogFile;
  counts: {
    wikidata: number;
    openBreweryDb: number;
    openStreetMap: number;
    merged: number;
    pending: number;
    published: number;
  };
}

export async function importBreweries(): Promise<ImportResult> {
  const capturedAt = new Date().toISOString();
  const [wikidata, openBreweryDb, openStreetMap] = await Promise.all([
    fetchWikidataBreweries(),
    fetchOpenBreweryDb(),
    fetchOpenStreetMapBreweries(),
  ]);

  const records: SourceRecord[] = [...wikidata, ...openBreweryDb, ...openStreetMap];
  const breweries = mergeSourceRecords(records, capturedAt);
  const catalog: CatalogFile = {
    generatedAt: capturedAt,
    sources: {
      wikidata: { fetchedAt: capturedAt, count: wikidata.length },
      open_brewery_db: { fetchedAt: capturedAt, count: openBreweryDb.length },
      openstreetmap: { fetchedAt: capturedAt, count: openStreetMap.length },
    },
    breweries,
  };

  return {
    catalog,
    counts: {
      wikidata: wikidata.length,
      openBreweryDb: openBreweryDb.length,
      openStreetMap: openStreetMap.length,
      merged: breweries.length,
      pending: breweries.filter((brewery) => brewery.status === "pending_review").length,
      published: breweries.filter((brewery) => brewery.status === "published").length,
    },
  };
}

export async function writeCatalog(catalog: CatalogFile, directory = path.join(process.cwd(), "data")): Promise<string> {
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, "catalog.json");
  await writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
  return file;
}
