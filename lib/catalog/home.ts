import type { CatalogFile } from "@/lib/catalog/merge";

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

export function catalogCounts(catalog: CatalogFile): CatalogCounts {
  return {
    breweries: catalog.breweries.length,
    beers: (catalog.beers ?? []).length,
  };
}

function byNewestThenName(a: { createdAt: string; name: string }, b: { createdAt: string; name: string }): number {
  const byDate = b.createdAt.localeCompare(a.createdAt);
  if (byDate !== 0) return byDate;
  return a.name.localeCompare(b.name, "nl");
}

function newest<T>(items: T[], compare: (a: T, b: T) => number, limit: number): T[] {
  return [...items].sort(compare).slice(0, limit);
}

export function recentBoardEntries(catalog: CatalogFile, limit = 6): RecentBoardEntry[] {
  if (limit <= 0) return [];

  const breweries = newest(catalog.breweries, byNewestThenName, limit).map((brewery) => ({
    kind: "brewery" as const,
    slug: brewery.slug,
    name: brewery.name,
    detail: brewery.address?.locality?.trim() || undefined,
    createdAt: brewery.createdAt,
  }));
  const beers = newest(catalog.beers ?? [], byNewestThenName, limit).map((beer) => ({
    kind: "beer" as const,
    slug: beer.slug,
    name: beer.name,
    detail: beer.breweryName,
    createdAt: beer.createdAt,
  }));

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
