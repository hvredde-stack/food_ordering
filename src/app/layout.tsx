import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SwRegister } from "@/components/sw-register";

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
  title: "TapServe",
  description: "Order from your table or for takeout — no app, no sign-up. Scan, tap, eat.",
  applicationName: "TapServe",
  appleWebApp: {
    capable: true,
    title: "TapServe",
    // Translucent so the dark walnut bg flows under the iOS status bar in
    // standalone mode. Pair with viewportFit: "cover" below.
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

// themeColor + viewport were moved off Metadata in Next.js 14. viewportFit
// "cover" is what unlocks safe-area insets on iPhone notch/home-indicator
// devices when launched from the home screen.
export const viewport: Viewport = {
  themeColor: "#1A1410",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}
      >
        <body className="min-h-screen antialiased">
          {children}
          <SwRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
