import type { Beer, Brewery } from "@/lib/schema";

export const BREWERY_BEER_SHEET_THRESHOLD = 12;

export function partitionBreweryBeers(beers: Beer[]): { featured: Beer[]; listed: Beer[] } {
  const featured = beers.filter((beer) => beer.availability === "year_round");
  if (!featured.length) return { featured: [], listed: beers };
  const featuredIds = new Set(featured.map((beer) => beer.id));
  return { featured, listed: beers.filter((beer) => !featuredIds.has(beer.id)) };
}

export function usesBeerSheet(count: number): boolean {
  return count > BREWERY_BEER_SHEET_THRESHOLD;
}

export function breweryIntro(
  brewery: Pick<Brewery, "name" | "description" | "closed">,
  templates: {
    intro: string;
    introNoPlace: string;
    introClosed: string;
    introClosedNoPlace: string;
  },
  place: string,
): string {
  if (brewery.description) return brewery.description;
  const closed = Boolean(brewery.closed);
  if (place) {
    const template = closed ? templates.introClosed : templates.intro;
    return template.replace("{name}", brewery.name).replace("{place}", place);
  }
  return (closed ? templates.introClosedNoPlace : templates.introNoPlace).replace("{name}", brewery.name);
}
