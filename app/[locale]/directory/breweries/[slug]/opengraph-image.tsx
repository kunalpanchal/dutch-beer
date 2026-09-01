import { ImageResponse } from "next/og";
import { getBreweryBySlug } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";
import { localityLine } from "@/lib/seo";
import { OgShell, ogContentType, ogSize } from "@/lib/og-image";

export const size = ogSize;
export const contentType = ogContentType;

export default async function BreweryOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = isLocale(locale) ? locale : "en";
  const brewery = await getBreweryBySlug(slug);
  const text = copy[resolved].seo;
  const place = brewery ? localityLine(brewery) : undefined;
  const subtitle = place ? `${text.og.breweryLabel} · ${place}` : text.og.breweryLabel;

  return new ImageResponse(
    <OgShell eyebrow={text.og.eyebrow} title={brewery?.name ?? "Brewery"} subtitle={subtitle} />,
    size,
  );
}
