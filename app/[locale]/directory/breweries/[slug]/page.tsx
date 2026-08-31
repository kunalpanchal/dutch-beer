import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ClaimPanel } from "@/components/claim-panel";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  breweryOrigins,
  getBreweryBySlug,
  listBeersForBrewery,
  listBreweries,
} from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";
import {
  beerPath,
  breweryPath,
  contributePath,
  placePath,
} from "@/lib/paths";
import { slugify } from "@/lib/catalog/normalize";
import type { Brewery } from "@/lib/schema";
import { isClaimed } from "@/lib/schema";
import {
  breadcrumbJsonLd,
  breweryBreadcrumbs,
  breweryJsonLd,
  breweryMetadata,
  localityLine,
  mapHref,
  socialEntries,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const brewery = await getBreweryBySlug(slug);
  if (!brewery || !isLocale(locale)) return {};
  return breweryMetadata(brewery, locale);
}

function osmEmbed(latitude: number, longitude: number): string {
  const delta = 0.012;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function formatStreetAddress(brewery: Brewery): string[] {
  const address = brewery.address;
  if (!address) return [];
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityLine = [address.postalCode, address.locality].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (address.region) lines.push(address.region);
  return lines;
}

function hasVisitInfo(brewery: Brewery): boolean {
  return Boolean(
    brewery.address?.locality ||
      brewery.address?.street ||
      (brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined) ||
      brewery.openingHours ||
      brewery.telephone ||
      brewery.taproom,
  );
}

function mediaImage(src: string, className: string | undefined, size: { width: number; height: number }, priority = false) {
  return (
    <Image
      src={src}
      alt=""
      width={size.width}
      height={size.height}
      className={className}
      priority={priority}
      unoptimized={!src.startsWith("/")}
    />
  );
}

function hasUpdate(brewery: Brewery): boolean {
  return brewery.updatedAt.slice(0, 10) > brewery.createdAt.slice(0, 10);
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
  const pending = brewery.status !== "published";
  const origins = breweryOrigins(brewery);
  const beers = await listBeersForBrewery(brewery);
  const place = localityLine(brewery);
  const locality = brewery.address?.locality?.trim();
  const directions = mapHref(brewery);
  const claimed = isClaimed(brewery);
  const verified = brewery.trustLevel === "verified_brewery";
  const social = socialEntries(brewery);
  const crumbs = breweryBreadcrumbs(brewery, locale);
  const streetLines = formatStreetAddress(brewery);
  const visit = hasVisitInfo(brewery);
  const related = locality
    ? (await listBreweries())
        .filter((item) => item.slug !== brewery.slug && item.address?.locality?.trim() && slugify(item.address.locality) === slugify(locality))
        .slice(0, 6)
    : [];

  const beerCountLabel =
    beers.length === 1 ? text.brewery.beerOne : text.brewery.beersCount.replace("{count}", String(beers.length));

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={breweryJsonLd(brewery, locale)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="brewery-hub">
        <div className="shell brewery-hub-top">
          <Breadcrumbs items={crumbs} />
        </div>

        {brewery.coverImage ? (
          <div className="brewery-cover">
            {/* Cover is owner- or source-supplied; never a stock stand-in. */}
            {mediaImage(brewery.coverImage, undefined, { width: 1600, height: 640 }, true)}
            {brewery.logo ? mediaImage(brewery.logo, "brewery-logo", { width: 96, height: 96 }) : null}
          </div>
        ) : (
          <header className="brewery-identity-band">
            <div className="shell">
              {brewery.logo ? mediaImage(brewery.logo, "brewery-logo brewery-logo-band", { width: 72, height: 72 }) : null}
              <div className="listing-card-top">
                <h1>{brewery.name}</h1>
                {brewery.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
              </div>
              {place ? (
                <p className="brewery-place">
                  {locality ? (
                    <Link href={placePath(locale, slugify(locality))}>{locality}</Link>
                  ) : null}
                  {locality && brewery.address?.region ? " · " : null}
                  {brewery.address?.region}
                </p>
              ) : null}
              {claimed ? (
                <p className="claimed-status">
                  <span aria-hidden="true">✓ </span>
                  {verified ? `${text.brewery.verified} · ` : null}
                  {text.brewery.managedBy.replace("{name}", brewery.name)}
                </p>
              ) : null}
            </div>
          </header>
        )}

        <div className="shell brewery-hub-body">
          {brewery.coverImage ? (
            <header className="brewery-identity">
              <div className="listing-card-top">
                <h1>{brewery.name}</h1>
                {brewery.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
              </div>
              {place ? (
                <p className="brewery-place">
                  {locality ? (
                    <Link href={placePath(locale, slugify(locality))}>{locality}</Link>
                  ) : null}
                  {locality && brewery.address?.region ? " · " : null}
                  {brewery.address?.region}
                </p>
              ) : null}
              {claimed ? (
                <p className="claimed-status">
                  <span aria-hidden="true">✓ </span>
                  {verified ? `${text.brewery.verified} · ` : null}
                  {text.brewery.managedBy.replace("{name}", brewery.name)}
                </p>
              ) : null}
            </header>
          ) : null}

          {brewery.description ? <p className="brewery-description">{brewery.description}</p> : null}

          {brewery.website || social.length || directions ? (
          <ul className="brewery-actions-row">
            {brewery.website ? (
              <li>
                <a className="button button-ale" href={brewery.website} rel="noreferrer">
                  {text.brewery.website}
                </a>
              </li>
            ) : null}
            {social.map((entry) => (
              <li key={entry.key}>
                <a className="button button-quiet" href={entry.href} rel="noreferrer">
                  {text.brewery[entry.key]}
                </a>
              </li>
            ))}
            {directions ? (
              <li>
                <a className="button button-quiet" href={directions} rel="noreferrer">
                  {text.brewery.directions}
                </a>
              </li>
            ) : null}
          </ul>
          ) : null}

          <ClaimPanel brewery={brewery} locale={locale} placement="hero" />

          {pending ? (
            <aside className="trust-note">
              <strong>{text.brewery.awaiting}</strong>
              <p>{text.brewery.awaitingCopy}</p>
            </aside>
          ) : null}

          <section>
            <div className="section-heading">
              <h2>{text.brewery.beers}</h2>
              <p>{beerCountLabel}</p>
            </div>
            {beers.length ? (
              <ul className="beer-index">
                {beers.map((beer) => (
                  <li key={beer.slug}>
                    <Link href={beerPath(locale, beer.slug)}>
                      <strong>{beer.name}</strong>
                      <span>
                        {[beer.style, typeof beer.abv === "number" ? `${beer.abv}%` : null].filter(Boolean).join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-inline">
                <p>{text.brewery.beersEmpty}</p>
                <Link className="button button-quiet" href={contributePath(locale, { kind: "beer", brewery: brewery.slug })}>
                  {text.brewery.addBeer}
                </Link>
              </div>
            )}
          </section>

          {visit ? (
            <section>
              <h2>{text.brewery.visit}</h2>
              <dl className="fact-list">
                {streetLines.length ? (
                  <div>
                    <dt>{text.brewery.address}</dt>
                    <dd>
                      <address>
                        {brewery.address?.street ? (
                          <>
                            {brewery.address.street}
                            <br />
                          </>
                        ) : null}
                        {brewery.address?.postalCode ? `${brewery.address.postalCode} ` : null}
                        {locality ? <Link href={placePath(locale, slugify(locality))}>{locality}</Link> : null}
                        {brewery.address?.region ? (
                          <>
                            <br />
                            {brewery.address.region}
                          </>
                        ) : null}
                      </address>
                    </dd>
                  </div>
                ) : place ? (
                  <div>
                    <dt>{text.brewery.location}</dt>
                    <dd>
                      {locality ? <Link href={placePath(locale, slugify(locality))}>{place}</Link> : place}
                    </dd>
                  </div>
                ) : null}
                {brewery.telephone ? (
                  <div>
                    <dt>{text.brewery.telephone}</dt>
                    <dd>
                      <a href={`tel:${brewery.telephone}`}>{brewery.telephone}</a>
                    </dd>
                  </div>
                ) : null}
                {brewery.openingHours ? (
                  <div>
                    <dt>{text.brewery.openingHours}</dt>
                    <dd>{brewery.openingHours}</dd>
                  </div>
                ) : null}
                {brewery.taproom ? (
                  <div>
                    <dt>{text.brewery.taproom}</dt>
                    <dd>
                      {brewery.taproom.name ? <strong>{brewery.taproom.name}</strong> : null}
                      {brewery.taproom.description ? <p>{brewery.taproom.description}</p> : null}
                      {brewery.taproom.website ? (
                        <a href={brewery.taproom.website} rel="noreferrer">
                          {brewery.taproom.website}
                        </a>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined ? (
                <div className="brewery-map-wrap">
                  <iframe
                    title={text.directory.map}
                    className="brewery-map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={osmEmbed(brewery.address.latitude, brewery.address.longitude)}
                  />
                  {directions ? (
                    <a href={directions} rel="noreferrer">
                      {text.directory.map}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {hasUpdate(brewery) ? (
            <section>
              <h2>{text.brewery.updates}</h2>
              <p>
                {text.brewery.updatedOn} {brewery.updatedAt.slice(0, 10)}
              </p>
            </section>
          ) : null}

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

          {related.length ? (
            <section>
              <h2>{text.brewery.related.replace("{place}", locality ?? "")}</h2>
              <ul className="related-breweries">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={breweryPath(locale, item.slug)}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ClaimPanel brewery={brewery} locale={locale} placement="footer" />

          <p className="brewery-actions">
            <Link className="button button-quiet" href={contributePath(locale, { kind: "correction", brewery: brewery.slug })}>
              {text.brewery.suggestCorrection}
            </Link>
          </p>
        </div>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
