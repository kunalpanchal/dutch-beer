"use client";

import { DirectorySheet, type SheetColumn } from "@/components/directory-sheet";
import type { BeerListItem } from "@/lib/catalog/store";
import { copy, type Locale } from "@/lib/i18n";

export function BreweryBeerSheet({
  locale,
  items,
  hrefBase,
}: {
  locale: Locale;
  items: BeerListItem[];
  hrefBase: string;
}) {
  const text = copy[locale];
  const table = text.directory.table;
  const brewery = text.brewery;
  const columns: SheetColumn<BeerListItem>[] = [
    {
      id: "name",
      label: table.beerColumns.name,
      value: (row) => row.name,
      href: (row) => `${hrefBase}/${row.slug}`,
    },
    { id: "style", label: table.beerColumns.style, value: (row) => row.style ?? "" },
    {
      id: "abv",
      label: table.beerColumns.abv,
      value: (row) => (row.abv === undefined ? "" : String(row.abv)),
      format: (row) => (row.abv === undefined ? "" : `${row.abv}%`),
    },
  ];

  return (
    <DirectorySheet
      rows={items}
      columns={columns}
      copy={{
        search: table.search,
        searchPlaceholder: brewery.beerSearchPlaceholder,
        sort: table.sort,
        sortDefault: table.sortDefault,
        showing: table.showing,
        noMatches: table.noMatches,
        previous: table.previous,
        next: table.next,
        pagination: table.pagination,
      }}
      facet={{
        label: table.beerColumns.style,
        all: brewery.allStyles,
        value: (row) => row.style,
      }}
    />
  );
}
