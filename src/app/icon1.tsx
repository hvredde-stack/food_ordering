import { ImageResponse } from "next/og";

// Larger size for the manifest — Android's PWA install criteria look for at
// least one icon at 512x512.
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
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "16px solid #C9A76E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
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
