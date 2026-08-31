import { readdir, readFile } from "fs/promises";
import path from "path";
import type { Beer, Brewery, Provenance, TrustLevel } from "@/lib/schema";
import { normalizeName } from "@/lib/catalog/normalize";

export const listingsRoot = path.join(process.cwd(), "data");

export interface BeerListingFile extends Partial<Beer> {
  slug: string;
  name: string;
  sources: Provenance[];
  brewery?: string;
  brewerySlug?: string;
}

export interface BreweryListingFile extends Partial<Brewery> {
  slug: string;
  name: string;
  sources: Provenance[];
}

async function readJsonDir<T>(directory: string): Promise<T[]> {
  let names: string[];
  try {
    names = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const records: T[] = [];
  for (const name of names) {
    const raw = await readFile(path.join(directory, name), "utf8");
    records.push(JSON.parse(raw) as T);
  }
  return records;
}

export async function loadBreweryListings(): Promise<BreweryListingFile[]> {
  return readJsonDir<BreweryListingFile>(path.join(listingsRoot, "breweries"));
}

export async function loadBeerListings(): Promise<BeerListingFile[]> {
  return readJsonDir<BeerListingFile>(path.join(listingsRoot, "beers"));
}

function mergeSources(base: Provenance[], extra: Provenance[] | undefined): Provenance[] {
  if (!extra?.length) return base;
  const seen = new Set(base.map((source) => `${source.sourceKind}|${source.url ?? ""}|${source.note ?? ""}`));
  const merged = [...base];
  for (const source of extra) {
    const key = `${source.sourceKind}|${source.url ?? ""}|${source.note ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(source);
  }
  return merged;
}

function listingTimestamp(listing: Partial<Brewery>, fallback: string): { createdAt: string; updatedAt: string } {
  const captured = listing.sources?.[0]?.capturedAt ?? fallback;
  return {
    createdAt: listing.createdAt ?? captured,
    updatedAt: listing.updatedAt ?? captured,
  };
}

export function listingToBrewery(listing: BreweryListingFile, now = new Date().toISOString()): Brewery {
  const times = listingTimestamp(listing, now);
  return {
    id: listing.id ?? `listing-${listing.slug}`,
    slug: listing.slug,
    name: listing.name,
    website: listing.website,
    address: listing.address,
    claimedBy: listing.claimedBy,
    externalIds: listing.externalIds,
    closed: listing.closed,
    description: listing.description,
    coverImage: listing.coverImage,
    logo: listing.logo,
    social: listing.social,
    telephone: listing.telephone,
    openingHours: listing.openingHours,
    taproom: listing.taproom,
    status: listing.status ?? "pending_review",
    createdAt: times.createdAt,
    updatedAt: times.updatedAt,
    createdBy: listing.createdBy,
    trustLevel: listing.trustLevel ?? "new",
    sources: listing.sources,
  };
}

export function applyBreweryOverlay(base: Brewery, overlay: BreweryListingFile): Brewery {
  const times = listingTimestamp(overlay, base.updatedAt);
  return {
    ...base,
    name: overlay.name || base.name,
    website: overlay.website ?? base.website,
    claimedBy: overlay.claimedBy ?? base.claimedBy,
    closed: overlay.closed ?? base.closed,
    description: overlay.description ?? base.description,
    coverImage: overlay.coverImage ?? base.coverImage,
    logo: overlay.logo ?? base.logo,
    telephone: overlay.telephone ?? base.telephone,
    openingHours: overlay.openingHours ?? base.openingHours,
    taproom: overlay.taproom ?? base.taproom,
    status: overlay.status ?? base.status,
    trustLevel: overlay.trustLevel ?? base.trustLevel,
    createdBy: overlay.createdBy ?? base.createdBy,
    createdAt: overlay.createdAt ?? base.createdAt,
    updatedAt: times.updatedAt,
    address: overlay.address ? { ...base.address, ...overlay.address, countryCode: overlay.address.countryCode ?? base.address?.countryCode ?? "NL" } : base.address,
    social: overlay.social ? { ...base.social, ...overlay.social } : base.social,
    externalIds: overlay.externalIds ? { ...base.externalIds, ...overlay.externalIds } : base.externalIds,
    sources: mergeSources(base.sources, overlay.sources),
  };
}

export function mergeBreweryListings(catalog: Brewery[], listings: BreweryListingFile[]): Brewery[] {
  const bySlug = new Map(catalog.map((brewery) => [brewery.slug, brewery]));
  for (const listing of listings) {
    const existing = bySlug.get(listing.slug);
    bySlug.set(listing.slug, existing ? applyBreweryOverlay(existing, listing) : listingToBrewery(listing));
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function resolveBeerListing(
  listing: BeerListingFile,
  breweries: Brewery[],
  now = new Date().toISOString(),
): Beer | undefined {
  const brewery =
    (listing.breweryId ? breweries.find((item) => item.id === listing.breweryId) : undefined) ??
    (listing.brewerySlug ? breweries.find((item) => item.slug === listing.brewerySlug) : undefined) ??
    (listing.brewery
      ? breweries.find((item) => normalizeName(item.name) === normalizeName(listing.brewery ?? ""))
      : undefined);
  if (!brewery) return undefined;
  const captured = listing.sources[0]?.capturedAt ?? now;
  return {
    id: listing.id ?? `beer-${listing.slug}`,
    slug: listing.slug,
    breweryId: brewery.id,
    name: listing.name,
    style: listing.style,
    abv: listing.abv,
    description: listing.description,
    availability: listing.availability,
    status: listing.status ?? "pending_review",
    createdAt: listing.createdAt ?? captured,
    updatedAt: listing.updatedAt ?? captured,
    createdBy: listing.createdBy,
    trustLevel: (listing.trustLevel as TrustLevel | undefined) ?? "new",
    sources: listing.sources,
  };
}

export function resolveBeerListings(listings: BeerListingFile[], breweries: Brewery[]): Beer[] {
  return listings
    .map((listing) => resolveBeerListing(listing, breweries))
    .filter((beer): beer is Beer => Boolean(beer))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}
