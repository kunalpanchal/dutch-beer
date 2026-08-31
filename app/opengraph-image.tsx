import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dutch.beer — a directory of Dutch beer";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#24150f",
          color: "#fbf4e4",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#d97820" }}>
          The Netherlands
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>dutch.beer</div>
          <div style={{ marginTop: 18, fontSize: 32, color: "#ead7a8" }}>A directory of Dutch breweries and beers.</div>
        </div>
      </div>
    ),
    size,
  );
}
