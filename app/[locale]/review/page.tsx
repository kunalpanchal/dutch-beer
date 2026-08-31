import { notFound } from "next/navigation";
import { BreweryList } from "@/components/brewery-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SourceOriginNote } from "@/components/source-credit";
import { listPendingBreweries, loadCatalog, toListItem } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";

export default async function ReviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale];
  const [catalog, pending] = await Promise.all([loadCatalog(), listPendingBreweries()]);
  const importedOn = catalog.generatedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(catalog.generatedAt))
    : "";

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="directory-hero shell">
        <p className="eyebrow">{text.review.eyebrow}</p>
        <h1>{text.review.title}</h1>
        <p>{text.review.lead}</p>
        {importedOn ? (
          <p className="hero-note">
            {text.review.importedOn}: {importedOn}. Wikidata {catalog.sources.wikidata.count}, Open Brewery DB{" "}
            {catalog.sources.open_brewery_db.count}, OpenStreetMap {catalog.sources.openstreetmap.count}.
          </p>
        ) : null}
      </section>
      <section className="shell listing-section">
        <SourceOriginNote locale={locale} />
        <BreweryList
          locale={locale}
          items={pending.map(toListItem)}
          hrefBase={`/${locale}/directory/breweries`}
          emptyLabel={text.review.empty}
          showFilters
        />
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
