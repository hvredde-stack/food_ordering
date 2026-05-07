"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/customer/cart-provider";

export function TableConfirm({
  restaurantSlug,
  tableCode,
}: {
  restaurantSlug: string;
  tableCode: string;
}) {
  const router = useRouter();
  const cart = useCart();
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "dine-in",
          restaurantSlug,
          tableCode,
          customerName: name || undefined,
          partySize: partySize ? Number(partySize) : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Could not start session");
        return;
      }
      // New session means a new diner — wipe any cart left over from a
      // previous scan in this browser. Without this, items added while
      // visiting Table 03's QR would carry over to Table 04 if both
      // QRs were scanned from the same phone. The order would still
      // tag with the new table, but the items the diner sees in the
      // cart aren't the ones they actually picked.
      cart.clear();
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
          <span className="text-xs text-muted">Your name (optional)</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Party size (optional)</span>
          <Input
            type="number"
            min={1}
            max={50}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder="2"
            className="mt-1"
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
