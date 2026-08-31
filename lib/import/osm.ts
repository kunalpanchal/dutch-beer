import type { SourceRecord } from "@/lib/catalog/merge";
import { IMPORT_USER_AGENT, fetchJson } from "@/lib/import/http";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const QUERY = `
[out:json][timeout:90];
area["ISO3166-1"="NL"][admin_level=2]->.nl;
(
  nwr["craft"="brewery"](area.nl);
  nwr["industrial"="brewery"](area.nl);
);
out center tags;
`.trim();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function tag(tags: Record<string, string> | undefined, ...keys: string[]): string | undefined {
  if (!tags) return undefined;
  for (const key of keys) {
    if (tags[key]) return tags[key];
  }
  return undefined;
}

export async function fetchOpenStreetMapBreweries(): Promise<SourceRecord[]> {
  let lastError: unknown;
  let data: OverpassResponse | undefined;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      data = await fetchJson<OverpassResponse>(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          "User-Agent": IMPORT_USER_AGENT,
        },
        body: new URLSearchParams({ data: QUERY }),
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!data) throw lastError instanceof Error ? lastError : new Error("OpenStreetMap Overpass request failed");

  const records: SourceRecord[] = [];
  for (const element of data.elements) {
    const tags = element.tags ?? {};
    const name = tag(tags, "name:nl", "name", "name:en", "official_name", "brand");
    if (!name) continue;
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const osmId = `${element.type}/${element.id}`;
    records.push({
      origin: "openstreetmap",
      name,
      website: tag(tags, "website", "contact:website", "url"),
      locality: tag(tags, "addr:city", "addr:municipality", "addr:town", "addr:village"),
      region: tag(tags, "addr:province", "addr:state"),
      latitude,
      longitude,
      sourceUrl: `https://www.openstreetmap.org/${osmId}`,
      externalId: osmId,
      wikidataId: tags.wikidata,
    });
  }
  return records;
}
