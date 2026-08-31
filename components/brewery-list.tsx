"use client";

import { useMemo, useState } from "react";
import { BrewerySheet } from "@/components/directory-sheet";
import type { BreweryListItem } from "@/lib/catalog/store";
import type { OpenDataOrigin } from "@/lib/schema";
import { copy, type Locale } from "@/lib/i18n";

const ORIGINS: OpenDataOrigin[] = ["wikidata", "open_brewery_db", "openstreetmap"];

export function BreweryList({
  locale,
  items,
  hrefBase,
  emptyLabel,
  showFilters = false,
}: {
  locale: Locale;
  items: BreweryListItem[];
  hrefBase: string;
  emptyLabel: string;
  showFilters?: boolean;
}) {
  const text = copy[locale];
  const [currentOnly, setCurrentOnly] = useState(showFilters);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [showClosed, setShowClosed] = useState(!showFilters);
  const [origin, setOrigin] = useState<OpenDataOrigin | "all">("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (currentOnly && (item.closed || (!item.website && item.origins.length < 2))) return false;
      if (hasWebsite && !item.website) return false;
      if (!showClosed && item.closed) return false;
      if (origin !== "all" && !item.origins.includes(origin)) return false;
      return true;
    });
  }, [items, currentOnly, hasWebsite, showClosed, origin]);

  const table = text.directory.table;

  return (
    <div className="brewery-list">
      {showFilters ? (
        <div className="review-filters">
          <div className="filter-toggles">
            <label>
              <input type="checkbox" checked={currentOnly} onChange={(event) => setCurrentOnly(event.target.checked)} />
              {text.review.currentOnly}
            </label>
            <label>
              <input type="checkbox" checked={hasWebsite} onChange={(event) => setHasWebsite(event.target.checked)} />
              {text.review.hasWebsite}
            </label>
            <label>
              <input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} />
              {text.review.showClosed}
            </label>
          </div>
          <div className="source-filters" role="group" aria-label={text.directory.sources}>
            <button type="button" className={origin === "all" ? "is-active" : undefined} onClick={() => setOrigin("all")}>
              {text.review.allSources}
            </button>
            {ORIGINS.map((value) => (
              <button
                key={value}
                type="button"
                className={origin === value ? "is-active" : undefined}
                onClick={() => setOrigin(value)}
              >
                {text.directory.origin[value]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <BrewerySheet
        rows={filtered}
        hrefBase={hrefBase}
        copy={{
          search: table.search,
          searchPlaceholder: table.searchPlaceholder,
          facetLabel: table.region,
          allFacet: table.allRegions,
          showing: table.showing,
          noMatches: filtered.length === 0 && items.length === 0 ? emptyLabel : table.noMatches,
          previous: table.previous,
          next: table.next,
          pagination: table.pagination,
          columns: table.columns,
          origin: text.directory.origin,
          closed: text.directory.closed,
        }}
      />
    </div>
  );
}
