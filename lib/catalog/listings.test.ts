import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadListingFiles } from "./listings";

describe("listing files", () => {
  it("passes through sourced brewery profile fields without inventing missing ones", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "listings-"));
    await mkdir(path.join(directory, "breweries"));
    await mkdir(path.join(directory, "beers"));
    await writeFile(
      path.join(directory, "breweries", "kompaan.json"),
      `${JSON.stringify({
        slug: "kompaan",
        name: "Kompaan",
        website: "https://kompaanbier.nl/nl/",
        description: "A brewery in Den Haag.",
        coverImage: "https://kompaanbier.nl/cover.jpg",
        logo: "https://kompaanbier.nl/logo.png",
        social: { instagram: "https://instagram.com/kompaanbier" },
        sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/nl/", capturedAt: "2026-08-31" }],
      })}\n`,
    );
    const { breweries } = await loadListingFiles(directory);
    assert.equal(breweries.length, 1);
    assert.equal(breweries[0].description, "A brewery in Den Haag.");
    assert.equal(breweries[0].coverImage, "https://kompaanbier.nl/cover.jpg");
    assert.equal(breweries[0].logo, "https://kompaanbier.nl/logo.png");
    assert.equal(breweries[0].social?.instagram, "https://instagram.com/kompaanbier");
    assert.equal(breweries[0].website, "https://kompaanbier.nl/nl/");
    assert.equal(breweries[0].openingHours, undefined);
    assert.equal(breweries[0].telephone, undefined);
  });

  it("keeps beer descriptions only when the listing file supplies them", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "listings-"));
    await mkdir(path.join(directory, "breweries"));
    await mkdir(path.join(directory, "beers"));
    await writeFile(
      path.join(directory, "breweries", "kompaan.json"),
      `${JSON.stringify({
        slug: "kompaan",
        name: "Kompaan",
        sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/", capturedAt: "2026-08-31" }],
      })}\n`,
    );
    await writeFile(
      path.join(directory, "beers", "bloedbroeder.json"),
      `${JSON.stringify({
        slug: "bloedbroeder",
        name: "Bloedbroeder",
        breweryName: "Kompaan",
        brewerySlug: "kompaan",
        style: "IPA",
        abv: 7.2,
        sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/", capturedAt: "2026-08-31" }],
      })}\n`,
    );
    const { beers } = await loadListingFiles(directory);
    assert.equal(beers.length, 1);
    assert.equal(beers[0].brewerySlug, "kompaan");
    assert.equal(beers[0].style, "IPA");
    assert.equal(beers[0].abv, 7.2);
    assert.equal(beers[0].description, undefined);
  });
});
