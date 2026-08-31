import type { SourceRecord } from "@/lib/catalog/merge";
import { fetchJson } from "@/lib/import/http";

interface OpenBrewery {
  id: string;
  name: string;
  brewery_type?: string;
  website_url?: string | null;
  city?: string | null;
  state_province?: string | null;
  country?: string | null;
  longitude?: string | number | null;
  latitude?: string | number | null;
}

function asNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchOpenBreweryDb(): Promise<SourceRecord[]> {
  const records: SourceRecord[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.openbrewerydb.org/v1/breweries?by_country=netherlands&per_page=200&page=${page}`;
    const pageRows = await fetchJson<OpenBrewery[]>(url);
    if (!pageRows.length) break;
    for (const row of pageRows) {
      if (row.country && row.country.toLowerCase() !== "netherlands") continue;
      records.push({
        origin: "open_brewery_db",
        name: row.name,
        website: row.website_url ?? undefined,
        locality: row.city ?? undefined,
        region: row.state_province ?? undefined,
        latitude: asNumber(row.latitude),
        longitude: asNumber(row.longitude),
        sourceUrl: `https://www.openbrewerydb.org/`,
        note: `Open Brewery DB (MIT) id ${row.id}`,
        externalId: row.id,
        closed: row.brewery_type === "closed",
      });
    }
    if (pageRows.length < 200) break;
  }
  return records;
}
