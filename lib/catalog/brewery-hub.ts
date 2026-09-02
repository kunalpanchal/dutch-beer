import type { Beer, Brewery, OpenDataOrigin, Provenance } from "@/lib/schema";

export const BREWERY_BEER_FILTER_THRESHOLD = 12;
/** @deprecated Use BREWERY_BEER_FILTER_THRESHOLD; kept for existing tests. */
export const BREWERY_BEER_SHEET_THRESHOLD = BREWERY_BEER_FILTER_THRESHOLD;

export function partitionBreweryBeers(beers: Beer[]): { featured: Beer[]; listed: Beer[] } {
  const featured = beers.filter((beer) => beer.availability === "year_round");
  if (!featured.length) return { featured: [], listed: beers };
  const featuredIds = new Set(featured.map((beer) => beer.id));
  return { featured, listed: beers.filter((beer) => !featuredIds.has(beer.id)) };
}

export function usesBeerFilter(count: number): boolean {
  return count > BREWERY_BEER_FILTER_THRESHOLD;
}

/** @deprecated Use usesBeerFilter. */
export function usesBeerSheet(count: number): boolean {
  return usesBeerFilter(count);
}

export function breweryIntro(
  brewery: Pick<Brewery, "name" | "description" | "closed">,
  templates: {
    intro: string;
    introNoPlace: string;
    introClosed: string;
    introClosedNoPlace: string;
  },
  place: string,
): string {
  if (brewery.description) return brewery.description;
  const closed = Boolean(brewery.closed);
  if (place) {
    const template = closed ? templates.introClosed : templates.intro;
    return template.replace("{name}", brewery.name).replace("{place}", place);
  }
  return (closed ? templates.introClosedNoPlace : templates.introNoPlace).replace("{name}", brewery.name);
}

export function hasVisitInfo(brewery: Pick<Brewery, "address" | "openingHours" | "telephone" | "taproom">): boolean {
  return Boolean(
    brewery.address?.street ||
      brewery.openingHours ||
      brewery.telephone ||
      brewery.taproom ||
      (brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined),
  );
}

export function formatStreetAddress(brewery: Pick<Brewery, "address">): string[] {
  const address = brewery.address;
  if (!address) return [];
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityLine = [address.postalCode, address.locality].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (address.region) lines.push(address.region);
  return lines;
}

export function displayHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

export interface BrewerySourceLink {
  label: string;
  href?: string;
}

export interface BrewerySourceLabels {
  website: string;
  wikidata: string;
  open_brewery_db: string;
  openstreetmap: string;
}

function originKey(origin: OpenDataOrigin): string {
  return `origin:${origin}`;
}

function sourceHref(source: Provenance, brewery: Pick<Brewery, "website" | "externalIds">): string | undefined {
  if (source.origin === "wikidata" && brewery.externalIds?.wikidata) {
    return `https://www.wikidata.org/wiki/${brewery.externalIds.wikidata}`;
  }
  if (source.origin === "openstreetmap" && brewery.externalIds?.osm) {
    return `https://www.openstreetmap.org/${brewery.externalIds.osm}`;
  }
  if (source.sourceKind === "official_website") return source.url ?? brewery.website;
  return source.url;
}

function sourceLabel(source: Provenance, labels: BrewerySourceLabels): string | undefined {
  if (source.origin) return labels[source.origin];
  if (source.sourceKind === "official_website") return labels.website;
  if (source.note?.trim()) return source.note.trim();
  return undefined;
}

export function brewerySourceLinks(
  brewery: Pick<Brewery, "website" | "sources" | "externalIds">,
  labels: BrewerySourceLabels,
): BrewerySourceLink[] {
  const links: BrewerySourceLink[] = [];
  const seen = new Set<string>();

  const push = (key: string, label: string, href?: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ label, href });
  };

  if (brewery.website) push("website", labels.website, brewery.website);

  for (const source of brewery.sources) {
    const label = sourceLabel(source, labels);
    if (!label) continue;
    const key = source.origin ? originKey(source.origin) : source.sourceKind === "official_website" ? "website" : `${source.sourceKind}:${source.url ?? label}`;
    push(key, label, sourceHref(source, brewery));
  }

  if (brewery.externalIds?.wikidata) {
    push(originKey("wikidata"), labels.wikidata, `https://www.wikidata.org/wiki/${brewery.externalIds.wikidata}`);
  }
  if (brewery.externalIds?.osm) {
    push(originKey("openstreetmap"), labels.openstreetmap, `https://www.openstreetmap.org/${brewery.externalIds.osm}`);
  }

  return links;
}
