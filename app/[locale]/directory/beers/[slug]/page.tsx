import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getBeerBySlug, getBreweryById, listBeers } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
import { breweryPath, contributePath } from "@/lib/paths";
import {
  beerBreadcrumbs,
  beerJsonLd,
  beerMetadata,
  breadcrumbJsonLd,
} from "@/lib/seo";

export async function generateStaticParams() {
  const beers = await listBeers();
  return locales.flatMap((locale) => beers.map((beer) => ({ locale, slug: beer.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const beer = await getBeerBySlug(slug);
  if (!beer) return {};
  const brewery = await getBreweryById(beer.breweryId);
  return beerMetadata(beer, brewery, locale);
}

export default async function BeerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const beer = await getBeerBySlug(slug);
  if (!beer) notFound();
  const brewery = await getBreweryById(beer.breweryId);
  const text = copy[locale];
  const crumbs = beerBreadcrumbs(beer, brewery, locale);
  const availability = beer.availability ? text.contribute.availability[beer.availability] : undefined;

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={beerJsonLd(beer, brewery, locale)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="brewery-hub beer-page">
        <div className="shell brewery-hub-top">
          <Breadcrumbs items={crumbs} />
        </div>
        <header className="brewery-identity-band">
          <div className="shell">
            <p className="eyebrow">
              {brewery ? (
                <Link href={breweryPath(locale, brewery.slug)}>{brewery.name}</Link>
              ) : (
                text.directory.beers.title
              )}
            </p>
            <h1>{beer.name}</h1>
            {brewery ? (
              <p className="brewery-place">
                {text.beer.by} <Link href={breweryPath(locale, brewery.slug)}>{brewery.name}</Link>
              </p>
            ) : null}
          </div>
        </header>
        <div className="shell brewery-hub-body">
          {beer.description ? <p className="lead">{beer.description}</p> : null}
          <dl className="fact-list">
            {brewery ? (
              <div>
                <dt>{text.beer.brewery}</dt>
                <dd>
                  <Link href={breweryPath(locale, brewery.slug)}>{brewery.name}</Link>
                </dd>
              </div>
            ) : null}
            {beer.style ? (
              <div>
                <dt>{text.beer.style}</dt>
                <dd>{beer.style}</dd>
              </div>
            ) : null}
            {typeof beer.abv === "number" ? (
              <div>
                <dt>{text.beer.abv}</dt>
                <dd>{beer.abv}%</dd>
              </div>
            ) : null}
            {availability ? (
              <div>
                <dt>{text.beer.availability}</dt>
                <dd>{availability}</dd>
              </div>
            ) : null}
          </dl>
          <section>
            <h2>{text.beer.sources}</h2>
            <ul className="source-list">
              {beer.sources.map((source, index) => (
                <li key={`${source.url ?? source.note}-${index}`}>
                  {source.url ? (
                    <a href={source.url} rel="noreferrer">
                      {source.note ?? source.sourceKind}
                    </a>
                  ) : (
                    <span>{source.note ?? source.sourceKind}</span>
                  )}
                  <small>
                    {text.beer.captured} {source.capturedAt.slice(0, 10)}
                  </small>
                </li>
              ))}
            </ul>
          </section>
          <p className="brewery-actions">
            <Link className="button button-quiet" href={contributePath(locale, { kind: "correction", entry: beer.name })}>
              {text.beer.suggestCorrection}
            </Link>
          </p>
        </div>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
