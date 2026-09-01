import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 14,
            height: 22,
            border: "2.5px solid #d97820",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            background: "rgba(217, 120, 32, 0.15)",
          }}
        />
      </div>
    ),
    size,
  );
}
