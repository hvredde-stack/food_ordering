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

export function QR({ value, size = 240, className, alt = "QR code" }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      // 'H' = highest error correction (~30%), so the QR scans even when
      // partially obscured or printed on imperfect paper.
      errorCorrectionLevel: "H",
      // 4 modules of quiet zone — required for most camera scanners.
      margin: 4,
      // Render at a high pixel density so on-screen and printed scans are crisp.
      width: 1024,
      color: { dark: "#000000", light: "#ffffff" },
    })
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
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/**
 * Returns a data URL for the QR. Used when we want a downloadable PNG link.
 */
export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 1024,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
