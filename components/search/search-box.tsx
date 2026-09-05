"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  querySearchIndex,
  searchHref,
  searchResultsPath,
  type GroupedSearchResults,
  type SearchHit,
  type SearchKind,
} from "@/lib/catalog/search";
import { copy, type Locale } from "@/lib/i18n";
import { useIsMac, useSearchHotkeys, useSearchIndex } from "@/components/search/use-search";

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_ORDER: SearchKind[] = ["brewery", "place", "beer", "style"];
const CATEGORY_EMOJI: Record<SearchKind, string> = {
  brewery: "🏢",
  place: "📍",
  beer: "🍺",
  style: "🍺",
};

function groupsFor(results: GroupedSearchResults): Array<{ kind: SearchKind; hits: SearchHit[] }> {
  return CATEGORY_ORDER.map((kind) => ({
    kind,
    hits:
      kind === "brewery"
        ? results.breweries
        : kind === "place"
          ? results.places
          : kind === "beer"
            ? results.beers
            : results.styles,
  })).filter((group) => group.hits.length > 0);
}

function hitDetail(hit: SearchHit, text: (typeof copy)[Locale]["search"]): string | undefined {
  if (hit.kind !== "style" || !hit.detail) return hit.detail;
  const count = Number(hit.detail);
  if (!Number.isFinite(count)) return hit.detail;
  return count === 1 ? text.styleCountOne : interpolate(text.styleCount, { count });
}

export type SearchBoxVariant = "hero" | "header" | "overlay";

export function SearchBox({
  locale,
  variant,
  autoFocus = false,
  enableHotkeys,
  initialQuery = "",
  onClose,
  className,
}: {
  locale: Locale;
  variant: SearchBoxVariant;
  autoFocus?: boolean;
  enableHotkeys?: boolean;
  initialQuery?: string;
  onClose?: () => void;
  className?: string;
}) {
  const text = copy[locale].search;
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isMac = useIsMac();
  const { index } = useSearchIndex(true);
  const hotkeysEnabled = enableHotkeys ?? variant === "hero";

  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(() => querySearchIndex(index, query), [index, query]);
  const groups = useMemo(() => groupsFor(results), [results]);
  const flat = results.flat;
  const showPanel = open && query.trim().length > 0;

  const focusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
    setOpen(true);
  };

  useSearchHotkeys({
    onOpen: focusInput,
    enabled: hotkeysEnabled,
  });

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goToHit(hit: SearchHit) {
    setOpen(false);
    onClose?.();
    router.push(searchHref(locale, hit));
  }

  function goToResults() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    onClose?.();
    router.push(searchResultsPath(locale, trimmed));
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        setQuery("");
        setActiveIndex(-1);
        return;
      }
      setOpen(false);
      inputRef.current?.blur();
      onClose?.();
      return;
    }

    if (event.key === "ArrowDown") {
      if (!flat.length && !query.trim()) return;
      event.preventDefault();
      setOpen(true);
      const max = flat.length; // last slot = "view all"
      setActiveIndex((current) => (current + 1 > max ? 0 : current + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      if (!flat.length && !query.trim()) return;
      event.preventDefault();
      setOpen(true);
      const max = flat.length;
      setActiveIndex((current) => (current <= 0 ? max : current - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < flat.length) {
        goToHit(flat[activeIndex]);
        return;
      }
      goToResults();
    }
  }

  const hotkeyLabel = isMac ? text.hotkey : text.hotkeyWin;
  const activeOptionId = activeIndex >= 0 && activeIndex < flat.length ? `${listId}-option-${activeIndex}` : undefined;

  return (
    <div
      ref={rootRef}
      className={["search-box", `search-box-${variant}`, className].filter(Boolean).join(" ")}
    >
      <div className="search-field">
        <MagnifierIcon className="search-field-icon" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          aria-label={text.open}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          enterKeyHint="search"
          placeholder={text.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            aria-label={text.clear}
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <ClearIcon />
          </button>
        ) : variant === "hero" ? (
          <kbd className="search-hotkey" aria-hidden="true">
            {hotkeyLabel}
            <span className="search-hotkey-sep">·</span>
            {text.slashHint}
          </kbd>
        ) : variant === "header" ? (
          <kbd className="search-hotkey search-hotkey-compact" aria-hidden="true">
            {hotkeyLabel}
          </kbd>
        ) : null}
      </div>

      {showPanel ? (
        <div className="search-panel" id={listId} role="listbox" aria-label={text.open}>
          {flat.length === 0 ? (
            <p className="search-empty">{interpolate(text.noResults, { query: query.trim() })}</p>
          ) : (
            groups.map((group) => (
              <section key={group.kind} className="search-group">
                <h3 className="search-group-label">
                  <span aria-hidden="true">{CATEGORY_EMOJI[group.kind]} </span>
                  {text.categories[group.kind]}
                </h3>
                <ul>
                  {group.hits.map((hit) => {
                    const flatIndex = flat.indexOf(hit);
                    const active = flatIndex === activeIndex;
                    const detail = hitDetail(hit, text);
                    return (
                      <li key={`${hit.kind}-${hit.slug}`} role="presentation">
                        <Link
                          id={`${listId}-option-${flatIndex}`}
                          role="option"
                          aria-selected={active}
                          className={active ? "search-option is-active" : "search-option"}
                          href={searchHref(locale, hit)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => {
                            setOpen(false);
                            onClose?.();
                          }}
                        >
                          <span className="search-option-name">{hit.name}</span>
                          {detail ? <span className="search-option-detail">{detail}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
          <button
            type="button"
            className={
              activeIndex === flat.length ? "search-view-all is-active" : "search-view-all"
            }
            onMouseEnter={() => setActiveIndex(flat.length)}
            onClick={goToResults}
          >
            {interpolate(text.viewAll, { query: query.trim() })}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderSearch({ locale }: { locale: Locale }) {
  const text = copy[locale].search;
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMac = useIsMac();

  useSearchHotkeys({
    onOpen: () => {
      const desktopInput = document.querySelector<HTMLInputElement>(".search-box-header input");
      if (desktopInput && window.matchMedia("(min-width: 861px)").matches) {
        desktopInput.focus();
        desktopInput.select();
        return;
      }
      setMobileOpen(true);
    },
  });

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="header-search-desktop">
        <SearchBox locale={locale} variant="header" />
      </div>
      <button
        type="button"
        className="header-search-trigger"
        aria-label={text.open}
        onClick={() => setMobileOpen(true)}
      >
        <MagnifierIcon />
        <kbd className="header-search-trigger-hotkey" aria-hidden="true">
          {isMac ? text.hotkey : text.hotkeyWin}
        </kbd>
      </button>
      {mobileOpen ? (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label={text.open}>
          <div className="search-overlay-bar">
            <SearchBox locale={locale} variant="overlay" autoFocus onClose={() => setMobileOpen(false)} />
            <button type="button" className="search-overlay-close" onClick={() => setMobileOpen(false)}>
              {text.close}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function HeroSearch({ locale }: { locale: Locale }) {
  const text = copy[locale].search;
  return (
    <div className="hero-search">
      <h1 className="hero-search-brand">
        dutch<span>.beer</span>
      </h1>
      <p className="hero-search-tagline">{text.tagline}</p>
      <SearchBox locale={locale} variant="hero" />
    </div>
  );
}
