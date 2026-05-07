"use client";

// Server app — staff-facing screen for marking tables cleaned. The
// primary UX is a dropdown picker (most restaurants have 2–20 tables;
// scrolling through individual cards on a phone is friction). The
// camera-based QR scanner is kept as a fallback for staff who prefer
// to scan, hidden behind a "Or scan a QR" toggle so it doesn't
// dominate the screen.

import { useEffect, useRef, useState } from "react";
import { Sparkles, Camera, X, Check, ChevronDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, cn } from "@/lib/utils";

interface OccupiedSession {
  id: string;
  customer_name: string | null;
  party_size: number | null;
  created_at: string;
}
interface TableWithStatus {
  id: string;
  code: string;
  label: string | null;
  seats: number;
  occupancy: OccupiedSession | null;
  last_cleaned_at: string | null;
}

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

interface Props {
  restaurantSlug: string;
  restaurantName: string;
  staffDisplayName: string;
  initialTables: TableWithStatus[];
}

export function ServerApp({
  restaurantSlug,
  restaurantName,
  staffDisplayName,
  initialTables,
}: Props) {
  const [tables, setTables] = useState(initialTables);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // QR scanner refs — only used when the scanner is expanded.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);

  async function reload() {
    const res = await fetch("/api/admin/tables", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setTables(j.tables);
    }
  }

  // Refresh statuses every 8 s so the dropdown reflects what's happening
  // on the floor in near-real-time. Staff who leave this page open all
  // shift won't go stale.
  useEffect(() => {
    const id = setInterval(reload, 8000);
    return () => clearInterval(id);
  }, []);

  // Tear down the camera if the component unmounts mid-scan.
  useEffect(() => () => { scannerRef.current?.stop?.().catch(() => {}); }, []);

  const selected = tables.find((t) => t.id === selectedId) ?? null;

  async function clean(tableCode: string) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/server/clean", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          tableCode,
          staffName: staffDisplayName,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: j.error ?? "Failed to clean table" });
        return;
      }
      setResult({
        ok: true,
        message: `Table ${j.table.code} cleaned · ${j.sessionsCleared} session${j.sessionsCleared === 1 ? "" : "s"} ended.`,
      });
      // Reset the picker to neutral; reload statuses so the just-cleaned
      // table flips visibly to Available without waiting for the poll.
      setSelectedId("");
      await reload();
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  // Match either the new slug-first URL (/<slug>/t/<code>) or the
  // pre-refactor /t/<slug>/<code> form for backward compat — printed
  // QR codes in the wild may still use the old layout, and the
  // 301 redirect would normally rewrite them, but the QR scanner
  // captures the raw decoded text before any redirect happens.
  function parseTableUrl(url: string): { slug: string; code: string } | null {
    try {
      const u = new URL(url, window.location.origin);
      const newForm = u.pathname.match(/^\/([^/]+)\/t\/([^/]+)\/?$/);
      if (newForm) {
        return { slug: decodeURIComponent(newForm[1]), code: decodeURIComponent(newForm[2]) };
      }
      const oldForm = u.pathname.match(/^\/t\/([^/]+)\/([^/]+)\/?$/);
      if (oldForm) {
        return { slug: decodeURIComponent(oldForm[1]), code: decodeURIComponent(oldForm[2]) };
      }
      return null;
    } catch {
      return null;
    }
  }

  async function startScanner() {
    setResult(null);
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    if (!containerRef.current) return;
    const scanner = new Html5Qrcode("server-scanner");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decoded) => {
          const parsed = parseTableUrl(decoded);
          if (!parsed) return;
          if (parsed.slug !== restaurantSlug) {
            await scanner.stop().catch(() => {});
            setScanning(false);
            setResult({ ok: false, message: "That QR is for a different restaurant." });
            return;
          }
          await scanner.stop().catch(() => {});
          setScanning(false);
          await clean(parsed.code);
        },
        () => { /* ignore per-frame errors */ }
      );
    } catch (err) {
      setScanning(false);
      setResult({ ok: false, message: `Camera error: ${(err as Error).message}` });
    }
  }

  async function stopScanner() {
    try { await scannerRef.current?.stop(); } catch {}
    setScanning(false);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
        Server · {restaurantSlug}
      </div>
      <h1 className="font-display font-light text-4xl md:text-5xl tracking-tight mt-3 leading-[1.05]">
        {restaurantName}
      </h1>
      <p className="text-sm text-muted mt-3">
        Signed in as <span className="text-fg">{staffDisplayName}</span>. Pick
        a table to mark cleaned and reset its QR for the next party.
      </p>

      {/* Primary action: pick a table from the dropdown. */}
      <Card className="mt-6">
        <CardHeader>
          <div className="font-semibold">Mark a table cleaned</div>
          <div className="text-xs text-muted mt-1">
            Cleaning ends the diner's session and frees the QR for the next party.
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
              Table
            </span>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
              className="mt-2 h-12 w-full rounded-lg border border-border bg-card px-3 text-base font-medium"
            >
              <option value="">— Select a table —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {`Table ${t.code}${t.label ? ` (${t.label})` : ""} — `}
                  {t.occupancy
                    ? `Occupied${t.occupancy.customer_name ? `: ${t.occupancy.customer_name}` : ""}`
                    : "Available"}
                </option>
              ))}
            </select>
          </label>

          {/* Selected table details — same status language as the admin
              tables page, so staff who use both surfaces never have to
              reconcile two visual systems. */}
          {selected && (
            <div className="rounded-lg border border-border bg-bg-alt p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-full",
                    selected.occupancy ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  aria-hidden
                />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
                  {selected.occupancy ? "Occupied" : "Available"}
                </span>
                {selected.occupancy && (
                  <span className="ml-auto font-mono text-[10px] text-muted">
                    seated {formatRelativeTime(selected.occupancy.created_at)}
                  </span>
                )}
                {!selected.occupancy && selected.last_cleaned_at && (
                  <span className="ml-auto font-mono text-[10px] text-muted">
                    cleaned {formatRelativeTime(selected.last_cleaned_at)}
                  </span>
                )}
              </div>
              {selected.occupancy?.customer_name && (
                <div className="text-sm font-display italic">
                  {selected.occupancy.customer_name}
                  {selected.occupancy.party_size ? (
                    <span className="text-muted not-italic font-mono text-xs ml-2">
                      · party of {selected.occupancy.party_size}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!selected || busy}
            onClick={() => selected && clean(selected.code)}
          >
            <Sparkles className="w-4 h-4" />
            {busy
              ? "Cleaning…"
              : selected
                ? `Mark Table ${selected.code} cleaned`
                : "Pick a table first"}
          </Button>

          {result && (
            <div
              className={cn(
                "p-3 rounded-lg flex items-start gap-2 text-sm",
                result.ok
                  ? "border border-emerald-500/30 text-emerald-300"
                  : "border border-red-500/30 text-red-400"
              )}
            >
              {result.ok ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <X className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div>{result.message}</div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Secondary: QR scanner. Collapsed by default — most staff will
          stay on the dropdown. The scanner is here for owners who want
          to validate a printed QR without typing into the picker, or
          for the rare floor where staff genuinely prefer to scan. */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowScanner((s) => !s)}
          className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted hover:text-fg transition inline-flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          {showScanner ? "Hide scanner" : "Or scan a QR"}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              showScanner && "rotate-180"
            )}
          />
        </button>
        {showScanner && (
          <Card className="mt-3">
            <CardBody className="space-y-3">
              {!scanning ? (
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  onClick={startScanner}
                  disabled={busy}
                >
                  <Camera className="w-4 h-4" /> Start scanner
                </Button>
              ) : (
                <div className="space-y-3">
                  <div
                    id="server-scanner"
                    ref={containerRef}
                    className="w-full aspect-square bg-black rounded-lg overflow-hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={stopScanner}
                  >
                    <X className="w-4 h-4" /> Stop scanning
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted mt-6 inline-flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        Status refreshes every 8 seconds.
      </p>
    </div>
  );
}
