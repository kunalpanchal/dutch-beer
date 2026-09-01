export const SITE_NAME = "Dutch.beer";
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGE_TYPE = "image/png";

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteOrigin()}${path}`;
}

export function openGraphImagePath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path === "/") return "/opengraph-image";
  return `${path.replace(/\/$/, "")}/opengraph-image`;
}
