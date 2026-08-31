import Link from "next/link";
import { notFound } from "next/navigation";
import { PintMark } from "@/components/pint-mark";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BreweryList } from "@/components/brewery-list";
import { SourceOriginNote } from "@/components/source-credit";
import { listPendingBreweries, listPublishedBreweries, toListItem } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    ["breweries", "beers"].map((kind) => ({ locale, kind })),
  );
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
  const published = kind === "breweries" ? await listPublishedBreweries() : [];
  const pendingCount = kind === "breweries" ? (await listPendingBreweries()).length : 0;

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
        </nav>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </section>
      {published.length > 0 ? (
        <section className="shell listing-section">
          <BreweryList
            locale={locale}
            items={published.map(toListItem)}
            hrefBase={`/${locale}/directory/breweries`}
            emptyLabel={page.empty}
          />
        </section>
      ) : (
        <section className="empty-state shell">
          <PintMark className="empty-mark" />
          <h2>{page.empty}</h2>
          <p>{text.emptyCopy}</p>
          <div className="actions empty-actions">
            {pendingCount > 0 ? (
              <Link className="button button-ale" href={`/${locale}/review`}>
                {pendingCount} {text.pendingNote}
              </Link>
            ) : null}
            <Link className="button button-quiet" href={`/${locale}/contribute`}>
              {page.action}
            </Link>
          </div>
        </section>
      )}
      {kind === "breweries" ? (
        <section className="shell listing-section">
          <SourceOriginNote locale={locale} />
        </section>
      ) : null}
      <SiteFooter locale={locale} />
    </main>
  );
}
