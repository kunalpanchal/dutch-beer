/**
 * Persistence-neutral domain model. These records intentionally retain their
 * evidence and moderation state; a database adapter can map them to tables later.
 */
export type TrustLevel = "new" | "trusted_contributor" | "verified_brewery" | "moderator";
export type PublicationStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type SourceKind =
  | "official_website"
  | "brewery_submission"
  | "label"
  | "retailer"
  | "publication"
  | "open_data"
  | "other";
export type OpenDataOrigin = "wikidata" | "open_brewery_db" | "openstreetmap";
export type BeerAvailability = "year_round" | "seasonal" | "one_off" | "unknown";

export interface Provenance {
  sourceKind: SourceKind;
  url?: string;
  note?: string;
  capturedAt: string;
  contributorId?: string;
  origin?: OpenDataOrigin;
}

export interface AuditFields {
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  trustLevel: TrustLevel;
  sources: Provenance[];
}

export interface BreweryAddress {
  street?: string;
  postalCode?: string;
  locality: string;
  region?: string;
  countryCode: "NL";
  latitude?: number;
  longitude?: number;
}

export interface BreweryExternalIds {
  wikidata?: string;
  openBreweryDb?: string;
  osm?: string;
  senb?: string;
}

export interface BrewerySocial {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
}

export interface TaproomInfo {
  name?: string;
  description?: string;
  website?: string;
}

export interface BreweryLink {
  label: string;
  url: string;
}

export interface BreweryFounder {
  name: string;
  role?: string;
  /** Owner- or source-supplied. Never generated. */
  bio?: string;
  /** Absolute URL or site-relative path. Never a stock stand-in. */
  image?: string;
}

export type BreweryBranchKind = "brewery" | "taproom" | "shop" | "other";

export interface BreweryBranch {
  name: string;
  kind?: BreweryBranchKind;
  address?: BreweryAddress;
  telephone?: string;
  openingHours?: string;
  website?: string;
}

export interface BreweryEvent {
  title: string;
  startsAt: string;
  endsAt?: string;
  description?: string;
  url?: string;
  location?: string;
}

export interface BreweryNewsUpdate {
  title: string;
  publishedAt: string;
  body?: string;
  url?: string;
}

export interface BreweryTour {
  description?: string;
  bookingUrl?: string;
  schedule?: string;
}

export interface BreweryPhoto {
  src: string;
  alt?: string;
  caption?: string;
}

export interface Brewery extends AuditFields {
  id: string;
  slug: string;
  name: string;
  website?: string;
  address?: BreweryAddress;
  claimedBy?: string;
  externalIds?: BreweryExternalIds;
  closed?: boolean;
  /** Owner- or source-supplied short copy. Never generated. */
  description?: string;
  /** Absolute URL or site-relative path. Never a stock stand-in. */
  coverImage?: string;
  logo?: string;
  /** CSS color from the brewery brand, e.g. "#1a3a5c". */
  accentColor?: string;
  social?: BrewerySocial;
  telephone?: string;
  /** Public contact page or form. Prefer over publishing a private inbox. */
  contactUrl?: string;
  openingHours?: string;
  taproom?: TaproomInfo;
  foundedYear?: number;
  founder?: BreweryFounder;
  tours?: BreweryTour;
  branches?: BreweryBranch[];
  events?: BreweryEvent[];
  /** Brewery-authored news, distinct from listing updatedAt. */
  news?: BreweryNewsUpdate[];
  photos?: BreweryPhoto[];
  /** Owner-chosen links to highlight (shop, booking, menu, …). */
  highlightLinks?: BreweryLink[];
  /** Brewery-ranked beer slugs shown ahead of the full list. */
  featuredBeerSlugs?: string[];
  /** Editorial or claimed featured placement on the directory. */
  featured?: boolean;
  /** Preview fixture: reachable by slug URL, omitted from directory lists. */
  previewOnly?: boolean;
}

export interface BeerExternalIds {
  wikidata?: string;
  senb?: string;
}

export interface Beer extends AuditFields {
  id: string;
  slug: string;
  breweryId: string;
  breweryName: string;
  brewerySlug?: string;
  name: string;
  style?: string;
  abv?: number;
  availability?: BeerAvailability;
  website?: string;
  /** Owner- or source-supplied short copy. Never generated. */
  description?: string;
  externalIds?: BeerExternalIds;
  /** Preview fixture beer: omitted from public beer lists. */
  previewOnly?: boolean;
}

export interface Contribution extends AuditFields {
  id: string;
  entityType: "brewery" | "beer";
  entityId?: string;
  kind: "create" | "update" | "correction" | "claim";
  payload: Record<string, unknown>;
  reviewNote?: string;
}

export const moderationPolicy = {
  new: "pending_review",
  trusted_contributor: "pending_review",
  verified_brewery: "pending_review",
  moderator: "published",
} as const satisfies Record<TrustLevel, PublicationStatus>;

export function isClaimed(brewery: Pick<Brewery, "claimedBy" | "trustLevel">): boolean {
  return Boolean(brewery.claimedBy) || brewery.trustLevel === "verified_brewery";
}
