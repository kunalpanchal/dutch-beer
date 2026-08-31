import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import type { Beer, Brewery, OpenDataOrigin, PublicationStatus } from "@/lib/schema";
import { applyPublishedClaims, loadClaimFiles } from "@/lib/catalog/claims";
import type { CatalogFile } from "@/lib/catalog/merge";
import { breweryOrigins, sourceConfidence } from "@/lib/catalog/merge";
import { catalogCounts, recentBoardEntries } from "@/lib/catalog/home";

const assembledCatalogPath = path.join(process.cwd(), "data/.assembled.json");

const emptyCatalog = (): CatalogFile => ({
  generatedAt: "",
  sources: {},
  breweries: [],
  beers: [],
  beerSources: { wikidata: { fetchedAt: "", count: 0 } },
});

export const loadCatalog = cache(async (): Promise<CatalogFile> => {
  try {
    return JSON.parse(await readFile(assembledCatalogPath, "utf8")) as CatalogFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyCatalog();
    throw error;
  }
});

const loadClaims = cache(loadClaimFiles);

interface CatalogIndex {
  breweries: Brewery[];
  beers: Beer[];
  breweryBySlug: Map<string, Brewery>;
  beerBySlug: Map<string, Beer>;
  beersByBrewery: Map<string, Beer[]>;
}

const loadIndexedCatalog = cache(async (): Promise<CatalogIndex> => {
  const [catalog, claims] = await Promise.all([loadCatalog(), loadClaims()]);
  const breweries = applyPublishedClaims(catalog.breweries, claims);
  const beers = catalog.beers ?? [];
  const breweryBySlug = new Map(breweries.map((brewery) => [brewery.slug, brewery]));
  const beerBySlug = new Map(beers.map((beer) => [beer.slug, beer]));
  const beersByBrewery = new Map<string, Beer[]>();
  for (const beer of beers) {
    for (const key of new Set([beer.breweryId, beer.brewerySlug].filter((value): value is string => Boolean(value)))) {
      const list = beersByBrewery.get(key) ?? [];
      list.push(beer);
      beersByBrewery.set(key, list);
    }
  }
  return { breweries, beers, breweryBySlug, beerBySlug, beersByBrewery };
});

export async function listBreweries(): Promise<Brewery[]> {
  return (await loadIndexedCatalog()).breweries;
}

export async function listPublishedBreweries(): Promise<Brewery[]> {
  return (await listBreweries()).filter((brewery) => brewery.status === "published");
}

export async function listPendingBreweries(): Promise<Brewery[]> {
  return (await listBreweries()).filter((brewery) => brewery.status === "pending_review");
}

export async function getBreweryBySlug(slug: string): Promise<Brewery | undefined> {
  return (await loadIndexedCatalog()).breweryBySlug.get(slug);
}

export async function listBeers(): Promise<Beer[]> {
  return (await loadIndexedCatalog()).beers;
}

export async function getCatalogCounts() {
  return catalogCounts(await loadCatalog());
}

export async function listRecentBoardEntries(limit = 6) {
  return recentBoardEntries(await loadCatalog(), limit);
}

export async function getBeerBySlug(slug: string): Promise<Beer | undefined> {
  return (await loadIndexedCatalog()).beerBySlug.get(slug);
}

export async function listBeersForBrewery(brewery: Brewery): Promise<Beer[]> {
  const index = await loadIndexedCatalog();
  const byId = index.beersByBrewery.get(brewery.id) ?? [];
  if (byId.length) return byId;
  return index.beersByBrewery.get(brewery.slug) ?? [];
}

export function isLikelyCurrent(brewery: Brewery): boolean {
  return !brewery.closed && Boolean(brewery.website || breweryOrigins(brewery).length >= 2);
}

export interface BreweryListItem {
  slug: string;
  name: string;
  locality?: string;
  region?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  origins: OpenDataOrigin[];
  closed?: boolean;
  claimed?: boolean;
  status: PublicationStatus;
  confidence: "high" | "medium" | "low";
}

export interface BeerListItem {
  slug: string;
  name: string;
  breweryName: string;
  brewerySlug?: string;
  style?: string;
  abv?: number;
  origins: OpenDataOrigin[];
  status: PublicationStatus;
}

export function toBeerListItem(beer: Beer): BeerListItem {
  return {
    slug: beer.slug,
    name: beer.name,
    breweryName: beer.breweryName,
    brewerySlug: beer.brewerySlug,
    style: beer.style,
    abv: beer.abv,
    origins: [
      ...new Set(
        beer.sources
          .map((source) => source.origin)
          .filter((origin): origin is OpenDataOrigin => Boolean(origin)),
      ),
    ],
    status: beer.status,
  };
}

export function toListItem(brewery: Brewery): BreweryListItem {
  const origins = breweryOrigins(brewery);
  return {
    slug: brewery.slug,
    name: brewery.name,
    locality: brewery.address?.locality || undefined,
    region: brewery.address?.region,
    website: brewery.website,
    latitude: brewery.address?.latitude,
    longitude: brewery.address?.longitude,
    origins,
    closed: brewery.closed,
    claimed: Boolean(brewery.claimedBy),
    status: brewery.status,
    confidence: sourceConfidence(origins, brewery.website, brewery.closed),
  };
}

export { breweryOrigins, sourceConfidence };
