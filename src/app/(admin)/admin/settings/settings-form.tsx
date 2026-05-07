"use client";

import { useState } from "react";
import { RefreshCw, ShoppingBag, Utensils, ExternalLink, QrCode } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QR, qrDataUrl } from "@/components/ui/qr";
import type { Restaurant } from "@/lib/types";

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [r, setR] = useState(restaurant);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/restaurant", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setFlash(`Error: ${j.error ?? "Failed"}`);
        return;
      }
      const j = await res.json();
      setR(j.restaurant);
      setFlash("Saved.");
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 2400);
    }
  }

  const takeoutUrl =
    typeof window !== "undefined" && r.takeout_code
      ? `${window.location.origin}/to/${r.slug}/${r.takeout_code}`
      : `/to/${r.slug}/${r.takeout_code}`;

  async function downloadQr() {
    if (!r.takeout_code) return;
    const url = await qrDataUrl(takeoutUrl);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takeout-qr-${r.slug}.png`;
    a.click();
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted">Ordering modes and the master takeout QR.</p>
        </div>
        {flash && (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-md">{flash}</div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="font-semibold">Ordering modes</div>
          <div className="text-xs text-muted">Toggle dine-in and takeout independently.</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <ToggleRow
            icon={<Utensils className="w-4 h-4" />}
            label="Dine-in"
            description="Customers scan a per-table QR to order from their seat."
            checked={r.dine_in_enabled}
            onChange={(v) => patch({ dine_in_enabled: v })}
            busy={busy}
          />
          <ToggleRow
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Takeout"
            description="Customers scan a master QR to order for pickup."
            checked={r.takeout_enabled}
            onChange={(v) => patch({ takeout_enabled: v })}
            busy={busy}
          />
        </CardBody>
      </Card>

      {r.takeout_enabled && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <div className="font-semibold inline-flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Master takeout QR
              </div>
              <div className="text-xs text-muted">
                One QR code for all takeout orders. Print it at the counter.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (confirm("Regenerate? Old printed QRs will stop working.")) {
                  patch({ regenerate_takeout_code: true });
                }
              }}
              disabled={busy}
            >
              <RefreshCw className="w-4 h-4" /> Regenerate
            </Button>
          </CardHeader>
          {r.takeout_code ? (
            <CardBody className="text-center space-y-3">
              <QR value={takeoutUrl} size={280} className="mx-auto bg-white rounded" />
              <div className="text-xs text-muted break-all">{takeoutUrl}</div>
              <div className="flex gap-2 justify-center">
                <a href={takeoutUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="w-4 h-4" /> Preview
                  </Button>
                </a>
                <Button variant="secondary" size="sm" onClick={downloadQr}>
                  <QrCode className="w-4 h-4" /> Download
                </Button>
              </div>
            </CardBody>
          ) : (
            <CardBody>
              <Button onClick={() => patch({ regenerate_takeout_code: true })} disabled={busy}>
                Generate takeout code
              </Button>
            </CardBody>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="font-semibold">Restaurant details</div>
        </CardHeader>
        <CardBody className="text-sm space-y-1">
          <div><span className="text-muted">Name:</span> {r.name}</div>
          <div>
            <span className="text-muted">Slug:</span>{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">{r.slug}</code>
          </div>
          <div><span className="text-muted">Currency:</span> {r.currency}</div>
        </CardBody>
        <CardFooter className="text-xs text-muted">
          Slug-rename and currency editing not exposed in v1; ping the schema directly if needed.
        </CardFooter>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  busy,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  busy: boolean;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg cursor-pointer">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={busy}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 mt-1"
      />
    </label>
  );
}
