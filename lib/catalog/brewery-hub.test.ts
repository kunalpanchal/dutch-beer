import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import type { Beer } from "../schema";
import { loadListingFiles } from "./listings";
import {
  breweryIntro,
  isSafeAccentColor,
  partitionBreweryBeers,
  upcomingEvents,
  usesBeerSheet,
} from "./brewery-hub";

const capturedAt = "2026-09-01T00:00:00.000Z";

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
    assert.equal(usesBeerSheet(beers.length), false);
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

  it("lets a brewery rank featured beers ahead of availability tagging", () => {
    const alpha = beer({ id: "a", slug: "alpha", name: "Alpha", availability: "year_round" });
    const bravo = beer({ id: "b", slug: "bravo", name: "Bravo" });
    const charlie = beer({ id: "c", slug: "charlie", name: "Charlie" });
    assert.deepEqual(partitionBreweryBeers([alpha, bravo, charlie], ["charlie", "bravo"]), {
      featured: [charlie, bravo],
      listed: [alpha],
    });
  });

  it("falls back when featuredBeerSlugs match nothing", () => {
    const core = beer({ id: "core", slug: "core", name: "Core", availability: "year_round" });
    assert.deepEqual(partitionBreweryBeers([core], ["missing"]), {
      featured: [core],
      listed: [],
    });
  });

  it("sends a large brewery catalog to the filterable sheet", () => {
    const beers = Array.from({ length: 13 }, (_, index) => beer({ id: `b${index}`, slug: `b-${index}`, name: `Beer ${index}` }));
    assert.equal(usesBeerSheet(beers.length), true);
    assert.equal(usesBeerSheet(12), false);
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

describe("isSafeAccentColor", () => {
  it("accepts hex colors only", () => {
    assert.equal(isSafeAccentColor("#c41230"), true);
    assert.equal(isSafeAccentColor("#abc"), true);
    assert.equal(isSafeAccentColor("red"), false);
    assert.equal(isSafeAccentColor("url(javascript:alert(1))"), false);
  });
});

describe("upcomingEvents", () => {
  it("keeps current and future events and drops past ones", () => {
    const now = new Date("2026-09-05T12:00:00.000Z");
    const events = upcomingEvents(
      [
        { title: "Past", startsAt: "2026-08-01" },
        { title: "Today", startsAt: "2026-09-05" },
        { title: "Soon", startsAt: "2026-10-01", endsAt: "2026-10-02" },
      ],
      now,
    );
    assert.deepEqual(
      events.map((event) => event.title),
      ["Today", "Soon"],
    );
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
    assert.equal(usesBeerSheet(listed.length), true);
  });
});
