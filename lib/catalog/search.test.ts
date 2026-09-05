import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Beer, Brewery } from "@/lib/schema";
import { buildSearchIndex, querySearchIndex, searchHref, searchResultsPath } from "./search";

function brewery(partial: Partial<Brewery> & Pick<Brewery, "id" | "slug" | "name">): Brewery {
  return {
    status: "published",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    trustLevel: "new",
    sources: [],
    ...partial,
  };
}

function beer(partial: Partial<Beer> & Pick<Beer, "id" | "slug" | "name" | "breweryId" | "breweryName">): Beer {
  return {
    status: "published",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    trustLevel: "new",
    sources: [],
    ...partial,
  };
}

describe("buildSearchIndex", () => {
  it("indexes breweries, places, beers, and styles", () => {
    const index = buildSearchIndex(
      [
        brewery({
          id: "b1",
          slug: "uiltje",
          name: "Uiltje",
          address: { locality: "Haarlem", countryCode: "NL", region: "Noord-Holland" },
        }),
        brewery({
          id: "b2",
          slug: "moersleutel",
          name: "Moersleutel",
          address: { locality: "Alkmaar", countryCode: "NL" },
        }),
      ],
      [
        beer({
          id: "beer1",
          slug: "herfstbock",
          name: "Herfstbock",
          breweryId: "b1",
          breweryName: "Uiltje",
          style: "Bock",
        }),
        beer({
          id: "beer2",
          slug: "ipa",
          name: "Bird of Prey",
          breweryId: "b1",
          breweryName: "Uiltje",
          style: "IPA",
        }),
      ],
    );

    assert.ok(index.documents.some((doc) => doc.kind === "brewery" && doc.slug === "uiltje"));
    assert.ok(index.documents.some((doc) => doc.kind === "place" && doc.name === "Haarlem"));
    assert.ok(index.documents.some((doc) => doc.kind === "beer" && doc.slug === "herfstbock"));
    assert.ok(index.documents.some((doc) => doc.kind === "style" && doc.name === "IPA"));
  });
});

describe("querySearchIndex", () => {
  const index = buildSearchIndex(
    [
      brewery({
        id: "b1",
        slug: "uiltje",
        name: "Uiltje Brewing Company",
        address: { locality: "Haarlem", countryCode: "NL" },
      }),
      brewery({
        id: "b2",
        slug: "moersleutel",
        name: "Moersleutel",
        address: { locality: "Alkmaar", countryCode: "NL" },
      }),
    ],
    [
      beer({
        id: "beer1",
        slug: "herfstbock",
        name: "Herfstbock",
        breweryId: "b1",
        breweryName: "Uiltje",
        style: "Bock",
      }),
      beer({
        id: "beer2",
        slug: "bird-of-prey",
        name: "Bird of Prey",
        breweryId: "b1",
        breweryName: "Uiltje",
        style: "IPA",
      }),
    ],
  );

  it("returns empty groups for blank queries", () => {
    const results = querySearchIndex(index, "   ");
    assert.equal(results.flat.length, 0);
  });

  it("groups brewery, place, beer, and style hits", () => {
    const byCity = querySearchIndex(index, "Haarlem");
    assert.ok(byCity.places.some((hit) => hit.name === "Haarlem"));
    assert.ok(byCity.breweries.some((hit) => hit.slug === "uiltje"));

    const byBeer = querySearchIndex(index, "Herfstbock");
    assert.ok(byBeer.beers.some((hit) => hit.slug === "herfstbock"));

    const byStyle = querySearchIndex(index, "IPA");
    assert.ok(byStyle.styles.some((hit) => hit.name === "IPA"));
    assert.ok(byStyle.beers.some((hit) => hit.slug === "bird-of-prey"));
  });

  it("ranks prefix name matches above haystack-only matches", () => {
    const results = querySearchIndex(index, "Moer");
    assert.equal(results.breweries[0]?.slug, "moersleutel");
  });
});

describe("searchHref", () => {
  it("builds locale-aware paths for each kind", () => {
    assert.equal(searchHref("en", { kind: "brewery", slug: "uiltje", name: "Uiltje" }), "/en/directory/breweries/uiltje");
    assert.equal(searchHref("nl", { kind: "place", slug: "haarlem", name: "Haarlem" }), "/nl/directory/places/haarlem");
    assert.equal(searchHref("en", { kind: "beer", slug: "herfstbock", name: "Herfstbock" }), "/en/directory/beers/herfstbock");
    assert.equal(
      searchHref("en", { kind: "style", slug: "ipa", name: "IPA" }),
      "/en/search?q=IPA&kind=style",
    );
  });
});

describe("searchResultsPath", () => {
  it("encodes the query string", () => {
    assert.equal(searchResultsPath("en", "bock"), "/en/search?q=bock");
    assert.equal(searchResultsPath("nl", "IPA", "style"), "/nl/search?q=IPA&kind=style");
  });
});
