import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalWebsite,
  emailMatchesWebsite,
  hostnameFromEmail,
  hostnameFromUrl,
  normalizeLocality,
  normalizeName,
  normalizeProvince,
  slugify,
  urlMatchesWebsite,
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

describe("email / evidence domain checks", () => {
  it("accepts an email and page on the brewery domain", () => {
    assert.equal(hostnameFromEmail("info@jopen.nl"), "jopen.nl");
    assert.equal(emailMatchesWebsite("taproom@mail.jopen.nl", "https://www.jopen.nl/"), true);
    assert.equal(urlMatchesWebsite("https://jopen.nl/contact", "https://www.jopen.nl/"), true);
  });

  it("rejects consumer mail and off-domain evidence", () => {
    assert.equal(hostnameFromEmail("owner@gmail.com"), undefined);
    assert.equal(emailMatchesWebsite("owner@gmail.com", "https://jopen.nl"), false);
    assert.equal(urlMatchesWebsite("https://facebook.com/jopen", "https://jopen.nl"), false);
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
