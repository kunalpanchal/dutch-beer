import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Brewery } from "../schema";
import { mergeBeerRecords } from "./beers";

const capturedAt = "2026-08-31T00:00:00.000Z";

const jopen: Brewery = {
  id: "wd-q392195",
  slug: "jopen",
  name: "Jopen",
  status: "pending_review",
  createdAt: capturedAt,
  updatedAt: capturedAt,
  trustLevel: "new",
  sources: [],
  website: "https://www.jopen.nl",
  externalIds: { wikidata: "Q392195" },
};

describe("mergeBeerRecords", () => {
  it("links a Wikidata beer to a catalog brewery and stays pending", () => {
    const beers = mergeBeerRecords(
      [
        {
          name: "Hoppenbier",
          breweryWikidataId: "Q392195",
          breweryName: "Jopen Haarlem",
          style: "Pale ale",
          abv: 6.8,
          wikidataId: "Q123",
          sourceUrl: "https://www.wikidata.org/wiki/Q123",
        },
      ],
      [jopen],
      capturedAt,
    );

    assert.equal(beers.length, 1);
    assert.equal(beers[0].status, "pending_review");
    assert.equal(beers[0].breweryId, "wd-q392195");
    assert.equal(beers[0].brewerySlug, "jopen");
    assert.equal(beers[0].breweryName, "Jopen");
    assert.equal(beers[0].name, "Hoppenbier");
    assert.equal(beers[0].style, "Pale ale");
    assert.equal(beers[0].abv, 6.8);
    assert.equal(beers[0].website, "https://www.jopen.nl");
    assert.equal(beers[0].externalIds?.wikidata, "Q123");
    assert.ok(beers[0].sources.some((source) => source.origin === "wikidata"));
  });

  it("keeps an unmatched manufacturer as a Wikidata brewery id", () => {
    const beers = mergeBeerRecords(
      [
        {
          name: "Unknown Pint",
          breweryWikidataId: "Q999",
          breweryName: "Ghost Brewery",
          wikidataId: "Q1",
          sourceUrl: "https://www.wikidata.org/wiki/Q1",
        },
      ],
      [jopen],
      capturedAt,
    );
    assert.equal(beers[0].breweryId, "wd-q999");
    assert.equal(beers[0].breweryName, "Ghost Brewery");
    assert.equal(beers[0].brewerySlug, undefined);
  });

  it("deduplicates the same Wikidata id", () => {
    const beers = mergeBeerRecords(
      [
        {
          name: "Hoppenbier",
          wikidataId: "Q123",
          sourceUrl: "https://www.wikidata.org/wiki/Q123",
        },
        {
          name: "Hoppenbier",
          abv: 6.8,
          wikidataId: "Q123",
          sourceUrl: "https://www.wikidata.org/wiki/Q123",
        },
      ],
      [jopen],
      capturedAt,
    );
    assert.equal(beers.length, 1);
    assert.equal(beers[0].abv, 6.8);
  });
});
