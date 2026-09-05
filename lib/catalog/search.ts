import { slugify } from "@/lib/catalog/normalize";
import type { Beer, Brewery } from "@/lib/schema";

export type SearchKind = "brewery" | "place" | "beer" | "style";

export interface SearchDocument {
  kind: SearchKind;
  slug: string;
  name: string;
  detail?: string;
  /** Lowercased fields joined for matching. */
  haystack: string;
}

export interface SearchIndex {
  documents: SearchDocument[];
}

export interface SearchHit extends SearchDocument {
  score: number;
}

export interface GroupedSearchResults {
  query: string;
  breweries: SearchHit[];
  places: SearchHit[];
  beers: SearchHit[];
  styles: SearchHit[];
  flat: SearchHit[];
}

interface SearchPlace {
  slug: string;
  name: string;
  region?: string;
}

const LIMITS: Record<SearchKind, number> = {
  brewery: 6,
  place: 4,
  beer: 6,
  style: 4,
};

const PAGE_LIMITS: Record<SearchKind, number> = {
  brewery: 40,
  place: 24,
  beer: 40,
  style: 24,
};

function haystack(...parts: Array<string | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .toLowerCase();
}

function placesFromBreweries(breweries: Brewery[]): SearchPlace[] {
  const groups = new Map<string, { names: Map<string, number>; regions: Map<string, number> }>();
  for (const brewery of breweries) {
    const locality = brewery.address?.locality?.trim();
    if (!locality) continue;
    const slug = slugify(locality);
    const group = groups.get(slug) ?? { names: new Map(), regions: new Map() };
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function breweryDocuments(breweries: Brewery[]): SearchDocument[] {
  return breweries.map((brewery) => ({
    kind: "brewery" as const,
    slug: brewery.slug,
    name: brewery.name,
    detail: brewery.address?.locality?.trim() || undefined,
    haystack: haystack(
      brewery.name,
      brewery.address?.locality,
      brewery.address?.region,
      brewery.website,
    ),
  }));
}

export function placeDocuments(places: SearchPlace[]): SearchDocument[] {
  return places.map((place) => ({
    kind: "place" as const,
    slug: place.slug,
    name: place.name,
    detail: place.region,
    haystack: haystack(place.name, place.region),
  }));
}

export function beerDocuments(beers: Beer[]): SearchDocument[] {
  return beers.map((beer) => ({
    kind: "beer" as const,
    slug: beer.slug,
    name: beer.name,
    detail: [beer.breweryName, beer.style].filter(Boolean).join(" · ") || undefined,
    haystack: haystack(beer.name, beer.breweryName, beer.style),
  }));
}

export function styleDocuments(beers: Beer[]): SearchDocument[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const beer of beers) {
    const style = beer.style?.trim();
    if (!style) continue;
    const key = slugify(style);
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { name: style, count: 1 });
  }
  return [...counts.entries()]
    .map(([slug, { name, count }]) => ({
      kind: "style" as const,
      slug,
      name,
      detail: String(count),
      haystack: haystack(name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function buildSearchIndex(breweries: Brewery[], beers: Beer[]): SearchIndex {
  const places = placesFromBreweries(breweries);
  return {
    documents: [
      ...breweryDocuments(breweries),
      ...placeDocuments(places),
      ...beerDocuments(beers),
      ...styleDocuments(beers),
    ],
  };
}

function scoreDocument(document: SearchDocument, tokens: string[]): number | null {
  let score = 0;
  const name = document.name.toLowerCase();
  for (const token of tokens) {
    if (!document.haystack.includes(token)) return null;
    if (name === token) score += 120;
    else if (name.startsWith(token)) score += 80;
    else if (name.includes(token)) score += 40;
    else score += 10;
  }
  // Prefer shorter exact-ish names slightly.
  score += Math.max(0, 20 - document.name.length);
  return score;
}

function takeTop(hits: SearchHit[], limit: number): SearchHit[] {
  return hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "nl")).slice(0, limit);
}

export function querySearchIndex(
  index: SearchIndex | null | undefined,
  rawQuery: string,
  options?: { mode?: "suggest" | "page" },
): GroupedSearchResults {
  const query = rawQuery.trim();
  const empty: GroupedSearchResults = {
    query,
    breweries: [],
    places: [],
    beers: [],
    styles: [],
    flat: [],
  };
  if (!index || !query) return empty;

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return empty;

  const limits = options?.mode === "page" ? PAGE_LIMITS : LIMITS;
  const buckets: Record<SearchKind, SearchHit[]> = {
    brewery: [],
    place: [],
    beer: [],
    style: [],
  };

  for (const document of index.documents) {
    const score = scoreDocument(document, tokens);
    if (score === null) continue;
    buckets[document.kind].push({ ...document, score });
  }

  const breweries = takeTop(buckets.brewery, limits.brewery);
  const places = takeTop(buckets.place, limits.place);
  const beers = takeTop(buckets.beer, limits.beer);
  const styles = takeTop(buckets.style, limits.style);
  const flat = [...breweries, ...places, ...beers, ...styles];

  return { query, breweries, places, beers, styles, flat };
}

export function searchHref(
  locale: string,
  hit: Pick<SearchDocument, "kind" | "slug" | "name">,
): string {
  switch (hit.kind) {
    case "brewery":
      return `/${locale}/directory/breweries/${hit.slug}`;
    case "place":
      return `/${locale}/directory/places/${hit.slug}`;
    case "beer":
      return `/${locale}/directory/beers/${hit.slug}`;
    case "style":
      return `/${locale}/search?q=${encodeURIComponent(hit.name)}&kind=style`;
    default:
      return `/${locale}/search?q=${encodeURIComponent(hit.name)}`;
  }
}

export function searchResultsPath(locale: string, query: string, kind?: SearchKind): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (kind) params.set("kind", kind);
  const encoded = params.toString();
  return encoded ? `/${locale}/search?${encoded}` : `/${locale}/search`;
}
