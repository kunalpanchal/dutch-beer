import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeerList } from "@/components/beer-list";
import { BreweryList } from "@/components/brewery-list";
import { PintMark } from "@/components/pint-mark";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listBeers, listBreweries, toBeerListItem, toListItem } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
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
  const breweryRows = kind === "breweries" ? (await listBreweries()).map(toListItem) : [];
  const beerRows = kind === "beers" ? (await listBeers()).map(toBeerListItem) : [];
  const empty = kind === "breweries" ? breweryRows.length === 0 : beerRows.length === 0;

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
      {empty ? (
        <section className="empty-state shell">
          <PintMark className="empty-mark" />
          <h2>{page.empty}</h2>
          <p>{text.emptyCopy}</p>
          <Link className="button button-ale" href={`/${locale}/contribute`}>
            {page.action}
          </Link>
        </section>
      ) : (
        <section className="shell listing-section">
          {kind === "breweries" ? (
            <BreweryList locale={locale} items={breweryRows} hrefBase={`/${locale}/directory/breweries`} />
          ) : (
            <BeerList locale={locale} items={beerRows} hrefBase={`/${locale}/directory/beers`} />
          )}
        </section>
      )}
      <SiteFooter locale={locale} />
    </main>
  );
}
