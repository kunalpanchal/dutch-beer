import { notFound } from "next/navigation";
import { ContributionForm, GithubTemplateLinks } from "@/components/contribution-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getBreweryBySlug } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";

export default async function ContributePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const read = (key: string) => {
    const value = query[key];
    return typeof value === "string" ? value : undefined;
  };
  const kind = read("kind");
  const brewerySlug = read("brewery");
  const brewery = brewerySlug ? await getBreweryBySlug(brewerySlug) : undefined;
  const text = copy[locale].contribute;

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="contribute-page shell">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.lead}</p>
        <ContributionForm
          locale={locale}
          initialKind={kind}
          initialBreweryName={brewery?.name}
          initialWebsite={brewery?.website}
          initialLocality={brewery?.address?.locality}
          initialRegion={brewery?.address?.region}
          initialEntity={read("entry") || brewery?.name}
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
