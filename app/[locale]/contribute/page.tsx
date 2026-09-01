import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContributionForm, GithubTemplateLinks } from "@/components/contribution-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getBreweryBySlug } from "@/lib/catalog/store";
import { contributionKinds, type ContributionKind } from "@/lib/contribute";
import { copy, isLocale } from "@/lib/i18n";
import { contributeMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return contributeMetadata(locale);
}

function isContributionKind(value: string | undefined): value is ContributionKind {
  return contributionKinds.includes(value as ContributionKind);
}

export default async function ContributePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string; brewery?: string; entry?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const text = copy[locale].contribute;
  const initialKind = isContributionKind(query.kind) ? query.kind : undefined;
  const brewery = query.brewery ? await getBreweryBySlug(query.brewery) : undefined;
  const claimPrefill = brewery
    ? { slug: brewery.slug, name: brewery.name, website: brewery.website }
    : undefined;

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="contribute-page shell">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.lead}</p>
        <ContributionForm
          key={`${initialKind ?? "brewery"}-${claimPrefill?.slug ?? ""}-${query.entry ?? ""}`}
          locale={locale}
          initialKind={initialKind}
          claimPrefill={claimPrefill}
          initialEntity={query.entry}
        />
        <GithubTemplateLinks locale={locale} />
        <aside className="trust-note">
          <strong>{text.trustTitle}</strong>
          <p>{text.trustCopy}</p>
        </aside>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
