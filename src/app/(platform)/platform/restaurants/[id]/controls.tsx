"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RestaurantControls({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: "active" | "suspended";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function setNew(next: "active" | "suspended") {
    if (next === "suspended" && !confirm("Suspend this restaurant? Customers can no longer place orders.")) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/platform/restaurants/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Failed");
        return;
      }
      setStatus(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs px-2 py-0.5 rounded-md border ${
          status === "active"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-amber-50 text-amber-800 border-amber-200"
        }`}
      >
        {status}
      </span>
      {status === "active" ? (
        <Button variant="secondary" size="sm" onClick={() => setNew("suspended")} disabled={busy}>
          Suspend
        </Button>
      ) : (
        <Button size="sm" onClick={() => setNew("active")} disabled={busy}>
          Reactivate
        </Button>
      )}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
