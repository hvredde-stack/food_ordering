import { notFound } from "next/navigation";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { getRestaurantBySlug } from "@/lib/auth";

// Slug gateway. Every URL under /[slug]/... funnels through here so we get
// one place to fail-fast on:
//   - reserved slugs (admin, platform, api, ...) that collide with global
//     routes — those should already 404 via static-segment priority, but
//     the explicit check is a belt-and-suspenders against future slip-ups
//   - non-existent restaurants
//
// Per-page authorization (owner / platform admin) lives on each page,
// since some routes under [slug] are public (customer entry pages /t, /to)
// and others require auth (admin, server, kitchen).
export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return <>{children}</>;
}
