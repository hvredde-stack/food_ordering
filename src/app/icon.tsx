import { ImageResponse } from "next/og";

// Brand mark for the favicon / manifest 192px size. Brass hairline outer
// square + filled inner square on warm walnut, matching the foil-stamp
// lockup. PWA host platforms (iOS / Android) apply their own corner
// rounding to the tile, so we render an unrounded walnut bg here.
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
            width: 96,
            height: 96,
            border: "5px solid #C9A76E",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
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
