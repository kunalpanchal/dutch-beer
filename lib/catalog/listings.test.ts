import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyBreweryOverlay,
  listingToBrewery,
  mergeBreweryListings,
  resolveBeerListing,
  resolveBeerListings,
  type BeerListingFile,
  type BreweryListingFile,
} from "./listings";
import type { Brewery } from "@/lib/schema";

const capturedAt = "2026-08-31T00:00:00.000Z";

function brewery(partial: Partial<Brewery> & Pick<Brewery, "slug" | "name">): Brewery {
  return {
    id: partial.id ?? `id-${partial.slug}`,
    website: partial.website,
    address: partial.address,
    claimedBy: partial.claimedBy,
    status: partial.status ?? "pending_review",
    createdAt: partial.createdAt ?? capturedAt,
    updatedAt: partial.updatedAt ?? capturedAt,
    trustLevel: partial.trustLevel ?? "new",
    sources: partial.sources ?? [
      { sourceKind: "open_data", url: "https://www.wikidata.org/", capturedAt, origin: "wikidata" },
    ],
    ...partial,
  };
}

describe("brewery listing overlays", () => {
  it("lets a claim add cover, logo, description and claimedBy without inventing other fields", () => {
    const catalog = brewery({
      slug: "kompaan",
      name: "Kompaan",
      website: "https://kompaanbier.nl/nl/",
      address: { locality: "Den Haag", region: "Zuid-Holland", countryCode: "NL" },
    });
    const overlay: BreweryListingFile = {
      slug: "kompaan",
      name: "Kompaan",
      claimedBy: "kompaan",
      description: "A brewery in Den Haag.",
      coverImage: "https://kompaanbier.nl/cover.jpg",
      logo: "https://kompaanbier.nl/logo.png",
      social: { instagram: "https://instagram.com/kompaanbier" },
      sources: [{ sourceKind: "brewery_submission", url: "https://kompaanbier.nl/nl/", capturedAt }],
    };
    const merged = applyBreweryOverlay(catalog, overlay);
    assert.equal(merged.claimedBy, "kompaan");
    assert.equal(merged.coverImage, "https://kompaanbier.nl/cover.jpg");
    assert.equal(merged.logo, "https://kompaanbier.nl/logo.png");
    assert.equal(merged.description, "A brewery in Den Haag.");
    assert.equal(merged.social?.instagram, "https://instagram.com/kompaanbier");
    assert.equal(merged.website, "https://kompaanbier.nl/nl/");
    assert.equal(merged.openingHours, undefined);
    assert.equal(merged.telephone, undefined);
    assert.ok(merged.sources.length >= 2);
  });

  it("does not invent a cover or description when the overlay omits them", () => {
    const catalog = brewery({ slug: "jopen", name: "Jopen" });
    const merged = applyBreweryOverlay(catalog, {
      slug: "jopen",
      name: "Jopen",
      sources: [{ sourceKind: "official_website", url: "https://www.jopen.nl/", capturedAt }],
    });
    assert.equal(merged.coverImage, undefined);
    assert.equal(merged.description, undefined);
    assert.equal(merged.claimedBy, undefined);
  });

  it("adds community listings that are not in the catalog", () => {
    const listing = listingToBrewery({
      slug: "new-local",
      name: "New Local",
      sources: [{ sourceKind: "official_website", url: "https://example.nl", capturedAt }],
    });
    const merged = mergeBreweryListings([], [listing]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].status, "pending_review");
  });
});

describe("beer listings", () => {
  const kompaan = brewery({ slug: "kompaan", name: "Kompaan", id: "wd-kompaan" });

  it("resolves a beer file to a brewery by name and keeps sourced facts only", () => {
    const listing: BeerListingFile = {
      slug: "bloedbroeder",
      name: "Bloedbroeder",
      brewery: "Kompaan",
      style: "IPA",
      abv: 7.2,
      sources: [{ sourceKind: "official_website", url: "https://kompaanbier.nl/", capturedAt }],
    };
    const beer = resolveBeerListing(listing, [kompaan]);
    assert.ok(beer);
    assert.equal(beer?.breweryId, "wd-kompaan");
    assert.equal(beer?.style, "IPA");
    assert.equal(beer?.abv, 7.2);
    assert.equal(beer?.description, undefined);
  });

  it("drops beer files that do not match a brewery", () => {
    const beers = resolveBeerListings(
      [
        {
          slug: "orphan",
          name: "Orphan",
          brewery: "Unknown Brewery",
          sources: [{ sourceKind: "other", note: "no match", capturedAt }],
        },
      ],
      [kompaan],
    );
    assert.equal(beers.length, 0);
  });
});
