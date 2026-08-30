import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { copy, isLocale } from "@/lib/i18n";
export default async function DirectoryPage({ params }: { params: Promise<{ locale: string; kind: string }> }) { const { locale, kind } = await params; if (!isLocale(locale) || (kind !== "breweries" && kind !== "beers")) notFound(); const text = copy[locale].directory; const page = text[kind]; return <main><SiteHeader locale={locale} /><section className="directory-hero"><p className="eyebrow">{copy[locale].navigation.directory} / {kind}</p><h1>{page.title}</h1><p>{page.description}</p></section><section className="empty-state"><div className="empty-mark">✦</div><h2>{page.empty}</h2><p>{text.emptyCopy}</p><Link className="button button-dark" href={`/${locale}/contribute`}>{page.action} <span>→</span></Link></section><SiteFooter locale={locale} /></main>; }
