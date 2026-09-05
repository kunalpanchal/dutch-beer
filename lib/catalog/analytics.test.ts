import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  abvBucket,
  buildAnalyticsPayload,
  classifyOperationalModel,
  classifyStyleGroup,
  computeAnalyticsSnapshot,
  type AnalyticsEnrichment,
} from "./analytics";
import type { Beer, Brewery } from "@/lib/schema";

function brewery(partial: Partial<Brewery> & Pick<Brewery, "id" | "slug" | "name">): Brewery {
  return {
    status: "pending_review",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    trustLevel: "new",
    sources: [],
    ...partial,
  };
}

function beer(partial: Partial<Beer> & Pick<Beer, "id" | "slug" | "name" | "breweryId" | "breweryName">): Beer {
  return {
    status: "pending_review",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    trustLevel: "new",
    sources: [],
    ...partial,
  };
}

const emptyEnrichment: AnalyticsEnrichment = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  foundedByWikidata: {},
  breweryTypeByObdb: {},
};

describe("classifyStyleGroup", () => {
  it("maps common Dutch craft styles into primary groups", () => {
    assert.equal(classifyStyleGroup("American India Pale Ale"), "IPA");
    assert.equal(classifyStyleGroup("imperial stout"), "Stout");
    assert.equal(classifyStyleGroup("tripel"), "Trappist/Abbey");
    assert.equal(classifyStyleGroup("bokbier"), "Bock");
    assert.equal(classifyStyleGroup("sour beer"), "Sours");
    assert.equal(classifyStyleGroup("pils"), "Lager");
    assert.equal(classifyStyleGroup("saison"), "Other");
  });
});

describe("abvBucket", () => {
  it("bins ABV into the requested ranges", () => {
    assert.equal(abvBucket(3.5), "<4%");
    assert.equal(abvBucket(5), "4–6%");
    assert.equal(abvBucket(7), "6–8%");
    assert.equal(abvBucket(9), "8–10%");
    assert.equal(abvBucket(11), ">10%");
    assert.equal(abvBucket(undefined), null);
  });
});

describe("classifyOperationalModel", () => {
  it("treats contract OBDB types and missing sites as contract/gypsy", () => {
    assert.equal(classifyOperationalModel(brewery({ id: "a", slug: "a", name: "A" }), "contract"), "contract");
    assert.equal(classifyOperationalModel(brewery({ id: "b", slug: "b", name: "B" })), "contract");
  });

  it("treats known localities and brewpubs as physical", () => {
    assert.equal(
      classifyOperationalModel(
        brewery({
          id: "c",
          slug: "c",
          name: "C",
          address: { locality: "Amsterdam", countryCode: "NL" },
        }),
      ),
      "physical",
    );
    assert.equal(classifyOperationalModel(brewery({ id: "d", slug: "d", name: "D" }), "brewpub"), "physical");
  });
});

describe("computeAnalyticsSnapshot", () => {
  it("filters by province and active-only, and surfaces overview cards", () => {
    const enrichment: AnalyticsEnrichment = {
      ...emptyEnrichment,
      foundedByWikidata: { Q1: 1985, Q2: 2010, Q3: 1600 },
      breweryTypeByObdb: { "obdb-1": "contract" },
    };
    const payload = buildAnalyticsPayload(
      [
        brewery({
          id: "wd-q1",
          slug: "old-amsterdam",
          name: "Old Amsterdam",
          externalIds: { wikidata: "Q1" },
          address: { locality: "Amsterdam", region: "Noord-Holland", countryCode: "NL" },
        }),
        brewery({
          id: "wd-q2",
          slug: "rotterdam-hop",
          name: "Rotterdam Hop",
          externalIds: { wikidata: "Q2" },
          address: { locality: "Rotterdam", region: "Zuid-Holland", countryCode: "NL" },
        }),
        brewery({
          id: "wd-q3",
          slug: "closed-leiden",
          name: "Closed Leiden",
          closed: true,
          externalIds: { wikidata: "Q3" },
          address: { locality: "Leiden", region: "Zuid-Holland", countryCode: "NL" },
        }),
        brewery({
          id: "obdb-x",
          slug: "gypsy",
          name: "Gypsy Co",
          externalIds: { openBreweryDb: "obdb-1" },
        }),
      ],
      [
        beer({
          id: "b1",
          slug: "ipa-1",
          name: "IPA One",
          breweryId: "wd-q1",
          breweryName: "Old Amsterdam",
          brewerySlug: "old-amsterdam",
          style: "American India Pale Ale",
          abv: 6.5,
        }),
        beer({
          id: "b2",
          slug: "stout-1",
          name: "Stout One",
          breweryId: "wd-q2",
          breweryName: "Rotterdam Hop",
          brewerySlug: "rotterdam-hop",
          style: "imperial stout",
          abv: 11,
        }),
        beer({
          id: "b3",
          slug: "closed-beer",
          name: "Closed Beer",
          breweryId: "wd-q3",
          breweryName: "Closed Leiden",
          brewerySlug: "closed-leiden",
          style: "pils",
          abv: 5,
        }),
      ],
      enrichment,
    );

    const all = computeAnalyticsSnapshot(payload);
    assert.equal(all.overview.activeBreweries, 3);
    assert.equal(all.overview.contractBrewers, 1);
    assert.equal(all.overview.indexedBeers, 3);
    assert.equal(all.overview.mostPopularStyle, "American India Pale Ale");
    assert.equal(all.overview.oldestActiveBrewery?.slug, "old-amsterdam");
    assert.equal(all.overview.oldestActiveBrewery?.year, 1985);
    assert.ok(all.provinces.some((row) => row.name === "Zuid-Holland" && row.count === 2));
    assert.ok(all.growth.some((row) => row.name === "1980s" && row.count === 1));
    assert.ok(all.abv.some((row) => row.name === ">10%" && row.count === 1));

    const south = computeAnalyticsSnapshot(payload, { province: "Zuid-Holland", activeOnly: true });
    assert.equal(south.overview.activeBreweries, 1);
    assert.equal(south.overview.indexedBeers, 1);
    assert.equal(south.overview.mostPopularStyle, "imperial stout");
    assert.deepEqual(
      south.cities.map((row) => row.name),
      ["Rotterdam"],
    );
  });
});
