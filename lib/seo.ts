import type { Metadata } from "next";
import type { Beer, Brewery } from "@/lib/schema";
import { slugify } from "@/lib/catalog/normalize";
import { copy, type Locale } from "@/lib/i18n";
import {
  beerPath,
  breweriesIndexPath,
  breweryPath,
  contributePath,
  homePath,
  placePath,
} from "@/lib/paths";
import {
  absoluteUrl,
  OG_IMAGE_SIZE,
  OG_IMAGE_TYPE,
  openGraphImagePath,
  SITE_NAME,
} from "@/lib/site";

export interface Breadcrumb {
  name: string;
  path: string;
}

function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    const compacted = value
      .map((entry) => compact(entry))
      .filter((entry) => entry !== undefined && entry !== null && entry !== "");
    return (compacted.length ? compacted : undefined) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined || entry === null || entry === "") continue;
      const compacted = compact(entry);
      if (compacted === undefined || compacted === null || compacted === "") continue;
      if (typeof compacted === "object" && !Array.isArray(compacted) && Object.keys(compacted).length === 0) continue;
      out[key] = compacted;
    }
    return out as T;
  }
  return value;
}

export function placeSlugFromLocality(locality: string): string {
  return slugify(locality);
}

export function localityLine(brewery: Pick<Brewery, "address">): string {
  return [brewery.address?.locality, brewery.address?.region].filter(Boolean).join(", ");
}

export function mapHref(brewery: Pick<Brewery, "address">): string | undefined {
  const latitude = brewery.address?.latitude;
  const longitude = brewery.address?.longitude;
  if (latitude === undefined || longitude === undefined) return undefined;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function socialEntries(brewery: Pick<Brewery, "social">): Array<{ key: keyof NonNullable<Brewery["social"]>; href: string }> {
  if (!brewery.social) return [];
  const keys = ["instagram", "facebook", "twitter", "youtube"] as const;
  return keys.flatMap((key) => {
    const href = brewery.social?.[key];
    return href ? [{ key, href }] : [];
  });
}

export function brewerySameAs(brewery: Brewery): string[] {
  const urls = [
    brewery.website,
    ...socialEntries(brewery).map((entry) => entry.href),
    brewery.externalIds?.wikidata ? `https://www.wikidata.org/wiki/${brewery.externalIds.wikidata}` : undefined,
    brewery.externalIds?.osm ? `https://www.openstreetmap.org/${brewery.externalIds.osm}` : undefined,
  ];
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

export function breweryTitle(brewery: Brewery, locale: Locale): string {
  const templates = copy[locale].seo.brewery;
  const place = brewery.address?.locality;
  const parts: string[] = [templates.brewery, templates.beers];
  if (brewery.taproom) parts.push(templates.taproom);
  const what = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} & ${parts.at(-1)}`;
  if (place) return templates.titleInPlace.replace("{name}", brewery.name).replace("{what}", what).replace("{place}", place);
  return templates.title.replace("{name}", brewery.name).replace("{what}", what);
}

export function breweryDescription(brewery: Brewery, locale: Locale): string {
  const templates = copy[locale].seo.brewery;
  const place = localityLine(brewery);
  const bits: string[] = [templates.beersBit, templates.infoBit];
  if (brewery.address) bits.push(templates.locationBit);
  if (brewery.taproom) bits.push(templates.taproomBit);
  const explore =
    bits.length <= 1
      ? (bits[0] ?? "")
      : bits.length === 2
        ? bits.join(templates.andJoin)
        : `${bits.slice(0, -1).join(templates.listJoin)}${templates.andJoin}${bits.at(-1)}`;
  if (place) {
    return templates.descriptionInPlace.replace("{name}", brewery.name).replace("{place}", place).replace("{explore}", explore);
  }
  return templates.description.replace("{name}", brewery.name).replace("{explore}", explore);
}

export function beerTitle(beer: Beer, brewery: Brewery | undefined, locale: Locale): string {
  const templates = copy[locale].seo.beer;
  if (brewery) return templates.titleBy.replace("{name}", beer.name).replace("{brewery}", brewery.name);
  return templates.title.replace("{name}", beer.name);
}

export function beerDescription(beer: Beer, brewery: Brewery | undefined, locale: Locale): string {
  const templates = copy[locale].seo.beer;
  const facts: string[] = [];
  if (beer.style) facts.push(beer.style);
  if (typeof beer.abv === "number") facts.push(`${beer.abv}% ABV`);
  if (beer.description) {
    return beer.description.length > 160 ? `${beer.description.slice(0, 157).trimEnd()}…` : beer.description;
  }
  if (brewery && facts.length) {
    return templates.descriptionFacts
      .replace("{name}", beer.name)
      .replace("{brewery}", brewery.name)
      .replace("{facts}", facts.join(templates.listJoin));
  }
  if (brewery) return templates.descriptionBy.replace("{name}", beer.name).replace("{brewery}", brewery.name);
  return templates.description.replace("{name}", beer.name);
}

export function placeTitle(placeName: string, locale: Locale): string {
  return copy[locale].seo.place.title.replace("{place}", placeName);
}

function formatCount(locale: Locale, value: number): string {
  return value.toLocaleString(locale === "nl" ? "nl-NL" : "en");
}

export function homeTitle(locale: Locale): string {
  return copy[locale].home.title;
}

export function homeDescription(locale: Locale, counts?: { breweries: number; beers: number }): string {
  const templates = copy[locale].seo.homePage;
  if (counts && (counts.breweries || counts.beers)) {
    return templates.descriptionWithCounts
      .replace("{breweries}", formatCount(locale, counts.breweries))
      .replace("{beers}", formatCount(locale, counts.beers));
  }
  return templates.description;
}

export function contributeTitle(locale: Locale): string {
  return copy[locale].contribute.title;
}

export function contributeDescription(locale: Locale): string {
  return copy[locale].seo.contributePage.description;
}

export function placeDescription(placeName: string, region: string | undefined, count: number, locale: Locale): string {
  const templates = copy[locale].seo.place;
  const where = region ? `${placeName}, ${region}` : placeName;
  return templates.description.replace("{place}", where).replace("{count}", String(count));
}

export function pageMetadata({
  locale,
  title,
  description,
  path,
  image,
  imageAlt,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = `${title} | ${SITE_NAME}`;
  const imageUrl = absoluteUrl(image ?? openGraphImagePath(path));
  const images = [
    {
      url: imageUrl,
      alt: imageAlt ?? title,
      width: OG_IMAGE_SIZE.width,
      height: OG_IMAGE_SIZE.height,
      type: OG_IMAGE_TYPE,
    },
  ];
  const sibling = (next: Locale) => path.replace(/^\/(en|nl)/, `/${next}`);
  return {
    title: { absolute: fullTitle },
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: path,
      languages: {
        en: sibling("en"),
        nl: sibling("nl"),
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: "website",
      locale: locale === "nl" ? "nl_NL" : "en_US",
      alternateLocale: locale === "nl" ? ["en_US"] : ["nl_NL"],
      siteName: SITE_NAME,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: imageUrl, alt: imageAlt ?? title, width: OG_IMAGE_SIZE.width, height: OG_IMAGE_SIZE.height }],
    },
  };
}

export function homeMetadata(locale: Locale, counts?: { breweries: number; beers: number }): Metadata {
  return pageMetadata({
    locale,
    title: homeTitle(locale),
    description: homeDescription(locale, counts),
    path: homePath(locale),
  });
}

export function contributeMetadata(locale: Locale): Metadata {
  return pageMetadata({
    locale,
    title: contributeTitle(locale),
    description: contributeDescription(locale),
    path: contributePath(locale),
  });
}

export function breweryMetadata(brewery: Brewery, locale: Locale): Metadata {
  return pageMetadata({
    locale,
    title: breweryTitle(brewery, locale),
    description: breweryDescription(brewery, locale),
    path: breweryPath(locale, brewery.slug),
    imageAlt: brewery.name,
  });
}

export function beerMetadata(beer: Beer, brewery: Brewery | undefined, locale: Locale): Metadata {
  return pageMetadata({
    locale,
    title: beerTitle(beer, brewery, locale),
    description: beerDescription(beer, brewery, locale),
    path: beerPath(locale, beer.slug),
    imageAlt: beer.name,
  });
}

export function breweryBreadcrumbs(brewery: Brewery, locale: Locale): Breadcrumb[] {
  const text = copy[locale];
  const crumbs: Breadcrumb[] = [
    { name: text.seo.home, path: homePath(locale) },
    { name: text.directory.breweries.title, path: breweriesIndexPath(locale) },
  ];
  const locality = brewery.address?.locality?.trim();
  if (locality) crumbs.push({ name: locality, path: placePath(locale, placeSlugFromLocality(locality)) });
  crumbs.push({ name: brewery.name, path: breweryPath(locale, brewery.slug) });
  return crumbs;
}

export function beerBreadcrumbs(beer: Beer, brewery: Brewery | undefined, locale: Locale): Breadcrumb[] {
  const text = copy[locale];
  const crumbs: Breadcrumb[] = [
    { name: text.seo.home, path: homePath(locale) },
    { name: text.directory.beers.title, path: `/${locale}/directory/beers` },
  ];
  if (brewery) crumbs.push({ name: brewery.name, path: breweryPath(locale, brewery.slug) });
  crumbs.push({ name: beer.name, path: beerPath(locale, beer.slug) });
  return crumbs;
}

export function placeBreadcrumbs(placeName: string, placeSlugValue: string, locale: Locale): Breadcrumb[] {
  const text = copy[locale];
  return [
    { name: text.seo.home, path: homePath(locale) },
    { name: text.directory.breweries.title, path: breweriesIndexPath(locale) },
    { name: text.places.title, path: `/${locale}/directory/places` },
    { name: placeName, path: placePath(locale, placeSlugValue) },
  ];
}

export function breadcrumbJsonLd(crumbs: Breadcrumb[]) {
  return compact({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  });
}

export function breweryJsonLd(brewery: Brewery, locale: Locale) {
  const pageUrl = absoluteUrl(breweryPath(locale, brewery.slug));
  const address = brewery.address
    ? {
        "@type": "PostalAddress",
        streetAddress: brewery.address.street,
        postalCode: brewery.address.postalCode,
        addressLocality: brewery.address.locality || undefined,
        addressRegion: brewery.address.region,
        addressCountry: brewery.address.countryCode,
      }
    : undefined;
  const geo =
    brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined
      ? {
          "@type": "GeoCoordinates",
          latitude: brewery.address.latitude,
          longitude: brewery.address.longitude,
        }
      : undefined;

  return compact({
    "@context": "https://schema.org",
    "@type": "Brewery",
    name: brewery.name,
    url: brewery.website || pageUrl,
    mainEntityOfPage: pageUrl,
    description: brewery.description,
    logo: brewery.logo,
    image: brewery.coverImage || brewery.logo,
    telephone: brewery.telephone,
    openingHours: brewery.openingHours,
    address,
    geo,
    sameAs: brewerySameAs(brewery),
  });
}

export function websiteJsonLd(locale: Locale, counts?: { breweries: number; beers: number }) {
  return compact({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(homePath(locale)),
    description: homeDescription(locale, counts),
    inLanguage: locale === "nl" ? "nl-NL" : "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl(homePath(locale)),
    },
  });
}

export function beerJsonLd(beer: Beer, brewery: Brewery | undefined, locale: Locale) {
  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name: beer.name,
    description: beer.description,
    url: absoluteUrl(beerPath(locale, beer.slug)),
    brand: brewery
      ? {
          "@type": "Brand",
          name: brewery.name,
          url: absoluteUrl(breweryPath(locale, brewery.slug)),
        }
      : undefined,
    additionalProperty: [
      beer.style
        ? { "@type": "PropertyValue", name: "Style", value: beer.style }
        : undefined,
      typeof beer.abv === "number"
        ? { "@type": "PropertyValue", name: "ABV", value: `${beer.abv}%` }
        : undefined,
    ],
  });
}

export { isClaimed } from "@/lib/schema";
