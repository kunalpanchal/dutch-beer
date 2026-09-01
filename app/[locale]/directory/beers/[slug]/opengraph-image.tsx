import { ImageResponse } from "next/og";
import { getBeerBySlug, getBreweryById, getBreweryBySlug } from "@/lib/catalog/store";
import { copy, isLocale } from "@/lib/i18n";
import { OgShell, ogContentType, ogSize } from "@/lib/og-image";

export const size = ogSize;
export const contentType = ogContentType;

export default async function BeerOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = isLocale(locale) ? locale : "en";
  const beer = await getBeerBySlug(slug);
  const breweryFromId = beer ? await getBreweryById(beer.breweryId) : undefined;
  const brewery =
    breweryFromId ?? (beer?.brewerySlug ? await getBreweryBySlug(beer.brewerySlug) : undefined);
  const text = copy[resolved].seo;

  const facts: string[] = [];
  if (beer?.style) facts.push(beer.style);
  if (typeof beer?.abv === "number") facts.push(`${beer.abv}% ABV`);

  const breweryLine = brewery?.name ?? beer?.breweryName;
  const subtitle = breweryLine
    ? facts.length
      ? `${text.og.beerLabel} · ${breweryLine} · ${facts.join(" · ")}`
      : `${text.og.beerLabel} · ${breweryLine}`
    : text.og.beerLabel;

  return new ImageResponse(
    <OgShell eyebrow={text.og.eyebrow} title={beer?.name ?? "Beer"} subtitle={subtitle} />,
    size,
  );
}
