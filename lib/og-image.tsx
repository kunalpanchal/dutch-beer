import type { ReactNode } from "react";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export const ogColors = {
  background: "#24150f",
  foreground: "#fbf4e4",
  accent: "#d97820",
  muted: "#ead7a8",
  subtle: "#a8896a",
} as const;

export function OgShell({
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: ogColors.background,
        color: ogColors.foreground,
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: ogColors.accent,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: title.length > 40 ? 56 : title.length > 28 ? 68 : 84, fontWeight: 700, lineHeight: 1.05 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 32, color: ogColors.muted, lineHeight: 1.35, maxWidth: 960 }}>{subtitle}</div>
        ) : null}
        {footer}
      </div>
      <div style={{ fontSize: 24, color: ogColors.subtle, letterSpacing: 1 }}>dutch.beer</div>
    </div>
  );
}
