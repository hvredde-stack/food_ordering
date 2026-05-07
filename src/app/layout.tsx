import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

// Display — editorial serif. Italic available; weights for hero scale.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

// Body — neutral, generous on size and line-height per editorial spec.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Mono — for prices, codes, tags. Sparingly.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Food Ordering",
  description: "Multi-tenant restaurant ordering platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}
      >
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
