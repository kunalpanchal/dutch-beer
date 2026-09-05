import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadListingFiles } from "./listings";

describe("listing files", () => {
  it("keeps imported breweries pending review without OSM facts", async () => {
    const { breweries } = await loadListingFiles(path.join(process.cwd(), "data"));
    const imported = breweries.filter((brewery) => !brewery.previewOnly);
    assert.ok(imported.length > 0);
    assert.equal(imported.filter((brewery) => brewery.status === "published").length, 0);
    assert.ok(imported.every((brewery) => brewery.status === "pending_review"));
    assert.ok(imported.every((brewery) => brewery.sources.length > 0));
    assert.ok(imported.every((brewery) => brewery.sources.every((source) => source.origin !== "openstreetmap")));
    assert.ok(imported.every((brewery) => !brewery.externalIds?.osm));
    assert.ok(imported.some((brewery) => brewery.sources.some((source) => source.origin === "wikidata")));
    assert.ok(imported.some((brewery) => brewery.sources.some((source) => source.origin === "open_brewery_db")));
    assert.ok(breweries.some((brewery) => brewery.previewOnly && brewery.slug === "dummy"));
  });

  it("keeps imported Wikidata beers pending review", async () => {
    const { beers } = await loadListingFiles(path.join(process.cwd(), "data"));
    const imported = beers.filter((beer) => beer.brewerySlug !== "dummy" && beer.breweryId !== "preview-dummy");
    assert.ok(imported.length > 0);
    assert.equal(imported.filter((beer) => beer.status === "published").length, 0);
    assert.ok(imported.every((beer) => beer.status === "pending_review"));
    assert.ok(imported.every((beer) => beer.sources.some((source) => source.origin === "wikidata")));
    assert.ok(imported.every((beer) => beer.externalIds?.wikidata));
    assert.ok(beers.filter((beer) => beer.previewOnly).length >= 150);
  });
});
