"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  AreaTimelineChart,
  DonutChart,
  HistogramChart,
  HorizontalBarChart,
} from "@/components/analytics-charts";
import {
  analyticsExportRows,
  computeAnalyticsSnapshot,
  type AnalyticsPayload,
} from "@/lib/catalog/analytics";
import type { Locale } from "@/lib/i18n";

export type AnalyticsCopy = {
  title: string;
  subtitle: string;
  filters: {
    province: string;
    allProvinces: string;
    scope: string;
    allTime: string;
    activeOnly: string;
  };
  stats: {
    activeBreweries: string;
    contractBrewers: string;
    indexedBeers: string;
    popularStyle: string;
    oldestBrewery: string;
    unknown: string;
  };
  charts: {
    provinces: string;
    provincesHint: string;
    cities: string;
    citiesHint: string;
    growth: string;
    growthHint: string;
    styles: string;
    stylesHint: string;
    operational: string;
    operationalHint: string;
    abv: string;
    abvHint: string;
    empty: string;
    physical: string;
    contract: string;
  };
  export: {
    title: string;
    share: string;
    downloadJson: string;
    downloadCsv: string;
    copied: string;
  };
  coverage: string;
  breweryLink: string;
};

function formatCount(locale: Locale, value: number): string {
  return value.toLocaleString(locale === "nl" ? "nl-NL" : "en");
}

function downloadBlob(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(exportData: ReturnType<typeof analyticsExportRows>): string {
  const lines = ["section,name,count"];
  const push = (section: string, rows: { name: string; count: number }[]) => {
    for (const row of rows) {
      lines.push(`${section},${JSON.stringify(row.name)},${row.count}`);
    }
  };
  const overview = exportData.overview;
  lines.push(`overview,"activeBreweries",${overview.activeBreweries}`);
  lines.push(`overview,"contractBrewers",${overview.contractBrewers}`);
  lines.push(`overview,"indexedBeers",${overview.indexedBeers}`);
  lines.push(`overview,"mostPopularStyle",${JSON.stringify(overview.mostPopularStyle ?? "")}`);
  if (overview.oldestActiveBrewery) {
    lines.push(
      `overview,"oldestActiveBrewery",${JSON.stringify(`${overview.oldestActiveBrewery.name} (${overview.oldestActiveBrewery.year})`)}`,
    );
  }
  push("provinces", exportData.provinces);
  push("cities", exportData.cities);
  push("growth", exportData.growth);
  push("styleGroups", exportData.styleGroups);
  push("operational", exportData.operational);
  push("abv", exportData.abv);
  return `${lines.join("\n")}\n`;
}

export function AnalyticsDashboard({
  locale,
  payload,
  copy,
}: {
  locale: Locale;
  payload: AnalyticsPayload;
  copy: AnalyticsCopy;
}) {
  const [province, setProvince] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [, startTransition] = useTransition();

  const snapshot = useMemo(
    () => computeAnalyticsSnapshot(payload, { province, activeOnly }),
    [payload, province, activeOnly],
  );

  const operationalRows = useMemo(
    () =>
      snapshot.operational.map((row) => ({
        ...row,
        name: row.name === "physical" ? copy.charts.physical : copy.charts.contract,
      })),
    [snapshot.operational, copy.charts.physical, copy.charts.contract],
  );

  const oldest = snapshot.overview.oldestActiveBrewery;

  function onProvinceChange(value: string) {
    startTransition(() => setProvince(value));
  }

  function onScopeChange(value: string) {
    startTransition(() => setActiveOnly(value === "active"));
  }

  async function shareInsights() {
    const text = [
      copy.title,
      `${copy.stats.activeBreweries}: ${snapshot.overview.activeBreweries}`,
      `${copy.stats.indexedBeers}: ${snapshot.overview.indexedBeers}`,
      `${copy.stats.popularStyle}: ${snapshot.overview.mostPopularStyle ?? copy.stats.unknown}`,
      typeof window !== "undefined" ? window.location.href : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: copy.title, text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote(copy.export.copied);
      window.setTimeout(() => setShareNote(""), 2400);
    } catch {
      setShareNote("");
    }
  }

  function downloadJson() {
    const data = analyticsExportRows(payload, { province, activeOnly });
    downloadBlob("dutch-beer-analytics.json", `${JSON.stringify(data, null, 2)}\n`, "application/json");
  }

  function downloadCsv() {
    const data = analyticsExportRows(payload, { province, activeOnly });
    downloadBlob("dutch-beer-analytics.csv", toCsv(data), "text/csv");
  }

  return (
    <div className="analytics-page">
      <section className="directory-hero shell analytics-hero">
        <p className="eyebrow">dutch.beer</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </section>

      <section className="shell analytics-controls" aria-label={copy.filters.scope}>
        <label className="analytics-control">
          <span>{copy.filters.province}</span>
          <select value={province} onChange={(event) => onProvinceChange(event.target.value)}>
            <option value="">{copy.filters.allProvinces}</option>
            {payload.provinces.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="analytics-control">
          <span>{copy.filters.scope}</span>
          <select value={activeOnly ? "active" : "all"} onChange={(event) => onScopeChange(event.target.value)}>
            <option value="all">{copy.filters.allTime}</option>
            <option value="active">{copy.filters.activeOnly}</option>
          </select>
        </label>
        <div className="analytics-export">
          <button type="button" className="button button-ale" onClick={shareInsights}>
            {copy.export.share}
          </button>
          <button type="button" className="button button-quiet" onClick={downloadJson}>
            {copy.export.downloadJson}
          </button>
          <button type="button" className="button button-quiet" onClick={downloadCsv}>
            {copy.export.downloadCsv}
          </button>
          {shareNote ? <span className="analytics-share-note">{shareNote}</span> : null}
        </div>
      </section>

      <ul className="shell analytics-stat-grid">
        <li>
          <strong>{formatCount(locale, snapshot.overview.activeBreweries)}</strong>
          <span>{copy.stats.activeBreweries}</span>
        </li>
        <li>
          <strong>{formatCount(locale, snapshot.overview.contractBrewers)}</strong>
          <span>{copy.stats.contractBrewers}</span>
        </li>
        <li>
          <strong>{formatCount(locale, snapshot.overview.indexedBeers)}</strong>
          <span>{copy.stats.indexedBeers}</span>
        </li>
        <li>
          <strong>{snapshot.overview.mostPopularStyle ?? copy.stats.unknown}</strong>
          <span>{copy.stats.popularStyle}</span>
        </li>
        <li>
          <strong>
            {oldest ? (
              <Link href={`/${locale}/directory/breweries/${oldest.slug}`}>
                {oldest.name}
                <em>{oldest.year}</em>
              </Link>
            ) : (
              copy.stats.unknown
            )}
          </strong>
          <span>{copy.stats.oldestBrewery}</span>
        </li>
      </ul>

      <section className="shell analytics-grid">
        <article className="analytics-card">
          <h2>{copy.charts.provinces}</h2>
          <p>{copy.charts.provincesHint}</p>
          <HorizontalBarChart
            rows={snapshot.provinces}
            ariaLabel={copy.charts.provinces}
            emptyLabel={copy.charts.empty}
          />
        </article>
        <article className="analytics-card">
          <h2>{copy.charts.cities}</h2>
          <p>{copy.charts.citiesHint}</p>
          <HorizontalBarChart rows={snapshot.cities} ariaLabel={copy.charts.cities} emptyLabel={copy.charts.empty} />
        </article>
        <article className="analytics-card analytics-card-wide">
          <h2>{copy.charts.growth}</h2>
          <p>{copy.charts.growthHint}</p>
          <AreaTimelineChart rows={snapshot.growth} ariaLabel={copy.charts.growth} emptyLabel={copy.charts.empty} />
        </article>
        <article className="analytics-card">
          <h2>{copy.charts.styles}</h2>
          <p>{copy.charts.stylesHint}</p>
          <DonutChart
            rows={snapshot.styleGroups}
            ariaLabel={copy.charts.styles}
            emptyLabel={copy.charts.empty}
            centerLabel={formatCount(locale, snapshot.coverage.beerTotal)}
          />
        </article>
        <article className="analytics-card">
          <h2>{copy.charts.operational}</h2>
          <p>{copy.charts.operationalHint}</p>
          <DonutChart
            rows={operationalRows}
            ariaLabel={copy.charts.operational}
            emptyLabel={copy.charts.empty}
            centerLabel={formatCount(locale, snapshot.coverage.breweryTotal)}
          />
        </article>
        <article className="analytics-card analytics-card-wide">
          <h2>{copy.charts.abv}</h2>
          <p>{copy.charts.abvHint}</p>
          <HistogramChart rows={snapshot.abv} ariaLabel={copy.charts.abv} emptyLabel={copy.charts.empty} />
        </article>
      </section>

      <p className="shell analytics-coverage">
        {copy.coverage
          .replace("{regions}", formatCount(locale, snapshot.coverage.breweriesWithRegion))
          .replace("{founded}", formatCount(locale, snapshot.coverage.breweriesWithFoundedYear))
          .replace("{breweries}", formatCount(locale, snapshot.coverage.breweryTotal))
          .replace("{styles}", formatCount(locale, snapshot.coverage.beersWithStyle))
          .replace("{abv}", formatCount(locale, snapshot.coverage.beersWithAbv))
          .replace("{beers}", formatCount(locale, snapshot.coverage.beerTotal))}
      </p>
    </div>
  );
}
