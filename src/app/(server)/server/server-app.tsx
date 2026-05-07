"use client";

// Server-app: signed-in staff scans a table QR (the same /t/<slug>/<code>
// URL the customer uses), and any active session at that table is
// invalidated. The slug in the QR must match the staff member's
// restaurant — enforced server-side by /api/server/clean.

import { useEffect, useRef, useState } from "react";
import { Sparkles, Camera, X, Check, Hammer } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScanResult =
  | { ok: true; sessionsCleared: number; restaurantName: string; tableCode: string }
  | { ok: false; error: string };

interface Props {
  restaurantSlug: string;
  restaurantName: string;
  staffDisplayName: string;
}

export function ServerApp({ restaurantSlug, restaurantName, staffDisplayName }: Props) {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);

  // Stop the camera if the component unmounts mid-scan.
  useEffect(() => () => { scannerRef.current?.stop?.().catch(() => {}); }, []);

  function parseTableUrl(url: string): { slug: string; code: string } | null {
    try {
      const u = new URL(url, window.location.origin);
      const m = u.pathname.match(/^\/t\/([^/]+)\/([^/]+)\/?$/);
      if (!m) return null;
      return { slug: decodeURIComponent(m[1]), code: decodeURIComponent(m[2]) };
    } catch {
      return null;
    }
  }

  async function clean(slug: string, code: string) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/server/clean", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: slug,
          tableCode: code,
          staffName: staffDisplayName,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: j.error ?? "Failed to clean table" });
        return;
      }
      setResult({
        ok: true,
        sessionsCleared: j.sessionsCleared,
        restaurantName: j.restaurant.name,
        tableCode: j.table.code,
      });
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setBusy(false);
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
          await scanner.stop().catch(() => {});
          setScanning(false);
          await clean(parsed.slug, parsed.code);
        },
        () => { /* ignore per-frame errors */ }
      );
    } catch (err) {
      setScanning(false);
      setResult({ ok: false, error: `Camera error: ${(err as Error).message}` });
    }
  }

  async function stopScanner() {
    try { await scannerRef.current?.stop(); } catch {}
    setScanning(false);
  }

  function submitManual() {
    const parsed = parseTableUrl(manualUrl.trim());
    if (!parsed) {
      setResult({ ok: false, error: "Invalid table URL" });
      return;
    }
    clean(parsed.slug, parsed.code);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8">
      <div className="flex items-center gap-2">
        <Hammer className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Server app</h1>
      </div>
      <p className="text-muted text-sm mt-1">
        Signed in as <span className="font-medium text-fg">{staffDisplayName}</span> at {restaurantName} (<code>{restaurantSlug}</code>).
      </p>

      <Card className="mt-5">
        <CardHeader>
          <div className="text-sm">
            Scan a table QR to mark it cleaned. Any active customer session at that table is invalidated.
          </div>
        </CardHeader>

        <CardBody className="space-y-3">
          {!scanning ? (
            <Button size="lg" className="w-full" onClick={startScanner} disabled={busy}>
              <Camera className="w-4 h-4" /> Scan table QR
            </Button>
          ) : (
            <div className="space-y-3">
              <div
                id="server-scanner"
                ref={containerRef}
                className="w-full aspect-square bg-black rounded-lg overflow-hidden"
              />
              <Button variant="secondary" className="w-full" onClick={stopScanner}>
                <X className="w-4 h-4" /> Stop scanning
              </Button>
            </div>
          )}

          <div className="relative my-2 flex items-center">
            <div className="flex-1 h-px bg-border" />
            <span className="px-2 text-xs text-muted">or paste URL</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <Input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://…/t/demo/T-01"
            />
            <Button onClick={submitManual} disabled={busy}>Mark</Button>
          </div>
        </CardBody>

        {result && (
          <CardFooter>
            {result.ok ? (
              <div className="flex items-start gap-2 text-green-700">
                <Check className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">
                    Table {result.tableCode} cleaned at {result.restaurantName}
                  </div>
                  <div className="text-sm text-muted">
                    {result.sessionsCleared} active session{result.sessionsCleared === 1 ? "" : "s"} invalidated.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-red-700">
                <X className="w-5 h-5 mt-0.5" />
                <div className="font-medium">{result.error}</div>
              </div>
            )}
          </CardFooter>
        )}
      </Card>

      <p className="text-xs text-muted mt-6 inline-flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        The same QR a customer uses to start a session is the one you scan to clean the table.
      </p>
    </div>
  );
}
