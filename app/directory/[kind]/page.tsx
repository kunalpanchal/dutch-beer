import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const content = { breweries: { singular: "breweries", title: "The brewery directory", description: "A growing, community-maintained record of independent Dutch breweries." }, beers: { singular: "beers", title: "The beer directory", description: "A place for every Dutch beer—documented with care and source-aware details." } } as const;

export default async function DirectoryPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "breweries" && kind !== "beers") notFound();
  const page = content[kind];
  return <main><SiteHeader /><section className="directory-hero"><p className="eyebrow">Directory / {page.singular}</p><h1>{page.title}</h1><p>{page.description}</p></section><section className="empty-state"><div className="empty-mark">✦</div><h2>The first {page.singular} are waiting.</h2><p>We don’t seed this project with unverified information. Be part of the first trusted entries instead.</p><Link className="button button-dark" href="/contribute">Contribute a {kind === "breweries" ? "brewery" : "beer"} <span>→</span></Link></section><SiteFooter /></main>;
}
