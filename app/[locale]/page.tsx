import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { copy, isLocale } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale].home;

  return (
    <main>
      <SiteHeader locale={locale} />
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
            <li>{copy[locale].navigation.addListing}</li>
          </ul>
        </aside>
      </section>
      <section className="principles shell">
        {text.principles.map(([title, description]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
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
