"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShoppingBag, Utensils, ExternalLink, QrCode, UserPlus, Trash2, Users, Check } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QR, qrDataUrl } from "@/components/ui/qr";
import { PageHeader } from "@/components/ui/page-header";
import { formatRelativeTime } from "@/lib/utils";
import type { Restaurant, RestaurantStaff } from "@/lib/types";

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
      ? `${window.location.origin}/${r.slug}/to/${r.takeout_code}`
      : `/${r.slug}/to/${r.takeout_code}`;

  async function downloadQr() {
    if (!r.takeout_code) return;
    const url = await qrDataUrl(takeoutUrl);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takeout-qr-${r.slug}.png`;
    a.click();
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        lede="Ordering modes (dine-in vs takeout) and the master takeout QR. Changes save instantly."
        actions={flash && (
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent border-b border-accent pb-1">
            {flash}
          </div>
        )}
      />


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

      <TeamCard />

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

function TeamCard() {
  const [staff, setStaff] = useState<RestaurantStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/staff", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setStaff(j.staff);
    }
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  async function add() {
    const v = email.trim();
    if (!v) {
      setErr("Type an email first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? `Failed (${res.status})`);
        return;
      }
      setEmail("");
      await reload();
    } catch (e) {
      setErr((e as Error)?.message ?? "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string, address: string) {
    if (!confirm(`Remove ${address}? They lose access immediately.`)) return;
    await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <Card>
      <CardHeader>
        <div className="font-semibold inline-flex items-center gap-1.5">
          <Users className="w-4 h-4" /> Team
        </div>
        <div className="text-xs text-muted mt-1">
          Add staff emails to grant them access. Anyone signing in with one
          of these emails (Google or email/password via Clerk) gets the
          same permissions you do — admin, kitchen, server.
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (err) setErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="staff@example.com"
            disabled={busy}
          />
          <Button type="button" onClick={add} disabled={busy}>
            <UserPlus className="w-4 h-4" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
              {busy ? "Adding…" : "Invite"}
            </span>
          </Button>
        </div>
        {err && (
          <div className="text-xs text-red-500 font-mono tracking-wide">
            Couldn't add: {err}
          </div>
        )}

        {loading ? (
          <div className="text-muted font-mono text-[11px] tracking-[0.14em] uppercase">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-muted italic">
            No staff yet — add an email above. They'll be auto-linked the first
            time they sign in.
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.email}</div>
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5">
                    {s.user_id ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> linked
                      </span>
                    ) : (
                      "pending — they haven't signed in yet"
                    )}
                    <span className="mx-1.5 opacity-50">·</span>
                    invited {formatRelativeTime(s.created_at)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(s.id, s.email)}
                  className="text-muted hover:text-red-500 transition shrink-0"
                  aria-label={`Revoke ${s.email}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
      <CardFooter className="text-xs text-muted">
        Make sure email/password sign-in is enabled in your Clerk dashboard
        (User & Authentication → Email, Phone, Username) so staff who don't
        have a Google account can still sign in.
      </CardFooter>
    </Card>
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
