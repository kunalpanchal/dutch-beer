"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
export function LanguageSwitcher({ locale }: { locale: Locale }) { const pathname = usePathname(); const other = locale === "en" ? "nl" : "en"; const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/"; return <Link className="language-switcher" href={`/${other}${rest === "/" ? "" : rest}`} lang={other} aria-label={locale === "en" ? "Bekijk deze pagina in het Nederlands" : "View this page in English"}>{other.toUpperCase()}</Link>; }
