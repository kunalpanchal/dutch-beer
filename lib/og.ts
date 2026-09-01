import type { Beer, Brewery } from "@/lib/schema";
import { copy, type Locale } from "@/lib/i18n";
import {
  beerTitle,
  breweryTitle,
  localityLine,
  placeTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

export interface OgCardContent {
  kicker: string;
  title: string;
  subtitle?: string;
  meta?: string;
  alt: string;
}

export interface CatalogCounts {
  breweries: number;
  beers: number;
}

function clip(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function formatCount(locale: Locale, value: number): string {
  return value.toLocaleString(locale === "nl" ? "nl-NL" : "en");
}

function titleAfterDash(fullTitle: string): string | undefined {
  const separator = " — ";
  const index = fullTitle.indexOf(separator);
  return index >= 0 ? fullTitle.slice(index + separator.length) : undefined;
}

function altTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function homeOgCard(locale: Locale, counts?: CatalogCounts): OgCardContent {
  const text = copy[locale];
  const hasCounts = Boolean(counts && (counts.breweries || counts.beers));
  const meta = hasCounts && counts
    ? `${formatCount(locale, counts.breweries)} ${text.home.stats.breweries} · ${formatCount(locale, counts.beers)} ${text.home.stats.beers}`
    : undefined;
  return {
    kicker: text.home.eyebrow,
    title: "dutch.beer",
    subtitle: text.home.title,
    meta,
    alt: altTitle(text.home.title),
  };
}

export function breweryOgCard(brewery: Brewery, locale: Locale): OgCardContent {
  const text = copy[locale];
  const fullTitle = breweryTitle(brewery, locale);
  const subtitle = titleAfterDash(fullTitle) ?? localityLine(brewery);
  return {
    kicker: text.seo.brewery.brewery,
    title: clip(brewery.name, 48),
    subtitle: subtitle ? clip(subtitle, 80) : undefined,
    meta: brewery.closed ? text.directory.closed : undefined,
    alt: altTitle(fullTitle),
  };
}

export function beerOgCard(beer: Beer, brewery: Brewery | undefined, locale: Locale): OgCardContent {
  const text = copy[locale];
  const fullTitle = beerTitle(beer, brewery, locale);
  const breweryName = brewery?.name ?? beer.breweryName;
  const subtitle = breweryName ? `${text.beer.by} ${breweryName}` : undefined;
  const facts = [
    beer.style,
    typeof beer.abv === "number" ? `${beer.abv}% ABV` : undefined,
  ].filter((value): value is string => Boolean(value));
  return {
    kicker: text.seo.og.beer,
    title: clip(beer.name, 48),
    subtitle: subtitle ? clip(subtitle, 80) : undefined,
    meta: facts.length ? facts.join(" · ") : undefined,
    alt: altTitle(fullTitle),
  };
}

export function placeOgCard(
  placeName: string,
  region: string | undefined,
  count: number,
  locale: Locale,
): OgCardContent {
  const text = copy[locale];
  const countLabel =
    count === 1 ? text.places.countOne : text.places.count.replace("{count}", String(count));
  return {
    kicker: text.seo.og.place,
    title: clip(placeName, 48),
    subtitle: clip(placeTitle(placeName, locale), 80),
    meta: [region, countLabel].filter(Boolean).join(" · ") || undefined,
    alt: altTitle(placeTitle(placeName, locale)),
  };
}

export function directoryOgCard(kind: "breweries" | "beers", locale: Locale): OgCardContent {
  const page = copy[locale].directory[kind];
  return {
    kicker: copy[locale].navigation.directory,
    title: page.title,
    subtitle: clip(page.description, 90),
    alt: altTitle(page.title),
  };
}

export function placesIndexOgCard(locale: Locale): OgCardContent {
  const text = copy[locale].places;
  return {
    kicker: copy[locale].navigation.directory,
    title: text.title,
    subtitle: clip(text.description, 90),
    alt: altTitle(text.title),
  };
}

export function contributeOgCard(locale: Locale): OgCardContent {
  const text = copy[locale].contribute;
  return {
    kicker: text.eyebrow,
    title: clip(text.title, 48),
    subtitle: clip(copy[locale].seo.contributePage.description, 90),
    alt: altTitle(text.title),
  };
}
