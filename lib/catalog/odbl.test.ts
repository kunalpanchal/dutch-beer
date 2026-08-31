import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Brewery } from "@/lib/schema";
import { sanitizeImportedBrewery } from "@/lib/catalog/odbl";

const capturedAt = "2026-08-31T00:00:00.000Z";

function brewery(partial: Partial<Brewery> & Pick<Brewery, "slug" | "name">): Brewery {
  return {
    id: partial.id ?? `osm-${partial.slug}`,
    status: "pending_review",
    createdAt: capturedAt,
    updatedAt: capturedAt,
    trustLevel: "new",
    sources: [],
    ...partial,
  };
}

describe("sanitizeImportedBrewery", () => {
  it("drops OSM-only listings that have no official website", () => {
    const result = sanitizeImportedBrewery(
      brewery({
        slug: "mystery-vat",
        name: "Mystery Vat",
        sources: [{ sourceKind: "open_data", origin: "openstreetmap", capturedAt, url: "https://www.openstreetmap.org/node/1" }],
        externalIds: { osm: "node/1" },
        address: { locality: "Utrecht", countryCode: "NL", latitude: 52.1, longitude: 5.1 },
      }),
    );
    assert.equal(result, null);
  });

  it("keeps OSM-only listings with a website, citing the site and dropping geometry", () => {
    const result = sanitizeImportedBrewery(
      brewery({
        slug: "de-school",
        name: "Brouwerij de School",
        website: "https://brouwerijdeschool.com/",
        sources: [{ sourceKind: "open_data", origin: "openstreetmap", capturedAt, url: "https://www.openstreetmap.org/node/2" }],
        externalIds: { osm: "node/2" },
        address: { locality: "Badhoevedorp", countryCode: "NL", latitude: 52.3, longitude: 4.7 },
      }),
    );
    assert.ok(result);
    assert.equal(result.address, undefined);
    assert.equal(result.externalIds?.osm, undefined);
    assert.ok(result.sources.every((source) => source.origin !== "openstreetmap"));
    assert.ok(result.sources.some((source) => source.sourceKind === "official_website" && source.url === "https://brouwerijdeschool.com/"));
  });

  it("strips OSM source and coordinates from mixed listings, keeps Wikidata facts", () => {
    const result = sanitizeImportedBrewery(
      brewery({
        id: "wd-q1",
        slug: "jopen",
        name: "Jopen",
        website: "https://www.jopen.nl/",
        sources: [
          { sourceKind: "open_data", origin: "wikidata", capturedAt, url: "https://www.wikidata.org/wiki/Q1" },
          { sourceKind: "open_data", origin: "openstreetmap", capturedAt, url: "https://www.openstreetmap.org/node/3" },
          { sourceKind: "official_website", url: "https://www.jopen.nl/", capturedAt },
        ],
        externalIds: { wikidata: "Q1", osm: "node/3" },
        address: { locality: "Haarlem", region: "Noord-Holland", countryCode: "NL", latitude: 52.38, longitude: 4.63 },
      }),
    );
    assert.ok(result);
    assert.equal(result.address?.locality, "Haarlem");
    assert.equal(result.address?.latitude, undefined);
    assert.equal(result.address?.longitude, undefined);
    assert.equal(result.externalIds?.wikidata, "Q1");
    assert.equal(result.externalIds?.osm, undefined);
    assert.equal(result.sources.some((source) => source.origin === "openstreetmap"), false);
    assert.ok(result.sources.some((source) => source.origin === "wikidata"));
  });
});
