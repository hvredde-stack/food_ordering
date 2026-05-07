"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function OnboardingWizard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tableCount, setTableCount] = useState(4);
  const [seatsPerTable, setSeatsPerTable] = useState(2);
  const [tableCodePrefix, setTableCodePrefix] = useState("T-");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const previewSlug = name ? slugify(name) : "your-restaurant";

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tableCount,
          seatsPerTable,
          tableCodePrefix,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Something went wrong. Please try again.");
        return;
      }
      // The API returns the freshly-created restaurant; jump straight to
      // its slug-scoped welcome page so the URL is canonical from the
      // first hit (rather than bouncing through the /admin shim).
      const slug = j?.restaurant?.slug as string | undefined;
      router.push(slug ? `/${slug}/admin/welcome` : "/admin");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          Restaurant details
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <label className="block">
          <div className="text-sm">Restaurant name</div>
          <div className="text-xs text-muted mt-1">
            How customers will see it on the menu and confirmation screens.
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Demo Bistro"
            className="mt-2"
            autoFocus
          />
          <div className="text-xs text-muted mt-2 font-mono">
            Customer URL preview: <span className="text-fg">/t/{previewSlug}/T-01</span>
          </div>
        </label>

        <div className="border-t border-border pt-5">
          <div className="text-sm">How many tables do you have?</div>
          <div className="text-xs text-muted mt-1">
            We'll create QR codes for {tableCount > 0 ? `T-01 through T-${String(tableCount).padStart(2, "0")}` : "no tables"}{" "}
            — you can edit them later.
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <NumField label="Tables" value={tableCount} setValue={setTableCount} min={0} max={50} />
            <NumField label="Seats per table" value={seatsPerTable} setValue={setSeatsPerTable} min={1} max={20} />
            <label className="block">
              <div className="text-xs text-muted">Code prefix</div>
              <Input
                value={tableCodePrefix}
                onChange={(e) => setTableCodePrefix(e.target.value)}
                maxLength={8}
                className="mt-1"
              />
            </label>
          </div>
        </div>

        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-3">{err}</div>}
      </CardBody>
      <CardFooter>
        <Button
          size="lg"
          className="w-full justify-between"
          onClick={submit}
          disabled={busy || !name.trim()}
        >
          <span className="font-mono text-xs tracking-[0.18em] uppercase">
            {busy ? "Setting up your restaurant…" : "Continue"}
          </span>
          {!busy && <ArrowUpRight className="w-4 h-4" />}
        </Button>
        <p className="text-xs text-muted text-center mt-4 italic font-display">
          Free during preview. No credit card needed.
        </p>
      </CardFooter>
    </Card>
  );
}

function NumField({
  label, value, setValue, min, max,
}: {
  label: string; value: number; setValue: (v: number) => void; min: number; max: number;
}) {
  return (
    <label className="block">
      <div className="text-xs text-muted">{label}</div>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-1"
      />
    </label>
  );
}
