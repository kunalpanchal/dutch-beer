import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  buildAnalyticsPayload,
} from "@/lib/catalog/analytics";
import { loadAnalyticsEnrichment } from "@/lib/catalog/analytics-enrichment";
import { listBeers, listBreweries } from "@/lib/catalog/store";
import { copy, isLocale, locales } from "@/lib/i18n";
import { analyticsPath } from "@/lib/paths";
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
  const page = copy[locale].analytics;
  return pageMetadata({
    locale,
    title: page.title,
    description: page.subtitle,
    path: analyticsPath(locale),
  });
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [breweries, beers, enrichment] = await Promise.all([
    listBreweries(),
    listBeers(),
    loadAnalyticsEnrichment(),
  ]);
  const payload = buildAnalyticsPayload(breweries, beers, enrichment);
  const text = copy[locale].analytics;

  return (
    <main>
      <SiteHeader locale={locale} />
      <AnalyticsDashboard locale={locale} payload={payload} copy={text} />
      <SiteFooter locale={locale} />
    </main>
  );
}
