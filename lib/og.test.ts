import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Beer, Brewery } from "@/lib/schema";
import { beerOgCard, breweryOgCard, directoryOgCard, homeOgCard, placeOgCard } from "@/lib/og";

const capturedAt = "2026-08-31T00:00:00.000Z";

const kompaan: Brewery = {
  id: "wd-q124625708",
  slug: "kompaan",
  name: "Kompaan",
  website: "https://kompaanbier.nl/nl/",
  address: {
    locality: "Den Haag",
    region: "Zuid-Holland",
    countryCode: "NL",
    latitude: 52.0671662,
    longitude: 4.3462556,
  },
  status: "pending_review",
  createdAt: capturedAt,
  updatedAt: capturedAt,
  trustLevel: "new",
  sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/nl/", capturedAt }],
  externalIds: { wikidata: "Q124625708" },
};

describe("share cards", () => {
  it("builds a homepage card from the tap-board copy and counts", () => {
    const card = homeOgCard("en", { breweries: 412, beers: 1234 });
    assert.equal(card.kicker, "The Netherlands");
    assert.equal(card.title, "dutch.beer");
    assert.equal(card.subtitle, "Dutch beer, listed like a tap board.");
    assert.equal(card.meta, "412 breweries · 1,234 beers");
  });

  it("builds a brewery card from the listing title and place", () => {
    const card = breweryOgCard(kompaan, "en");
    assert.equal(card.kicker, "Brewery");
    assert.equal(card.title, "Kompaan");
    assert.equal(card.subtitle, "Brewery & Beers in Den Haag");
    assert.equal(card.meta, undefined);
    assert.match(card.alt, /Kompaan/);
  });

  it("builds a beer card from style, ABV, and brewery", () => {
    const beer: Beer = {
      id: "beer-bloedbroeder",
      slug: "bloedbroeder",
      breweryId: kompaan.id,
      breweryName: kompaan.name,
      name: "Bloedbroeder",
      style: "IPA",
      abv: 7.2,
      status: "published",
      createdAt: capturedAt,
      updatedAt: capturedAt,
      trustLevel: "new",
      sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/", capturedAt }],
    };
    const card = beerOgCard(beer, kompaan, "nl");
    assert.equal(card.kicker, "Bier");
    assert.equal(card.title, "Bloedbroeder");
    assert.equal(card.subtitle, "van Kompaan");
    assert.equal(card.meta, "IPA · 7.2% ABV");
  });

  it("builds place and directory cards from page copy", () => {
    const place = placeOgCard("Den Haag", "Zuid-Holland", 12, "en");
    assert.equal(place.title, "Den Haag");
    assert.equal(place.subtitle, "Breweries in Den Haag");
    assert.equal(place.meta, "Zuid-Holland · 12 breweries");
    const directory = directoryOgCard("beers", "en");
    assert.equal(directory.title, "Beers");
    assert.match(directory.subtitle ?? "", /Wikidata/);
  });
});
