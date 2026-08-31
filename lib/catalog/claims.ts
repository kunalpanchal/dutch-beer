import { readdir, readFile } from "fs/promises";
import path from "path";
import type { Brewery, PublicationStatus, Provenance, TrustLevel } from "@/lib/schema";

export interface ClaimRecord {
  slug: string;
  brewery: string;
  claimedBy: string;
  email: string;
  website?: string;
  status: PublicationStatus;
  trustLevel?: TrustLevel;
  sources: Provenance[];
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
