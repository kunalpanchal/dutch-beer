import Link from "next/link";
import type { Brewery } from "@/lib/schema";
import { isClaimed } from "@/lib/schema";
import { copy, type Locale } from "@/lib/i18n";
import { contributePath } from "@/lib/paths";

export function ClaimPanel({
  brewery,
  locale,
  placement,
}: {
  brewery: Brewery;
  locale: Locale;
  placement: "hero" | "footer";
}) {
  const text = copy[locale].brewery;
  if (isClaimed(brewery)) {
    if (placement === "footer") {
      return (
        <aside className="claim-panel claim-panel-managed">
          <h2>{text.managedBy.replace("{name}", brewery.name)}</h2>
          <p>
            <Link className="button button-quiet" href={contributePath(locale, { kind: "correction", brewery: brewery.slug })}>
              {text.updateListing}
            </Link>
          </p>
        </aside>
      );
    }
    return null;
  }

  return (
    <aside className={`claim-panel ${placement === "hero" ? "claim-panel-hero" : ""}`}>
      <p className="claim-kicker">{text.claimLead}</p>
      <h2>{text.areYou.replace("{name}", brewery.name)}</h2>
      <p>{text.claimCopy}</p>
      <Link className="button button-ale" href={contributePath(locale, { kind: "claim", brewery: brewery.slug })}>
        {text.claimThis}
      </Link>
    </aside>
  );
}
