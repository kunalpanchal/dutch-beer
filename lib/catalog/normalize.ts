const GENERIC_HOSTS = new Set([
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "wikipedia.org",
  "en.wikipedia.org",
  "nl.wikipedia.org",
  "google.com",
  "maps.google.com",
  "youtu.be",
  "youtube.com",
  "linktr.ee",
  "untappd.com",
  "ratebeer.com",
]);

const NAME_NOISE =
  /\b(brouwerij|bierbrouwerij|stadsbrouwerij|stadsbrouwer|microbrouwerij|brewery|brewing|brewpub|brouwhuis|proeflokaal|craft beer company|beer company|beer|bier|bieren|de|het|den|the|van|'t|’t)\b/g;

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeName(value: string): string {
  return collapseWhitespace(
    stripDiacritics(value)
      .toLowerCase()
      .replace(/['’]t\b/g, " ")
      .replace(/['’`]/g, "")
      .replace(NAME_NOISE, " ")
      .replace(/[^a-z0-9]+/g, " "),
  );
}

export function normalizeLocality(value: string): string {
  return collapseWhitespace(
    stripDiacritics(value)
      .toLowerCase()
      .replace(/^['’]s[-–\s]*/i, "s ")
      .replace(/[^a-z0-9]+/g, " "),
  );
}

export function hostnameFromUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const href = value.includes("://") ? value : `https://${value}`;
    const host = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || GENERIC_HOSTS.has(host) || host.endsWith(".wikipedia.org")) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

export function canonicalWebsite(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const href = value.includes("://") ? value : `https://${value}`;
    const url = new URL(href);
    if (!hostnameFromUrl(url.href)) return undefined;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

export function slugify(value: string): string {
  const slug = stripDiacritics(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "brewery";
}

export const DUTCH_PROVINCES = [
  "Drenthe",
  "Flevoland",
  "Friesland",
  "Gelderland",
  "Groningen",
  "Limburg",
  "Noord-Brabant",
  "Noord-Holland",
  "Overijssel",
  "Utrecht",
  "Zeeland",
  "Zuid-Holland",
] as const;

const PROVINCE_ALIASES: Record<string, (typeof DUTCH_PROVINCES)[number]> = {
  drenthe: "Drenthe",
  flevoland: "Flevoland",
  friesland: "Friesland",
  fryslan: "Friesland",
  "fryslân": "Friesland",
  gelderland: "Gelderland",
  groningen: "Groningen",
  limburg: "Limburg",
  "noord brabant": "Noord-Brabant",
  "noord-brabant": "Noord-Brabant",
  "north brabant": "Noord-Brabant",
  northbrabant: "Noord-Brabant",
  "noord holland": "Noord-Holland",
  "noord-holland": "Noord-Holland",
  northholland: "Noord-Holland",
  "north holland": "Noord-Holland",
  overijssel: "Overijssel",
  utrecht: "Utrecht",
  zeeland: "Zeeland",
  "zuid holland": "Zuid-Holland",
  "zuid-holland": "Zuid-Holland",
  southholland: "Zuid-Holland",
  "south holland": "Zuid-Holland",
};

export function normalizeProvince(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const key = stripDiacritics(value).toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();
  return PROVINCE_ALIASES[key] ?? PROVINCE_ALIASES[key.replace(/-/g, " ")];
}
