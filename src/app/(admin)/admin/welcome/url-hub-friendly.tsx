"use client";

// A simpler URL list designed for the restaurant owner (vs. the platform
// admin's tearsheet). Plain English labels, copy-to-clipboard, downloadable
// QR PNGs for the customer URLs.

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QR, qrDataUrl } from "@/components/ui/qr";

interface Table { id: string; code: string; label: string | null; seats: number }

export function UrlHubFriendly({
  slug,
  takeoutCode,
  tables,
}: {
  slug: string;
  takeoutCode: string | null;
  tables: Table[];
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="space-y-8">
      {/* Staff URLs — short, no QRs needed (staff sign in by URL) */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          For you & your team
        </div>
        <div className="mt-3 space-y-2">
          <StaffRow
            title="Restaurant admin"
            desc="Sign in to manage your menu, tables, and settings."
            url={`${origin}/admin`}
          />
          <StaffRow
            title="Server app"
            desc="Your servers scan a table's QR to mark it cleaned."
            url={`${origin}/server`}
          />
          <StaffRow
            title="Kitchen dashboard"
            desc="Live order queue. Mark items preparing → ready → served."
            url={`${origin}/kitchen/${slug}`}
          />
        </div>
      </div>

      {/* Customer URLs — printable QRs */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          For your customers (print these)
        </div>

        {tables.length > 0 && (
          <div className="mt-3">
            <div className="font-display text-lg tracking-tight">Dine-in QR codes</div>
            <div className="text-xs text-muted mt-1 mb-4">
              One per table — print and place on the table.
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {tables.map((t) => (
                <CustomerCard
                  key={t.id}
                  label={`Table ${t.code}`}
                  filename={`qr-table-${t.code}`}
                  url={`${origin}/t/${slug}/${encodeURIComponent(t.code)}`}
                />
              ))}
            </div>
          </div>
        )}

        {takeoutCode && (
          <div className="mt-8">
            <div className="font-display text-lg tracking-tight">Takeout QR</div>
            <div className="text-xs text-muted mt-1 mb-4">
              Place this at your pickup counter or share it online.
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <CustomerCard
                label="Takeout pickup"
                filename={`qr-takeout-${slug}`}
                url={`${origin}/to/${slug}/${takeoutCode}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StaffRow({
  title, desc, url,
}: {
  title: string; desc: string; url: string;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Card>
      <CardBody className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display text-base tracking-tight">{title}</div>
          <div className="text-xs text-muted mt-1">{desc}</div>
          <code className="font-mono text-xs text-muted block mt-2 truncate">{url}</code>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Link href={url} target="_blank">
            <Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function CustomerCard({
  label, filename, url,
}: {
  label: string; filename: string; url: string;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function download() {
    const data = await qrDataUrl(url);
    const a = document.createElement("a");
    a.href = data;
    a.download = `${filename}.png`;
    a.click();
  }
  return (
    <Card>
      <CardBody className="p-4 flex items-start gap-3">
        <QR value={url} size={108} className="bg-white rounded shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-base tracking-tight">{label}</div>
          <code className="font-mono text-[10px] text-muted block mt-1 break-all">{url}</code>
          <div className="flex gap-1 mt-3">
            <Button size="sm" variant="secondary" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 font-mono text-[10px] tracking-wider">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={download}>
              <span className="font-mono text-[10px] tracking-wider">PNG</span>
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
