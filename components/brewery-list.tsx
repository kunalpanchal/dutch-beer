"use client";

import { BrewerySheet } from "@/components/directory-sheet";
import type { BreweryListItem } from "@/lib/catalog/store";
import { copy, type Locale } from "@/lib/i18n";

export function BreweryList({
  locale,
  items,
  hrefBase,
}: {
  locale: Locale;
  items: BreweryListItem[];
  hrefBase: string;
}) {
  const text = copy[locale];
  const table = text.directory.table;

  return (
    <BrewerySheet
      rows={items}
      hrefBase={hrefBase}
      copy={{
        search: table.search,
        searchPlaceholder: table.searchPlaceholder,
        facetLabel: table.region,
        allFacet: table.allRegions,
        showing: table.showing,
        noMatches: table.noMatches,
        previous: table.previous,
        next: table.next,
        pagination: table.pagination,
        columns: table.columns,
          origin: text.directory.origin,
          closed: text.directory.closed,
          claimed: text.directory.claimed,
        }}
    />
  );
}
