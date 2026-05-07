"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/**
 * Mount once anywhere in a route's tree. Activates the IntersectionObserver
 * that reveals every `.observe` element as it scrolls into view.
 */
export function ScrollRevealInit() {
  useScrollReveal();
  return null;
}
