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
  social?: BrewerySocial;
  telephone?: string;
  openingHours?: string;
  taproom?: TaproomInfo;
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
