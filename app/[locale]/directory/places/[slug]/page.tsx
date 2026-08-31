import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BreweryCards } from "@/components/brewery-cards";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPlaceBySlug, listPlaces, toListItem } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
import { breadcrumbJsonLd, pageMetadata, placeBreadcrumbs, placeDescription, placeTitle } from "@/lib/seo";

export async function generateStaticParams() {
  const places = await listPlaces();
  return locales.flatMap((locale) => places.map((place) => ({ locale, slug: place.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const result = await getPlaceBySlug(slug);
  if (!result) return {};
  return pageMetadata({
    locale,
    title: placeTitle(result.place.name, locale),
    description: placeDescription(result.place.name, result.place.region, result.place.breweryCount, locale),
    path: `/${locale}/directory/places/${slug}`,
  });
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const result = await getPlaceBySlug(slug);
  if (!result) notFound();
  const { place, breweries } = result;
  const text = copy[locale];
  const crumbs = placeBreadcrumbs(place.name, place.slug, locale);
  const countLabel =
    place.breweryCount === 1 ? text.places.countOne : text.places.count.replace("{count}", String(place.breweryCount));

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="brewery-hub">
        <div className="shell brewery-hub-top">
          <Breadcrumbs items={crumbs} />
        </div>
        <header className="brewery-identity-band">
          <div className="shell">
            <p className="eyebrow">{text.places.title}</p>
            <h1>{text.places.breweriesIn.replace("{place}", place.name)}</h1>
            <p className="brewery-place">
              {[place.name, place.region].filter(Boolean).join(" · ")} · {countLabel}
            </p>
          </div>
        </header>
        <div className="shell brewery-hub-body listing-section">
          <BreweryCards
            locale={locale}
            items={breweries.map(toListItem)}
            hrefBase={`/${locale}/directory/breweries`}
            emptyLabel={text.places.empty}
          />
        </div>
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}
