import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SearchBox } from "@/components/search/search-box";
import {
  querySearchIndex,
  searchHref,
  type SearchHit,
  type SearchKind,
} from "@/lib/catalog/search";
import { getSearchIndex } from "@/lib/catalog/store";
import { copy, isLocale, type Locale } from "@/lib/i18n";
import { searchPath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function isSearchKind(value: string | undefined): value is SearchKind {
  return value === "brewery" || value === "place" || value === "beer" || value === "style";
}

const CATEGORY_EMOJI: Record<SearchKind, string> = {
  brewery: "🏢",
  place: "📍",
  beer: "🍺",
  style: "🍺",
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { q } = await searchParams;
  const text = copy[locale].search;
  const title = q?.trim() ? interpolate(text.resultsHeading, { query: q.trim() }) : text.resultsTitle;
  return pageMetadata({
    locale,
    title,
    description: text.tagline,
    path: searchPath(locale, q),
  });
}

function ResultGroup({
  locale,
  kind,
  hits,
  label,
}: {
  locale: Locale;
  kind: SearchKind;
  hits: SearchHit[];
  label: string;
}) {
  if (!hits.length) return null;
  const text = copy[locale].search;
  return (
    <section className="search-results-group">
      <h2>
        <span aria-hidden="true">{CATEGORY_EMOJI[kind]} </span>
        {label}
      </h2>
      <ul>
        {hits.map((hit) => {
          let detail = hit.detail;
          if (hit.kind === "style" && hit.detail) {
            const count = Number(hit.detail);
            detail = count === 1 ? text.styleCountOne : interpolate(text.styleCount, { count });
          }
          return (
            <li key={`${hit.kind}-${hit.slug}`}>
              <Link href={searchHref(locale, hit)}>
                <span className="search-results-name">{hit.name}</span>
                {detail ? <span className="search-results-detail">{detail}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q = "", kind: kindParam } = await searchParams;
  const kind = isSearchKind(kindParam) ? kindParam : undefined;
  const text = copy[locale].search;
  const query = q.trim();
  const index = await getSearchIndex();
  const results = querySearchIndex(index, query, { mode: "page" });

  let breweries = results.breweries;
  let places = results.places;
  let beers = results.beers;
  let styles = results.styles;

  if (kind === "brewery") {
    places = [];
    beers = [];
    styles = [];
  } else if (kind === "place") {
    breweries = [];
    beers = [];
    styles = [];
  } else if (kind === "beer") {
    breweries = [];
    places = [];
    styles = [];
  } else if (kind === "style") {
    breweries = [];
    places = [];
    // Keep matching beers that share the style name in haystack, plus style docs.
  }

  const hasResults = breweries.length + places.length + beers.length + styles.length > 0;

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="directory-hero shell search-page-hero">
        <p className="eyebrow">{text.resultsTitle}</p>
        <h1>{query ? interpolate(text.resultsHeading, { query }) : text.resultsTitle}</h1>
        <div className="search-page-box">
          <SearchBox locale={locale} variant="hero" enableHotkeys={false} initialQuery={query} />
        </div>
      </section>
      <section className="shell search-results">
        {!query ? (
          <p className="search-results-hint">{text.resultsEmptyHint}</p>
        ) : !hasResults ? (
          <div className="fresh-empty">
            <p className="fresh-empty-title">{text.resultsEmpty}</p>
            <p>{text.resultsEmptyHint}</p>
          </div>
        ) : (
          <>
            <ResultGroup locale={locale} kind="brewery" hits={breweries} label={text.categories.brewery} />
            <ResultGroup locale={locale} kind="place" hits={places} label={text.categories.place} />
            <ResultGroup locale={locale} kind="beer" hits={beers} label={text.categories.beer} />
            <ResultGroup locale={locale} kind="style" hits={styles} label={text.categories.style} />
          </>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
