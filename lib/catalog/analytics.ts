import { DUTCH_PROVINCES, normalizeProvince } from "@/lib/catalog/normalize";
import type { Beer, Brewery } from "@/lib/schema";

export type StyleGroup = "IPA" | "Stout" | "Trappist/Abbey" | "Bock" | "Sours" | "Lager" | "Other";
export type OperationalModel = "physical" | "contract";
export type AbvBucket = "<4%" | "4–6%" | "6–8%" | "8–10%" | ">10%";

export interface AnalyticsEnrichment {
  generatedAt: string;
  foundedByWikidata: Record<string, number>;
  breweryTypeByObdb: Record<string, string>;
}

export interface AnalyticsBreweryRow {
  slug: string;
  name: string;
  region?: string;
  locality?: string;
  closed: boolean;
  foundedYear?: number;
  operational: OperationalModel;
  breweryType?: string;
}

export interface AnalyticsBeerRow {
  slug: string;
  name: string;
  brewerySlug?: string;
  region?: string;
  style?: string;
  styleGroup: StyleGroup;
  abv?: number;
  breweryClosed: boolean;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface AnalyticsOverview {
  activeBreweries: number;
  contractBrewers: number;
  indexedBeers: number;
  mostPopularStyle: string | null;
  oldestActiveBrewery: { name: string; slug: string; year: number } | null;
}

export interface AnalyticsSnapshot {
  overview: AnalyticsOverview;
  provinces: NamedCount[];
  cities: NamedCount[];
  growth: NamedCount[];
  styleGroups: NamedCount[];
  operational: NamedCount[];
  abv: NamedCount[];
  coverage: {
    breweriesWithRegion: number;
    breweriesWithFoundedYear: number;
    beersWithStyle: number;
    beersWithAbv: number;
    breweryTotal: number;
    beerTotal: number;
  };
}

export interface AnalyticsPayload {
  generatedAt: string;
  provinces: string[];
  breweries: AnalyticsBreweryRow[];
  beers: AnalyticsBeerRow[];
}

const CONTRACT_TYPE = new Set(["contract", "proprietor"]);
const PHYSICAL_TYPE = new Set(["micro", "brewpub", "regional", "large", "planning", "bar", "nano"]);

export function classifyOperationalModel(
  brewery: Pick<Brewery, "address" | "taproom" | "externalIds">,
  breweryType?: string,
): OperationalModel {
  const type = breweryType?.toLowerCase();
  if (type && CONTRACT_TYPE.has(type)) return "contract";
  if (type && PHYSICAL_TYPE.has(type)) return "physical";
  if (brewery.taproom) return "physical";
  const locality = brewery.address?.locality?.trim();
  const hasCoords = brewery.address?.latitude != null && brewery.address?.longitude != null;
  if (locality || hasCoords) return "physical";
  return "contract";
}

export function classifyStyleGroup(style: string | undefined): StyleGroup {
  if (!style?.trim()) return "Other";
  const value = style.toLowerCase();
  if (/\b(ipa|neipa|dipa)\b/.test(value) || value.includes("india pale")) return "IPA";
  if (/\b(stout|porter)\b/.test(value)) return "Stout";
  if (/\b(trappist|abbey|abdij|tripel|dubbel|quadrupel|quad|belgian strong)\b/.test(value)) return "Trappist/Abbey";
  if (/\b(bok|bock|dubbelbok|ijsbock)\b/.test(value) || /bokbier|bockbier/.test(value)) return "Bock";
  if (/\b(sour|zuur|gose|lambic|berliner|wild ale|spontaneous|flanders|oud bruin)\b/.test(value)) return "Sours";
  if (/\b(lager|pils|pilsner|pilsener|helles|export|märzen|marzen|kellerbier)\b/.test(value)) return "Lager";
  return "Other";
}

export function abvBucket(abv: number | undefined): AbvBucket | null {
  if (abv == null || !Number.isFinite(abv)) return null;
  if (abv < 4) return "<4%";
  if (abv < 6) return "4–6%";
  if (abv < 8) return "6–8%";
  if (abv < 10) return "8–10%";
  return ">10%";
}

function decadeLabel(year: number): string {
  const start = Math.floor(year / 10) * 10;
  return `${start}s`;
}

function topCounts(counter: Map<string, number>, limit: number): NamedCount[] {
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"))
    .slice(0, limit);
}

function allCounts(counter: Map<string, number>, order?: string[]): NamedCount[] {
  if (order) {
    return order.map((name) => ({ name, count: counter.get(name) ?? 0 }));
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"));
}

export function toAnalyticsBreweryRow(
  brewery: Brewery,
  enrichment: AnalyticsEnrichment,
): AnalyticsBreweryRow {
  const wikidata = brewery.externalIds?.wikidata;
  const obdb = brewery.externalIds?.openBreweryDb;
  const breweryType = obdb ? enrichment.breweryTypeByObdb[obdb] : undefined;
  const foundedYear = wikidata ? enrichment.foundedByWikidata[wikidata] : undefined;
  const region = normalizeProvince(brewery.address?.region) ?? brewery.address?.region;
  return {
    slug: brewery.slug,
    name: brewery.name,
    region: region || undefined,
    locality: brewery.address?.locality?.trim() || undefined,
    closed: Boolean(brewery.closed),
    foundedYear,
    operational: classifyOperationalModel(brewery, breweryType),
    breweryType,
  };
}

export function toAnalyticsBeerRow(
  beer: Beer,
  breweryBySlug: Map<string, AnalyticsBreweryRow>,
  breweryById: Map<string, AnalyticsBreweryRow>,
): AnalyticsBeerRow {
  const brewery =
    (beer.brewerySlug ? breweryBySlug.get(beer.brewerySlug) : undefined) ??
    breweryById.get(beer.breweryId);
  return {
    slug: beer.slug,
    name: beer.name,
    brewerySlug: brewery?.slug ?? beer.brewerySlug,
    region: brewery?.region,
    style: beer.style,
    styleGroup: classifyStyleGroup(beer.style),
    abv: beer.abv,
    breweryClosed: brewery?.closed ?? false,
  };
}

export function buildAnalyticsPayload(
  breweries: Brewery[],
  beers: Beer[],
  enrichment: AnalyticsEnrichment,
): AnalyticsPayload {
  const breweryRows = breweries.map((brewery) => toAnalyticsBreweryRow(brewery, enrichment));
  const bySlug = new Map(breweryRows.map((row) => [row.slug, row]));
  const byId = new Map(
    breweries.map((brewery, index) => [brewery.id, breweryRows[index]] as const),
  );
  const beerRows = beers.map((beer) => toAnalyticsBeerRow(beer, bySlug, byId));
  const provinces = [
    ...new Set(
      breweryRows
        .map((row) => row.region)
        .filter((region): region is string => Boolean(region)),
    ),
  ].sort((a, b) => a.localeCompare(b, "nl"));

  return {
    generatedAt: enrichment.generatedAt || new Date().toISOString(),
    provinces: provinces.length ? provinces : [...DUTCH_PROVINCES],
    breweries: breweryRows,
    beers: beerRows,
  };
}

export function computeAnalyticsSnapshot(
  payload: AnalyticsPayload,
  options: { province?: string; activeOnly?: boolean } = {},
): AnalyticsSnapshot {
  const province = options.province?.trim() || "";
  const activeOnly = Boolean(options.activeOnly);

  const breweries = payload.breweries.filter((brewery) => {
    if (province && brewery.region !== province) return false;
    if (activeOnly && brewery.closed) return false;
    return true;
  });
  const brewerySlugs = new Set(breweries.map((brewery) => brewery.slug));

  const beers = payload.beers.filter((beer) => {
    if (province) {
      if (beer.region) {
        if (beer.region !== province) return false;
      } else if (!beer.brewerySlug || !brewerySlugs.has(beer.brewerySlug)) {
        return false;
      }
    }
    if (activeOnly && beer.breweryClosed) return false;
    return true;
  });

  const provinceCounter = new Map<string, number>();
  const cityCounter = new Map<string, number>();
  const growthCounter = new Map<string, number>();
  const styleGroupCounter = new Map<string, number>();
  const rawStyleCounter = new Map<string, number>();
  const operationalCounter = new Map<string, number>([
    ["physical", 0],
    ["contract", 0],
  ]);
  const abvCounter = new Map<string, number>([
    ["<4%", 0],
    ["4–6%", 0],
    ["6–8%", 0],
    ["8–10%", 0],
    [">10%", 0],
  ]);

  let withRegion = 0;
  let withFounded = 0;
  let oldest: AnalyticsOverview["oldestActiveBrewery"] = null;

  for (const brewery of breweries) {
    if (brewery.region) {
      withRegion += 1;
      provinceCounter.set(brewery.region, (provinceCounter.get(brewery.region) ?? 0) + 1);
    }
    if (brewery.locality) {
      cityCounter.set(brewery.locality, (cityCounter.get(brewery.locality) ?? 0) + 1);
    }
    if (brewery.foundedYear != null) {
      withFounded += 1;
      const label = decadeLabel(brewery.foundedYear);
      growthCounter.set(label, (growthCounter.get(label) ?? 0) + 1);
      if (!brewery.closed) {
        if (!oldest || brewery.foundedYear < oldest.year) {
          oldest = { name: brewery.name, slug: brewery.slug, year: brewery.foundedYear };
        }
      }
    }
    operationalCounter.set(
      brewery.operational,
      (operationalCounter.get(brewery.operational) ?? 0) + 1,
    );
  }

  let withStyle = 0;
  let withAbv = 0;
  for (const beer of beers) {
    styleGroupCounter.set(beer.styleGroup, (styleGroupCounter.get(beer.styleGroup) ?? 0) + 1);
    if (beer.style) {
      withStyle += 1;
      rawStyleCounter.set(beer.style, (rawStyleCounter.get(beer.style) ?? 0) + 1);
    }
    const bucket = abvBucket(beer.abv);
    if (bucket) {
      withAbv += 1;
      abvCounter.set(bucket, (abvCounter.get(bucket) ?? 0) + 1);
    }
  }

  const mostPopular = topCounts(rawStyleCounter, 1)[0]?.name ?? null;
  const activeBreweries = breweries.filter((brewery) => !brewery.closed).length;
  const contractBrewers = breweries.filter(
    (brewery) => brewery.operational === "contract" && !brewery.closed,
  ).length;

  const growth = [...growthCounter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10));

  return {
    overview: {
      activeBreweries,
      contractBrewers,
      indexedBeers: beers.length,
      mostPopularStyle: mostPopular,
      oldestActiveBrewery: oldest,
    },
    provinces: topCounts(provinceCounter, 10),
    cities: topCounts(cityCounter, 10),
    growth,
    styleGroups: allCounts(styleGroupCounter, [
      "IPA",
      "Stout",
      "Trappist/Abbey",
      "Bock",
      "Sours",
      "Lager",
      "Other",
    ]),
    operational: allCounts(operationalCounter, ["physical", "contract"]),
    abv: allCounts(abvCounter, ["<4%", "4–6%", "6–8%", "8–10%", ">10%"]),
    coverage: {
      breweriesWithRegion: withRegion,
      breweriesWithFoundedYear: withFounded,
      beersWithStyle: withStyle,
      beersWithAbv: withAbv,
      breweryTotal: breweries.length,
      beerTotal: beers.length,
    },
  };
}

export function analyticsExportRows(
  payload: AnalyticsPayload,
  options: { province?: string; activeOnly?: boolean } = {},
): {
  overview: AnalyticsOverview;
  provinces: NamedCount[];
  cities: NamedCount[];
  growth: NamedCount[];
  styleGroups: NamedCount[];
  operational: NamedCount[];
  abv: NamedCount[];
} {
  const snapshot = computeAnalyticsSnapshot(payload, options);
  return {
    overview: snapshot.overview,
    provinces: snapshot.provinces,
    cities: snapshot.cities,
    growth: snapshot.growth,
    styleGroups: snapshot.styleGroups,
    operational: snapshot.operational,
    abv: snapshot.abv,
  };
}
