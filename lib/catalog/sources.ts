import type { OpenDataOrigin } from "@/lib/schema";

export const openDataSources: Record<
  OpenDataOrigin,
  { href: string; license: string; copyright?: string }
> = {
  wikidata: { href: "https://www.wikidata.org/", license: "CC0" },
  open_brewery_db: { href: "https://www.openbrewerydb.org/", license: "MIT" },
  openstreetmap: {
    href: "https://www.openstreetmap.org/copyright",
    license: "ODbL",
    copyright: "© OpenStreetMap contributors",
  },
};

export const openDataOriginOrder: OpenDataOrigin[] = ["wikidata", "open_brewery_db", "openstreetmap"];
