import { getBeerBySlug, getBreweryById, getBreweryBySlug } from "@/lib/catalog/store";
import { isLocale } from "@/lib/i18n";
import { beerOgCard, homeOgCard } from "@/lib/og";
import { ogImageResponse } from "@/lib/og-card";
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Dutch beer on Dutch.beer";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  const beer = await getBeerBySlug(slug);
  if (!beer) return ogImageResponse(homeOgCard(resolvedLocale));
  const brewery =
    (await getBreweryById(beer.breweryId)) ?? (beer.brewerySlug ? await getBreweryBySlug(beer.brewerySlug) : undefined);
  return ogImageResponse(beerOgCard(beer, brewery, resolvedLocale));
}
