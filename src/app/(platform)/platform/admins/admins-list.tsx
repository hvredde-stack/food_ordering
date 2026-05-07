"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { formatRelativeTime } from "@/lib/utils";
import type { PlatformAdmin } from "@/lib/types";

export function AdminsList({
  initialAdmins,
  meUserId,
}: {
  initialAdmins: PlatformAdmin[];
  meUserId: string;
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const r = await fetch("/api/platform/admins", { cache: "no-store" });
    if (r.ok) setAdmins((await r.json()).admins);
  }

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/platform/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error ?? "Failed");
        return;
      }
      setEmail("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this platform admin?")) return;
    const r = await fetch(`/api/platform/admins/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error ?? "Failed");
      return;
    }
    await reload();
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Platform admins"
        lede="Anyone in this list has cross-tenant access — they can view any restaurant's admin, kitchen, and analytics. Add by Clerk email."
      />


      <Card>
        <CardHeader><div className="font-semibold">Invite admin</div></CardHeader>
        <CardBody className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@yourcompany.com"
          />
          <Button onClick={add} disabled={busy || !email.trim()}>
            <Plus className="w-4 h-4" /> Invite
          </Button>
        </CardBody>
        {err && (
          <div className="px-4 pb-3 text-sm text-red-600">{err}</div>
        )}
      </Card>

      <Card>
        <CardHeader><div className="font-semibold">Current admins ({admins.length})</div></CardHeader>
        <div className="divide-y divide-border">
          {admins.map((a) => (
            <div key={a.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  {a.display_name ?? a.email ?? a.user_id}
                  {a.user_id === meUserId && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-accent text-bg px-1.5 py-0.5 rounded">you</span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  {a.email} · joined {formatRelativeTime(a.created_at)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(a.id)}
                disabled={a.user_id === meUserId}
                title={a.user_id === meUserId ? "Have another admin remove you" : "Remove"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
