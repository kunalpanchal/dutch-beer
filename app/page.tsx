import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const principles = [
  ["Open by default", "Profiles, sources, and edits are made for the community—not locked away."],
  ["Traceable facts", "Every important detail can carry a source, date, and a clear confidence signal."],
  ["Built together", "Enthusiasts and breweries can improve the record, one useful correction at a time."],
];

export default function Home() {
  return <main><SiteHeader />
    <section className="hero"><p className="eyebrow">An independent, community project</p><h1>Every Dutch beer<br /><em>has a story.</em></h1><p className="hero-copy">Dutch.beer is building a shared, source-aware map of the breweries and beers that make the Netherlands worth exploring.</p><div className="actions"><Link className="button button-dark" href="/directory/breweries">Explore the directory <span>→</span></Link><Link className="button button-quiet" href="/contribute">Add what you know</Link></div><div className="hero-note"><span className="pulse" /> The directory is just getting started. Help make it trustworthy.</div>
    </section>
    <section className="intro grid-section"><div><p className="eyebrow">A better beer record</p><h2>Made for curious drinkers. Useful to everyone.</h2></div><p>Finding Dutch beer should not depend on stale listings or closed platforms. We’re creating a durable public record—with room for local knowledge and direct brewery input.</p></section>
    <section className="principles">{principles.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>
    <section className="contribute-banner"><div><p className="eyebrow">Start the record</p><h2>Know a brewery?<br />Put it on the map.</h2></div><Link className="round-link" href="/contribute" aria-label="Contribute a brewery or beer">↗</Link></section>
    <SiteFooter />
  </main>;
}
