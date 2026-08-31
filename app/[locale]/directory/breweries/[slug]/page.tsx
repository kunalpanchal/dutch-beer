import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { breweryOrigins, getBreweryBySlug, listBeersForBrewery, listBreweries, openStreetMapHref } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";

export async function generateStaticParams() {
  const breweries = await listBreweries();
  return locales.flatMap((locale) => breweries.map((brewery) => ({ locale, slug: brewery.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const brewery = await getBreweryBySlug(slug);
  if (!brewery || !isLocale(locale)) return {};
  return { title: brewery.name, description: `${brewery.name} | Dutch.beer` };
}

export default async function BreweryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const brewery = await getBreweryBySlug(slug);
  if (!brewery) notFound();
  const text = copy[locale];
  const origins = breweryOrigins(brewery);
  const place = [brewery.address?.locality, brewery.address?.region].filter(Boolean).join(", ");
  const mapHref = openStreetMapHref(brewery.address?.latitude, brewery.address?.longitude);
  const beers = await listBeersForBrewery(brewery);

  return (
    <main>
      <SiteHeader locale={locale} />
      <article className="brewery-page shell">
        <p className="eyebrow">
          <Link href={`/${locale}/directory/breweries`}>{text.directory.breweries.title}</Link>
        </p>
        <div className="listing-card-top">
          <h1>{brewery.name}</h1>
          <div className="listing-badges">
            {brewery.claimedBy ? <span className="badge badge-claimed">{text.brewery.claimed}</span> : null}
            {brewery.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
          </div>
        </div>
        {place ? <p className="lead">{place}</p> : null}

        {brewery.claimedBy ? (
          <aside className="trust-note">
            <strong>{text.brewery.claimed}</strong>
            <p>{text.brewery.claimedCopy}</p>
          </aside>
        ) : null}

        <dl className="fact-list">
          {brewery.website ? (
            <div>
              <dt>{text.brewery.officialSite}</dt>
              <dd>
                <a href={brewery.website} rel="noreferrer">{brewery.website}</a>
              </dd>
            </div>
          ) : null}
          {place ? (
            <div>
              <dt>{text.brewery.location}</dt>
              <dd>
                {place}
                {mapHref ? (
                  <>
                    {" · "}
                    <a href={mapHref} rel="noreferrer">
                      {text.directory.map}
                    </a>
                  </>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>

        <section>
          <h2>{text.directory.sources}</h2>
          <ul className="source-list">
            {brewery.sources.map((source, index) => (
              <li key={`${source.url ?? source.note}-${index}`}>
                {source.url ? (
                  <a href={source.url} rel="noreferrer">
                    {source.note ?? source.sourceKind}
                  </a>
                ) : (
                  <span>{source.note ?? source.sourceKind}</span>
                )}
                <small>
                  {text.brewery.captured} {source.capturedAt.slice(0, 10)}
                </small>
              </li>
            ))}
          </ul>
          <div className="source-badges">
            {origins.map((origin) => (
              <span key={origin} className={`badge badge-${origin}`}>
                {text.directory.origin[origin]}
              </span>
            ))}
          </div>
        </section>

        {beers.length > 0 ? (
          <section>
            <h2>{text.brewery.beers}</h2>
            <ul className="id-list">
              {beers.map((beer) => (
                <li key={beer.id}>
                  <Link href={`/${locale}/directory/beers/${beer.slug}`}>{beer.name}</Link>
                  {beer.style ? ` · ${beer.style}` : ""}
                  {beer.abv !== undefined ? ` · ${beer.abv}%` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {brewery.externalIds && Object.values(brewery.externalIds).some(Boolean) ? (
          <section>
            <h2>{text.brewery.identifiers}</h2>
            <ul className="id-list">
              {brewery.externalIds.wikidata ? (
                <li>
                  Wikidata:{" "}
                  <a href={`https://www.wikidata.org/wiki/${brewery.externalIds.wikidata}`} rel="noreferrer">
                    {brewery.externalIds.wikidata}
                  </a>
                </li>
              ) : null}
              {brewery.externalIds.openBreweryDb ? <li>Open Brewery DB: {brewery.externalIds.openBreweryDb}</li> : null}
              {brewery.externalIds.osm ? (
                <li>
                  OpenStreetMap:{" "}
                  <a href={`https://www.openstreetmap.org/${brewery.externalIds.osm}`} rel="noreferrer">
                    {brewery.externalIds.osm}
                  </a>
                </li>
              ) : null}
              {brewery.externalIds.senb ? (
                <li>
                  SENB:{" "}
                  <a href={`https://www.nederlandsebiercultuur.nl/brouwerij/${brewery.externalIds.senb}`} rel="noreferrer">
                    {brewery.externalIds.senb}
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
          {!brewery.claimedBy && brewery.website ? (
            <Link
              className="button button-ale"
              href={`/${locale}/contribute?kind=claim&brewery=${encodeURIComponent(brewery.slug)}`}
            >
              {text.brewery.claimListing}
            </Link>
          ) : null}
        </p>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
