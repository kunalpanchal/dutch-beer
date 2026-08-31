export const GITHUB_REPO = "kunalpanchal/dutchbeer";

export const contributionKinds = ["brewery", "beer", "correction", "claim"] as const;
export type ContributionKind = (typeof contributionKinds)[number];

export type ContributionPayload = {
  kind: ContributionKind;
  breweryName: string;
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
  description: string;
  coverImage: string;
  logo: string;
  instagram: string;
  facebook: string;
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
    url: payload.source || payload.website,
    capturedAt: capturedAt(),
    ...(payload.notes ? { note: payload.notes } : {}),
  };
}

function profileFields(payload: ContributionPayload) {
  const social = {
    ...(payload.instagram ? { instagram: payload.instagram } : {}),
    ...(payload.facebook ? { facebook: payload.facebook } : {}),
  };
  return {
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.coverImage ? { coverImage: payload.coverImage } : {}),
    ...(payload.logo ? { logo: payload.logo } : {}),
    ...(Object.keys(social).length ? { social } : {}),
  };
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
          brewery: payload.breweryName,
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
          ...profileFields(payload),
          status: "pending_review",
          sources: [source(payload)],
        },
        null,
        2,
      )}\n`,
    };
  }

  if (payload.kind === "claim") {
    const slug = slugify(payload.breweryName);
    return {
      path: `data/claims/${slug}.json`,
      contents: `${JSON.stringify(
        {
          kind: "claim",
          slug,
          name: payload.breweryName,
          website: payload.website,
          ...profileFields(payload),
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
    description: read("description"),
    coverImage: read("coverImage"),
    logo: read("logo"),
    instagram: read("instagram"),
    facebook: read("facebook"),
  };
}
