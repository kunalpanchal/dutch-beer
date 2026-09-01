import type { ReactElement } from "react";

const stout = "#24150f";
const amber = "#d97820";

export function brandIconImage(size: number): ReactElement {
  const markSize = Math.round(size * 0.68);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: stout,
      }}
    >
      <svg
        viewBox="0 0 72 88"
        fill="none"
        width={markSize}
        height={markSize}
        style={{ display: "flex" }}
      >
        <path d="M12 8c5-7 14-8 22-5 7 2 13 2 20-3 1 9-6 16-20 16S11 16 12 8Z" fill={amber} opacity={0.45} />
        <path d="M16 18h28l-2.6 62H18.6L16 18Z" fill={amber} opacity={0.12} />
        <path
          d="M16 18h28l-2.6 62H18.6L16 18Z"
          stroke={amber}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
        <path
          d="M44 30c9 3 14 10 14 18 0 9-5 16-14 19"
          stroke={amber}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
        <path d="M22 42h16M23 54h14" stroke={amber} strokeWidth={1.8} opacity={0.35} />
      </svg>
    </div>
  );
}
