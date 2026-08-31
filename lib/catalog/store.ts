import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import type { Brewery, OpenDataOrigin, PublicationStatus } from "@/lib/schema";
import { applyPublishedClaims, loadClaimFiles } from "@/lib/catalog/claims";
import type { CatalogFile } from "@/lib/catalog/merge";
import { breweryOrigins, sourceConfidence } from "@/lib/catalog/merge";

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

const loadClaims = cache(loadClaimFiles);

export async function listBreweries(): Promise<Brewery[]> {
  const [catalog, claims] = await Promise.all([loadCatalog(), loadClaims()]);
  return applyPublishedClaims(catalog.breweries, claims);
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

export function isLikelyCurrent(brewery: Brewery): boolean {
  return !brewery.closed && Boolean(brewery.website || breweryOrigins(brewery).length >= 2);
}

export function openStreetMapHref(latitude?: number, longitude?: number): string | undefined {
  if (latitude === undefined || longitude === undefined) return undefined;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export interface BreweryListItem {
  slug: string;
  name: string;
  locality?: string;
  region?: string;
  website?: string;
  mapHref?: string;
  origins: OpenDataOrigin[];
  closed?: boolean;
  claimed?: boolean;
  status: PublicationStatus;
  confidence: "high" | "medium" | "low";
}

export function toListItem(brewery: Brewery): BreweryListItem {
  const origins = breweryOrigins(brewery);
  return {
    slug: brewery.slug,
    name: brewery.name,
    locality: brewery.address?.locality || undefined,
    region: brewery.address?.region,
    website: brewery.website,
    mapHref: openStreetMapHref(brewery.address?.latitude, brewery.address?.longitude),
    origins,
    closed: brewery.closed,
    claimed: Boolean(brewery.claimedBy),
    status: brewery.status,
    confidence: sourceConfidence(origins, brewery.website, brewery.closed),
  };
}

export { breweryOrigins, sourceConfidence };
