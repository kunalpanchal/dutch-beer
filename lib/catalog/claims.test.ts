import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyPublishedClaims, type ClaimRecord } from "@/lib/catalog/claims";
import type { Brewery } from "@/lib/schema";

const brewery: Brewery = {
  id: "wd-q1",
  slug: "jopen",
  name: "Jopen",
  website: "https://www.jopen.nl/",
  status: "published",
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
  trustLevel: "new",
  sources: [{ sourceKind: "open_data", capturedAt: "2026-08-31", origin: "wikidata" }],
};

const publishedClaim: ClaimRecord = {
  slug: "jopen",
  brewery: "Jopen",
  claimedBy: "Taproom",
  email: "info@jopen.nl",
  website: "https://www.jopen.nl/",
  status: "published",
  trustLevel: "new",
  sources: [{ sourceKind: "brewery_submission", url: "https://www.jopen.nl/contact", capturedAt: "2026-08-31" }],
};

describe("applyPublishedClaims", () => {
  it("marks a brewery verified only after a published claim", () => {
    const pending = applyPublishedClaims([brewery], [{ ...publishedClaim, status: "pending_review" }]);
    assert.equal(pending[0].claimedBy, undefined);
    assert.equal(pending[0].trustLevel, "new");

    const claimed = applyPublishedClaims([brewery], [publishedClaim]);
    assert.equal(claimed[0].claimedBy, "Taproom");
    assert.equal(claimed[0].trustLevel, "verified_brewery");
    assert.ok(claimed[0].sources.some((source) => source.sourceKind === "brewery_submission"));
  });

  it("lets a published claim add cover, logo, and description without inventing other fields", () => {
    const claimed = applyPublishedClaims([brewery], [
      {
        ...publishedClaim,
        description: "A brewery in Haarlem.",
        coverImage: "https://www.jopen.nl/cover.jpg",
        logo: "https://www.jopen.nl/logo.png",
        social: { instagram: "https://instagram.com/jopenbier" },
      },
    ]);
    assert.equal(claimed[0].description, "A brewery in Haarlem.");
    assert.equal(claimed[0].coverImage, "https://www.jopen.nl/cover.jpg");
    assert.equal(claimed[0].logo, "https://www.jopen.nl/logo.png");
    assert.equal(claimed[0].social?.instagram, "https://instagram.com/jopenbier");
    assert.equal(claimed[0].openingHours, undefined);
    assert.equal(claimed[0].telephone, undefined);
  });

  it("lets a published claim overlay richer profile fields", () => {
    const claimed = applyPublishedClaims([brewery], [
      {
        ...publishedClaim,
        accentColor: "#1a3a5c",
        foundedYear: 1994,
        contactUrl: "https://www.jopen.nl/contact",
        featuredBeerSlugs: ["hoppenbier"],
        highlightLinks: [{ label: "Shop", url: "https://www.jopen.nl/shop" }],
      },
    ]);
    assert.equal(claimed[0].accentColor, "#1a3a5c");
    assert.equal(claimed[0].foundedYear, 1994);
    assert.equal(claimed[0].contactUrl, "https://www.jopen.nl/contact");
    assert.deepEqual(claimed[0].featuredBeerSlugs, ["hoppenbier"]);
    assert.equal(claimed[0].highlightLinks?.[0].label, "Shop");
  });

  it("does not invent a cover or description when the claim omits them", () => {
    const claimed = applyPublishedClaims([brewery], [publishedClaim]);
    assert.equal(claimed[0].coverImage, undefined);
    assert.equal(claimed[0].description, undefined);
  });
});
