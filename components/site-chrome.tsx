import Link from "next/link";
import { GitHubLink } from "@/components/github-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Nix18Mark } from "@/components/nix18-mark";
import { PintMark } from "@/components/pint-mark";
import { HeaderSearch } from "@/components/search/search-box";
import { copy, type Locale } from "@/lib/i18n";

function Logo({ locale }: { locale: Locale }) {
  return (
    <Link className="logo" href={`/${locale}`}>
      <PintMark className="logo-mark" />
      <span className="logo-wordmark">dutch<span>.beer</span></span>
    </Link>
  );
}

export function SiteHeader({
  locale,
  showSearch = true,
}: {
  locale: Locale;
  showSearch?: boolean;
}) {
  const text = copy[locale].navigation;
  return (
    <header className={`site-header${showSearch ? " site-header-sticky" : ""}`}>
      <div className="shell header-inner">
        <Logo locale={locale} />
        <nav aria-label="Primary navigation">
          <Link href={`/${locale}/directory/breweries`}>{text.breweries}</Link>
          <Link href={`/${locale}/directory/beers`}>{text.beers}</Link>
          <Link href={`/${locale}/directory/places`}>{text.places}</Link>
          <Link href={`/${locale}/contribute`}>{text.contribute}</Link>
        </nav>
        <div className="header-end">
          {showSearch ? <HeaderSearch locale={locale} /> : null}
          <GitHubLink />
          <Link className="header-cta" href={`/${locale}/contribute`}>
            {text.contribute}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <footer>
      <div className="footer-backdrop" aria-hidden="true">
        <PintMark className="footer-backdrop-mark footer-backdrop-mark-main" />
        <PintMark className="footer-backdrop-mark footer-backdrop-mark-side" />
      </div>
      <div className="shell footer-shell footer-inner">
        <Logo locale={locale} />
        <div className="footer-copy">
          <p>{text.footer}</p>
          <p>{text.footerBuilt}</p>
        </div>
        <div className="footer-end">
          <nav aria-label="Footer">
            <Link href={`/${locale}/directory/breweries`}>{text.navigation.breweries}</Link>
            <Link href={`/${locale}/directory/beers`}>{text.navigation.beers}</Link>
            <Link href={`/${locale}/directory/places`}>{text.navigation.places}</Link>
            <Link href={`/${locale}/contribute`}>{text.navigation.contribute}</Link>
          </nav>
          <Nix18Mark className="footer-nix18" />
          <GitHubLink />
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </footer>
  );
}
