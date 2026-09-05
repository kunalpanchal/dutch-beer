import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import type { CatalogFile } from "./merge";
import { catalogCounts, recentBoardEntries } from "./home";
import { loadListingFiles } from "./listings";

async function loadCatalog(): Promise<CatalogFile> {
  const listings = await loadListingFiles(path.join(process.cwd(), "data"));
  return { generatedAt: "", sources: {}, ...listings };
}

describe("catalogCounts", () => {
  it("uses the real catalog lengths and does not invent a contributor count", async () => {
    const catalog = await loadCatalog();
    const counts = catalogCounts(catalog);
    const listedBreweries = catalog.breweries.filter((brewery) => !brewery.previewOnly).length;
    const previewKeys = new Set(
      catalog.breweries.filter((brewery) => brewery.previewOnly).flatMap((brewery) => [brewery.id, brewery.slug]),
    );
    const listedBeers = (catalog.beers ?? []).filter(
      (beer) => !previewKeys.has(beer.breweryId) && !(beer.brewerySlug && previewKeys.has(beer.brewerySlug)),
    ).length;
    assert.equal(counts.breweries, listedBreweries);
    assert.equal(counts.beers, listedBeers);
    assert.ok(counts.breweries > 0);
    assert.ok(counts.beers > 0);
    assert.equal("contributors" in counts, false);
  });

  it("omits preview-only fixtures from public counts", () => {
    assert.deepEqual(
      catalogCounts({
        breweries: [
          {
            id: "preview-dummy",
            slug: "dummy",
            name: "Dummy Brewery",
            status: "published",
            createdAt: "2026-09-05T00:00:00.000Z",
            updatedAt: "2026-09-05T00:00:00.000Z",
            trustLevel: "verified_brewery",
            sources: [],
            previewOnly: true,
          },
        ],
        beers: [
          {
            id: "preview-beer",
            slug: "dummy-beer",
            breweryId: "preview-dummy",
            breweryName: "Dummy Brewery",
            brewerySlug: "dummy",
            name: "Dummy Beer",
            status: "published",
            createdAt: "2026-09-05T00:00:00.000Z",
            updatedAt: "2026-09-05T00:00:00.000Z",
            trustLevel: "verified_brewery",
            sources: [],
          },
        ],
      }),
      { breweries: 0, beers: 0 },
    );
  });

  it("returns zeros for an empty catalog", () => {
    assert.deepEqual(catalogCounts({ breweries: [], beers: [] }), { breweries: 0, beers: 0 });
  });
});

describe("recentBoardEntries", () => {
  it("returns real catalog names, newest first, mixed across kinds", async () => {
    const catalog = await loadCatalog();
    const breweryNames = new Set(catalog.breweries.map((brewery) => brewery.name));
    const beerNames = new Set((catalog.beers ?? []).map((beer) => beer.name));
    const recent = recentBoardEntries(catalog, 6);

    assert.ok(recent.length > 0);
    assert.ok(recent.length <= 6);
    assert.ok(recent.some((entry) => entry.kind === "brewery"));
    assert.ok(recent.some((entry) => entry.kind === "beer"));

    for (const entry of recent) {
      if (entry.kind === "brewery") {
        assert.ok(breweryNames.has(entry.name));
        assert.ok(catalog.breweries.some((brewery) => brewery.slug === entry.slug));
      } else {
        assert.ok(beerNames.has(entry.name));
        assert.ok((catalog.beers ?? []).some((beer) => beer.slug === entry.slug));
      }
    }

    assert.ok(recent.filter((entry) => entry.kind === "beer").every((entry) => /^\p{L}/u.test(entry.name)));

    const dates = recent.map((entry) => entry.createdAt);
    assert.deepEqual(
      dates,
      [...dates].sort((a, b) => b.localeCompare(a)),
    );
  });

  it("returns an empty list when the catalog has no listings", () => {
    assert.deepEqual(recentBoardEntries({ breweries: [], beers: [] }), []);
  });
});
