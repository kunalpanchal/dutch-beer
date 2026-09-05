import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BreweryBeerSheet } from "@/components/brewery-beer-sheet";
import {
  BreweryAboutExtras,
  BreweryBranches,
  BreweryEvents,
  BreweryMediaImage,
  BreweryNews,
  BreweryPhotos,
  BreweryVisitPanel,
} from "@/components/brewery-profile";
import { ClaimPanel } from "@/components/claim-panel";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MapLink } from "@/components/map-link";
import {
  breweryIntro,
  hasAboutExtras,
  hasVisitInfo,
  isSafeAccentColor,
  partitionBreweryBeers,
  upcomingEvents,
  usesBeerSheet,
} from "@/lib/catalog/brewery-hub";
import {
  breweryOrigins,
  getBreweryBySlug,
  listBeersForBrewery,
  listBreweries,
  toBeerListItem,
} from "@/lib/catalog/store";
import { copy, isLocale, mapLinkCopy, type Locale } from "@/lib/i18n";
import {
  beerPath,
  breweryPath,
  contributePath,
  placePath,
} from "@/lib/paths";
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

function hasUpdate(brewery: Brewery): boolean {
  return brewery.updatedAt.slice(0, 10) > brewery.createdAt.slice(0, 10);
}

function beerCountLabel(count: number, text: (typeof copy)[Locale]["brewery"]): string {
  return count === 1 ? text.beerOne : text.beersCount.replace("{count}", String(count));
}

function BeerIndex({ beers, locale }: { beers: Beer[]; locale: Locale }) {
  return (
    <ul className="beer-index">
      {beers.map((item) => (
        <li key={item.slug}>
          <Link href={beerPath(locale, item.slug)}>
            <strong>{item.name}</strong>
            <span>
              {[item.style, typeof item.abv === "number" ? `${item.abv}%` : null].filter(Boolean).join(" · ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BreweryHeading({
  brewery,
  locale,
  place,
  locality,
  claimed,
  verified,
  pending,
}: {
  brewery: Brewery;
  locale: Locale;
  place: string;
  locality: string | undefined;
  claimed: boolean;
  verified: boolean;
  pending: boolean;
}) {
  const text = copy[locale];
  const showBadges = brewery.closed || pending || brewery.featured || verified;
  return (
    <>
      <div className="listing-card-top">
        <h1>{brewery.name}</h1>
        {showBadges ? (
          <div className="listing-badges">
            {brewery.featured ? <span className="badge badge-featured">{text.brewery.featuredPlacement}</span> : null}
            {verified ? <span className="badge badge-verified">{text.brewery.verified}</span> : null}
            {brewery.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
            {pending ? <span className="badge badge-pending">{text.directory.pending}</span> : null}
          </div>
        ) : null}
      </div>
      {place ? (
        <p className="brewery-place">
          {locality ? <Link href={placePath(locale, slugify(locality))}>{locality}</Link> : null}
          {locality && brewery.address?.region ? " · " : null}
          {brewery.address?.region}
        </p>
      ) : null}
      {claimed ? (
        <p className="claimed-status">
          <span aria-hidden="true">✓ </span>
          {text.brewery.managedBy.replace("{name}", brewery.name)}
        </p>
      ) : null}
    </>
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
  const { featured, listed } = partitionBreweryBeers(beers, brewery.featuredBeerSlugs);
  const rankedFeatured = Boolean(brewery.featuredBeerSlugs?.length && featured.length);
  const place = localityLine(brewery);
  const locality = brewery.address?.locality?.trim();
  const hasMap = brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined;
  const claimed = isClaimed(brewery);
  const verified = brewery.trustLevel === "verified_brewery";
  const social = socialEntries(brewery);
  const crumbs = breweryBreadcrumbs(brewery, locale);
  const visit = hasVisitInfo(brewery);
  const aboutExtras = hasAboutExtras(brewery);
  const intro = breweryIntro(brewery, text.brewery, place);
  const events = brewery.events?.length ? upcomingEvents(brewery.events) : [];
  const news = brewery.news?.length
    ? [...brewery.news].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    : [];
  const accent = isSafeAccentColor(brewery.accentColor) ? brewery.accentColor.trim() : undefined;
  const showActions = Boolean(
    brewery.website || brewery.contactUrl || social.length || hasMap || brewery.highlightLinks?.length || !claimed,
  );
  const related = locality
    ? (await listBreweries())
        .filter((item) => item.slug !== brewery.slug && item.address?.locality?.trim() && slugify(item.address.locality) === slugify(locality))
        .slice(0, 6)
    : [];
  const heading = (
    <BreweryHeading
      brewery={brewery}
      locale={locale}
      place={place}
      locality={locality}
      claimed={claimed}
      verified={verified}
      pending={pending}
    />
  );

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={breweryJsonLd(brewery, locale)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article
        className={accent ? "brewery-hub brewery-hub-branded" : "brewery-hub"}
        style={accent ? ({ "--brewery-accent": accent } as CSSProperties) : undefined}
      >
        <div className="shell brewery-hub-top">
          <Breadcrumbs items={crumbs} />
        </div>

        {brewery.coverImage ? (
          <div className="brewery-cover">
            {/* Cover is owner- or source-supplied; never a stock stand-in. */}
            <BreweryMediaImage src={brewery.coverImage} size={{ width: 1600, height: 640 }} priority />
            {brewery.logo ? (
              <BreweryMediaImage src={brewery.logo} className="brewery-logo" size={{ width: 96, height: 96 }} alt="" />
            ) : null}
          </div>
        ) : (
          <header className="brewery-identity-band">
            <div className="shell">
              {brewery.logo ? (
                <BreweryMediaImage
                  src={brewery.logo}
                  className="brewery-logo brewery-logo-band"
                  size={{ width: 72, height: 72 }}
                  alt=""
                />
              ) : null}
              {heading}
            </div>
          </header>
        )}

        <div className="shell brewery-hub-body">
          {brewery.coverImage ? <header className="brewery-identity">{heading}</header> : null}

          <div className={visit ? "brewery-home" : "brewery-home brewery-home-solo"}>
            <div className="brewery-home-main">
              <p className="brewery-description">{intro}</p>
              {aboutExtras ? <BreweryAboutExtras brewery={brewery} locale={locale} /> : null}
              {showActions ? (
                <ul className="brewery-actions-row">
                  {brewery.website ? (
                    <li>
                      <a className="button button-ale" href={brewery.website} rel="noreferrer">
                        {text.brewery.website}
                      </a>
                    </li>
                  ) : null}
                  {brewery.contactUrl ? (
                    <li>
                      <a className="button button-quiet" href={brewery.contactUrl} rel="noreferrer">
                        {text.brewery.contact}
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
                  {!claimed ? (
                    <li>
                      <Link className="button button-quiet" href={contributePath(locale, { kind: "claim", brewery: brewery.slug })}>
                        {text.brewery.claimThis}
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {brewery.highlightLinks?.length ? (
                <ul className="brewery-highlight-links">
                  {brewery.highlightLinks.map((link) => (
                    <li key={`${link.label}-${link.url}`}>
                      <a href={link.url} rel="noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {visit ? <BreweryVisitPanel brewery={brewery} locale={locale} place={place} /> : null}
          </div>

          {brewery.branches?.length ? <BreweryBranches branches={brewery.branches} locale={locale} /> : null}
          {brewery.photos?.length ? <BreweryPhotos photos={brewery.photos} locale={locale} /> : null}
          {events.length ? <BreweryEvents events={events} locale={locale} /> : null}
          {news.length ? <BreweryNews news={news} locale={locale} /> : null}

          {featured.length ? (
            <section>
              <div className="section-heading">
                <h2>{rankedFeatured ? text.brewery.featuredBeers : text.brewery.coreRange}</h2>
                <p>{beerCountLabel(featured.length, text.brewery)}</p>
              </div>
              <BeerIndex beers={featured} locale={locale} />
            </section>
          ) : null}

          {listed.length || !beers.length ? (
            <section>
              <div className="section-heading">
                <h2>{featured.length ? text.brewery.listedBeers : text.brewery.beers}</h2>
                <p>{beers.length ? beerCountLabel(listed.length, text.brewery) : null}</p>
              </div>
              {listed.length ? (
                usesBeerSheet(listed.length) ? (
                  <BreweryBeerSheet locale={locale} items={listed.map(toBeerListItem)} hrefBase={`/${locale}/directory/beers`} />
                ) : (
                  <BeerIndex beers={listed} locale={locale} />
                )
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

          <details className="brewery-listing-details">
            <summary>{text.brewery.listingDetails}</summary>
            {pending ? (
              <aside className="trust-note">
                <strong>{text.brewery.awaiting}</strong>
                <p>{text.brewery.awaitingCopy}</p>
              </aside>
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
          </details>

          <ClaimPanel brewery={brewery} locale={locale} placement="footer" />

          <p className="brewery-actions">
            <Link className="button button-quiet" href={contributePath(locale, { kind: "correction", brewery: brewery.slug })}>
              {text.brewery.suggestCorrection}
            </Link>
          </p>
        </div>
      </article>

      {related.length && locality ? (
        <aside className="brewery-nearby" aria-label={text.brewery.related.replace("{place}", locality)}>
          <div className="shell">
            <p className="brewery-nearby-kicker">{text.brewery.relatedKicker}</p>
            <h2>{text.brewery.related.replace("{place}", locality)}</h2>
            <ul className="brewery-nearby-list">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={breweryPath(locale, item.slug)}>{item.name}</Link>
                </li>
              ))}
            </ul>
            <p className="brewery-nearby-more">
              <Link href={placePath(locale, slugify(locality))}>{text.brewery.relatedBrowse.replace("{place}", locality)}</Link>
            </p>
          </div>
        </aside>
      ) : null}

      <SiteFooter locale={locale} />
    </main>
  );
}
