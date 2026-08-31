import type { SourceRecord } from "@/lib/catalog/merge";
import { fetchJson } from "@/lib/import/http";

interface WikidataBinding {
  type: string;
  value: string;
}

interface WikidataResponse {
  results: {
    bindings: Array<{
      item: WikidataBinding;
      itemLabel?: WikidataBinding;
      website?: WikidataBinding;
      coord?: WikidataBinding;
      localityLabel?: WikidataBinding;
      regionLabel?: WikidataBinding;
      senb?: WikidataBinding;
      dissolved?: WikidataBinding;
    }>;
  };
}

const QUERY = `
SELECT ?item ?itemLabel ?website ?coord ?localityLabel ?regionLabel ?senb ?dissolved WHERE {
  ?item wdt:P31/wdt:P279* wd:Q131734 ;
        wdt:P17 wd:Q55 .
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P131 ?locality. }
  OPTIONAL {
    ?item wdt:P131* ?region .
    ?region wdt:P31 wd:Q13439015 .
  }
  OPTIONAL { ?item wdt:P12691 ?senb. }
  OPTIONAL { ?item wdt:P576 ?dissolved. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "nl,en".
    ?item rdfs:label ?itemLabel .
    ?locality rdfs:label ?localityLabel .
    ?region rdfs:label ?regionLabel .
  }
}
`.trim();

function parseCoord(value: string | undefined): { latitude?: number; longitude?: number } {
  if (!value) return {};
  const match = /Point\(([-\d.]+)\s+([-\d.]+)\)/i.exec(value);
  if (!match) return {};
  return { longitude: Number(match[1]), latitude: Number(match[2]) };
}

function qid(uri: string): string {
  return uri.replace(/.*\/entity\//, "");
}

export async function fetchWikidataBreweries(): Promise<SourceRecord[]> {
  const body = new URLSearchParams({ query: QUERY, format: "json" });
  const data = await fetchJson<WikidataResponse>("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
    body,
  });

  const byId = new Map<string, SourceRecord>();
  for (const row of data.results.bindings) {
    const id = qid(row.item.value);
    const existing = byId.get(id);
    const coords = parseCoord(row.coord?.value);
    const next: SourceRecord = {
      origin: "wikidata",
      name: row.itemLabel?.value || id,
      website: row.website?.value,
      locality: row.localityLabel?.value,
      region: row.regionLabel?.value,
      latitude: coords.latitude,
      longitude: coords.longitude,
      sourceUrl: `https://www.wikidata.org/wiki/${id}`,
      externalId: id,
      wikidataId: id,
      senb: row.senb?.value,
      closed: Boolean(row.dissolved?.value),
    };
    if (!existing) {
      byId.set(id, next);
      continue;
    }
    byId.set(id, {
      ...existing,
      website: existing.website ?? next.website,
      locality: existing.locality ?? next.locality,
      region: existing.region ?? next.region,
      latitude: existing.latitude ?? next.latitude,
      longitude: existing.longitude ?? next.longitude,
      senb: existing.senb ?? next.senb,
      closed: existing.closed || next.closed,
    });
  }
  return [...byId.values()];
}
