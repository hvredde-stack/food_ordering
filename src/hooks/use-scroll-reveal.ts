"use client";

// Tiny IntersectionObserver wrapper. Adds `.visible` to elements with
// the `.observe` class as they scroll into view. Pair with the CSS in
// globals.css (.observe → starts hidden, .visible → animates in).
//
// One observer for the whole page is cheaper than per-component effects.

import { useEffect } from "react";

export function useScrollReveal(rootSelector?: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reveal everything immediately for users who don't want motion.
      document.querySelectorAll(".observe").forEach((el) => el.classList.add("visible"));
      return;
    }

    const root: HTMLElement | null = rootSelector
      ? document.querySelector(rootSelector)
      : null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05, root }
    );

    const targets = (root ?? document).querySelectorAll(".observe");
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [rootSelector]);
}
