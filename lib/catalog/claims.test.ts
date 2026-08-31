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
});
