import { readdir, readFile } from "fs/promises";
import path from "path";
import type { Brewery, BrewerySocial, PublicationStatus, Provenance, TaproomInfo, TrustLevel } from "@/lib/schema";

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
  social?: BrewerySocial;
  telephone?: string;
  openingHours?: string;
  taproom?: TaproomInfo;
}

export const claimsDir = path.join(process.cwd(), "data/claims");

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
      description: claim.description ?? brewery.description,
      coverImage: claim.coverImage ?? brewery.coverImage,
      logo: claim.logo ?? brewery.logo,
      social: claim.social ?? brewery.social,
      telephone: claim.telephone ?? brewery.telephone,
      openingHours: claim.openingHours ?? brewery.openingHours,
      taproom: claim.taproom ?? brewery.taproom,
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
