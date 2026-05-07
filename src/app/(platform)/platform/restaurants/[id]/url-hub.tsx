"use client";

// One-stop list of every URL associated with a single tenant. Platform
// admins copy these to share with restaurant owners or paste into
// printed materials.

import { useState } from "react";
import {
  Copy, Check, ExternalLink, ShieldCheck, Hammer, ChefHat, Utensils, ShoppingBag, Eye,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QR, qrDataUrl } from "@/components/ui/qr";

interface Table { id: string; code: string; label: string | null; seats: number }

export function UrlHub({
  slug,
  takeoutCode,
  dineInEnabled,
  takeoutEnabled,
  tables,
}: {
  slug: string;
  takeoutCode: string | null;
  dineInEnabled: boolean;
  takeoutEnabled: boolean;
  tables: Table[];
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const staffAdmin   = `${origin}/admin`;
  const staffServer  = `${origin}/server`;
  const staffKitchen = `${origin}/kitchen/${slug}`;
  const customerTakeout = takeoutCode ? `${origin}/to/${slug}/${takeoutCode}` : null;

  return (
    <Card>
      <CardHeader>
        <div className="font-semibold">All URLs for this restaurant</div>
        <div className="text-xs text-muted">
          Copy or share these. Staff URLs (#1–3) require the owner to be signed in via Clerk.
        </div>
      </CardHeader>

      <div className="divide-y divide-border">
        <UrlRow
          n={1}
          icon={<ShieldCheck className="w-4 h-4" />}
          title="Restaurant admin"
          subtitle="Owner signs in here to manage menu, tables, settings."
          url={staffAdmin}
          note="Auto-detects which restaurant from the signed-in Clerk user."
        />
        <UrlRow
          n={2}
          icon={<Hammer className="w-4 h-4" />}
          title="Server app"
          subtitle="Staff scan a table QR to mark it cleaned."
          url={staffServer}
          note="Auto-detects restaurant from the signed-in Clerk user."
        />
        <UrlRow
          n={3}
          icon={<ChefHat className="w-4 h-4" />}
          title="Kitchen dashboard"
          subtitle="Real-time order queue. Staff sign in with Clerk."
          url={staffKitchen}
        />

        {/* Customer dine-in: one URL per table */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <Utensils className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm flex items-center gap-2">
                4. Customer dine-in
                {!dineInEnabled && (
                  <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">disabled</span>
                )}
              </div>
              <div className="text-xs text-muted">One URL per table. Print as a QR on each tabletop.</div>
            </div>
          </div>
          {tables.length === 0 ? (
            <div className="text-xs text-muted ml-6">
              No tables yet — owner adds them in Restaurant admin → Tables.
            </div>
          ) : (
            <div className="grid gap-2 ml-6 sm:grid-cols-2">
              {tables.map((t) => (
                <CustomerUrlCard
                  key={t.id}
                  label={`Table ${t.code}${t.label ? ` (${t.label})` : ""}`}
                  url={`${origin}/t/${slug}/${encodeURIComponent(t.code)}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Customer takeout */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <ShoppingBag className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm flex items-center gap-2">
                5. Customer takeout
                {!takeoutEnabled && (
                  <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">disabled</span>
                )}
              </div>
              <div className="text-xs text-muted">Master takeout QR — one per restaurant.</div>
            </div>
          </div>
          {customerTakeout ? (
            <div className="ml-6">
              <CustomerUrlCard label="Takeout pickup" url={customerTakeout} />
            </div>
          ) : (
            <div className="text-xs text-muted ml-6">No takeout code generated yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function UrlRow({
  n,
  icon,
  title,
  subtitle,
  url,
  note,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  url: string;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            {n}. {title}
          </div>
          <div className="text-xs text-muted">{subtitle}</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-xs px-2 py-1 rounded bg-muted flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {url}
            </code>
            <Button size="sm" variant="secondary" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <a href={url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
          {note && <div className="text-[11px] text-muted mt-1">{note}</div>}
        </div>
      </div>
    </div>
  );
}

function CustomerUrlCard({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function downloadQr() {
    const data = await qrDataUrl(url);
    const a = document.createElement("a");
    a.href = data;
    a.download = `${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`;
    a.click();
  }
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <QR value={url} size={120} className="bg-white rounded shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <code className="text-[10px] text-muted block mt-1 break-all">{url}</code>
          <div className="flex gap-1 mt-2">
            <Button size="sm" variant="secondary" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadQr}>
              <span className="text-xs">PNG</span>
            </Button>
            <a href={url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
