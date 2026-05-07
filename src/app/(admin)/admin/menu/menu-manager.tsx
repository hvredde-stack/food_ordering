"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import type { Dish, MenuCategory } from "@/lib/types";

interface Props {
  currency: string;
  initialDishes: Dish[];
  initialCategories: MenuCategory[];
}

export function MenuManager({ currency, initialDishes, initialCategories }: Props) {
  const [dishes, setDishes] = useState(initialDishes);
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<Partial<Dish> | null>(null);
  const [newCategory, setNewCategory] = useState("");

  async function reload() {
    const res = await fetch("/api/admin/dishes", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setDishes(j.dishes);
      setCategories(j.categories);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim(), position: categories.length }),
    });
    setNewCategory("");
    await reload();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category? Dishes inside become uncategorized.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    await reload();
  }

  async function deleteDish(id: string) {
    if (!confirm("Delete this dish?")) return;
    await fetch(`/api/admin/dishes/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-sm text-muted">Categories, dishes, prices & images.</p>
        </div>
        <Button onClick={() => setEditing({ name: "", price_cents: 0, available: true })}>
          <Plus className="w-4 h-4" /> New dish
        </Button>
      </div>

      <Card>
        <CardHeader><div className="font-semibold">Categories</div></CardHeader>
        <CardBody className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button onClick={addCategory}><Plus className="w-4 h-4" /> Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {c.name}
                <button onClick={() => deleteCategory(c.id)} className="text-muted hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {categories.length === 0 && <div className="text-sm text-muted">No categories yet.</div>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><div className="font-semibold">Dishes</div></CardHeader>
        <div className="divide-y divide-border">
          {dishes.map((d) => (
            <div key={d.id} className="p-4 flex items-start gap-3">
              {d.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt={d.name} className="w-16 h-16 rounded-md object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3">
                  <div className="font-medium">{d.name}</div>
                  <div className="font-semibold">{formatMoney(d.price_cents, currency)}</div>
                </div>
                <div className="text-xs text-muted">
                  {categories.find((c) => c.id === d.category_id)?.name ?? "Uncategorized"}
                  {" · "}
                  {d.available ? "Available" : "Hidden"}
                </div>
                {d.description && <p className="text-sm text-muted mt-1 line-clamp-2">{d.description}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteDish(d.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {dishes.length === 0 && (
            <div className="p-8 text-center text-muted">No dishes yet — add one to get started.</div>
          )}
        </div>
      </Card>

      {editing !== null && (
        <DishEditor
          dish={editing}
          categories={categories}
          currency={currency}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function DishEditor({
  dish,
  categories,
  currency,
  onClose,
  onSaved,
}: {
  dish: Partial<Dish>;
  categories: MenuCategory[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(dish.name ?? "");
  const [description, setDescription] = useState(dish.description ?? "");
  const [priceCents, setPriceCents] = useState(dish.price_cents ?? 0);
  const [categoryId, setCategoryId] = useState(dish.category_id ?? "");
  const [available, setAvailable] = useState(dish.available ?? true);
  const [imageUrl, setImageUrl] = useState(dish.image_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload ticket");
      const { bucket, path, token, publicUrl } = await res.json();
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      setImageUrl(publicUrl);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const body: any = {
        name,
        description: description || null,
        price_cents: Number(priceCents),
        category_id: categoryId || null,
        available,
        image_url: imageUrl || null,
      };
      const res = dish.id
        ? await fetch(`/api/admin/dishes/${dish.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/dishes", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Save failed");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex justify-between items-center">
          <div className="font-semibold">{dish.id ? "Edit dish" : "New dish"}</div>
          <button onClick={onClose} className="text-muted hover:text-fg">×</button>
        </CardHeader>
        <CardBody className="space-y-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted">Price (cents)</span>
              <Input
                type="number"
                min={0}
                value={priceCents}
                onChange={(e) => setPriceCents(Number(e.target.value))}
                className="mt-1"
              />
              <span className="text-xs text-muted">= {formatMoney(priceCents, currency)}</span>
            </label>
            <label className="block">
              <span className="text-xs text-muted">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            Available
          </label>

          <div>
            <span className="text-xs text-muted">Image</span>
            <div className="mt-1 flex gap-2 items-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="w-16 h-16 rounded-md object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted" />
              )}
              <label className="flex-1">
                <div className="inline-flex">
                  <Button variant="secondary" size="sm" type="button" disabled={uploading}>
                    <Upload className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
              {imageUrl && (
                <Button variant="ghost" size="sm" onClick={() => setImageUrl("")}>Clear</Button>
              )}
            </div>
            <Input
              className="mt-2"
              placeholder="…or paste an image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
        </CardBody>
        <div className="flex gap-2 p-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={busy} className="flex-1">
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
