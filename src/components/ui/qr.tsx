"use client";

// Client-rendered QR code. Beats third-party APIs for reliability and
// scan quality (we control error correction, margin, and resolution).

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  /** URL or text to encode. Required. */
  value: string;
  /** Pixel size of the rendered <img>. The bitmap is generated at higher res for crispness. */
  size?: number;
  className?: string;
  alt?: string;
}

// Default options tuned for on-screen scanning by phone cameras.
//   - errorCorrectionLevel "M" (~15%): keeps the QR sparse, so each module
//     stays large enough at small display sizes. We don't need "H" for
//     digital display — that's for damaged printed media.
//   - margin 4: the quiet zone every QR scanner needs to find the code.
//   - width 1024: high source resolution so it stays crisp when scaled.
const QR_OPTS = {
  errorCorrectionLevel: "M" as const,
  margin: 4,
  width: 1024,
  color: { dark: "#000000", light: "#ffffff" },
};

export function QR({ value, size = 280, className, alt = "QR code" }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, QR_OPTS)
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => { if (!cancelled) setDataUrl(null); });
    return () => { cancelled = true; };
  }, [value]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: "#f4f4f5", borderRadius: 8 }}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * Returns a data URL for the QR. Used when we want a downloadable PNG link.
 * Uses higher error correction since the result is meant to be printed.
 */
export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    ...QR_OPTS,
    errorCorrectionLevel: "H", // ~30% — robust against print imperfections.
  });
}
