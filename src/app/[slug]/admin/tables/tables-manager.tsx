"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, QrCode, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QR, qrDataUrl } from "@/components/ui/qr";
import { PageHeader } from "@/components/ui/page-header";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { RestaurantTable } from "@/lib/types";

// A table augmented with the active customer session (if any) and the
// most-recent cleaned_at timestamp. Shape matches what /api/admin/tables
// returns post the occupancy patch.
interface OccupiedSession {
  id: string;
  customer_name: string | null;
  party_size: number | null;
  created_at: string;
  last_active_at: string;
}
interface TableWithStatus extends RestaurantTable {
  occupancy: OccupiedSession | null;
  last_cleaned_at: string | null;
}

export function TablesManager({
  restaurantSlug,
  initialTables,
}: {
  restaurantSlug: string;
  initialTables: TableWithStatus[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState(2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/tables", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setTables(j.tables);
    }
  }

  // Poll every 8 s so the badges stay fresh without the user having to
  // refresh. New diners scanning a table flip the badge to Occupied;
  // staff cleaning a table flips it back to Available. 8 s is a sweet
  // spot — fast enough that an owner watching the floor sees changes
  // promptly, slow enough that the request rate stays trivial.
  useEffect(() => {
    const id = setInterval(() => { reload(); }, 8000);
    return () => clearInterval(id);
  }, []);

  async function markCleaned(t: TableWithStatus) {
    if (!confirm(`Mark Table ${t.code} as cleaned? This ends the current diner's session.`)) return;
    setCleaning(t.id);
    try {
      const res = await fetch("/api/server/clean", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ restaurantSlug, tableCode: t.code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Couldn't mark cleaned");
        return;
      }
      await reload();
    } finally {
      setCleaning(null);
    }
  }

  async function add() {
    if (!code.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim(), label: label || undefined, seats }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Failed");
        return;
      }
      setCode("");
      setLabel("");
      setSeats(2);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete table?")) return;
    await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    await reload();
  }

  function tableUrl(t: RestaurantTable) {
    // Encode the code so any characters (symbols, spaces, mixed case)
    // round-trip safely through the URL path.
    const code = encodeURIComponent(t.code);
    if (typeof window === "undefined") return `/${restaurantSlug}/t/${code}`;
    return `${window.location.origin}/${restaurantSlug}/t/${code}`;
  }

  async function downloadQr(t: RestaurantTable) {
    const url = await qrDataUrl(tableUrl(t));
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${t.code}.png`;
    a.click();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
      <PageHeader
        eyebrow="Floor plan"
        title="Tables & QR codes"
        lede="One row per physical table. Print the QR and place it on the tabletop — diners scan to start ordering, servers scan to mark a table clean."
      />


      <Card>
        <CardHeader><div className="font-semibold">Add a table</div></CardHeader>
        <CardBody className="grid sm:grid-cols-4 gap-2">
          <Input placeholder="Code (e.g. T-12)" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input
            type="number"
            min={1}
            placeholder="Seats"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
          <Button onClick={add} disabled={busy}><Plus className="w-4 h-4" /> Add</Button>
          {err && <div className="sm:col-span-4 text-sm text-red-600">{err}</div>}
        </CardBody>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((t) => {
          const isOccupied = !!t.occupancy;
          return (
            <Card
              key={t.id}
              className={cn(
                // Brass left-edge accent on occupied tables — same
                // hairline language as the Stat tiles, so "live status"
                // reads at a glance even peripherally.
                isOccupied && "border-l-2 border-l-accent"
              )}
            >
              <CardHeader className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{t.code}</div>
                  {t.label && <div className="text-xs text-muted">{t.label}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">{t.seats} seats</div>
                </div>
              </CardHeader>

              {/* Occupancy strip — green dot for available, amber for
                  occupied. When occupied, also show who's there + how
                  long. When clean, show last-cleaned timestamp so the
                  owner knows the table was actively serviced. */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-full",
                      isOccupied ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    aria-hidden
                  />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
                    {isOccupied ? "Occupied" : "Available"}
                  </span>
                  {isOccupied && t.occupancy && (
                    <span className="ml-auto font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                      {formatRelativeTime(t.occupancy.created_at)}
                    </span>
                  )}
                  {!isOccupied && t.last_cleaned_at && (
                    <span className="ml-auto font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                      cleaned {formatRelativeTime(t.last_cleaned_at)}
                    </span>
                  )}
                </div>
                {isOccupied && t.occupancy?.customer_name && (
                  <div className="mt-1.5 text-sm font-display italic text-fg/90">
                    {t.occupancy.customer_name}
                    {t.occupancy.party_size ? (
                      <span className="text-muted not-italic font-mono text-xs ml-2">
                        · party of {t.occupancy.party_size}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <CardBody className="text-center space-y-3">
                <QR value={tableUrl(t)} size={192} className="mx-auto bg-white rounded" />
                <div className="text-xs text-muted break-all">{tableUrl(t)}</div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <a href={tableUrl(t)} target="_blank" rel="noreferrer">
                    <Button type="button" variant="secondary" size="sm">
                      <ExternalLink className="w-4 h-4" /> Open
                    </Button>
                  </a>
                  <Button type="button" variant="secondary" size="sm" onClick={() => downloadQr(t)}>
                    <QrCode className="w-4 h-4" /> Download
                  </Button>
                  {isOccupied && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => markCleaned(t)}
                      disabled={cleaning === t.id}
                    >
                      <Sparkles className="w-4 h-4" />
                      {cleaning === t.id ? "Cleaning…" : "Mark cleaned"}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {tables.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center text-muted py-8">
            No tables yet — add one to generate a QR.
          </div>
        )}
      </div>
    </div>
  );
}
