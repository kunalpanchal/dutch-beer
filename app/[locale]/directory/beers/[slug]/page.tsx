import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getBeerBySlug, getBreweryById, getBreweryBySlug } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";
import { breweryPath, contributePath } from "@/lib/paths";
import {
  beerBreadcrumbs,
  beerJsonLd,
  beerMetadata,
  breadcrumbJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const beer = await getBeerBySlug(slug);
  if (!beer) return {};
  const brewery = (await getBreweryById(beer.breweryId)) ?? (beer.brewerySlug ? await getBreweryBySlug(beer.brewerySlug) : undefined);
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
  const brewery = (await getBreweryById(beer.breweryId)) ?? (beer.brewerySlug ? await getBreweryBySlug(beer.brewerySlug) : undefined);
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
            ) : beer.breweryName ? (
              <p className="brewery-place">
                {text.beer.by} {beer.breweryName}
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
            ) : beer.breweryName ? (
              <div>
                <dt>{text.beer.brewery}</dt>
                <dd>{beer.breweryName}</dd>
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
            {beer.website ? (
              <div>
                <dt>{text.brewery.officialSite}</dt>
                <dd>
                  <a href={beer.website} rel="noreferrer">
                    {beer.website}
                  </a>
                </dd>
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
          {beer.externalIds && Object.values(beer.externalIds).some(Boolean) ? (
            <section>
              <h2>{text.beer.identifiers}</h2>
              <ul className="id-list">
                {beer.externalIds.wikidata ? (
                  <li>
                    Wikidata:{" "}
                    <a href={`https://www.wikidata.org/wiki/${beer.externalIds.wikidata}`} rel="noreferrer">
                      {beer.externalIds.wikidata}
                    </a>
                  </li>
                ) : null}
                {beer.externalIds.senb ? (
                  <li>
                    SENB:{" "}
                    <a
                      href={`https://www.nederlandsebiercultuur.nl/databank/bier?item-id=${beer.externalIds.senb}`}
                      rel="noreferrer"
                    >
                      {beer.externalIds.senb}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}
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
