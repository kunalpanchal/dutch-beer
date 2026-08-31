import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Beer, Brewery } from "@/lib/schema";
import {
  beerDescription,
  beerJsonLd,
  beerTitle,
  breweryBreadcrumbs,
  breweryDescription,
  breweryJsonLd,
  breweryTitle,
  localityLine,
} from "@/lib/seo";

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

describe("brewery SEO", () => {
  it("builds a Kompaan title and description from real place data", () => {
    assert.equal(breweryTitle(kompaan, "en"), "Kompaan — Brewery & Beers in Den Haag");
    assert.equal(
      breweryDescription(kompaan, "en"),
      "Discover Kompaan in Den Haag, Zuid-Holland. Explore its beers, brewery information and location on Dutch.beer.",
    );
    assert.equal(localityLine(kompaan), "Den Haag, Zuid-Holland");
  });

  it("does not mention a taproom unless that field exists", () => {
    assert.equal(breweryTitle(kompaan, "en").includes("Taproom"), false);
    assert.equal(breweryDescription(kompaan, "en").includes("taproom"), false);
    const withTaproom = { ...kompaan, taproom: { name: "Kompaan Den Haag" } };
    assert.equal(breweryTitle(withTaproom, "en"), "Kompaan — Brewery, Beers & Taproom in Den Haag");
    assert.match(breweryDescription(withTaproom, "en"), /taproom/);
  });

  it("omits missing structured-data fields", () => {
    const data = breweryJsonLd(kompaan, "en") as Record<string, unknown>;
    assert.equal(data["@type"], "Brewery");
    assert.equal(data.name, "Kompaan");
    assert.equal(data.telephone, undefined);
    assert.equal(data.openingHours, undefined);
    assert.equal(data.image, undefined);
    assert.equal(data.logo, undefined);
    assert.equal(data.description, undefined);
    assert.ok(Array.isArray(data.sameAs));
    assert.ok((data.sameAs as string[]).includes("https://kompaanbier.nl/nl/"));
    const address = data.address as Record<string, unknown>;
    assert.equal(address.addressLocality, "Den Haag");
    assert.equal(address.streetAddress, undefined);
  });

  it("includes cover and logo in JSON-LD only when present", () => {
    const claimed = {
      ...kompaan,
      claimedBy: "kompaan",
      coverImage: "https://kompaanbier.nl/cover.jpg",
      logo: "https://kompaanbier.nl/logo.png",
    };
    const data = breweryJsonLd(claimed, "en") as Record<string, unknown>;
    assert.equal(data.image, "https://kompaanbier.nl/cover.jpg");
    assert.equal(data.logo, "https://kompaanbier.nl/logo.png");
  });

  it("builds breadcrumbs through the city page", () => {
    const crumbs = breweryBreadcrumbs(kompaan, "en");
    assert.deepEqual(
      crumbs.map((crumb) => crumb.path),
      ["/en", "/en/directory/breweries", "/en/directory/places/den-haag", "/en/directory/breweries/kompaan"],
    );
  });
});

describe("beer SEO", () => {
  const beer: Beer = {
    id: "beer-bloedbroeder",
    slug: "bloedbroeder",
    breweryId: kompaan.id,
    name: "Bloedbroeder",
    style: "IPA",
    abv: 7.2,
    status: "published",
    createdAt: capturedAt,
    updatedAt: capturedAt,
    trustLevel: "new",
    sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/", capturedAt }],
  };

  it("uses sourced facts and does not invent a description", () => {
    assert.equal(beerTitle(beer, kompaan, "en"), "Bloedbroeder — Beer by Kompaan");
    assert.equal(
      beerDescription(beer, kompaan, "en"),
      "Bloedbroeder from Kompaan (IPA, 7.2% ABV), listed on Dutch.beer.",
    );
    const data = beerJsonLd(beer, kompaan, "en") as Record<string, unknown>;
    assert.equal(data.description, undefined);
  });
});
