import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Beer, Brewery } from "@/lib/schema";
import {
  beerDescription,
  beerJsonLd,
  beerMetadata,
  beerTitle,
  breweryBreadcrumbs,
  breweryDescription,
  breweryJsonLd,
  breweryMetadata,
  breweryTitle,
  homeDescription,
  homeMetadata,
  localityLine,
  websiteJsonLd,
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

  it("emits Open Graph and Twitter cards with a generated share image", () => {
    const withCover = { ...kompaan, coverImage: "https://kompaanbier.nl/cover.jpg" };
    const meta = breweryMetadata(withCover, "en");
    const og = meta.openGraph;
    assert.ok(og);
    assert.equal(og.locale, "en_US");
    assert.equal(og.siteName, "Dutch.beer");
    assert.equal((og as { type?: string }).type, "website");
    assert.equal(og.url, "http://localhost:3000/en/directory/breweries/kompaan");
    const images = og.images as Array<{ url: string; width: number; height: number; alt: string; type: string }>;
    assert.equal(images[0].url, "http://localhost:3000/en/directory/breweries/kompaan/opengraph-image");
    assert.equal(images[0].width, 1200);
    assert.equal(images[0].height, 630);
    assert.equal(images[0].type, "image/png");
    assert.equal(images[0].alt, "Kompaan");
    const twitter = meta.twitter as { card: string; title: string };
    assert.equal(twitter.card, "summary_large_image");
    assert.match(twitter.title, /Kompaan/);
  });
});

describe("beer SEO", () => {
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

  it("uses sourced facts and does not invent a description", () => {
    assert.equal(beerTitle(beer, kompaan, "en"), "Bloedbroeder — Beer by Kompaan");
    assert.equal(
      beerDescription(beer, kompaan, "en"),
      "Bloedbroeder from Kompaan (IPA, 7.2% ABV), listed on Dutch.beer.",
    );
    const data = beerJsonLd(beer, kompaan, "en") as Record<string, unknown>;
    assert.equal(data.description, undefined);
  });

  it("points social previews at a generated beer share image", () => {
    const meta = beerMetadata(beer, kompaan, "en");
    const images = meta.openGraph?.images as Array<{ url: string; alt: string }>;
    assert.equal(images[0].url, "http://localhost:3000/en/directory/beers/bloedbroeder/opengraph-image");
    assert.equal(images[0].alt, "Bloedbroeder");
    const twitter = meta.twitter as { card: string; description: string };
    assert.equal(twitter.card, "summary_large_image");
    assert.match(twitter.description, /Kompaan/);
  });
});

describe("home SEO", () => {
  it("builds a homepage description from catalog counts", () => {
    assert.equal(
      homeDescription("en", { breweries: 412, beers: 1234 }),
      "A community-kept directory of Dutch beer. Browse 412 breweries and 1,234 beers. No ads. No locked lists.",
    );
    const meta = homeMetadata("nl", { breweries: 412, beers: 1234 });
    assert.equal((meta.title as { absolute: string }).absolute, "Nederlands bier, op een taplijst. | Dutch.beer");
    const images = meta.openGraph?.images as Array<{ url: string }>;
    assert.equal(images[0].url, "http://localhost:3000/nl/opengraph-image");
    const data = websiteJsonLd("en", { breweries: 412, beers: 1234 }) as Record<string, unknown>;
    assert.equal(data["@type"], "WebSite");
    assert.match(String(data.description), /412/);
  });
});
