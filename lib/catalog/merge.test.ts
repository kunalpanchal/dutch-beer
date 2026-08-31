import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeSourceRecords, sourceConfidence, type SourceRecord } from "@/lib/catalog/merge";

const capturedAt = "2026-08-31T00:00:00.000Z";

function record(partial: Partial<SourceRecord> & Pick<SourceRecord, "origin" | "name" | "sourceUrl" | "externalId">): SourceRecord {
  return partial;
}

describe("mergeSourceRecords", () => {
  it("merges Wikidata, Open Brewery DB, and OSM on website + wikidata id", () => {
    const breweries = mergeSourceRecords(
      [
        record({
          origin: "wikidata",
          name: "Jopen",
          website: "https://www.jopen.nl/",
          locality: "Haarlem",
          wikidataId: "Q1364325",
          sourceUrl: "https://www.wikidata.org/wiki/Q1364325",
          externalId: "Q1364325",
        }),
        record({
          origin: "open_brewery_db",
          name: "Jopen",
          website: "https://www.jopen.nl/haarlem/",
          locality: "Haarlem",
          region: "Noord-Holland",
          sourceUrl: "https://api.openbrewerydb.org/v1/breweries/jopen",
          externalId: "jopen-id",
        }),
        record({
          origin: "openstreetmap",
          name: "Jopenkerk",
          website: "https://jopen.nl",
          locality: "Haarlem",
          wikidataId: "Q1364325",
          sourceUrl: "https://www.openstreetmap.org/node/1",
          externalId: "node/1",
          latitude: 52.38,
          longitude: 4.63,
        }),
      ],
      capturedAt,
    );

    assert.equal(breweries.length, 1);
    const brewery = breweries[0];
    assert.equal(brewery.status, "pending_review");
    assert.equal(brewery.trustLevel, "new");
    assert.equal(brewery.name, "Jopen");
    assert.equal(brewery.externalIds?.wikidata, "Q1364325");
    assert.equal(brewery.externalIds?.osm, "node/1");
    assert.equal(brewery.address?.locality, "Haarlem");
    assert.equal(brewery.address?.region, "Noord-Holland");
    assert.equal(brewery.address?.latitude, 52.38);
    assert.ok(brewery.sources.some((source) => source.origin === "wikidata"));
    assert.ok(brewery.sources.some((source) => source.sourceKind === "official_website"));
    assert.equal(sourceConfidence(["wikidata", "open_brewery_db", "openstreetmap"], brewery.website, false), "high");
  });

  it("keeps unmatched records separate", () => {
    const breweries = mergeSourceRecords(
      [
        record({
          origin: "wikidata",
          name: "Brouwerij 't IJ",
          locality: "Amsterdam",
          wikidataId: "Q990529",
          sourceUrl: "https://www.wikidata.org/wiki/Q990529",
          externalId: "Q990529",
        }),
        record({
          origin: "open_brewery_db",
          name: "Texelse Bierbrouwerij",
          locality: "Oudeschild",
          sourceUrl: "https://api.openbrewerydb.org/v1/breweries/texels",
          externalId: "texels",
        }),
      ],
      capturedAt,
    );
    assert.equal(breweries.length, 2);
    assert.ok(breweries.every((brewery) => brewery.status === "pending_review"));
  });

  it("does not publish imported records", () => {
    const breweries = mergeSourceRecords(
      [
        record({
          origin: "open_brewery_db",
          name: "Closed Example",
          closed: true,
          sourceUrl: "https://api.openbrewerydb.org/v1/breweries/closed",
          externalId: "closed",
        }),
      ],
      capturedAt,
    );
    assert.equal(breweries[0].status, "pending_review");
    assert.equal(breweries[0].closed, true);
  });
});
