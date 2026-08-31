import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { mergeBeerRecords } from "@/lib/catalog/beers";
import { mergeSourceRecords, type CatalogFile, type SourceRecord } from "@/lib/catalog/merge";
import { fetchOpenBreweryDb } from "@/lib/import/open-brewery-db";
import { fetchOpenStreetMapBreweries } from "@/lib/import/osm";
import { fetchWikidataBeers } from "@/lib/import/wikidata-beers";
import { fetchWikidataBreweries } from "@/lib/import/wikidata";

const catalogFile = (directory: string) => path.join(directory, "catalog.json");

async function readCatalog(directory: string): Promise<CatalogFile | undefined> {
  try {
    return JSON.parse(await readFile(catalogFile(directory), "utf8")) as CatalogFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

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

export interface BeerImportResult {
  catalog: CatalogFile;
  counts: {
    wikidata: number;
    merged: number;
    pending: number;
    published: number;
    named: number;
    linked: number;
  };
}

export async function importBreweries(directory = path.join(process.cwd(), "data")): Promise<ImportResult> {
  const capturedAt = new Date().toISOString();
  const existing = await readCatalog(directory);
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
    beers: existing?.beers,
    beerSources: existing?.beerSources,
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

export async function importBeers(directory = path.join(process.cwd(), "data")): Promise<BeerImportResult> {
  const capturedAt = new Date().toISOString();
  const existing = await readCatalog(directory);
  if (!existing?.breweries.length) {
    throw new Error("Import breweries first so beers can attach to a brewery Wikidata id.");
  }
  const wikidata = await fetchWikidataBeers();
  const beers = mergeBeerRecords(wikidata, existing.breweries, capturedAt);
  const catalog: CatalogFile = {
    ...existing,
    generatedAt: capturedAt,
    beers,
    beerSources: { wikidata: { fetchedAt: capturedAt, count: wikidata.length } },
  };
  return {
    catalog,
    counts: {
      wikidata: wikidata.length,
      merged: beers.length,
      pending: beers.filter((beer) => beer.status === "pending_review").length,
      published: beers.filter((beer) => beer.status === "published").length,
      named: beers.filter((beer) => beer.name.toUpperCase() !== beer.externalIds?.wikidata?.toUpperCase()).length,
      linked: beers.filter((beer) => Boolean(beer.brewerySlug)).length,
    },
  };
}

export async function writeCatalog(catalog: CatalogFile, directory = path.join(process.cwd(), "data")): Promise<string> {
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, "catalog.json");
  await writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
  return file;
}
