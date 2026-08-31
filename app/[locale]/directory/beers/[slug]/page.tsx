import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getBeerBySlug } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const beer = await getBeerBySlug(slug);
  if (!beer || !isLocale(locale)) return {};
  return { title: beer.name, description: `${beer.name} | Dutch.beer` };
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
  const text = copy[locale];

  return (
    <main>
      <SiteHeader locale={locale} />
      <article className="brewery-page shell">
        <p className="eyebrow">
          <Link href={`/${locale}/directory/beers`}>{text.directory.beers.title}</Link>
        </p>
        <h1>{beer.name}</h1>
        <p className="lead">{beer.breweryName}</p>

        <dl className="fact-list">
          <div>
            <dt>{text.beer.brewery}</dt>
            <dd>
              {beer.brewerySlug ? (
                <Link href={`/${locale}/directory/breweries/${beer.brewerySlug}`}>{beer.breweryName}</Link>
              ) : (
                beer.breweryName
              )}
            </dd>
          </div>
          {beer.style ? (
            <div>
              <dt>{text.beer.style}</dt>
              <dd>{beer.style}</dd>
            </div>
          ) : null}
          {beer.abv !== undefined ? (
            <div>
              <dt>{text.beer.abv}</dt>
              <dd>{beer.abv}%</dd>
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
          <h2>{text.directory.sources}</h2>
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
          <div className="source-badges">
            <span className="badge badge-wikidata">{text.directory.origin.wikidata}</span>
          </div>
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
          <Link className="button button-quiet" href={`/${locale}/contribute`}>
            {text.brewery.suggestCorrection}
          </Link>
        </p>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
