import { ImageResponse } from "next/og";

// iOS home-screen tile. iOS auto-rounds corners and ignores transparency, so
// we render with an opaque walnut background. 180×180 is the standard
// apple-touch-icon size used by all current iPhones and iPads.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            width: 112,
            height: 112,
            borderRadius: "50%",
            border: "6px solid #C9A76E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
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
