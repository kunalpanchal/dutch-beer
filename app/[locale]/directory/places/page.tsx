import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listPlaces } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
import { placePath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const text = copy[locale].places;
  return pageMetadata({
    locale,
    title: text.title,
    description: text.description,
    path: `/${locale}/directory/places`,
  });
}

export default async function PlacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const places = await listPlaces();
  const text = copy[locale];

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="directory-hero shell">
        <Breadcrumbs
          items={[
            { name: text.seo.home, path: `/${locale}` },
            { name: text.directory.breweries.title, path: `/${locale}/directory/breweries` },
            { name: text.places.title, path: `/${locale}/directory/places` },
          ]}
        />
        <h1>{text.places.title}</h1>
        <p>{text.places.description}</p>
      </section>
      <section className="shell listing-section">
        {places.length ? (
          <ul className="place-index">
            {places.map((place) => (
              <li key={place.slug}>
                <Link href={placePath(locale, place.slug)}>
                  <strong>{place.name}</strong>
                  <span>
                    {place.region ? `${place.region} · ` : ""}
                    {place.breweryCount === 1
                      ? text.places.countOne
                      : text.places.count.replace("{count}", String(place.breweryCount))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="list-empty">{text.places.empty}</p>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
