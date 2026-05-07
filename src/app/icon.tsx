import { ImageResponse } from "next/og";

// Brand mark — a "plate from above" silhouette in brass on warm walnut.
// Universal restaurant symbol that survives rebranding (no letters), so we
// don't need to regenerate when the wordmark changes.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "6px solid #C9A76E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#C9A76E",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
