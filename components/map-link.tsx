"use client";

import { useId } from "react";
import { mapAppHrefs } from "@/lib/catalog/maps";

export type MapLinkCopy = {
  label: string;
  openIn: string;
  mapsApp: string;
  googleMaps: string;
  appleMaps: string;
  openStreetMap: string;
};

export function MapLink({
  latitude,
  longitude,
  name,
  copy,
}: {
  latitude?: number;
  longitude?: number;
  name?: string;
  copy: MapLinkCopy;
}) {
  const hrefs = mapAppHrefs(latitude, longitude, name);
  const popoverId = `map-picker-${useId().replace(/:/g, "")}`;
  if (!hrefs) return null;

  return (
    <>
      <button type="button" className="map-picker-trigger" popoverTarget={popoverId}>
        {copy.label}
      </button>
      <div id={popoverId} popover="auto" className="map-picker-menu">
        <p>{copy.openIn}</p>
        <a href={hrefs.geo}>{copy.mapsApp}</a>
        <a href={hrefs.google} target="_blank" rel="noreferrer">
          {copy.googleMaps}
        </a>
        <a href={hrefs.apple} target="_blank" rel="noreferrer">
          {copy.appleMaps}
        </a>
        <a href={hrefs.openStreetMap} target="_blank" rel="noreferrer">
          {copy.openStreetMap}
        </a>
      </div>
    </>
  );
}
