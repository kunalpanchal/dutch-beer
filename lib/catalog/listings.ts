import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { normalizeName } from "@/lib/catalog/normalize";
import type { CatalogFile } from "@/lib/catalog/merge";
import type { Beer, Brewery, PublicationStatus, TrustLevel } from "@/lib/schema";

export const assembledCatalogName = ".assembled.json";

export function breweriesDir(directory: string): string {
  return path.join(directory, "breweries");
}

export function beersDir(directory: string): string {
  return path.join(directory, "beers");
}

export function listingFileName(slug: string): string {
  return `${slug}.json`;
}

export function listingPath(directory: string, kind: "breweries" | "beers", slug: string): string {
  return path.join(directory, kind, listingFileName(slug));
}

async function readJsonFiles(directory: string): Promise<{ slug: string; data: Record<string, unknown> }[]> {
  let names: string[];
  try {
    names = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const records = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const filePath = path.join(directory, name);
    const data = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    const slug = typeof data.slug === "string" ? data.slug : name.slice(0, -5);
    if (!slug) throw new Error(`${filePath} is missing slug`);
    records.push({ slug, data });
  }
  return records;
}

function asStatus(value: unknown): PublicationStatus {
  return value === "published" || value === "draft" || value === "rejected" || value === "archived" ? value : "pending_review";
}

function asTrust(value: unknown): TrustLevel {
  return value === "trusted_contributor" || value === "verified_brewery" || value === "moderator" ? value : "new";
}

function normalizeBreweryRecord(slug: string, data: Record<string, unknown>): Brewery {
  const capturedAt = typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString().slice(0, 10);
  return {
    id: typeof data.id === "string" ? data.id : `file-${slug}`,
    slug,
    name: String(data.name ?? slug),
    website: typeof data.website === "string" ? data.website : undefined,
    address: data.address as Brewery["address"],
    status: asStatus(data.status),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : capturedAt,
    updatedAt: capturedAt,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    trustLevel: asTrust(data.trustLevel),
    sources: Array.isArray(data.sources) ? (data.sources as Brewery["sources"]) : [],
    claimedBy: typeof data.claimedBy === "string" ? data.claimedBy : undefined,
    externalIds: data.externalIds as Brewery["externalIds"],
    closed: data.closed === true ? true : undefined,
  };
}

function normalizeBeerRecord(slug: string, data: Record<string, unknown>, breweries: Brewery[]): Beer {
  const capturedAt = typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString().slice(0, 10);
  const breweryName = String(data.breweryName ?? data.brewery ?? "Unknown brewery");
  const matched =
    breweries.find((brewery) => brewery.slug === data.brewerySlug) ??
    breweries.find((brewery) => normalizeName(brewery.name) === normalizeName(breweryName));
  return {
    id: typeof data.id === "string" ? data.id : `file-${slug}`,
    slug,
    breweryId: typeof data.breweryId === "string" ? data.breweryId : (matched?.id ?? "unlinked"),
    breweryName: matched?.name ?? breweryName,
    brewerySlug: typeof data.brewerySlug === "string" ? data.brewerySlug : matched?.slug,
    name: String(data.name ?? slug),
    style: typeof data.style === "string" ? data.style : undefined,
    abv: typeof data.abv === "number" ? data.abv : undefined,
    availability: data.availability as Beer["availability"],
    website: typeof data.website === "string" ? data.website : undefined,
    status: asStatus(data.status),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : capturedAt,
    updatedAt: capturedAt,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    trustLevel: asTrust(data.trustLevel),
    sources: Array.isArray(data.sources) ? (data.sources as Beer["sources"]) : [],
    externalIds: data.externalIds as Beer["externalIds"],
  };
}

export async function loadListingFiles(directory: string): Promise<{ breweries: Brewery[]; beers: Beer[] }> {
  const [breweryFiles, beerFiles] = await Promise.all([
    readJsonFiles(breweriesDir(directory)),
    readJsonFiles(beersDir(directory)),
  ]);
  const breweries = breweryFiles
    .map((file) => normalizeBreweryRecord(file.slug, file.data))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
  const beers = beerFiles
    .map((file) => normalizeBeerRecord(file.slug, file.data, breweries))
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, "nl");
      if (byName !== 0) return byName;
      return a.breweryName.localeCompare(b.breweryName, "nl");
    });
  return { breweries, beers };
}

export async function writeListingFile(
  directory: string,
  kind: "breweries" | "beers",
  record: Brewery | Beer,
  options: { overwrite?: boolean } = {},
): Promise<"written" | "skipped"> {
  await mkdir(path.join(directory, kind), { recursive: true });
  const file = listingPath(directory, kind, record.slug);
  if (!options.overwrite) {
    try {
      await readFile(file);
      return "skipped";
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  await writeFile(file, `${JSON.stringify(record, null, 2)}\n`);
  return "written";
}

export async function writeListingFiles(
  directory: string,
  listings: { breweries?: Brewery[]; beers?: Beer[] },
  options: { overwrite?: boolean } = {},
): Promise<{ breweries: { written: number; skipped: number }; beers: { written: number; skipped: number } }> {
  const counts = {
    breweries: { written: 0, skipped: 0 },
    beers: { written: 0, skipped: 0 },
  };
  for (const brewery of listings.breweries ?? []) {
    const result = await writeListingFile(directory, "breweries", brewery, options);
    counts.breweries[result] += 1;
  }
  for (const beer of listings.beers ?? []) {
    const result = await writeListingFile(directory, "beers", beer, options);
    counts.beers[result] += 1;
  }
  return counts;
}

export async function assembleCatalogFile(
  directory: string,
  destination: string,
): Promise<CatalogFile> {
  const listings = await loadListingFiles(directory);
  const catalog: CatalogFile = {
    generatedAt: new Date().toISOString(),
    sources: {},
    ...listings,
  };
  await writeFile(destination, `${JSON.stringify(catalog)}\n`);
  return catalog;
}
