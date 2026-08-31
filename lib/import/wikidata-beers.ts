import { isGenericBeerStyle, type BeerSourceRecord } from "@/lib/catalog/beers";
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
      brewery?: WikidataBinding;
      breweryLabel?: WikidataBinding;
      abv?: WikidataBinding;
      styleLabel?: WikidataBinding;
      website?: WikidataBinding;
      senb?: WikidataBinding;
    }>;
  };
}

const QUERY = `
SELECT ?item ?itemLabel ?brewery ?breweryLabel ?abv ?styleLabel ?website ?senb WHERE {
  ?item wdt:P31/wdt:P279* wd:Q44 ;
        wdt:P495 wd:Q55 .
  OPTIONAL { ?item wdt:P176 ?brewery. }
  OPTIONAL { ?item wdt:P2665 ?abv. }
  OPTIONAL {
    ?item wdt:P31 ?style .
    FILTER(?style != wd:Q44)
  }
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P12932 ?senb. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "nl,en,de,fr,mul".
    ?item rdfs:label ?itemLabel .
    ?brewery rdfs:label ?breweryLabel .
    ?style rdfs:label ?styleLabel .
  }
}
`.trim();

function qid(uri: string): string {
  return uri.replace(/.*\/entity\//, "");
}

function parseAbv(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /(-?\d+(?:\.\d+)?)/.exec(value.replace(",", "."));
  if (!match) return undefined;
  const abv = Number(match[1]);
  return Number.isFinite(abv) ? abv : undefined;
}

function usableName(label: string | undefined, id: string): string {
  const name = label?.trim();
  if (name && name.toUpperCase() !== id.toUpperCase()) return name;
  return id;
}

export async function fetchWikidataBeers(): Promise<BeerSourceRecord[]> {
  const body = new URLSearchParams({ query: QUERY, format: "json" });
  const data = await fetchJson<WikidataResponse>("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
    body,
  });

  const byId = new Map<string, BeerSourceRecord>();
  for (const row of data.results.bindings) {
    const id = qid(row.item.value);
    const existing = byId.get(id);
    const style = isGenericBeerStyle(row.styleLabel?.value) ? undefined : row.styleLabel?.value.trim();
    const next: BeerSourceRecord = {
      name: usableName(row.itemLabel?.value, id),
      breweryWikidataId: row.brewery ? qid(row.brewery.value) : undefined,
      breweryName: row.breweryLabel?.value,
      style,
      abv: parseAbv(row.abv?.value),
      website: row.website?.value,
      senb: row.senb?.value,
      wikidataId: id,
      sourceUrl: `https://www.wikidata.org/wiki/${id}`,
    };
    if (!existing) {
      byId.set(id, next);
      continue;
    }
    byId.set(id, {
      ...existing,
      name: existing.name === id && next.name !== id ? next.name : existing.name,
      breweryWikidataId: existing.breweryWikidataId ?? next.breweryWikidataId,
      breweryName: existing.breweryName ?? next.breweryName,
      style: existing.style ?? next.style,
      abv: existing.abv ?? next.abv,
      website: existing.website ?? next.website,
      senb: existing.senb ?? next.senb,
    });
  }
  return [...byId.values()];
}
