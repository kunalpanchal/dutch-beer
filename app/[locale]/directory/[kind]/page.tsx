import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PintMark } from "@/components/pint-mark";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BreweryCards } from "@/components/brewery-cards";
import { SourceOriginNote } from "@/components/source-credit";
import {
  getBreweryById,
  listPendingBreweries,
  listPublishedBeers,
  listPublishedBreweries,
  toListItem,
} from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
import { beerPath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    ["breweries", "beers"].map((kind) => ({ locale, kind })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}): Promise<Metadata> {
  const { locale, kind } = await params;
  if (!isLocale(locale) || (kind !== "breweries" && kind !== "beers")) return {};
  const page = copy[locale].directory[kind];
  return pageMetadata({
    locale,
    title: page.title,
    description: page.description,
    path: `/${locale}/directory/${kind}`,
  });
}

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}) {
  const { locale, kind } = await params;
  if (!isLocale(locale) || (kind !== "breweries" && kind !== "beers")) notFound();
  const text = copy[locale].directory;
  const page = text[kind];
  const publishedBreweries = kind === "breweries" ? await listPublishedBreweries() : [];
  const publishedBeers = kind === "beers" ? await listPublishedBeers() : [];
  const pendingCount = kind === "breweries" ? (await listPendingBreweries()).length : 0;
  const beersWithBreweries = await Promise.all(
    publishedBeers.map(async (beer) => ({
      beer,
      brewery: await getBreweryById(beer.breweryId),
    })),
  );

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="directory-hero shell">
        <nav className="directory-tabs" aria-label={copy[locale].navigation.directory}>
          <Link
            href={`/${locale}/directory/breweries`}
            aria-current={kind === "breweries" ? "page" : undefined}
          >
            {text.breweries.title}
          </Link>
          <Link
            href={`/${locale}/directory/beers`}
            aria-current={kind === "beers" ? "page" : undefined}
          >
            {text.beers.title}
          </Link>
          <Link href={`/${locale}/directory/places`}>{copy[locale].places.title}</Link>
        </nav>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </section>
      {kind === "breweries" && publishedBreweries.length > 0 ? (
        <section className="shell listing-section">
          <BreweryCards
            locale={locale}
            items={publishedBreweries.map(toListItem)}
            hrefBase={`/${locale}/directory/breweries`}
            emptyLabel={page.empty}
          />
        </section>
      ) : null}
      {kind === "beers" && beersWithBreweries.length > 0 ? (
        <section className="shell listing-section">
          <ul className="beer-index">
            {beersWithBreweries.map(({ beer, brewery }) => (
              <li key={beer.slug}>
                <Link href={beerPath(locale, beer.slug)}>
                  <strong>{beer.name}</strong>
                  <span>
                    {[brewery?.name, beer.style, typeof beer.abv === "number" ? `${beer.abv}%` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {(kind === "breweries" && publishedBreweries.length === 0) || (kind === "beers" && beersWithBreweries.length === 0) ? (
        <section className="empty-state shell">
          <PintMark className="empty-mark" />
          <h2>{page.empty}</h2>
          <p>{text.emptyCopy}</p>
          <div className="actions empty-actions">
            {pendingCount > 0 ? (
              <Link className="button button-ale" href={`/${locale}/review`}>
                {pendingCount} {text.pendingNote}
              </Link>
            ) : null}
            <Link className="button button-quiet" href={`/${locale}/contribute`}>
              {page.action}
            </Link>
          </div>
        </section>
      ) : null}
      {kind === "breweries" ? (
        <section className="shell listing-section">
          <SourceOriginNote locale={locale} />
        </section>
      ) : null}
      <SiteFooter locale={locale} />
    </main>
  );
}
