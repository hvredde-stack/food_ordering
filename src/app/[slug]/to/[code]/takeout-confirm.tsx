"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// See note in table-confirm.tsx — same reasoning. CartProvider isn't in
// scope here (entry pages live under /[slug]/, not under (customer)),
// so we touch the localStorage key directly.
const CART_STORAGE_KEY = "ts_cart_v2";

export function TakeoutConfirm({
  restaurantSlug,
  takeoutCode,
}: {
  restaurantSlug: string;
  takeoutCode: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    if (!name.trim()) {
      setErr("Please enter your name.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "takeout",
          restaurantSlug,
          takeoutCode,
          customerName: name.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Could not start session");
        return;
      }
      // Fresh session = fresh cart. Prevents items from a previous
      // dine-in or takeout scan in the same browser from leaking in.
      try { localStorage.removeItem(CART_STORAGE_KEY); } catch {}
      router.push("/menu");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardBody className="space-y-3">
        <label className="block">
          <span className="text-xs text-muted">Your name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1"
            autoFocus
          />
        </label>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <Button size="lg" className="w-full mt-2" onClick={start} disabled={busy}>
          {busy ? "Starting…" : "View menu"}
        </Button>
      </CardBody>
    </Card>
  );
}
