import { getBreweryBySlug } from "@/lib/catalog/store";
import { isLocale } from "@/lib/i18n";
import { breweryOgCard, homeOgCard } from "@/lib/og";
import { ogImageResponse } from "@/lib/og-card";
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Dutch brewery on Dutch.beer";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  const brewery = await getBreweryBySlug(slug);
  if (!brewery) return ogImageResponse(homeOgCard(resolvedLocale));
  return ogImageResponse(breweryOgCard(brewery, resolvedLocale));
}
