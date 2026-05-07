"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function OnboardForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tableCount, setTableCount] = useState(4);
  const [seatsPerTable, setSeatsPerTable] = useState(2);
  const [tableCodePrefix, setTableCodePrefix] = useState("T-");
  const [seedTapWater, setSeedTapWater] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/platform/restaurants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          ownerEmail: email,
          currency,
          tableCount,
          seatsPerTable,
          tableCodePrefix,
          seedTapWater,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Failed to onboard");
        return;
      }
      router.push(`/platform/restaurants/${j.restaurant.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><div className="font-semibold">Restaurant</div></CardHeader>
        <CardBody className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted">Restaurant name</span>
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Demo Bistro" className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs text-muted">URL slug (lowercase, dashes only)</span>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              placeholder="demo-bistro"
              className="mt-1"
            />
            <span className="text-xs text-muted">
              Customer URL preview: <code className="text-xs">/t/{slug || "slug"}/&lt;table-code&gt;</code>
            </span>
          </label>
          <label className="block">
            <span className="text-xs text-muted">Owner email (must already have a Clerk account)</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Currency (3-letter code)</span>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="mt-1"
            />
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold">Initial setup</div>
          <div className="text-xs text-muted">
            Auto-creates tables and a starter menu item so all URLs work right after onboarding.
            The owner can edit/add more later in their admin panel.
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-muted">Number of tables</span>
              <Input
                type="number"
                min={0}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Seats per table</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={seatsPerTable}
                onChange={(e) => setSeatsPerTable(Number(e.target.value))}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Code prefix</span>
              <Input
                value={tableCodePrefix}
                onChange={(e) => setTableCodePrefix(e.target.value)}
                maxLength={8}
                className="mt-1"
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Will create:{" "}
            {tableCount > 0
              ? `${tableCodePrefix}01, ${tableCodePrefix}02 … ${tableCodePrefix}${String(tableCount).padStart(2, "0")} (${seatsPerTable} seats each)`
              : "no tables"}
          </p>

          <label className="flex items-center gap-2 text-sm pt-2">
            <input
              type="checkbox"
              checked={seedTapWater}
              onChange={(e) => setSeedTapWater(e.target.checked)}
            />
            Seed a free <strong>Tap Water</strong> menu item (so the menu page isn't empty for testing)
          </label>
        </CardBody>
        <CardFooter>
          <div className="w-full">
            {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
            <Button
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={busy || !name || !slug || !email}
            >
              {busy ? "Onboarding…" : "Create restaurant"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
