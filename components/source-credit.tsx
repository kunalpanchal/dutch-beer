import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import { openDataOriginOrder, openDataSources } from "@/lib/catalog/sources";

export function SourceCredit({ locale }: { locale: Locale }) {
  const text = copy[locale].attribution;
  return (
    <p className="shell source-credit">
      {text.credit}{" "}
      {openDataOriginOrder.map((origin, index) => {
        const source = openDataSources[origin];
        const name = copy[locale].directory.origin[origin];
        const separator = index === openDataOriginOrder.length - 1 ? text.and : index > 0 ? ", " : "";
        return (
          <span key={origin}>
            {separator}
            <a href={source.href} rel="noreferrer">
              {name}
            </a>{" "}
            ({source.license})
          </span>
        );
      })}
      . {text.creditAfter}
    </p>
  );
}

export function SourceOriginNote({ locale }: { locale: Locale }) {
  const text = copy[locale].attribution;
  return (
    <aside className="source-origin">
      <strong>{text.title}</strong>
      <p>{text.lead}</p>
      <ul>
        {openDataOriginOrder.map((origin) => {
          const source = openDataSources[origin];
          return (
            <li key={origin}>
              <a href={source.href} rel="noreferrer">
                {copy[locale].directory.origin[origin]}
              </a>
              <span>
                {source.license}
                {source.copyright ? ` · ${source.copyright}` : ""}
              </span>
              <span>{text.blurb[origin]}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
