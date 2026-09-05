import type { MetadataRoute } from "next";
import { listBeers, listBreweries, listPlaces } from "@/lib/catalog/store";
import { locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [breweries, beers, places] = await Promise.all([listBreweries(), listBeers(), listPlaces()]);
  const staticPaths = ["", "/directory/breweries", "/directory/beers", "/directory/places", "/analytics", "/contribute"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        changeFrequency: path === "" ? "weekly" : "daily",
        priority: path === "" ? 1 : 0.7,
      });
    }
    for (const brewery of breweries) {
      entries.push({
        url: absoluteUrl(`/${locale}/directory/breweries/${brewery.slug}`),
        lastModified: brewery.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const beer of beers) {
      entries.push({
        url: absoluteUrl(`/${locale}/directory/beers/${beer.slug}`),
        lastModified: beer.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const place of places) {
      entries.push({
        url: absoluteUrl(`/${locale}/directory/places/${place.slug}`),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
