import { isLocale } from "@/lib/i18n";
import { directoryOgCard, homeOgCard } from "@/lib/og";
import { ogImageResponse } from "@/lib/og-card";
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Dutch.beer directory";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string; kind: string }> }) {
  const { locale, kind } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  if (kind !== "breweries" && kind !== "beers") return ogImageResponse(homeOgCard(resolvedLocale));
  return ogImageResponse(directoryOgCard(kind, resolvedLocale));
}
