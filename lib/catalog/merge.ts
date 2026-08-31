import type { Beer, Brewery, OpenDataOrigin, Provenance } from "@/lib/schema";
import {
  canonicalWebsite,
  hostnameFromUrl,
  normalizeLocality,
  normalizeName,
  normalizeProvince,
  slugify,
} from "@/lib/catalog/normalize";

export interface SourceRecord {
  origin: OpenDataOrigin;
  name: string;
  website?: string;
  locality?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  sourceUrl: string;
  externalId: string;
  closed?: boolean;
  senb?: string;
  wikidataId?: string;
  note?: string;
}

export interface CatalogMeta {
  generatedAt: string;
  sources: Record<OpenDataOrigin, { fetchedAt: string; count: number }>;
}

export interface CatalogFile extends CatalogMeta {
  breweries: Brewery[];
  beers?: Beer[];
  beerSources?: { wikidata: { fetchedAt: string; count: number } };
}

const ORIGIN_NOTE: Record<OpenDataOrigin, string> = {
  wikidata: "Wikidata (CC0)",
  open_brewery_db: "Open Brewery DB (MIT)",
  openstreetmap: "OpenStreetMap (ODbL)",
};

type Rank = Record<OpenDataOrigin, number>;

const NAME_RANK: Rank = { wikidata: 0, open_brewery_db: 1, openstreetmap: 2 };
const WEB_RANK: Rank = { wikidata: 0, open_brewery_db: 1, openstreetmap: 2 };
const PLACE_RANK: Rank = { openstreetmap: 0, open_brewery_db: 1, wikidata: 2 };
const COORD_RANK: Rank = { wikidata: 0, openstreetmap: 1, open_brewery_db: 2 };

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
  }

  find(index: number): number {
    let current = index;
    while (this.parent[current] !== current) {
      this.parent[current] = this.parent[this.parent[current]];
      current = this.parent[current];
    }
    return current;
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent[rootB] = rootA;
  }
}

function link(unions: UnionFind, map: Map<string, number>, key: string | undefined, index: number): void {
  if (!key) return;
  const existing = map.get(key);
  if (existing === undefined) map.set(key, index);
  else unions.union(existing, index);
}

function pickString(
  records: SourceRecord[],
  rank: Rank,
  read: (record: SourceRecord) => string | undefined,
): string | undefined {
  const ranked = [...records].sort((a, b) => rank[a.origin] - rank[b.origin]);
  for (const record of ranked) {
    const value = read(record)?.trim();
    if (value) return value;
  }
  return undefined;
}

function pickNumber(
  records: SourceRecord[],
  rank: Rank,
  read: (record: SourceRecord) => number | undefined,
): number | undefined {
  const ranked = [...records].sort((a, b) => rank[a.origin] - rank[b.origin]);
  for (const record of ranked) {
    const value = read(record);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function breweryId(records: SourceRecord[]): string {
  const wikidata = records.find((record) => record.wikidataId)?.wikidataId;
  if (wikidata) return `wd-${wikidata.toLowerCase()}`;
  const obdb = records.find((record) => record.origin === "open_brewery_db");
  if (obdb) return `obdb-${obdb.externalId}`;
  const osm = records.find((record) => record.origin === "openstreetmap");
  return `osm-${osm?.externalId.replace("/", "-") ?? "unknown"}`;
}

function uniqueSlug(name: string, locality: string | undefined, used: Set<string>): string {
  const base = slugify(name);
  const withPlace = locality ? `${base}-${slugify(locality)}` : base;
  let slug = used.has(base) && locality ? withPlace : base;
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let suffix = 2;
  while (used.has(`${slug}-${suffix}`)) suffix += 1;
  slug = `${slug}-${suffix}`;
  used.add(slug);
  return slug;
}

export function sourceConfidence(
  origins: OpenDataOrigin[],
  website?: string,
  closed?: boolean,
): "high" | "medium" | "low" {
  const unique = new Set(origins);
  if (unique.size >= 3 && website && !closed) return "high";
  if (unique.size >= 2 && !closed) return "medium";
  return "low";
}

export function mergeSourceRecords(records: SourceRecord[], capturedAt: string): Brewery[] {
  const usable = records.filter((record) => record.name.trim());
  const unions = new UnionFind(usable.length);
  const byWikidata = new Map<string, number>();
  const byHost = new Map<string, number>();
  const byNamePlace = new Map<string, number>();
  const byName = new Map<string, number[]>();

  usable.forEach((record, index) => {
    link(unions, byWikidata, record.wikidataId?.toUpperCase(), index);
    link(unions, byHost, hostnameFromUrl(record.website), index);
    const name = normalizeName(record.name);
    const place = record.locality ? normalizeLocality(record.locality) : "";
    if (name && place) link(unions, byNamePlace, `${name}|${place}`, index);
    if (name) {
      const list = byName.get(name) ?? [];
      list.push(index);
      byName.set(name, list);
    }
  });

  for (const indexes of byName.values()) {
    if (indexes.length !== 2) continue;
    const [first, second] = indexes;
    const placeA = usable[first].locality ? normalizeLocality(usable[first].locality ?? "") : "";
    const placeB = usable[second].locality ? normalizeLocality(usable[second].locality ?? "") : "";
    if (!placeA || !placeB || placeA === placeB) unions.union(first, second);
  }

  const groups = new Map<number, SourceRecord[]>();
  usable.forEach((record, index) => {
    const root = unions.find(index);
    const list = groups.get(root) ?? [];
    list.push(record);
    groups.set(root, list);
  });

  const usedSlugs = new Set<string>();
  const breweries: Brewery[] = [];

  for (const clustered of groups.values()) {
    const recordsInCluster = [...clustered];
    const name = pickString(recordsInCluster, NAME_RANK, (record) => record.name) ?? "Unknown brewery";
    const website = canonicalWebsite(pickString(recordsInCluster, WEB_RANK, (record) => record.website));
    const locality = pickString(recordsInCluster, PLACE_RANK, (record) => record.locality);
    const region = normalizeProvince(pickString(recordsInCluster, PLACE_RANK, (record) => record.region));
    const latitude = pickNumber(recordsInCluster, COORD_RANK, (record) => record.latitude);
    const longitude = pickNumber(recordsInCluster, COORD_RANK, (record) => record.longitude);
    const closed = recordsInCluster.some((record) => record.closed);
    const sources: Provenance[] = recordsInCluster.map((record) => ({
      sourceKind: "open_data" as const,
      url: record.sourceUrl,
      note: record.note ?? ORIGIN_NOTE[record.origin],
      capturedAt,
      origin: record.origin,
    }));
    if (website) {
      sources.push({ sourceKind: "official_website", url: website, capturedAt });
    }

    const address =
      locality || region || latitude !== undefined
        ? {
            locality: locality ?? "",
            region,
            countryCode: "NL" as const,
            latitude,
            longitude,
          }
        : undefined;

    breweries.push({
      id: breweryId(recordsInCluster),
      slug: uniqueSlug(name, locality, usedSlugs),
      name,
      website,
      address,
      status: "pending_review",
      createdAt: capturedAt,
      updatedAt: capturedAt,
      createdBy: "open-data-import",
      trustLevel: "new",
      sources,
      closed: closed || undefined,
      externalIds: {
        wikidata: recordsInCluster.find((record) => record.wikidataId)?.wikidataId,
        openBreweryDb: recordsInCluster.find((record) => record.origin === "open_brewery_db")?.externalId,
        osm: recordsInCluster.find((record) => record.origin === "openstreetmap")?.externalId,
        senb: recordsInCluster.find((record) => record.senb)?.senb,
      },
    });
  }

  return breweries.sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function breweryOrigins(brewery: Brewery): OpenDataOrigin[] {
  return [
    ...new Set(
      brewery.sources
        .map((source) => source.origin)
        .filter((origin): origin is OpenDataOrigin => Boolean(origin)),
    ),
  ];
}
