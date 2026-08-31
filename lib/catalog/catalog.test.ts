import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadListingFiles } from "./listings";

describe("listing files", () => {
  it("keeps imported breweries pending review without OSM facts", async () => {
    const { breweries } = await loadListingFiles(path.join(process.cwd(), "data"));
    assert.ok(breweries.length > 0);
    assert.equal(breweries.filter((brewery) => brewery.status === "published").length, 0);
    assert.ok(breweries.every((brewery) => brewery.status === "pending_review"));
    assert.ok(breweries.every((brewery) => brewery.sources.length > 0));
    assert.ok(breweries.every((brewery) => brewery.sources.every((source) => source.origin !== "openstreetmap")));
    assert.ok(breweries.every((brewery) => !brewery.externalIds?.osm));
    assert.ok(breweries.some((brewery) => brewery.sources.some((source) => source.origin === "wikidata")));
    assert.ok(breweries.some((brewery) => brewery.sources.some((source) => source.origin === "open_brewery_db")));
  });

  it("keeps imported Wikidata beers pending review", async () => {
    const { beers } = await loadListingFiles(path.join(process.cwd(), "data"));
    assert.ok(beers.length > 0);
    assert.equal(beers.filter((beer) => beer.status === "published").length, 0);
    assert.ok(beers.every((beer) => beer.status === "pending_review"));
    assert.ok(beers.every((beer) => beer.sources.some((source) => source.origin === "wikidata")));
    assert.ok(beers.every((beer) => beer.externalIds?.wikidata));
  });
});
