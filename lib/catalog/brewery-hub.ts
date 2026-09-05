import type { Beer, Brewery } from "@/lib/schema";

export const BREWERY_BEER_SHEET_THRESHOLD = 12;

export function partitionBreweryBeers(
  beers: Beer[],
  featuredBeerSlugs?: string[],
): { featured: Beer[]; listed: Beer[] } {
  if (featuredBeerSlugs?.length) {
    const bySlug = new Map(beers.map((beer) => [beer.slug, beer]));
    const featured = featuredBeerSlugs
      .map((slug) => bySlug.get(slug))
      .filter((beer): beer is Beer => Boolean(beer));
    if (featured.length) {
      const featuredIds = new Set(featured.map((beer) => beer.id));
      return { featured, listed: beers.filter((beer) => !featuredIds.has(beer.id)) };
    }
  }

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

export function hasVisitInfo(brewery: Brewery): boolean {
  return Boolean(
    brewery.address?.street ||
      brewery.address?.postalCode ||
      (brewery.address?.latitude !== undefined && brewery.address.longitude !== undefined) ||
      brewery.openingHours ||
      brewery.telephone ||
      brewery.taproom,
  );
}

export function hasAboutExtras(brewery: Brewery): boolean {
  return Boolean(brewery.foundedYear || brewery.founder || brewery.tours);
}

export function hasStorySection(brewery: Brewery): boolean {
  return Boolean(brewery.description || hasAboutExtras(brewery));
}

export function upcomingEvents(events: NonNullable<Brewery["events"]>, now = new Date()): NonNullable<Brewery["events"]> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return events
    .filter((event) => {
      const end = event.endsAt ?? event.startsAt;
      return !Number.isNaN(Date.parse(end)) && Date.parse(end) >= startOfToday.getTime();
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function isSafeAccentColor(value: string | undefined): value is string {
  if (!value) return false;
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}
