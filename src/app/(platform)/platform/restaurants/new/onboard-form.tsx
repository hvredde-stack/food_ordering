"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
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
        body: JSON.stringify({ name, slug, ownerEmail: email, currency }),
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
    <Card className="mt-6">
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
        {err && <div className="text-sm text-red-600">{err}</div>}
      </CardBody>
      <CardFooter>
        <Button size="lg" className="w-full" onClick={submit} disabled={busy || !name || !slug || !email}>
          {busy ? "Onboarding…" : "Create restaurant"}
        </Button>
      </CardFooter>
    </Card>
  );
}
