"use client";

import { useState } from "react";
import { Plus, Trash2, QrCode, ExternalLink } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RestaurantTable } from "@/lib/types";

export function TablesManager({
  restaurantSlug,
  initialTables,
}: {
  restaurantSlug: string;
  initialTables: RestaurantTable[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState(2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/tables", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setTables(j.tables);
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
    if (typeof window === "undefined") return `/t/${restaurantSlug}/${t.code}`;
    return `${window.location.origin}/t/${restaurantSlug}/${t.code}`;
  }

  function qrSrc(t: RestaurantTable) {
    const url = tableUrl(t);
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=300x300&margin=10`;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tables</h1>
        <p className="text-sm text-muted">
          Create a row per physical table. Print the QR — customers scan to start ordering, servers scan to clean.
        </p>
      </div>

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
        {tables.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{t.code}</div>
                {t.label && <div className="text-xs text-muted">{t.label}</div>}
              </div>
              <div className="text-xs text-muted">{t.seats} seats</div>
            </CardHeader>
            <CardBody className="text-center space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc(t)} alt={`QR for ${t.code}`} className="mx-auto w-40 h-40 bg-muted rounded" />
              <div className="flex gap-2 justify-center">
                <a href={tableUrl(t)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="w-4 h-4" /> Open
                  </Button>
                </a>
                <a href={qrSrc(t)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <QrCode className="w-4 h-4" /> QR
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
        {tables.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center text-muted py-8">
            No tables yet — add one to generate a QR.
          </div>
        )}
      </div>
    </div>
  );
}
