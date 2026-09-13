import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#14100B",
        color: "#FAF7F1",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 8, color: "#E8500A", fontWeight: 700 }}>
        THE RESEARCH COMPASS
      </div>
      <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.05, marginTop: 16 }}>
        Explore the world&apos;s research.
      </div>
      <div style={{ fontSize: 30, opacity: 0.65, marginTop: 20, fontFamily: "system-ui, sans-serif" }}>
        Papers · Researchers · Institutions · Trends — Emergent.
      </div>
    </div>,
    { ...size },
  );
}
