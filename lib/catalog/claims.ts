import { readdir, readFile } from "fs/promises";
import path from "path";
import type {
  Brewery,
  BreweryBranch,
  BreweryEvent,
  BreweryFounder,
  BreweryLink,
  BreweryNewsUpdate,
  BreweryPhoto,
  BrewerySocial,
  BreweryTour,
  PublicationStatus,
  Provenance,
  TaproomInfo,
  TrustLevel,
} from "@/lib/schema";

export interface ClaimRecord {
  slug: string;
  brewery: string;
  claimedBy: string;
  email: string;
  website?: string;
  status: PublicationStatus;
  trustLevel?: TrustLevel;
  sources: Provenance[];
  description?: string;
  coverImage?: string;
  logo?: string;
  accentColor?: string;
  social?: BrewerySocial;
  telephone?: string;
  contactUrl?: string;
  openingHours?: string;
  taproom?: TaproomInfo;
  foundedYear?: number;
  founder?: BreweryFounder;
  tours?: BreweryTour;
  branches?: BreweryBranch[];
  events?: BreweryEvent[];
  news?: BreweryNewsUpdate[];
  photos?: BreweryPhoto[];
  highlightLinks?: BreweryLink[];
  featuredBeerSlugs?: string[];
  featured?: boolean;
}

export const claimsDir = path.join(process.cwd(), "data/claims");

function pickClaimField<T>(claimValue: T | undefined, breweryValue: T | undefined): T | undefined {
  return claimValue !== undefined ? claimValue : breweryValue;
}

export function applyPublishedClaims(breweries: Brewery[], claims: ClaimRecord[]): Brewery[] {
  const published = new Map(
    claims.filter((claim) => claim.status === "published" && claim.slug).map((claim) => [claim.slug, claim]),
  );
  if (published.size === 0) return breweries;

  return breweries.map((brewery) => {
    const claim = published.get(brewery.slug);
    if (!claim) return brewery;
    return {
      ...brewery,
      claimedBy: claim.claimedBy,
      trustLevel: "verified_brewery",
      description: pickClaimField(claim.description, brewery.description),
      coverImage: pickClaimField(claim.coverImage, brewery.coverImage),
      logo: pickClaimField(claim.logo, brewery.logo),
      accentColor: pickClaimField(claim.accentColor, brewery.accentColor),
      social: pickClaimField(claim.social, brewery.social),
      telephone: pickClaimField(claim.telephone, brewery.telephone),
      contactUrl: pickClaimField(claim.contactUrl, brewery.contactUrl),
      openingHours: pickClaimField(claim.openingHours, brewery.openingHours),
      taproom: pickClaimField(claim.taproom, brewery.taproom),
      foundedYear: pickClaimField(claim.foundedYear, brewery.foundedYear),
      founder: pickClaimField(claim.founder, brewery.founder),
      tours: pickClaimField(claim.tours, brewery.tours),
      branches: pickClaimField(claim.branches, brewery.branches),
      events: pickClaimField(claim.events, brewery.events),
      news: pickClaimField(claim.news, brewery.news),
      photos: pickClaimField(claim.photos, brewery.photos),
      highlightLinks: pickClaimField(claim.highlightLinks, brewery.highlightLinks),
      featuredBeerSlugs: pickClaimField(claim.featuredBeerSlugs, brewery.featuredBeerSlugs),
      featured: claim.featured === true || brewery.featured === true ? true : undefined,
      sources: claim.sources.length
        ? [...brewery.sources, ...claim.sources.filter((source) => !brewery.sources.some((existing) => existing.url === source.url && existing.sourceKind === source.sourceKind))]
        : brewery.sources,
    };
  });
}

export async function loadClaimFiles(): Promise<ClaimRecord[]> {
  let names: string[];
  try {
    names = await readdir(claimsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const claims: ClaimRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const raw = await readFile(path.join(claimsDir, name), "utf8");
    claims.push(JSON.parse(raw) as ClaimRecord);
  }
  return claims;
}
