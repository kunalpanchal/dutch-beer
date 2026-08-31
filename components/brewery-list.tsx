"use client";

import { DirectorySheet, type SheetColumn } from "@/components/directory-sheet";
import type { BreweryListItem } from "@/lib/catalog/store";
import { copy, type Locale } from "@/lib/i18n";

function host(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

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
  const columns: SheetColumn<BreweryListItem>[] = [
    {
      id: "name",
      label: table.columns.name,
      value: (row) => row.name,
      href: (row) => `${hrefBase}/${row.slug}`,
      format: (row) => {
        const flags = [row.closed ? text.directory.closed : "", row.claimed ? text.directory.claimed : ""].filter(Boolean);
        return flags.length ? `${row.name} (${flags.join(", ")})` : row.name;
      },
    },
    { id: "locality", label: table.columns.locality, value: (row) => row.locality ?? "" },
    { id: "region", label: table.columns.region, value: (row) => row.region ?? "" },
    {
      id: "map",
      label: table.columns.map,
      value: (row) => (row.mapHref ? table.columns.map : ""),
      href: (row) => row.mapHref,
      external: true,
    },
    {
      id: "website",
      label: table.columns.website,
      value: (row) => row.website ?? "",
      href: (row) => row.website,
      external: true,
      format: (row) => host(row.website ?? ""),
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
        searchPlaceholder: table.searchPlaceholder,
        sort: table.sort,
        sortDefault: table.sortDefault,
        showing: table.showing,
        noMatches: table.noMatches,
        previous: table.previous,
        next: table.next,
        pagination: table.pagination,
      }}
      facet={{
        label: table.region,
        all: table.allRegions,
        value: (row) => row.region,
      }}
    />
  );
}
