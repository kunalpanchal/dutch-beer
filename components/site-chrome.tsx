import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PintMark } from "@/components/pint-mark";
import { copy, type Locale } from "@/lib/i18n";

function Logo({ locale }: { locale: Locale }) {
  return (
    <Link className="logo" href={`/${locale}`}>
      <PintMark className="logo-mark" />
      <span className="logo-wordmark">dutch<span>.beer</span></span>
    </Link>
  );
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const text = copy[locale].navigation;
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Logo locale={locale} />
        <nav aria-label="Primary navigation">
          <Link href={`/${locale}/directory/breweries`}>{text.breweries}</Link>
          <Link href={`/${locale}/directory/beers`}>{text.beers}</Link>
          <Link href={`/${locale}/contribute`}>{text.contribute}</Link>
        </nav>
        <Link className="header-cta" href={`/${locale}/contribute`}>
          {text.addListing}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <footer>
      <div className="shell footer-inner">
        <Logo locale={locale} />
        <p>{text.footer}</p>
        <div className="footer-end">
          <nav aria-label="Footer">
            <Link href={`/${locale}/directory/breweries`}>{text.navigation.breweries}</Link>
            <Link href={`/${locale}/directory/beers`}>{text.navigation.beers}</Link>
            <Link href={`/${locale}/contribute`}>{text.navigation.contribute}</Link>
            <a href="https://github.com/kunalpanchal/dutchbeer">GitHub</a>
          </nav>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </footer>
  );
}
