"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy, locales, type Locale } from "@/lib/i18n";
import { replaceLocaleInPath } from "@/lib/paths";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = copy[locale].language;

  return (
    <nav className="language-switcher" aria-label={labels.label}>
      {locales.map((code) => (
        <Link
          key={code}
          href={replaceLocaleInPath(pathname, code)}
          hrefLang={code}
          lang={code}
          aria-current={code === locale ? "page" : undefined}
          aria-label={labels[code]}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
