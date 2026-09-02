"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Beer, BeerAvailability } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";
import { beerPath } from "@/lib/paths";

const SHOWN_AVAILABILITY = new Set<BeerAvailability>(["year_round", "seasonal", "one_off"]);

export type BeerBoardItem = Pick<Beer, "slug" | "name" | "style" | "abv" | "description" | "availability">;

export function BreweryBeerBoard({
  beers,
  locale,
  filterable,
  copy,
}: {
  beers: BeerBoardItem[];
  locale: Locale;
  filterable: boolean;
  copy: {
    search: string;
    searchPlaceholder: string;
    noMatches: string;
    availability: Record<BeerAvailability, string>;
  };
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return beers;
    return beers.filter((beer) => {
      const haystack = [beer.name, beer.style, beer.description].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [beers, query]);

  return (
    <div className="beer-board">
      {filterable ? (
        <label className="beer-board-filter">
          <span>{copy.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            autoComplete="off"
          />
        </label>
      ) : null}
      {filtered.length ? (
        <ul className="beer-board-list">
          {filtered.map((beer) => {
            const availability =
              beer.availability && SHOWN_AVAILABILITY.has(beer.availability)
                ? copy.availability[beer.availability]
                : undefined;
            return (
              <li key={beer.slug}>
                <Link href={beerPath(locale, beer.slug)}>
                  <span className="beer-board-name">{beer.name}</span>
                  <span className="beer-board-style">{beer.style ?? ""}</span>
                  <span className="beer-board-abv">{typeof beer.abv === "number" ? `${beer.abv}%` : ""}</span>
                  {availability ? <span className="beer-board-avail">{availability}</span> : null}
                  {beer.description ? <span className="beer-board-copy">{beer.description}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="list-empty">{copy.noMatches}</p>
      )}
    </div>
  );
}
