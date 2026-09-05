import type { CatalogFile } from "@/lib/catalog/merge";
import type { Beer, Brewery } from "@/lib/schema";

export interface CatalogCounts {
  breweries: number;
  beers: number;
}

export interface RecentBoardEntry {
  kind: "brewery" | "beer";
  slug: string;
  name: string;
  detail?: string;
  createdAt: string;
}

type CatalogSlice = CatalogFile | Pick<CatalogFile, "breweries" | "beers">;

function previewKeysFrom(breweries: Brewery[]): Set<string> {
  return new Set(breweries.filter((brewery) => brewery.previewOnly).flatMap((brewery) => [brewery.id, brewery.slug]));
}

function isListedBeer(beer: Beer, previewKeys: Set<string>): boolean {
  return !beer.previewOnly && !previewKeys.has(beer.breweryId) && !(beer.brewerySlug && previewKeys.has(beer.brewerySlug));
}

export function catalogCounts(
  catalog: CatalogSlice,
  listedBreweries?: Brewery[],
  listedBeers?: Beer[],
): CatalogCounts {
  const previewKeys = previewKeysFrom(catalog.breweries);
  return {
    breweries: listedBreweries?.length ?? catalog.breweries.filter((brewery) => !brewery.previewOnly).length,
    beers: listedBeers?.length ?? (catalog.beers ?? []).filter((beer) => isListedBeer(beer, previewKeys)).length,
  };
}

function startsWithLetter(name: string): boolean {
  return /^\p{L}/u.test(name);
}

function byNewestThenName(
  a: { createdAt: string; name: string; detail?: string },
  b: { createdAt: string; name: string; detail?: string },
): number {
  const byDate = b.createdAt.localeCompare(a.createdAt);
  if (byDate !== 0) return byDate;
  const detailScore = Number(Boolean(b.detail)) - Number(Boolean(a.detail));
  if (detailScore !== 0) return detailScore;
  const letterScore = Number(startsWithLetter(b.name)) - Number(startsWithLetter(a.name));
  if (letterScore !== 0) return letterScore;
  return a.name.localeCompare(b.name, "nl");
}

function newest<T>(items: T[], compare: (a: T, b: T) => number, limit: number): T[] {
  return [...items].sort(compare).slice(0, limit);
}

export function recentBoardEntries(catalog: CatalogSlice, limit = 6): RecentBoardEntry[] {
  if (limit <= 0) return [];

  const previewKeys = previewKeysFrom(catalog.breweries);
  const breweries = newest(
    catalog.breweries
      .filter((brewery) => !brewery.previewOnly)
      .map((brewery) => ({
        kind: "brewery" as const,
        slug: brewery.slug,
        name: brewery.name,
        detail: brewery.address?.locality?.trim() || undefined,
        createdAt: brewery.createdAt,
      })),
    byNewestThenName,
    limit,
  );
  const beers = newest(
    (catalog.beers ?? [])
      .filter((beer) => isListedBeer(beer, previewKeys))
      .map((beer) => ({
        kind: "beer" as const,
        slug: beer.slug,
        name: beer.name,
        detail: beer.breweryName,
        createdAt: beer.createdAt,
      })),
    byNewestThenName,
    limit,
  );

  const mixed: RecentBoardEntry[] = [];
  let breweryIndex = 0;
  let beerIndex = 0;
  while (mixed.length < limit && (breweryIndex < breweries.length || beerIndex < beers.length)) {
    if (breweryIndex < breweries.length) mixed.push(breweries[breweryIndex++]);
    if (mixed.length >= limit) break;
    if (beerIndex < beers.length) mixed.push(beers[beerIndex++]);
  }

  return mixed.sort(byNewestThenName);
}
