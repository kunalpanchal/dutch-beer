"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 25;

type SortDir = "asc" | "desc";

export type SheetToolbarCopy = {
  search: string;
  searchPlaceholder: string;
  sort: string;
  sortDefault: string;
  showing: string;
  noMatches: string;
  previous: string;
  next: string;
  pagination: string;
};

export type SheetColumn<T> = {
  id: string;
  label: string;
  value: (row: T) => string;
  href?: (row: T) => string | undefined;
  external?: boolean;
  format?: (row: T) => string;
};

function compare(a: string, b: string): number {
  return a.localeCompare(b, "nl", { numeric: true, sensitivity: "base" });
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function DirectorySheet<T extends { slug: string }>({
  rows,
  columns,
  copy,
  facet,
}: {
  rows: T[];
  columns: SheetColumn<T>[];
  copy: SheetToolbarCopy;
  facet?: {
    label: string;
    all: string;
    value: (row: T) => string | undefined;
  };
}) {
  const [query, setQuery] = useState("");
  const [facetValue, setFacetValue] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const facetOptions = useMemo(() => {
    if (!facet) return [];
    const unique = [...new Set(rows.map((row) => facet.value(row)).filter((value): value is string => Boolean(value)))];
    return unique.sort((a, b) => compare(a, b));
  }, [facet, rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (facet && facetValue && facet.value(row) !== facetValue) return false;
      if (!needle) return true;
      return columns.some((column) => {
        const formatted = column.format?.(row);
        return `${formatted ?? ""} ${column.value(row)}`.toLowerCase().includes(needle);
      });
    });
  }, [columns, facet, facetValue, query, rows]);

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
        {facet && facetOptions.length > 0 ? (
          <label className="sheet-facet">
            <span>{facet.label}</span>
            <select
              value={facetValue}
              onChange={(event) => {
                setFacetValue(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{facet.all}</option>
              {facetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="sheet-sort-control">
          <span>{copy.sort}</span>
          <select
            value={sortKey}
            onChange={(event) => {
              setSortKey(event.target.value);
              setSortDir("asc");
              setPage(1);
            }}
          >
            <option value="">{copy.sortDefault}</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
            ))}
          </select>
        </label>
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
                  <th
                    key={column.id}
                    className={`sheet-col-${column.id}`}
                    scope="col"
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
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
                    const empty = !label;
                    return (
                      <td
                        key={column.id}
                        className={`sheet-col-${column.id}${empty ? " is-empty" : ""}`}
                        data-label={column.label}
                      >
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
