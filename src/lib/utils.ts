import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString();
}

export function statusTone(status: string): string {
  switch (status) {
    case "pending":   return "bg-amber-100 text-amber-800 border-amber-200";
    case "preparing": return "bg-blue-100 text-blue-800 border-blue-200";
    case "ready":     return "bg-green-100 text-green-800 border-green-200";
    case "served":    return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "cancelled": return "bg-red-100 text-red-800 border-red-200";
    default:          return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}
