import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { claimDomainError, contributionFile, type ContributionPayload } from "@/lib/contribute";

function payload(partial: Partial<ContributionPayload>): ContributionPayload {
  return {
    kind: "brewery",
    breweryName: "",
    brewerySlug: "",
    beerName: "",
    website: "",
    locality: "",
    region: "",
    style: "",
    abv: "",
    availability: "",
    entity: "",
    source: "",
    notes: "",
    email: "",
    contact: "",
    ...partial,
  };
}

describe("contributionFile claim", () => {
  it("writes a pending claim under data/claims", () => {
    const file = contributionFile(
      payload({
        kind: "claim",
        breweryName: "Jopen",
        brewerySlug: "jopen",
        contact: "Taproom",
        email: "info@jopen.nl",
        website: "https://www.jopen.nl/",
        source: "https://jopen.nl/contact",
        notes: "We run the Haarlem taproom.",
      }),
    );
    assert.equal(file.path, "data/claims/jopen.json");
    const body = JSON.parse(file.contents) as Record<string, unknown>;
    assert.equal(body.slug, "jopen");
    assert.equal(body.claimedBy, "Taproom");
    assert.equal(body.status, "pending_review");
    assert.equal((body.sources as { sourceKind: string }[])[0].sourceKind, "brewery_submission");
  });
});

describe("claimDomainError", () => {
  it("requires email and evidence on the official domain", () => {
    const valid = {
      email: "info@jopen.nl",
      website: "https://www.jopen.nl/",
      source: "https://jopen.nl/contact",
    };
    assert.equal(claimDomainError(valid), undefined);
    assert.equal(claimDomainError({ ...valid, email: "me@gmail.com" }), "email");
    assert.equal(claimDomainError({ ...valid, source: "https://untappd.com/jopen" }), "evidence");
  });
});
