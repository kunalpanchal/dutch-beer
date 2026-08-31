import path from "path";
import { mergeBeerRecords } from "@/lib/catalog/beers";
import { loadListingFiles, writeListingFiles } from "@/lib/catalog/listings";
import { mergeSourceRecords } from "@/lib/catalog/merge";
import { sanitizeImportedBrewery } from "@/lib/catalog/odbl";
import { fetchOpenBreweryDb } from "@/lib/import/open-brewery-db";
import { fetchWikidataBeers } from "@/lib/import/wikidata-beers";
import { fetchWikidataBreweries } from "@/lib/import/wikidata";
import type { Beer, Brewery } from "@/lib/schema";

export interface ImportResult {
  counts: {
    wikidata: number;
    openBreweryDb: number;
    merged: number;
    written: number;
    skipped: number;
    pending: number;
    published: number;
  };
}

export interface BeerImportResult {
  counts: {
    wikidata: number;
    merged: number;
    written: number;
    skipped: number;
    pending: number;
    published: number;
    named: number;
    linked: number;
  };
}

function breweryAlreadyPresent(brewery: Brewery, existing: Brewery[]): boolean {
  if (existing.some((row) => row.slug === brewery.slug)) return true;
  const wikidata = brewery.externalIds?.wikidata?.toUpperCase();
  if (wikidata && existing.some((row) => row.externalIds?.wikidata?.toUpperCase() === wikidata)) return true;
  const obdb = brewery.externalIds?.openBreweryDb;
  return Boolean(obdb && existing.some((row) => row.externalIds?.openBreweryDb === obdb));
}

function beerAlreadyPresent(beer: Beer, existing: Beer[]): boolean {
  if (existing.some((row) => row.slug === beer.slug)) return true;
  const wikidata = beer.externalIds?.wikidata?.toUpperCase();
  return Boolean(wikidata && existing.some((row) => row.externalIds?.wikidata?.toUpperCase() === wikidata));
}

export async function importBreweries(directory = path.join(process.cwd(), "data")): Promise<ImportResult> {
  const capturedAt = new Date().toISOString();
  const existing = await loadListingFiles(directory);
  const [wikidata, openBreweryDb] = await Promise.all([fetchWikidataBreweries(), fetchOpenBreweryDb()]);
  const merged = mergeSourceRecords([...wikidata, ...openBreweryDb], capturedAt)
    .map(sanitizeImportedBrewery)
    .filter((brewery): brewery is Brewery => Boolean(brewery));
  const additions = merged.filter((brewery) => !breweryAlreadyPresent(brewery, existing.breweries));
  const written = await writeListingFiles(directory, { breweries: additions });

  return {
    counts: {
      wikidata: wikidata.length,
      openBreweryDb: openBreweryDb.length,
      merged: merged.length,
      written: written.breweries.written,
      skipped: written.breweries.skipped + (merged.length - additions.length),
      pending: merged.filter((brewery) => brewery.status === "pending_review").length,
      published: merged.filter((brewery) => brewery.status === "published").length,
    },
  };
}

export async function importBeers(directory = path.join(process.cwd(), "data")): Promise<BeerImportResult> {
  const capturedAt = new Date().toISOString();
  const existing = await loadListingFiles(directory);
  if (!existing.breweries.length) {
    throw new Error("Import breweries first so beers can attach to a brewery Wikidata id.");
  }
  const wikidata = await fetchWikidataBeers();
  const merged = mergeBeerRecords(wikidata, existing.breweries, capturedAt);
  const additions = merged.filter((beer) => !beerAlreadyPresent(beer, existing.beers));
  const written = await writeListingFiles(directory, { beers: additions });
  return {
    counts: {
      wikidata: wikidata.length,
      merged: merged.length,
      written: written.beers.written,
      skipped: written.beers.skipped + (merged.length - additions.length),
      pending: merged.filter((beer) => beer.status === "pending_review").length,
      published: merged.filter((beer) => beer.status === "published").length,
      named: merged.filter((beer) => beer.name.toUpperCase() !== beer.externalIds?.wikidata?.toUpperCase()).length,
      linked: merged.filter((beer) => Boolean(beer.brewerySlug)).length,
    },
  };
}
