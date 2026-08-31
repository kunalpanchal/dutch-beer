import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appleMapsHref,
  geoMapsHref,
  googleMapsHref,
  mapAppHrefs,
  openStreetMapHref,
} from "@/lib/catalog/maps";

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

  it("percent-encodes apostrophes in brewery names", () => {
    assert.equal(
      googleMapsHref(52.3814, 4.64564, "'t Scheepje"),
      "https://www.google.com/maps/search/?api=1&query=%27t%20Scheepje%2052.3814%2C4.64564",
    );
  });

  it("returns nothing without a finite coordinate pair", () => {
    assert.equal(googleMapsHref(undefined, 5), undefined);
    assert.equal(googleMapsHref(52, undefined), undefined);
    assert.equal(googleMapsHref(Number.NaN, 5), undefined);
  });
});

describe("geoMapsHref", () => {
  it("builds a geo URI so Android can offer a maps-app chooser", () => {
    assert.equal(
      geoMapsHref(51.4359941, 5.4849086, "100 Watt"),
      "geo:51.4359941,5.4849086?q=51.4359941%2C5.4849086(100%20Watt)",
    );
  });
});

describe("appleMapsHref", () => {
  it("builds an Apple Maps URL from coordinates and name", () => {
    assert.equal(
      appleMapsHref(51.4359941, 5.4849086, "100 Watt"),
      "https://maps.apple.com/?ll=51.4359941,5.4849086&q=100%20Watt",
    );
  });
});

describe("openStreetMapHref", () => {
  it("builds an OpenStreetMap marker URL", () => {
    assert.equal(
      openStreetMapHref(51.4359941, 5.4849086),
      "https://www.openstreetmap.org/?mlat=51.4359941&mlon=5.4849086#map=16/51.4359941/5.4849086",
    );
  });
});

describe("mapAppHrefs", () => {
  it("returns every map target when coordinates are present", () => {
    const hrefs = mapAppHrefs(51.4359941, 5.4849086, "100 Watt");
    assert.ok(hrefs);
    assert.equal(hrefs.geo, geoMapsHref(51.4359941, 5.4849086, "100 Watt"));
    assert.equal(hrefs.google, googleMapsHref(51.4359941, 5.4849086, "100 Watt"));
    assert.equal(hrefs.apple, appleMapsHref(51.4359941, 5.4849086, "100 Watt"));
    assert.equal(hrefs.openStreetMap, openStreetMapHref(51.4359941, 5.4849086));
  });

  it("returns nothing without coordinates", () => {
    assert.equal(mapAppHrefs(undefined, 5.48, "100 Watt"), undefined);
  });
});
