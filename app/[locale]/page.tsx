import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCatalogCounts, listRecentBoardEntries } from "@/lib/catalog/store";
import { copy, isLocale, type Locale } from "@/lib/i18n";
import { homeMetadata, websiteJsonLd } from "@/lib/seo";

function formatCount(locale: Locale, value: number): string {
  return value.toLocaleString(locale === "nl" ? "nl-NL" : "en");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return homeMetadata(locale, await getCatalogCounts());
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale].home;
  const [counts, recent] = await Promise.all([getCatalogCounts(), listRecentBoardEntries(6)]);

  return (
    <main>
      <SiteHeader locale={locale} />
      <JsonLd data={websiteJsonLd(locale, counts)} />
      <section className="hero shell">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="hero-copy">{text.intro}</p>
          <div className="actions">
            <Link className="button button-ale" href={`/${locale}/directory/breweries`}>
              {text.explore}
            </Link>
            <Link className="button button-quiet" href={`/${locale}/contribute`}>
              {text.add}
            </Link>
          </div>
          <p className="hero-note">{text.note}</p>
        </div>
        <aside className="tap-board" aria-hidden="true">
          <p>{text.boardLabel}</p>
          <ul>
            <li>{copy[locale].navigation.breweries}</li>
            <li>{copy[locale].navigation.beers}</li>
            <li>{copy[locale].navigation.contribute}</li>
          </ul>
        </aside>
      </section>
      <ul className="home-stats shell">
        <li>
          <strong>{formatCount(locale, counts.breweries)}</strong> {text.stats.breweries}
        </li>
        <li>
          <strong>{formatCount(locale, counts.beers)}</strong> {text.stats.beers}
        </li>
      </ul>
      <section className="principles shell">
        {text.principles.map(([title, description]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <section className="fresh-board shell">
        <h2>{text.freshTitle}</h2>
        {recent.length > 0 ? (
          <ul className="board-preview">
            {recent.map((entry) => (
              <li key={`${entry.kind}-${entry.slug}`}>
                <Link
                  href={`/${locale}/directory/${entry.kind === "brewery" ? "breweries" : "beers"}/${entry.slug}`}
                >
                  <span className="board-preview-name">{entry.name}</span>
                  {entry.detail ? <span className="board-preview-detail">{entry.detail}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="fresh-empty">
            <p className="fresh-empty-title">{text.freshEmptyTitle}</p>
            <p>{text.freshEmptyCopy}</p>
            <Link className="button button-quiet" href={`/${locale}/contribute`}>
              {text.add}
            </Link>
          </div>
        )}
      </section>
      <section className="owners-invite shell">
        <div>
          <h2>{text.ownersTitle}</h2>
          <p>{text.ownersCopy}</p>
        </div>
        <Link className="button button-ale" href={`/${locale}/contribute?kind=brewery`}>
          {text.ownersCta}
        </Link>
      </section>
      <section className="contribute-banner shell">
        <h2>
          {text.bannerTitle}
          <span>{text.bannerTitleSecond}</span>
        </h2>
        <Link className="button button-foam" href={`/${locale}/contribute`}>
          {text.add}
        </Link>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
