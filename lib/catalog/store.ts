import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import type { Beer, Brewery, OpenDataOrigin, PublicationStatus } from "@/lib/schema";
import type { CatalogFile } from "@/lib/catalog/merge";
import { breweryOrigins, sourceConfidence } from "@/lib/catalog/merge";
import { slugify } from "@/lib/catalog/normalize";
import {
  loadBeerListings,
  loadBreweryListings,
  mergeBreweryListings,
  resolveBeerListings,
} from "@/lib/catalog/listings";

export const catalogPath = path.join(process.cwd(), "data/catalog.json");

const emptyCatalog = (): CatalogFile => ({
  generatedAt: "",
  sources: {
    wikidata: { fetchedAt: "", count: 0 },
    open_brewery_db: { fetchedAt: "", count: 0 },
    openstreetmap: { fetchedAt: "", count: 0 },
  },
  breweries: [],
});

export const loadCatalog = cache(async (): Promise<CatalogFile> => {
  try {
    const raw = await readFile(catalogPath, "utf8");
    return JSON.parse(raw) as CatalogFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyCatalog();
    throw error;
  }
});

const loadMergedBreweries = cache(async (): Promise<Brewery[]> => {
  const [catalog, listings] = await Promise.all([loadCatalog(), loadBreweryListings()]);
  return mergeBreweryListings(catalog.breweries, listings);
});

const loadResolvedBeers = cache(async (): Promise<Beer[]> => {
  const [breweries, listings] = await Promise.all([loadMergedBreweries(), loadBeerListings()]);
  return resolveBeerListings(listings, breweries);
});

export async function listBreweries(): Promise<Brewery[]> {
  return loadMergedBreweries();
}

export async function listPublishedBreweries(): Promise<Brewery[]> {
  return (await listBreweries()).filter((brewery) => brewery.status === "published");
}

export async function listPendingBreweries(): Promise<Brewery[]> {
  return (await listBreweries()).filter((brewery) => brewery.status === "pending_review");
}

export async function getBreweryBySlug(slug: string): Promise<Brewery | undefined> {
  return (await listBreweries()).find((brewery) => brewery.slug === slug);
}

export async function getBreweryById(id: string): Promise<Brewery | undefined> {
  return (await listBreweries()).find((brewery) => brewery.id === id);
}

export async function listBeers(): Promise<Beer[]> {
  return loadResolvedBeers();
}

export async function listPublishedBeers(): Promise<Beer[]> {
  return (await listBeers()).filter((beer) => beer.status === "published");
}

export async function getBeerBySlug(slug: string): Promise<Beer | undefined> {
  return (await listBeers()).find((beer) => beer.slug === slug);
}

export async function listBeersForBrewery(brewery: Brewery): Promise<Beer[]> {
  return (await listBeers()).filter((beer) => beer.breweryId === brewery.id);
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
  origins: OpenDataOrigin[];
  closed?: boolean;
  status: PublicationStatus;
  confidence: "high" | "medium" | "low";
  claimed: boolean;
}

export function toListItem(brewery: Brewery): BreweryListItem {
  const origins = breweryOrigins(brewery);
  return {
    slug: brewery.slug,
    name: brewery.name,
    locality: brewery.address?.locality || undefined,
    region: brewery.address?.region,
    website: brewery.website,
    origins,
    closed: brewery.closed,
    status: brewery.status,
    confidence: sourceConfidence(origins, brewery.website, brewery.closed),
    claimed: Boolean(brewery.claimedBy) || brewery.trustLevel === "verified_brewery",
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
