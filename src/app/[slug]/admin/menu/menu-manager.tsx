"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { DishImage } from "@/components/ui/dish-image";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { PRICE_UNIT_LABELS, PRICE_UNIT_SHORT } from "@/lib/weight";
import type { Dish, MenuCategory, PriceUnit } from "@/lib/types";

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
  const [busyCat, setBusyCat] = useState(false);
  const [errCat, setErrCat] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/dishes", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setDishes(j.dishes);
      setCategories(j.categories);
    }
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setBusyCat(true);
    setErrCat(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, position: categories.length }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrCat(j.error ?? `Failed (${res.status})`);
        return;
      }
      setNewCategory("");
      await reload();
    } catch (e) {
      setErrCat((e as Error).message);
    } finally {
      setBusyCat(false);
    }
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

  // Group dishes by category for the visual list. "Uncategorized" bucket
  // appears only if there are dishes without a category.
  const grouped = useMemo(() => {
    const m = new Map<string, Dish[]>();
    for (const d of dishes) {
      const key = d.category_id ?? "__none__";
      const arr = m.get(key) ?? [];
      arr.push(d);
      m.set(key, arr);
    }
    return m;
  }, [dishes]);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <PageHeader
        eyebrow="Menu"
        title="Categories & dishes"
        lede="Group dishes into categories. Set a price per unit (each / lb / kg / oz / g) — weight units enable fractional ordering at checkout."
        actions={
          <Button onClick={() => setEditing({ name: "", price_cents: 0, price_unit: "each", available: true })}>
            <Plus className="w-4 h-4" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase">New dish</span>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Categories</div>
          <div className="text-xs text-muted mt-2">
            Tip: add a category first (e.g. <em>Starters</em>, <em>Mains</em>, <em>Drinks</em>), then assign dishes to it when you create or edit them.
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New category name (e.g. Starters)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              disabled={busyCat}
            />
            <Button onClick={addCategory} disabled={busyCat || !newCategory.trim()}>
              <Plus className="w-4 h-4" />
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{busyCat ? "Adding…" : "Add"}</span>
            </Button>
          </div>
          {errCat && <div className="text-sm text-red-600">Couldn't add category: {errCat}</div>}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full bg-bg-alt border border-border px-3 py-1 text-sm"
              >
                {c.name}
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="text-muted hover:text-red-600 transition-colors"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {categories.length === 0 && (
              <div className="text-sm text-muted italic">No categories yet — add one above.</div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Dishes — now grouped under their category, with one "Uncategorized" bucket. */}
      {dishes.length === 0 ? (
        <EmptyState
          eyebrow="Empty menu"
          title="No dishes yet."
          description="Add a category first, then create your first dish. You can mix per-item pricing (a $5 dosa) with weight pricing (a $15/lb fish pakora) on the same menu."
          action={
            <Button onClick={() => setEditing({ name: "", price_cents: 0, price_unit: "each", available: true })}>
              <Plus className="w-4 h-4" />
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase">Add the first dish</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {categories.map((c) => {
            const items = grouped.get(c.id) ?? [];
            if (items.length === 0) return (
              <CategoryGroup key={c.id} title={c.name} count={0}>
                <div className="p-4 text-sm text-muted italic">
                  No dishes in this category yet.
                </div>
              </CategoryGroup>
            );
            return (
              <CategoryGroup key={c.id} title={c.name} count={items.length}>
                {items.map((d) => (
                  <DishRow
                    key={d.id}
                    dish={d}
                    currency={currency}
                    onEdit={() => setEditing(d)}
                    onDelete={() => deleteDish(d.id)}
                  />
                ))}
              </CategoryGroup>
            );
          })}
          {(grouped.get("__none__")?.length ?? 0) > 0 && (
            <CategoryGroup
              title="Uncategorized"
              count={grouped.get("__none__")!.length}
              caption="Edit each dish to assign a category."
            >
              {grouped.get("__none__")!.map((d) => (
                <DishRow
                  key={d.id}
                  dish={d}
                  currency={currency}
                  onEdit={() => setEditing(d)}
                  onDelete={() => deleteDish(d.id)}
                />
              ))}
            </CategoryGroup>
          )}
        </div>
      )}

      {editing !== null && (
        <DishEditor
          dish={editing}
          categories={categories}
          currency={currency}
          onClose={() => setEditing(null)}
          onSaved={reload}
          onCategoryCreated={(c) => setCategories((cs) => [...cs, c])}
        />
      )}
    </div>
  );
}

function CategoryGroup({
  title,
  count,
  caption,
  children,
}: {
  title: string;
  count: number;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex justify-between items-baseline">
        <div>
          <div className="font-display text-2xl tracking-tight">{title}</div>
          {caption && <div className="text-xs text-muted mt-1">{caption}</div>}
        </div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
          {count} {count === 1 ? "dish" : "dishes"}
        </div>
      </CardHeader>
      <div className="divide-y divide-border">{children}</div>
    </Card>
  );
}

function DishRow({
  dish,
  currency,
  onEdit,
  onDelete,
}: {
  dish: Dish;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 flex items-start gap-4">
      <DishImage name={dish.name} imageUrl={dish.image_url} size={64} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3 items-baseline">
          <div className="font-display text-lg tracking-tight truncate">{dish.name}</div>
          <div className="font-mono text-sm tabular-nums whitespace-nowrap">
            {formatMoney(dish.price_cents, currency)}
            <span className="text-muted">{PRICE_UNIT_SHORT[dish.price_unit ?? "each"]}</span>
          </div>
        </div>
        <div className="text-xs text-muted font-mono tracking-wide mt-1">
          {dish.available ? "Available" : "Hidden"}
        </div>
        {dish.description && (
          <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">{dish.description}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function DishEditor({
  dish,
  categories,
  currency,
  onClose,
  onSaved,
  onCategoryCreated,
}: {
  dish: Partial<Dish>;
  categories: MenuCategory[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
  onCategoryCreated: (c: MenuCategory) => void;
}) {
  const [name, setName] = useState(dish.name ?? "");
  const [description, setDescription] = useState(dish.description ?? "");
  const [priceCents, setPriceCents] = useState(dish.price_cents ?? 0);
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(dish.price_unit ?? "each");
  const [categoryId, setCategoryId] = useState(dish.category_id ?? "");
  const [available, setAvailable] = useState(dish.available ?? true);
  const [imageUrl, setImageUrl] = useState(dish.image_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Inline category creation from inside the dish editor.
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [busyCat, setBusyCat] = useState(false);

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

  async function createInlineCategory() {
    const name = newCatName.trim();
    if (!name) return;
    setBusyCat(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, position: categories.length }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Failed to create category");
        return;
      }
      const j = await res.json();
      onCategoryCreated(j.category as MenuCategory);
      setCategoryId(j.category.id);
      setNewCatName("");
      setCreatingCategory(false);
    } finally {
      setBusyCat(false);
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
        price_unit: priceUnit,
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
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">{dish.id ? "Edit" : "New"}</div>
            <div className="font-display text-xl mt-1 tracking-tight">{dish.id ? "Edit dish" : "New dish"}</div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg text-2xl leading-none" aria-label="Close">×</button>
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
              <span className="text-xs text-muted font-mono">
                = {formatMoney(priceCents, currency)}
                <span className="opacity-70">{PRICE_UNIT_SHORT[priceUnit]}</span>
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-muted">Sold by</span>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value as PriceUnit)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                {(Object.keys(PRICE_UNIT_LABELS) as PriceUnit[]).map((u) => (
                  <option key={u} value={u}>{PRICE_UNIT_LABELS[u]}</option>
                ))}
              </select>
              <span className="text-[10px] text-muted block mt-1 leading-tight">
                {priceUnit === "each"
                  ? "Whole-item pricing. Customer adds in counts."
                  : "Customer picks a weight chip (¼/½/1/1½/2) at checkout."}
              </span>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-muted">Category</span>
            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setCreatingCategory(true);
                } else {
                  setCategoryId(e.target.value);
                }
              }}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">+ Create new category…</option>
            </select>
          </label>

          {creatingCategory && (
            <div className="flex gap-2 p-3 rounded-lg bg-bg-alt border border-border">
              <Input
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createInlineCategory();
                  }
                }}
                autoFocus
              />
              <Button onClick={createInlineCategory} disabled={busyCat || !newCatName.trim()}>
                {busyCat ? "Adding…" : "Add"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setCreatingCategory(false); setNewCatName(""); }}
              >
                Cancel
              </Button>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            Available
          </label>

          <div>
            <span className="text-xs text-muted">Image</span>
            <div className="mt-1 flex gap-2 items-center">
              <DishImage name={name || "Dish"} imageUrl={imageUrl} size={64} />
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
