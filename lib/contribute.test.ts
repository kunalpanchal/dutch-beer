import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { claimDomainError, contributionFile, payloadFromForm, type ContributionPayload } from "@/lib/contribute";

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
    description: "",
    coverImage: "",
    logo: "",
    instagram: "",
    facebook: "",
    ...partial,
  };
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
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
    assert.equal(body.email, "info@jopen.nl");
    assert.equal(body.status, "pending_review");
    assert.equal((body.sources as { sourceKind: string }[])[0].sourceKind, "brewery_submission");
  });

  it("includes sourced profile fields on a claim without inventing missing ones", () => {
    const file = contributionFile(
      payloadFromForm(
        "claim",
        form({
          breweryName: "Kompaan",
          brewerySlug: "kompaan",
          contact: "Kompaan",
          email: "info@kompaanbier.nl",
          website: "https://kompaanbier.nl/nl/",
          source: "https://kompaanbier.nl/nl/",
          notes: "I work at the brewery.",
          coverImage: "https://kompaanbier.nl/cover.jpg",
          description: "A brewery in Den Haag.",
        }),
      ),
    );
    assert.equal(file.path, "data/claims/kompaan.json");
    const body = JSON.parse(file.contents) as Record<string, unknown>;
    assert.equal(body.claimedBy, "Kompaan");
    assert.equal(body.coverImage, "https://kompaanbier.nl/cover.jpg");
    assert.equal(body.description, "A brewery in Den Haag.");
    assert.equal(body.openingHours, undefined);
    assert.equal(body.logo, undefined);
    assert.equal(body.social, undefined);
  });

  it("omits empty owner-profile fields instead of fabricating them", () => {
    const { contents } = contributionFile(
      payloadFromForm(
        "claim",
        form({
          breweryName: "Kompaan",
          brewerySlug: "kompaan",
          contact: "Kompaan",
          email: "info@kompaanbier.nl",
          website: "https://kompaanbier.nl/nl/",
          source: "https://kompaanbier.nl/nl/",
          notes: "Official domain.",
        }),
      ),
    );
    const body = JSON.parse(contents) as Record<string, unknown>;
    assert.equal(body.description, undefined);
    assert.equal(body.coverImage, undefined);
    assert.equal(body.logo, undefined);
    assert.equal(body.social, undefined);
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
