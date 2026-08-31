import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toListItem } from "@/lib/catalog/store";
import type { Brewery } from "@/lib/schema";

describe("toListItem", () => {
  it("keeps brewery coordinates for map links", () => {
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
    assert.equal(item.latitude, 51.4359941);
    assert.equal(item.longitude, 5.4849086);
  });
});
