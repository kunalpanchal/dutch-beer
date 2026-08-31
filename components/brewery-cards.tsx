import Link from "next/link";
import type { BreweryListItem } from "@/lib/catalog/store";
import { copy, type Locale } from "@/lib/i18n";

export function BreweryCards({
  locale,
  items,
  hrefBase,
  emptyLabel,
}: {
  locale: Locale;
  items: BreweryListItem[];
  hrefBase: string;
  emptyLabel: string;
}) {
  const text = copy[locale];
  if (!items.length) return <p className="list-empty">{emptyLabel}</p>;
  return (
    <ul className="listing-grid">
      {items.map((item) => (
        <li key={item.slug}>
          <Link className="listing-card" href={`${hrefBase}/${item.slug}`}>
            <div className="listing-card-top">
              <h2>{item.name}</h2>
              {item.closed ? <span className="badge badge-closed">{text.directory.closed}</span> : null}
            </div>
            <p>{[item.locality, item.region].filter(Boolean).join(", ")}</p>
            <div className="source-badges">
              {item.origins.map((value) => (
                <span key={value} className={`badge badge-${value}`}>
                  {text.directory.origin[value]}
                </span>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
