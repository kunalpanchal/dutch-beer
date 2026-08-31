"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [currentOnly, setCurrentOnly] = useState(showFilters);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [showClosed, setShowClosed] = useState(!showFilters);
  const [origin, setOrigin] = useState<OpenDataOrigin | "all">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (currentOnly && (item.closed || (!item.website && item.origins.length < 2))) return false;
      if (hasWebsite && !item.website) return false;
      if (!showClosed && item.closed) return false;
      if (origin !== "all" && !item.origins.includes(origin)) return false;
      if (!needle) return true;
      const haystack = [item.name, item.locality, item.region].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, currentOnly, hasWebsite, showClosed, origin]);

  return (
    <div className="brewery-list">
      {showFilters ? (
        <div className="review-filters">
          <label className="review-search">
            <span className="visually-hidden">{text.review.search}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.review.search}
            />
          </label>
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
          <p className="review-count">
            {filtered.length} {text.review.count}
            {items.length ? ` / ${items.length}` : ""}
          </p>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="list-empty">{emptyLabel}</p>
      ) : (
        <ul className="listing-grid">
          {filtered.map((item) => (
            <li key={item.slug}>
              <Link className="listing-card" href={`${hrefBase}/${item.slug}`}>
                <div className="listing-card-top">
                  <h2>{item.name}</h2>
                  {item.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
                </div>
                <p>{[item.locality, item.region].filter(Boolean).join(", ")}</p>
                <div className="source-badges">
                  {item.origins.map((value) => (
                    <span key={value} className={`badge badge-${value}`}>
                      {text.directory.origin[value]}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
