import { ImageResponse } from "next/og";
import { copy, isLocale } from "@/lib/i18n";
import { OgShell, ogContentType, ogSize } from "@/lib/og-image";

export const size = ogSize;
export const contentType = ogContentType;

export default async function LocaleOpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolved = isLocale(locale) ? locale : "en";
  const text = copy[resolved].seo;
  return new ImageResponse(
    <OgShell eyebrow={text.og.eyebrow} title="dutch.beer" subtitle={text.og.homeSubtitle} />,
    size,
  );
}
