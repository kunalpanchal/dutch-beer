export const GITHUB_REPO = "kunalpanchal/dutchbeer";
export const CONTRIBUTE_EMAIL = "hello@dutch.beer";

export const contributionKinds = ["brewery", "beer", "correction"] as const;
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
};

export const githubIssueTemplates = {
  brewery: `https://github.com/${GITHUB_REPO}/issues/new?template=add-brewery.yml`,
  beer: `https://github.com/${GITHUB_REPO}/issues/new?template=add-beer.yml`,
  correction: `https://github.com/${GITHUB_REPO}/issues/new?template=correction.yml`,
} as const;

function line(label: string, value: string): string {
  return value.trim() ? `- **${label}:** ${value.trim()}` : "";
}

export function contributionIssue(payload: ContributionPayload): { title: string; body: string; labels: string } {
  const notes = payload.notes.trim() || "_None_";
  if (payload.kind === "beer") {
    return {
      title: `[Beer] ${payload.beerName.trim()}`,
      labels: "new-entry,beer",
      body: [
        "## New beer",
        line("Beer", payload.beerName),
        line("Brewery", payload.breweryName),
        line("Style", payload.style),
        line("ABV", payload.abv),
        line("Availability", payload.availability),
        line("Primary source", payload.source),
        "### Notes",
        notes,
        "_Submitted from the dutch.beer contribute form._",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (payload.kind === "correction") {
    return {
      title: `[Correction] ${payload.entity.trim()}`,
      labels: "correction",
      body: [
        "## Directory correction",
        line("Entry", payload.entity),
        line("Primary source", payload.source),
        "### What should change",
        notes,
        "_Submitted from the dutch.beer contribute form._",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    title: `[Brewery] ${payload.breweryName.trim()}`,
    labels: "new-entry,brewery",
    body: [
      "## New brewery",
      line("Name", payload.breweryName),
      line("Website", payload.website),
      line("Locality", payload.locality),
      line("Region", payload.region),
      line("Primary source", payload.source),
      "### Notes",
      notes,
      "_Submitted from the dutch.beer contribute form._",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function githubIssueUrl(payload: ContributionPayload): string {
  const { title, body, labels } = contributionIssue(payload);
  const params = new URLSearchParams({ title, body, labels });
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

export function mailtoUrl(payload: ContributionPayload): string {
  const { title, body } = contributionIssue(payload);
  return `mailto:${CONTRIBUTE_EMAIL}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

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
  };
}
