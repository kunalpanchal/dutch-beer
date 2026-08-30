import Link from "next/link";
import { notFound } from "next/navigation";
import { PintMark } from "@/components/pint-mark";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { copy, isLocale } from "@/lib/i18n";

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}) {
  const { locale, kind } = await params;
  if (!isLocale(locale) || (kind !== "breweries" && kind !== "beers")) notFound();
  const text = copy[locale].directory;
  const page = text[kind];

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
      <section className="empty-state shell">
        <PintMark className="empty-mark" />
        <h2>{page.empty}</h2>
        <p>{text.emptyCopy}</p>
        <Link className="button button-ale" href={`/${locale}/contribute`}>
          {page.action}
        </Link>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
