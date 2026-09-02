import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import type { Beer, Brewery } from "../schema";
import { loadListingFiles } from "./listings";
import {
  breweryIntro,
  brewerySourceLinks,
  displayHostname,
  formatStreetAddress,
  hasVisitInfo,
  partitionBreweryBeers,
  usesBeerFilter,
} from "./brewery-hub";

const capturedAt = "2026-09-01T00:00:00.000Z";
const sourceLabels = {
  website: "Website",
  wikidata: "Wikidata",
  open_brewery_db: "Open Brewery DB",
  openstreetmap: "OpenStreetMap",
};

function beer(overrides: Partial<Beer> & Pick<Beer, "id" | "slug" | "name">): Beer {
  return {
    breweryId: "wd-test",
    breweryName: "Test",
    brewerySlug: "test",
    status: "pending_review",
    createdAt: capturedAt,
    updatedAt: capturedAt,
    trustLevel: "new",
    sources: [],
    availability: "unknown",
    ...overrides,
  };
}

describe("partitionBreweryBeers", () => {
  it("keeps an untagged catalog together so the brewery page can show one beer board", () => {
    const beers = [
      beer({ id: "a", slug: "alpha", name: "Alpha" }),
      beer({ id: "b", slug: "bravo", name: "Bravo", availability: "seasonal" }),
      beer({ id: "c", slug: "charlie", name: "Charlie", availability: "one_off" }),
    ];
    assert.deepEqual(partitionBreweryBeers(beers), { featured: [], listed: beers });
    assert.equal(usesBeerFilter(beers.length), false);
  });

  it("surfaces year-round beers as the core range and leaves the rest listed", () => {
    const core = beer({ id: "core", slug: "core", name: "Core", availability: "year_round" });
    const special = beer({ id: "special", slug: "special", name: "Special", availability: "one_off" });
    const unknown = beer({ id: "unknown", slug: "unknown", name: "Unknown" });
    assert.deepEqual(partitionBreweryBeers([special, core, unknown]), {
      featured: [core],
      listed: [special, unknown],
    });
  });

  it("adds a filter once a brewery catalog is too long to scan at a glance", () => {
    const beers = Array.from({ length: 13 }, (_, index) => beer({ id: `b${index}`, slug: `b-${index}`, name: `Beer ${index}` }));
    assert.equal(usesBeerFilter(beers.length), true);
    assert.equal(usesBeerFilter(12), false);
  });
});

describe("breweryIntro", () => {
  const templates = {
    intro: "{name} is a brewery in {place}.",
    introNoPlace: "{name} is a Dutch brewery.",
    introClosed: "{name} was a brewery in {place}.",
    introClosedNoPlace: "{name} was a Dutch brewery.",
  };

  it("uses sourced description when the listing has one", () => {
    assert.equal(
      breweryIntro({ name: "Kompaan", description: "A brewery in Den Haag." }, templates, "Den Haag, Zuid-Holland"),
      "A brewery in Den Haag.",
    );
  });

  it("states the sourced place when there is no description", () => {
    assert.equal(
      breweryIntro({ name: "Kompaan" }, templates, "Den Haag, Zuid-Holland"),
      "Kompaan is a brewery in Den Haag, Zuid-Holland.",
    );
  });

  it("does not invent a place when none is on file", () => {
    assert.equal(breweryIntro({ name: "Kompaan" }, templates, ""), "Kompaan is a Dutch brewery.");
  });

  it("uses past tense for a closed brewery", () => {
    assert.equal(
      breweryIntro({ name: "Old Tap", closed: true }, templates, "Utrecht"),
      "Old Tap was a brewery in Utrecht.",
    );
  });
});

describe("hasVisitInfo", () => {
  it("does not treat a city name as a place you can visit", () => {
    assert.equal(hasVisitInfo({ address: { locality: "Den Haag", countryCode: "NL" } }), false);
  });

  it("treats coordinates, hours, a street, a phone, or a taproom as visit information", () => {
    assert.equal(hasVisitInfo({ address: { locality: "Den Haag", countryCode: "NL", latitude: 52.07, longitude: 4.3 } }), true);
    assert.equal(hasVisitInfo({ openingHours: "Thu–Sun 12:00–22:00" }), true);
    assert.equal(hasVisitInfo({ address: { street: "Binckhorstlaan 299", locality: "Den Haag", countryCode: "NL" } }), true);
    assert.equal(hasVisitInfo({ telephone: "+31 70 000 0000" }), true);
    assert.equal(hasVisitInfo({ taproom: { name: "Kompaan Den Haag" } }), true);
  });
});

describe("formatStreetAddress", () => {
  it("returns sourced address lines without inventing missing parts", () => {
    assert.deepEqual(
      formatStreetAddress({
        address: { street: "Overtoom 60-62", postalCode: "1054 HK", locality: "Amsterdam", region: "Noord-Holland", countryCode: "NL" },
      }),
      ["Overtoom 60-62", "1054 HK Amsterdam", "Noord-Holland"],
    );
    assert.deepEqual(formatStreetAddress({ address: { locality: "Bodegraven", countryCode: "NL" } }), ["Bodegraven"]);
    assert.deepEqual(formatStreetAddress({}), []);
  });
});

describe("displayHostname", () => {
  it("shows a readable host without inventing a website", () => {
    assert.equal(displayHostname("https://kompaanbier.nl/nl/"), "kompaanbier.nl");
    assert.equal(displayHostname("https://www.texels.nl/"), "texels.nl");
  });
});

describe("brewerySourceLinks", () => {
  const brewery: Pick<Brewery, "website" | "sources" | "externalIds"> = {
    website: "https://kompaanbier.nl/nl/",
    externalIds: { wikidata: "Q124625708", openBreweryDb: "6c5eac6b-beab-4de1-9e12-a8f714727b04" },
    sources: [
      {
        sourceKind: "open_data",
        url: "https://www.wikidata.org/wiki/Q124625708",
        note: "Wikidata (CC0)",
        capturedAt: capturedAt,
        origin: "wikidata",
      },
      {
        sourceKind: "open_data",
        url: "https://www.openbrewerydb.org/",
        note: "Open Brewery DB (MIT)",
        capturedAt: capturedAt,
        origin: "open_brewery_db",
      },
      {
        sourceKind: "official_website",
        url: "https://kompaanbier.nl/nl/",
        capturedAt: capturedAt,
      },
    ],
  };

  it("compacts provenance into Website · Wikidata · Open Brewery DB", () => {
    assert.deepEqual(brewerySourceLinks(brewery, sourceLabels), [
      { label: "Website", href: "https://kompaanbier.nl/nl/" },
      { label: "Wikidata", href: "https://www.wikidata.org/wiki/Q124625708" },
      { label: "Open Brewery DB", href: "https://www.openbrewerydb.org/" },
    ]);
  });

  it("does not invent sources that are not on the listing", () => {
    assert.deepEqual(brewerySourceLinks({ sources: [] }, sourceLabels), []);
  });
});

describe("real catalog hubs", () => {
  it("treats Kompaan like any other large untagged catalog", async () => {
    const listings = await loadListingFiles(path.join(process.cwd(), "data"));
    const beers = listings.beers.filter((item) => item.brewerySlug === "kompaan");
    const { featured, listed } = partitionBreweryBeers(beers);
    assert.ok(beers.length > 12);
    assert.equal(featured.length, 0);
    assert.equal(listed.length, beers.length);
    assert.equal(usesBeerFilter(listed.length), true);
  });
});
