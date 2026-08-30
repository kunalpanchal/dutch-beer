import { notFound } from "next/navigation";
import { ContributionForm, GithubTemplateLinks } from "@/components/contribution-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { copy, isLocale } from "@/lib/i18n";

export default async function ContributePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale].contribute;

  return (
    <main>
      <SiteHeader locale={locale} />
      <section className="contribute-page shell">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.lead}</p>
        <ContributionForm locale={locale} />
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
