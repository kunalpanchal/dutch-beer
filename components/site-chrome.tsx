import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { copy, type Locale } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) { const text = copy[locale].navigation; return <header className="site-header"><Link className="logo" href={`/${locale}`}>dutch<span>.beer</span></Link><nav aria-label="Primary navigation"><Link href={`/${locale}/directory/breweries`}>{text.directory}</Link><Link href={`/${locale}/contribute`}>{text.contribute}</Link></nav><div className="header-actions"><LanguageSwitcher locale={locale} /><Link className="header-cta" href={`/${locale}/contribute`}>{text.addListing} <span>↗</span></Link></div></header>; }
export function SiteFooter({ locale }: { locale: Locale }) { const text = copy[locale]; return <footer><Link className="logo" href={`/${locale}`}>dutch<span>.beer</span></Link><p>{text.footer}</p><div><Link href={`/${locale}/directory/breweries`}>{text.navigation.directory}</Link><Link href={`/${locale}/contribute`}>{text.navigation.contribute}</Link><a href="https://github.com/kunalpanchal/dutchbeer">GitHub</a></div></footer>; }
