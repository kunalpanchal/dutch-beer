import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { googleMapsHref, toListItem } from "@/lib/catalog/store";
import type { Brewery } from "@/lib/schema";

describe("googleMapsHref", () => {
  it("builds a Google Maps search URL from coordinates", () => {
    assert.equal(
      googleMapsHref(51.4359941, 5.4849086),
      "https://www.google.com/maps/search/?api=1&query=51.4359941%2C5.4849086",
    );
  });

  it("includes the brewery name when provided", () => {
    assert.equal(
      googleMapsHref(51.4359941, 5.4849086, "100 Watt"),
      "https://www.google.com/maps/search/?api=1&query=100%20Watt%2051.4359941%2C5.4849086",
    );
  });

  it("returns nothing without a finite coordinate pair", () => {
    assert.equal(googleMapsHref(undefined, 5), undefined);
    assert.equal(googleMapsHref(52, undefined), undefined);
    assert.equal(googleMapsHref(Number.NaN, 5), undefined);
  });
});

describe("toListItem", () => {
  it("uses a Google Maps href for directory map links", () => {
    const brewery: Brewery = {
      id: "wd-q124666075",
      slug: "100-watt",
      name: "100 Watt",
      address: {
        locality: "Eindhoven",
        region: "Noord-Brabant",
        countryCode: "NL",
        latitude: 51.4359941,
        longitude: 5.4849086,
      },
      status: "pending_review",
      createdAt: "2026-08-31T00:00:00.000Z",
      updatedAt: "2026-08-31T00:00:00.000Z",
      trustLevel: "new",
      sources: [],
    };

    const item = toListItem(brewery);
    assert.equal(item.mapHref, googleMapsHref(51.4359941, 5.4849086, "100 Watt"));
    assert.match(item.mapHref ?? "", /^https:\/\/www\.google\.com\/maps\//);
  });
});
