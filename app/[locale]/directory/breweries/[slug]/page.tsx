import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BreweryBeerBoard } from "@/components/brewery-beer-board";
import { ClaimPanel } from "@/components/claim-panel";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MapLink } from "@/components/map-link";
import {
  brewerySourceLinks,
  displayHostname,
  formatStreetAddress,
  hasVisitInfo,
  partitionBreweryBeers,
  usesBeerFilter,
} from "@/lib/catalog/brewery-hub";
import {
  breweryOrigins,
  getBreweryBySlug,
  listBeersForBrewery,
  listBreweries,
} from "@/lib/catalog/store";
import { copy, isLocale, mapLinkCopy, type Locale } from "@/lib/i18n";
import { breweryPath, contributePath, placePath } from "@/lib/paths";
import { slugify } from "@/lib/catalog/normalize";
import type { Beer, Brewery } from "@/lib/schema";
import { isClaimed } from "@/lib/schema";
import {
  breadcrumbJsonLd,
  breweryBreadcrumbs,
  breweryJsonLd,
  breweryMetadata,
  localityLine,
  socialEntries,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const LONG_STORY = 400;

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

function mediaImage(src: string, className: string | undefined, size: { width: number; height: number }, alt: string, priority = false) {
  return (
    <Image
      src={src}
      alt={alt}
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

function beerCountLabel(count: number, text: (typeof copy)[Locale]["brewery"]): string {
  return count === 1 ? text.beerOne : text.beersCount.replace("{count}", String(count));
}

function BeerSection({
  heading,
  countLabel,
  beers,
  locale,
}: {
  heading: string;
  countLabel: string;
  beers: Beer[];
  locale: Locale;
}) {
  const text = copy[locale];
  return (
    <section className="brewery-section brewery-beers">
      <div className="brewery-section-head">
        <h2>{heading}</h2>
        <p>{countLabel}</p>
      </div>
      <BreweryBeerBoard
        beers={beers}
        locale={locale}
        filterable={usesBeerFilter(beers.length)}
        copy={{
          search: text.directory.table.search,
          searchPlaceholder: text.brewery.beerSearchPlaceholder,
          noMatches: text.directory.table.noMatches,
          availability: text.contribute.availability,
        }}
      />
    </section>
  );
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
  const { featured, listed } = partitionBreweryBeers(beers);
  const place = localityLine(brewery);
  const locality = brewery.address?.locality?.trim();
  const hasMap = brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined;
  const claimed = isClaimed(brewery);
  const verified = brewery.trustLevel === "verified_brewery";
  const social = socialEntries(brewery);
  const crumbs = breweryBreadcrumbs(brewery, locale);
  const streetLines = formatStreetAddress(brewery);
  const visit = hasVisitInfo(brewery);
  const story = brewery.description?.trim();
  const longStory = Boolean(story && story.length > LONG_STORY);
  const heroDek = story && !longStory ? story : undefined;
  const sourceLinks = brewerySourceLinks(brewery, {
    website: text.brewery.website,
    wikidata: text.directory.origin.wikidata,
    open_brewery_db: text.directory.origin.open_brewery_db,
    openstreetmap: text.directory.origin.openstreetmap,
  });
  const related = locality
    ? (await listBreweries())
        .filter((item) => item.slug !== brewery.slug && item.address?.locality?.trim() && slugify(item.address.locality) === slugify(locality))
        .slice(0, 6)
    : [];
  const facts: Array<{ label: string; value: ReactNode }> = [];
  if (place) {
    facts.push({
      label: text.brewery.location,
      value: locality ? (
        <>
          <Link href={placePath(locale, slugify(locality))}>{locality}</Link>
          {brewery.address?.region ? ` · ${brewery.address.region}` : null}
        </>
      ) : (
        place
      ),
    });
  }
  if (brewery.openingHours) {
    facts.push({ label: text.brewery.openingHours, value: brewery.openingHours });
  }
  if (beers.length) {
    facts.push({ label: text.brewery.beers, value: beerCountLabel(beers.length, text.brewery) });
  }
  if (brewery.taproom?.name) {
    facts.push({ label: text.brewery.taproom, value: brewery.taproom.name });
  }
  if (brewery.website) {
    facts.push({
      label: text.brewery.website,
      value: (
        <a href={brewery.website} rel="noreferrer">
          {displayHostname(brewery.website)}
        </a>
      ),
    });
  }

  const visitHeading = brewery.taproom?.name ?? (brewery.taproom ? text.brewery.taproom : text.brewery.visit);

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={breweryJsonLd(brewery, locale)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="brewery-profile">
        <div className="shell brewery-profile-top">
          <Breadcrumbs items={crumbs} />
        </div>

        {brewery.coverImage ? (
          <div className="brewery-hero-photo">
            {mediaImage(brewery.coverImage, undefined, { width: 1600, height: 720 }, brewery.name, true)}
            {brewery.logo ? mediaImage(brewery.logo, "brewery-hero-logo brewery-hero-logo-on-photo", { width: 96, height: 96 }, "") : null}
          </div>
        ) : null}

        <header className={brewery.coverImage ? "brewery-hero brewery-hero-after-photo" : "brewery-hero"}>
          <div className="shell brewery-hero-inner">
            {brewery.logo && !brewery.coverImage
              ? mediaImage(brewery.logo, "brewery-hero-logo", { width: 80, height: 80 }, "")
              : null}
            <p className="eyebrow">{brewery.closed ? text.brewery.kickerClosed : text.brewery.kicker}</p>
            <h1>{brewery.name}</h1>
            {place ? (
              <p className="brewery-place">
                {locality ? <Link href={placePath(locale, slugify(locality))}>{locality}</Link> : null}
                {locality && brewery.address?.region ? " · " : null}
                {brewery.address?.region}
              </p>
            ) : null}
            {claimed ? (
              <p className="brewery-status">
                {verified ? `${text.brewery.verified} · ` : null}
                {text.brewery.managedBy.replace("{name}", brewery.name)}
              </p>
            ) : null}
            {heroDek ? <p className="brewery-hero-dek">{heroDek}</p> : null}
            {brewery.website || social.length || hasMap ? (
              <ul className="brewery-hero-links">
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
                {hasMap ? (
                  <li>
                    <MapLink
                      latitude={brewery.address?.latitude}
                      longitude={brewery.address?.longitude}
                      name={brewery.name}
                      copy={{ ...mapLinkCopy(locale), label: text.brewery.directions }}
                    />
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </header>

        {facts.length ? (
          <div className="brewery-facts">
            <div className="shell">
              <dl>
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : null}

        <div className="shell brewery-profile-body">
          {featured.length ? (
            <BeerSection
              heading={text.brewery.coreRange}
              countLabel={beerCountLabel(featured.length, text.brewery)}
              beers={featured}
              locale={locale}
            />
          ) : null}

          {listed.length || !beers.length ? (
            <section className="brewery-section brewery-beers">
              <div className="brewery-section-head">
                <h2>{featured.length ? text.brewery.listedBeers : text.brewery.beers}</h2>
                <p>{beers.length ? beerCountLabel(listed.length, text.brewery) : null}</p>
              </div>
              {listed.length ? (
                <BreweryBeerBoard
                  beers={listed}
                  locale={locale}
                  filterable={usesBeerFilter(listed.length)}
                  copy={{
                    search: text.directory.table.search,
                    searchPlaceholder: text.brewery.beerSearchPlaceholder,
                    noMatches: text.directory.table.noMatches,
                    availability: text.contribute.availability,
                  }}
                />
              ) : (
                <div className="empty-inline">
                  <p>{text.brewery.beersEmpty}</p>
                  <Link className="button button-quiet" href={contributePath(locale, { kind: "beer", brewery: brewery.slug })}>
                    {text.brewery.addBeer}
                  </Link>
                </div>
              )}
            </section>
          ) : null}

          {visit ? (
            <section className="brewery-section brewery-visit">
              <div className="brewery-section-head">
                <h2>{visitHeading}</h2>
              </div>
              <div className={hasMap ? "brewery-visit-grid" : undefined}>
                <div className="brewery-visit-copy">
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
                    {brewery.website ? (
                      <div>
                        <dt>{text.brewery.website}</dt>
                        <dd>
                          <a href={brewery.website} rel="noreferrer">
                            {displayHostname(brewery.website)}
                          </a>
                        </dd>
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
                              {displayHostname(brewery.taproom.website)}
                            </a>
                          ) : null}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
                {brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined ? (
                  <div className="brewery-map-wrap">
                    <iframe
                      title={text.directory.map}
                      className="brewery-map"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={osmEmbed(brewery.address.latitude, brewery.address.longitude)}
                    />
                    <MapLink
                      latitude={brewery.address.latitude}
                      longitude={brewery.address.longitude}
                      name={brewery.name}
                      copy={mapLinkCopy(locale)}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {longStory && story ? (
            <section className="brewery-section brewery-about">
              <div className="brewery-section-head">
                <h2>{text.brewery.about}</h2>
              </div>
              <p>{story}</p>
            </section>
          ) : null}

          {related.length ? (
            <section className="brewery-section">
              <div className="brewery-section-head">
                <h2>{text.brewery.related.replace("{place}", locality ?? "")}</h2>
              </div>
              <ul className="related-breweries">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={breweryPath(locale, item.slug)}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="brewery-section brewery-sources">
            <div className="brewery-section-head">
              <h2>{text.directory.sources}</h2>
            </div>
            {sourceLinks.length ? (
              <p className="brewery-source-line">
                {sourceLinks.map((source, index) => (
                  <span key={`${source.label}-${source.href ?? index}`}>
                    {index > 0 ? <span aria-hidden="true"> · </span> : null}
                    {source.href ? (
                      <a href={source.href} rel="noreferrer">
                        {source.label}
                      </a>
                    ) : (
                      source.label
                    )}
                  </span>
                ))}
              </p>
            ) : null}
            {pending ? (
              <p className="brewery-source-meta">
                {text.brewery.awaiting}. {text.brewery.awaitingCopy}
              </p>
            ) : null}
            {hasUpdate(brewery) ? (
              <p className="brewery-source-meta">
                {text.brewery.updatedOn} {brewery.updatedAt.slice(0, 10)}
              </p>
            ) : null}
            {brewery.externalIds && Object.values(brewery.externalIds).some(Boolean) ? (
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
            ) : origins.length && !sourceLinks.length ? (
              <p className="brewery-source-line">
                {origins.map((origin, index) => (
                  <span key={origin}>
                    {index > 0 ? <span aria-hidden="true"> · </span> : null}
                    {text.directory.origin[origin]}
                  </span>
                ))}
              </p>
            ) : null}
          </section>

          <section className="brewery-section brewery-corrections">
            <h2>{text.brewery.outOfDate}</h2>
            <p>{text.brewery.keepAccurate}</p>
            <Link className="button button-quiet" href={contributePath(locale, { kind: "correction", brewery: brewery.slug })}>
              {text.brewery.suggestCorrection}
            </Link>
          </section>

          <ClaimPanel brewery={brewery} locale={locale} placement="footer" />
        </div>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
