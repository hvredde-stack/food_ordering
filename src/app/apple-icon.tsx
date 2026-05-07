import { ImageResponse } from "next/og";

// iOS home-screen tile. iOS auto-rounds corners and ignores transparency,
// so we render with an opaque walnut background. 180×180 is the standard
// apple-touch-icon size. Mark proportions are scaled from the 512px
// app-icon canvas so all sizes share one silhouette.
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
            width: 90,
            height: 90,
            border: "5px solid #C9A76E",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: "#C9A76E",
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
