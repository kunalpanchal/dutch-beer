import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { CatalogFile } from "./merge";

describe("imported catalog", () => {
  const catalog = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog.json"), "utf8")) as CatalogFile;

  it("keeps every imported brewery pending review", () => {
    assert.ok(catalog.breweries.length > 0);
    assert.equal(catalog.breweries.filter((brewery) => brewery.status === "published").length, 0);
    assert.ok(catalog.breweries.every((brewery) => brewery.status === "pending_review"));
    assert.ok(catalog.breweries.every((brewery) => brewery.sources.length > 0));
  });

  it("records all three open-data sources", () => {
    assert.ok(catalog.sources.wikidata.count > 0);
    assert.ok(catalog.sources.open_brewery_db.count > 0);
    assert.ok(catalog.sources.openstreetmap.count > 0);
  });
});
