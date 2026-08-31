import type { Beer, Brewery, Provenance } from "@/lib/schema";
import { canonicalWebsite, slugify } from "@/lib/catalog/normalize";

export interface BeerSourceRecord {
  name: string;
  breweryWikidataId?: string;
  breweryName?: string;
  style?: string;
  abv?: number;
  website?: string;
  senb?: string;
  wikidataId: string;
  sourceUrl: string;
}

const GENERIC_STYLES = new Set(["beer", "bier", "biermerk", "beer brand", "beers"]);

function uniqueSlug(name: string, breweryName: string | undefined, used: Set<string>): string {
  const base = slugify(name);
  const withBrewery = breweryName ? `${base}-${slugify(breweryName)}` : base;
  let slug = used.has(base) && breweryName ? withBrewery : base;
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

export function mergeBeerRecords(
  records: BeerSourceRecord[],
  breweries: Brewery[],
  capturedAt: string,
): Beer[] {
  const byWikidata = new Map(
    breweries
      .filter((brewery) => brewery.externalIds?.wikidata)
      .map((brewery) => [brewery.externalIds!.wikidata!.toUpperCase(), brewery]),
  );
  const usedSlugs = new Set<string>();
  const byId = new Map<string, BeerSourceRecord>();

  for (const record of records) {
    const id = record.wikidataId.toUpperCase();
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, record);
      continue;
    }
    byId.set(id, {
      ...existing,
      name: existing.name || record.name,
      breweryWikidataId: existing.breweryWikidataId ?? record.breweryWikidataId,
      breweryName: existing.breweryName ?? record.breweryName,
      style: existing.style ?? record.style,
      abv: existing.abv ?? record.abv,
      website: existing.website ?? record.website,
      senb: existing.senb ?? record.senb,
    });
  }

  const beers: Beer[] = [];
  for (const record of byId.values()) {
    const matched = record.breweryWikidataId
      ? byWikidata.get(record.breweryWikidataId.toUpperCase())
      : undefined;
    const breweryName = matched?.name ?? record.breweryName ?? "Unknown brewery";
    const website = canonicalWebsite(record.website) ?? matched?.website;
    const sources: Provenance[] = [
      {
        sourceKind: "open_data",
        url: record.sourceUrl,
        note: "Wikidata (CC0)",
        capturedAt,
        origin: "wikidata",
      },
    ];
    if (website) {
      sources.push({ sourceKind: "official_website", url: website, capturedAt });
    }

    beers.push({
      id: `wd-${record.wikidataId.toLowerCase()}`,
      slug: uniqueSlug(record.name, breweryName, usedSlugs),
      breweryId: matched?.id ?? (record.breweryWikidataId ? `wd-${record.breweryWikidataId.toLowerCase()}` : "unlinked"),
      breweryName,
      brewerySlug: matched?.slug,
      name: record.name,
      style: record.style,
      abv: record.abv,
      availability: "unknown",
      website,
      status: "pending_review",
      createdAt: capturedAt,
      updatedAt: capturedAt,
      createdBy: "open-data-import",
      trustLevel: "new",
      sources,
      externalIds: {
        wikidata: record.wikidataId,
        senb: record.senb,
      },
    });
  }

  return beers.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "nl");
    if (byName !== 0) return byName;
    return a.breweryName.localeCompare(b.breweryName, "nl");
  });
}

export function isGenericBeerStyle(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return GENERIC_STYLES.has(value.trim().toLowerCase());
}
