import Link from "next/link";

export function SiteHeader() { return <header className="site-header"><Link className="logo" href="/">dutch<span>.beer</span></Link><nav aria-label="Primary navigation"><Link href="/directory/breweries">Directory</Link><Link href="/contribute">Contribute</Link></nav><Link className="header-cta" href="/contribute">Add a listing <span>↗</span></Link></header>; }
export function SiteFooter() { return <footer><Link className="logo" href="/">dutch<span>.beer</span></Link><p>A shared record of Dutch beer, built with care.</p><div><Link href="/directory/breweries">Directory</Link><Link href="/contribute">Contribute</Link><a href="https://github.com/kunalpanchal/dutchbeer">GitHub</a></div></footer>; }
