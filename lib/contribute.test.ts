import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contributionFile, payloadFromForm } from "./contribute";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("claim contributions", () => {
  it("writes a claim file using the existing pull-request contribution flow", () => {
    const { path, contents } = contributionFile(
      payloadFromForm(
        "claim",
        form({
          breweryName: "Kompaan",
          website: "https://kompaanbier.nl/nl/",
          source: "https://kompaanbier.nl/nl/",
          notes: "I work at the brewery.",
          coverImage: "https://kompaanbier.nl/cover.jpg",
          description: "A brewery in Den Haag.",
        }),
      ),
    );
    assert.equal(path, "data/claims/kompaan.json");
    const body = JSON.parse(contents) as Record<string, unknown>;
    assert.equal(body.kind, "claim");
    assert.equal(body.slug, "kompaan");
    assert.equal(body.name, "Kompaan");
    assert.equal(body.coverImage, "https://kompaanbier.nl/cover.jpg");
    assert.equal(body.openingHours, undefined);
    assert.equal(body.status, "pending_review");
  });

  it("omits empty owner-profile fields instead of fabricating them", () => {
    const { contents } = contributionFile(
      payloadFromForm(
        "claim",
        form({
          breweryName: "Kompaan",
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
