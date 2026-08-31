import { emailMatchesWebsite, urlMatchesWebsite } from "@/lib/catalog/normalize";

export const GITHUB_REPO = "kunalpanchal/dutchbeer";

export const contributionKinds = ["brewery", "beer", "correction", "claim"] as const;
export type ContributionKind = (typeof contributionKinds)[number];

export type ContributionPayload = {
  kind: ContributionKind;
  breweryName: string;
  brewerySlug: string;
  beerName: string;
  website: string;
  locality: string;
  region: string;
  style: string;
  abv: string;
  availability: string;
  entity: string;
  source: string;
  notes: string;
  email: string;
  contact: string;
};

export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "entry";
}

export function githubNewFileUrl(path: string, contents?: string): string {
  const params = new URLSearchParams({ filename: path });
  if (contents) params.set("value", contents);
  return `https://github.com/${GITHUB_REPO}/new/main?${params.toString()}`;
}

function capturedAt(): string {
  return new Date().toISOString().slice(0, 10);
}

function source(payload: ContributionPayload, sourceKind: "official_website" | "brewery_submission" = "official_website") {
  return {
    sourceKind,
    url: payload.source,
    capturedAt: capturedAt(),
    ...(payload.notes ? { note: payload.notes } : {}),
  };
}

export function claimDomainError(payload: Pick<ContributionPayload, "email" | "website" | "source">): "email" | "evidence" | undefined {
  if (!emailMatchesWebsite(payload.email, payload.website)) return "email";
  if (!urlMatchesWebsite(payload.source, payload.website)) return "evidence";
  return undefined;
}

export function contributionFile(payload: ContributionPayload): { path: string; contents: string } {
  if (payload.kind === "beer") {
    const slug = slugify(payload.beerName);
    const abv = Number.parseFloat(payload.abv.replace(",", "."));
    return {
      path: `data/beers/${slug}.json`,
      contents: `${JSON.stringify(
        {
          slug,
          name: payload.beerName,
          breweryName: payload.breweryName,
          ...(payload.brewerySlug ? { brewerySlug: payload.brewerySlug } : {}),
          ...(payload.style ? { style: payload.style } : {}),
          ...(Number.isFinite(abv) ? { abv } : {}),
          availability: payload.availability || "unknown",
          status: "pending_review",
          trustLevel: "new",
          sources: [source(payload)],
        },
        null,
        2,
      )}\n`,
    };
  }

  if (payload.kind === "correction") {
    const slug = slugify(payload.entity);
    return {
      path: `data/corrections/${slug}.json`,
      contents: `${JSON.stringify(
        {
          entry: payload.entity,
          change: payload.notes,
          status: "pending_review",
          sources: [source(payload)],
        },
        null,
        2,
      )}\n`,
    };
  }

  if (payload.kind === "claim") {
    const slug = payload.brewerySlug || slugify(payload.breweryName);
    return {
      path: `data/claims/${slug}.json`,
      contents: `${JSON.stringify(
        {
          slug,
          brewery: payload.breweryName,
          claimedBy: payload.contact,
          email: payload.email,
          website: payload.website,
          status: "pending_review",
          trustLevel: "new",
          sources: [source(payload, "brewery_submission")],
        },
        null,
        2,
      )}\n`,
    };
  }

  const slug = slugify(payload.breweryName);
  return {
    path: `data/breweries/${slug}.json`,
    contents: `${JSON.stringify(
      {
        slug,
        name: payload.breweryName,
        website: payload.website,
        address: {
          locality: payload.locality,
          ...(payload.region ? { region: payload.region } : {}),
          countryCode: "NL",
        },
        status: "pending_review",
        trustLevel: "new",
        sources: [source(payload)],
      },
      null,
      2,
    )}\n`,
  };
}

export function githubPullRequestUrl(payload: ContributionPayload): string {
  const { path, contents } = contributionFile(payload);
  return githubNewFileUrl(path, contents);
}

export const githubNewEntryUrls = {
  brewery: githubNewFileUrl("data/breweries/brewery-name.json"),
  beer: githubNewFileUrl("data/beers/beer-name.json"),
  correction: githubNewFileUrl("data/corrections/entry-name.json"),
  claim: githubNewFileUrl("data/claims/brewery-name.json"),
} as const;

export function payloadFromForm(kind: ContributionKind, form: FormData): ContributionPayload {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  return {
    kind,
    breweryName: read("breweryName"),
    brewerySlug: read("brewerySlug"),
    beerName: read("beerName"),
    website: read("website"),
    locality: read("locality"),
    region: read("region"),
    style: read("style"),
    abv: read("abv"),
    availability: read("availability"),
    entity: read("entity"),
    source: read("source"),
    notes: read("notes"),
    email: read("email"),
    contact: read("contact"),
  };
}
