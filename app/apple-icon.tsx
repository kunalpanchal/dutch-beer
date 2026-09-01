import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#24150f",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 72,
            height: 112,
            border: "8px solid #d97820",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            background: "rgba(217, 120, 32, 0.15)",
          }}
        />
      </div>
    ),
    size,
  );
}
