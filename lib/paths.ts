import { isLocale, type Locale } from "@/lib/i18n";

export function replaceLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }
  return `/${segments.join("/")}`;
}

export function breweryPath(locale: Locale, slug: string): string {
  return `/${locale}/directory/breweries/${slug}`;
}

export function beerPath(locale: Locale, slug: string): string {
  return `/${locale}/directory/beers/${slug}`;
}

export function placePath(locale: Locale, slug: string): string {
  return `/${locale}/directory/places/${slug}`;
}

export function breweriesIndexPath(locale: Locale): string {
  return `/${locale}/directory/breweries`;
}

export function beersIndexPath(locale: Locale): string {
  return `/${locale}/directory/beers`;
}

export function placesIndexPath(locale: Locale): string {
  return `/${locale}/directory/places`;
}

export function contributePath(
  locale: Locale,
  query?: { kind?: string; brewery?: string; entry?: string },
): string {
  const path = `/${locale}/contribute`;
  if (!query) return path;
  const params = new URLSearchParams();
  if (query.kind) params.set("kind", query.kind);
  if (query.brewery) params.set("brewery", query.brewery);
  if (query.entry) params.set("entry", query.entry);
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}

export function homePath(locale: Locale): string {
  return `/${locale}`;
}

export function analyticsPath(locale: Locale): string {
  return `/${locale}/analytics`;
}
