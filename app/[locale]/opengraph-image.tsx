import { getCatalogCounts } from "@/lib/catalog/store";
import { isLocale } from "@/lib/i18n";
import { homeOgCard } from "@/lib/og";
import { ogImageResponse } from "@/lib/og-card";
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Dutch.beer — a directory of Dutch beer";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const counts = await getCatalogCounts();
  return ogImageResponse(homeOgCard(isLocale(locale) ? locale : "en", counts));
}
