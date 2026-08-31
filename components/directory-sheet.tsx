"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BreweryListItem } from "@/lib/catalog/store";

const PAGE_SIZE = 25;

type SortDir = "asc" | "desc";

export type SheetCopy = {
  search: string;
  searchPlaceholder: string;
  facetLabel: string;
  allFacet: string;
  showing: string;
  noMatches: string;
  previous: string;
  next: string;
  pagination: string;
  columns: {
    name: string;
    locality: string;
    region: string;
    website: string;
    sources: string;
  };
  origin: Record<string, string>;
  closed: string;
};

type Column = {
  id: string;
  label: string;
  value: (row: BreweryListItem) => string;
  href?: (row: BreweryListItem) => string | undefined;
  external?: boolean;
  format?: (row: BreweryListItem) => string;
};

function compare(a: string, b: string): number {
  return a.localeCompare(b, "nl", { numeric: true, sensitivity: "base" });
}

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

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function BrewerySheet({
  rows,
  hrefBase,
  copy,
}: {
  rows: BreweryListItem[];
  hrefBase: string;
  copy: SheetCopy;
}) {
  const [query, setQuery] = useState("");
  const [facetValue, setFacetValue] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const columns: Column[] = useMemo(() => [
    {
      id: "name",
      label: copy.columns.name,
      value: (row) => row.name,
      href: (row) => `${hrefBase}/${row.slug}`,
      format: (row) => (row.closed ? `${row.name} (${copy.closed})` : row.name),
    },
    { id: "locality", label: copy.columns.locality, value: (row) => row.locality ?? "" },
    { id: "region", label: copy.columns.region, value: (row) => row.region ?? "" },
    {
      id: "website",
      label: copy.columns.website,
      value: (row) => row.website ?? "",
      href: (row) => row.website,
      external: true,
      format: (row) => host(row.website ?? ""),
    },
    {
      id: "sources",
      label: copy.columns.sources,
      value: (row) => row.origins.map((origin) => copy.origin[origin] ?? origin).join(", "),
    },
  ], [copy, hrefBase]);

  const facetOptions = useMemo(() => {
    const unique = [...new Set(rows.map((row) => row.region).filter((value): value is string => Boolean(value)))];
    return unique.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (facetValue && row.region !== facetValue) return false;
      if (!needle) return true;
      return columns.some((column) => {
        const formatted = column.format?.(row);
        return `${formatted ?? ""} ${column.value(row)}`.toLowerCase().includes(needle);
      });
    });
  }, [columns, facetValue, query, rows]);

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.id === sortKey);
    if (!column) return filtered;
    const copyRows = [...filtered];
    copyRows.sort((a, b) => {
      const result = compare(column.value(a), column.value(b));
      return sortDir === "asc" ? result : -result;
    });
    return copyRows;
  }, [columns, filtered, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);
  const from = sorted.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, sorted.length);

  function sortBy(id: string) {
    if (sortKey === id) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(id);
      setSortDir("asc");
    }
    setPage(1);
  }

  return (
    <section className="sheet">
      <div className="sheet-toolbar">
        <label className="sheet-search">
          <span>{copy.search}</span>
          <input
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={copy.searchPlaceholder}
          />
        </label>
        {facetOptions.length > 0 ? (
          <label className="sheet-facet">
            <span>{copy.facetLabel}</span>
            <select
              value={facetValue}
              onChange={(event) => {
                setFacetValue(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{copy.allFacet}</option>
              {facetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="sheet-meta">{interpolate(copy.showing, { from, to, total: sorted.length })}</p>
      </div>
      <div className="sheet-scroll">
        <table>
          <thead>
            <tr>
              <th className="sheet-index" scope="col">
                #
              </th>
              {columns.map((column) => {
                const active = sortKey === column.id;
                return (
                  <th key={column.id} scope="col" aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <button type="button" onClick={() => sortBy(column.id)}>
                      {column.label}
                      <span className="sheet-sort" aria-hidden="true">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="sheet-empty" colSpan={columns.length + 1}>
                  {copy.noMatches}
                </td>
              </tr>
            ) : (
              visible.map((row, index) => (
                <tr key={row.slug}>
                  <td className="sheet-index">{start + index + 1}</td>
                  {columns.map((column) => {
                    const href = column.href?.(row);
                    const label = column.format?.(row) ?? column.value(row);
                    return (
                      <td key={column.id}>
                        {href && label ? (
                          column.external ? (
                            <a href={href} target="_blank" rel="noreferrer">
                              {label}
                            </a>
                          ) : (
                            <Link href={href}>{label}</Link>
                          )
                        ) : (
                          label || "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <nav className="sheet-pager" aria-label={copy.pagination}>
        <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          {copy.previous}
        </button>
        <span>
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
        >
          {copy.next}
        </button>
      </nav>
    </section>
  );
}
