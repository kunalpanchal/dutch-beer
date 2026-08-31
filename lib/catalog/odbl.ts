import type { Brewery, Provenance } from "@/lib/schema";

const OSM = "openstreetmap";

export function isOsmOrigin(origin: string | undefined): boolean {
  return origin === OSM;
}

export function breweryHasOsmSource(brewery: Brewery): boolean {
  return Boolean(brewery.externalIds?.osm) || brewery.sources.some((source) => isOsmOrigin(source.origin));
}

export function breweryIsOsmOnly(brewery: Brewery): boolean {
  const origins = [
    ...new Set(brewery.sources.map((source) => source.origin).filter((origin): origin is NonNullable<typeof origin> => Boolean(origin))),
  ];
  return origins.length === 1 && origins[0] === OSM;
}

/**
 * OpenStreetMap is ODbL (share-alike). We do not copy OSM geometries or
 * OSM-only POIs without an independent website into the git catalog.
 * Mixed records keep Wikidata / Open Brewery DB facts; OSM is dropped as a source.
 */
export function sanitizeImportedBrewery(brewery: Brewery): Brewery | null {
  const osmOnly = breweryIsOsmOnly(brewery);
  if (osmOnly && !brewery.website) return null;

  const sources = stripOsmSources(brewery.sources, osmOnly ? brewery.website : undefined, latestCapturedAt(brewery));
  const externalIds = brewery.externalIds ? { ...brewery.externalIds } : undefined;
  if (externalIds) delete externalIds.osm;
  const hadOsm = breweryHasOsmSource(brewery);

  let address = brewery.address;
  if (osmOnly) {
    address = undefined;
  } else if (hadOsm && address) {
    address =
      address.locality || address.region
        ? { locality: address.locality, region: address.region, countryCode: address.countryCode }
        : undefined;
  }

  return {
    ...brewery,
    sources,
    address,
    externalIds: externalIds && Object.values(externalIds).some(Boolean) ? externalIds : undefined,
  };
}

function latestCapturedAt(brewery: Brewery): string {
  return brewery.sources.reduce((latest, source) => (source.capturedAt > latest ? source.capturedAt : latest), brewery.updatedAt);
}

function stripOsmSources(sources: Provenance[], website: string | undefined, capturedAt: string): Provenance[] {
  const kept = sources.filter((source) => !isOsmOrigin(source.origin));
  if (website && !kept.some((source) => source.sourceKind === "official_website" && source.url === website)) {
    kept.push({ sourceKind: "official_website", url: website, capturedAt });
  }
  return kept;
}
