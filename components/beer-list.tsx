"use client";

import { DirectorySheet, type SheetColumn } from "@/components/directory-sheet";
import type { BeerListItem } from "@/lib/catalog/store";
import { copy, type Locale } from "@/lib/i18n";

export function BeerList({
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
  const columns: SheetColumn<BeerListItem>[] = [
    {
      id: "name",
      label: table.beerColumns.name,
      value: (row) => row.name,
      href: (row) => `${hrefBase}/${row.slug}`,
    },
    {
      id: "brewery",
      label: table.beerColumns.brewery,
      value: (row) => row.breweryName,
      href: (row) => (row.brewerySlug ? `/${locale}/directory/breweries/${row.brewerySlug}` : undefined),
    },
    { id: "style", label: table.beerColumns.style, value: (row) => row.style ?? "" },
    {
      id: "abv",
      label: table.beerColumns.abv,
      value: (row) => (row.abv === undefined ? "" : String(row.abv)),
      format: (row) => (row.abv === undefined ? "" : `${row.abv}%`),
    },
    {
      id: "sources",
      label: table.columns.sources,
      value: (row) => row.origins.map((origin) => text.directory.origin[origin] ?? origin).join(", "),
    },
  ];

  return (
    <DirectorySheet
      rows={items}
      columns={columns}
      copy={{
        search: table.search,
        searchPlaceholder: table.beerSearchPlaceholder,
        sort: table.sort,
        sortDefault: table.sortDefault,
        showing: table.showing,
        noMatches: table.noMatches,
        previous: table.previous,
        next: table.next,
        pagination: table.pagination,
      }}
      facet={{
        label: table.beerColumns.brewery,
        all: table.allBreweries,
        value: (row) => row.breweryName,
      }}
    />
  );
}
