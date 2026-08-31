import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import type { Beer, Brewery, OpenDataOrigin, PublicationStatus } from "@/lib/schema";
import { applyPublishedClaims, loadClaimFiles } from "@/lib/catalog/claims";
import type { CatalogFile } from "@/lib/catalog/merge";
import { breweryOrigins, sourceConfidence } from "@/lib/catalog/merge";
import { catalogCounts, recentBoardEntries } from "@/lib/catalog/home";
import { slugify } from "@/lib/catalog/normalize";

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
  breweryById: Map<string, Brewery>;
  beerBySlug: Map<string, Beer>;
  beersByBrewery: Map<string, Beer[]>;
}

const loadIndexedCatalog = cache(async (): Promise<CatalogIndex> => {
  const [catalog, claims] = await Promise.all([loadCatalog(), loadClaims()]);
  const breweries = applyPublishedClaims(catalog.breweries, claims);
  const beers = catalog.beers ?? [];
  const breweryBySlug = new Map(breweries.map((brewery) => [brewery.slug, brewery]));
  const breweryById = new Map(breweries.map((brewery) => [brewery.id, brewery]));
  const beerBySlug = new Map(beers.map((beer) => [beer.slug, beer]));
  const beersByBrewery = new Map<string, Beer[]>();
  for (const beer of beers) {
    for (const key of new Set([beer.breweryId, beer.brewerySlug].filter((value): value is string => Boolean(value)))) {
      const list = beersByBrewery.get(key) ?? [];
      list.push(beer);
      beersByBrewery.set(key, list);
    }
  }
  return { breweries, beers, breweryBySlug, breweryById, beerBySlug, beersByBrewery };
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

export async function getBreweryById(id: string): Promise<Brewery | undefined> {
  return (await loadIndexedCatalog()).breweryById.get(id);
}

export async function listBeers(): Promise<Beer[]> {
  return (await loadIndexedCatalog()).beers;
}

export async function listPublishedBeers(): Promise<Beer[]> {
  return (await listBeers()).filter((beer) => beer.status === "published");
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

export interface Place {
  slug: string;
  name: string;
  region?: string;
  breweryCount: number;
}

export function placeSlug(locality: string): string {
  return slugify(locality);
}

export function breweriesInPlace(breweries: Brewery[], slug: string): Brewery[] {
  return breweries.filter((brewery) => {
    const locality = brewery.address?.locality?.trim();
    return locality ? placeSlug(locality) === slug : false;
  });
}

export function placesFromBreweries(breweries: Brewery[]): Place[] {
  const groups = new Map<string, { names: Map<string, number>; regions: Map<string, number>; count: number }>();
  for (const brewery of breweries) {
    const locality = brewery.address?.locality?.trim();
    if (!locality) continue;
    const slug = placeSlug(locality);
    const group = groups.get(slug) ?? { names: new Map(), regions: new Map(), count: 0 };
    group.count += 1;
    group.names.set(locality, (group.names.get(locality) ?? 0) + 1);
    if (brewery.address?.region) {
      group.regions.set(brewery.address.region, (group.regions.get(brewery.address.region) ?? 0) + 1);
    }
    groups.set(slug, group);
  }
  return [...groups.entries()]
    .map(([slug, group]) => ({
      slug,
      name: [...group.names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl"))[0][0],
      region: [...group.regions.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl"))[0]?.[0],
      breweryCount: group.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export async function listPlaces(): Promise<Place[]> {
  return placesFromBreweries(await listBreweries());
}

export async function getPlaceBySlug(slug: string): Promise<{ place: Place; breweries: Brewery[] } | undefined> {
  const breweries = breweriesInPlace(await listBreweries(), slug);
  if (!breweries.length) return undefined;
  const place = placesFromBreweries(breweries).find((item) => item.slug === slug);
  if (!place) return undefined;
  return { place, breweries };
}

export { breweryOrigins, sourceConfidence };
