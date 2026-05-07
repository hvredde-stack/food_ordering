import { ImageResponse } from "next/og";

// 512×512 — the size Android Chrome's PWA install criteria expect.
// Proportions match public/brand/tapserve-app-icon.svg exactly so the
// PWA tile, the marketing seal, and the in-product Logo component all
// share one identity.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon1() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A1410",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 256,
            height: 256,
            border: "13px solid #C9A76E",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              background: "#C9A76E",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
