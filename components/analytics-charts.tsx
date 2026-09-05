import type { NamedCount } from "@/lib/catalog/analytics";

const CHART_COLORS = ["#c45e12", "#d97820", "#b07a2a", "#3a2418", "#6d5344", "#8a5a28", "#24150f"];

function maxCount(rows: NamedCount[]): number {
  return Math.max(1, ...rows.map((row) => row.count));
}

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function donutSlicePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polar(cx, cy, outerRadius, startAngle);
  const outerEnd = polar(cx, cy, outerRadius, end);
  const innerEnd = polar(cx, cy, innerRadius, end);
  const innerStart = polar(cx, cy, innerRadius, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function labelStep(count: number, minPx: number, available: number): number {
  if (count <= 1) return 1;
  const spacing = available / Math.max(count - 1, 1);
  return Math.max(1, Math.ceil(minPx / spacing));
}

export function HorizontalBarChart({
  rows,
  ariaLabel,
  emptyLabel,
}: {
  rows: NamedCount[];
  ariaLabel: string;
  emptyLabel: string;
}) {
  if (!rows.length || rows.every((row) => row.count === 0)) {
    return <p className="analytics-empty">{emptyLabel}</p>;
  }
  const max = maxCount(rows);
  return (
    <ul className="analytics-hbar" aria-label={ariaLabel}>
      {rows.map((row, index) => {
        const width = Math.max(4, Math.round((row.count / max) * 100));
        return (
          <li key={row.name}>
            <div className="analytics-hbar-meta">
              <span className="analytics-hbar-name">{row.name}</span>
              <span className="analytics-hbar-count">{row.count}</span>
            </div>
            <div className="analytics-hbar-track" aria-hidden="true">
              <span
                className="analytics-hbar-fill"
                style={{
                  width: `${width}%`,
                  background: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AreaTimelineChart({
  rows,
  ariaLabel,
  emptyLabel,
}: {
  rows: NamedCount[];
  ariaLabel: string;
  emptyLabel: string;
}) {
  if (!rows.length || rows.every((row) => row.count === 0)) {
    return <p className="analytics-empty">{emptyLabel}</p>;
  }
  const width = 720;
  const height = 260;
  const padX = 36;
  const padTop = 20;
  const padBottom = 56;
  const max = maxCount(rows);
  const plotWidth = width - padX * 2;
  const plotHeight = height - padTop - padBottom;
  const step = rows.length === 1 ? 0 : plotWidth / (rows.length - 1);
  const tickEvery = labelStep(rows.length, 52, plotWidth);
  const points = rows.map((row, index) => {
    const x = padX + index * step;
    const y = padTop + plotHeight - (row.count / max) * plotHeight;
    return { x, y, ...row };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${padTop + plotHeight} ${line} ${points.at(-1)!.x},${padTop + plotHeight}`;

  return (
    <div className="analytics-svg-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="analytics-svg analytics-svg-plot"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97820" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d97820" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padTop + plotHeight - fraction * plotHeight;
          return (
            <line
              key={fraction}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(36,21,15,0.12)"
              strokeWidth="1"
            />
          );
        })}
        <polygon points={area} fill="url(#growthFill)" />
        <polyline points={line} fill="none" stroke="#c45e12" strokeWidth="3" strokeLinejoin="round" />
        {points.map((point, index) => {
          const showLabel = index === 0 || index === points.length - 1 || index % tickEvery === 0;
          return (
            <g key={point.name}>
              <circle cx={point.x} cy={point.y} r="4" fill="#24150f">
                <title>{`${point.name}: ${point.count}`}</title>
              </circle>
              {showLabel ? (
                <text
                  x={point.x}
                  y={height - 14}
                  textAnchor="end"
                  className="analytics-svg-label"
                  transform={`rotate(-40 ${point.x} ${height - 14})`}
                >
                  {point.name}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({
  rows,
  ariaLabel,
  emptyLabel,
  centerLabel,
}: {
  rows: NamedCount[];
  ariaLabel: string;
  emptyLabel: string;
  centerLabel?: string;
}) {
  const active = rows.filter((row) => row.count > 0);
  if (!active.length) return <p className="analytics-empty">{emptyLabel}</p>;

  const total = active.reduce((sum, row) => sum + row.count, 0);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 78;
  const innerRadius = 46;
  const slices = active.reduce<
    Array<NamedCount & { startAngle: number; endAngle: number; color: string }>
  >((acc, row, index) => {
    const startAngle = acc.at(-1)?.endAngle ?? 0;
    const endAngle = startAngle + (row.count / total) * 360;
    return [
      ...acc,
      {
        ...row,
        startAngle,
        endAngle,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ];
  }, []);

  return (
    <div className="analytics-donut">
      <div className="analytics-donut-visual">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
          className="analytics-svg analytics-svg-donut"
          preserveAspectRatio="xMidYMid meet"
        >
          {slices.map((slice) => (
            <path
              key={slice.name}
              d={donutSlicePath(cx, cy, outerRadius, innerRadius, slice.startAngle, slice.endAngle)}
              fill={slice.color}
            >
              <title>{`${slice.name}: ${slice.count}`}</title>
            </path>
          ))}
          {centerLabel ? (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="analytics-donut-center">
              {centerLabel}
            </text>
          ) : null}
        </svg>
      </div>
      <ul className="analytics-legend">
        {slices.map((slice) => (
          <li key={slice.name}>
            <span className="analytics-legend-swatch" style={{ background: slice.color }} aria-hidden="true" />
            <span className="analytics-legend-copy">
              <span className="analytics-legend-name">{slice.name}</span>
              <span className="analytics-legend-meta">
                <strong>{slice.count}</strong>
                <em>{Math.round((slice.count / total) * 100)}%</em>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistogramChart({
  rows,
  ariaLabel,
  emptyLabel,
}: {
  rows: NamedCount[];
  ariaLabel: string;
  emptyLabel: string;
}) {
  if (!rows.length || rows.every((row) => row.count === 0)) {
    return <p className="analytics-empty">{emptyLabel}</p>;
  }
  const max = maxCount(rows);
  const width = 640;
  const height = 240;
  const padX = 20;
  const padTop = 28;
  const padBottom = 44;
  const gap = 16;
  const plotHeight = height - padTop - padBottom;
  const barWidth = (width - padX * 2 - gap * (rows.length - 1)) / rows.length;

  return (
    <div className="analytics-svg-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="analytics-svg analytics-svg-plot"
        preserveAspectRatio="xMidYMid meet"
      >
        {rows.map((row, index) => {
          const barHeight = row.count ? Math.max(4, (row.count / max) * plotHeight) : 0;
          const x = padX + index * (barWidth + gap);
          const y = padTop + plotHeight - barHeight;
          const labelX = x + barWidth / 2;
          return (
            <g key={row.name}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                rx="2"
              >
                <title>{`${row.name}: ${row.count}`}</title>
              </rect>
              <text x={labelX} y={y - 8} textAnchor="middle" className="analytics-svg-value">
                {row.count}
              </text>
              <text x={labelX} y={height - 14} textAnchor="middle" className="analytics-svg-label">
                {row.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
