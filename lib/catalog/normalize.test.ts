import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalWebsite,
  hostnameFromUrl,
  normalizeLocality,
  normalizeName,
  normalizeProvince,
  slugify,
} from "@/lib/catalog/normalize";

describe("normalizeName", () => {
  it("strips brewery noise and diacritics", () => {
    assert.equal(normalizeName("Brouwerij De Molen"), "molen");
    assert.equal(normalizeName("Brouwerij 't IJ"), "ij");
    assert.equal(normalizeName("vandeStreek bier"), "vandestreek");
  });
});

describe("hostnameFromUrl", () => {
  it("drops www and rejects generic hosts", () => {
    assert.equal(hostnameFromUrl("https://www.jopen.nl/haarlem"), "jopen.nl");
    assert.equal(hostnameFromUrl("http://facebook.com/brewery"), undefined);
  });
});

describe("canonicalWebsite", () => {
  it("adds a protocol and drops the hash", () => {
    assert.equal(canonicalWebsite("jopen.nl#tap"), "https://jopen.nl/");
  });
});

describe("slugify", () => {
  it("builds a stable slug", () => {
    assert.equal(slugify("Brouwerij De Molen"), "brouwerij-de-molen");
  });
});

describe("normalizeLocality / province", () => {
  it("normalizes Dutch place names and provinces", () => {
    assert.equal(normalizeLocality("'s-Hertogenbosch"), "s hertogenbosch");
    assert.equal(normalizeProvince("North Holland"), "Noord-Holland");
    assert.equal(normalizeProvince("Fryslân"), "Friesland");
  });
});
