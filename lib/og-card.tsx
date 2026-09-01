import { ImageResponse } from "next/og";
import type { OgCardContent } from "@/lib/og";
import { OG_IMAGE_SIZE } from "@/lib/site";

export function OgCard({ kicker, title, subtitle, meta }: OgCardContent) {
  const titleSize = title.length > 42 ? 52 : title.length > 28 ? 64 : title.length > 18 ? 72 : 84;
  const showBrand = title.toLowerCase() !== "dutch.beer";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px 56px",
        background: "#24150f",
        color: "#fbf4e4",
        borderBottom: "14px solid #ead7a8",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#d97820",
          }}
        >
          {kicker}
        </div>
        {showBrand ? (
          <div style={{ fontSize: 26, color: "#ead7a8", letterSpacing: 1 }}>dutch.beer</div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ marginTop: 18, fontSize: 30, color: "#ead7a8", lineHeight: 1.3 }}>{subtitle}</div>
        ) : null}
        {meta ? <div style={{ marginTop: 16, fontSize: 26, color: "#d97820" }}>{meta}</div> : null}
      </div>
    </div>
  );
}

export function ogImageResponse(card: OgCardContent) {
  return new ImageResponse(<OgCard {...card} />, {
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
  });
}
