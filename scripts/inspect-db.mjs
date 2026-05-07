// Quick read-only DB inspector via PostgREST. Run: node scripts/inspect-db.mjs
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("./.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function q(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

const restaurants = await q("restaurants?select=id,slug,name,owner_user_id,created_at&order=created_at.desc");
console.log(`\n[Restaurants] (${restaurants.length})`);
for (const r of restaurants) {
  console.log(`  slug="${r.slug}"  name="${r.name}"  owner=${r.owner_user_id}`);
}

const tables = await q("restaurant_tables?select=id,restaurant_id,code,label,seats");
console.log(`\n[Tables] (${tables.length})`);
for (const t of tables) {
  const r = restaurants.find((x) => x.id === t.restaurant_id);
  console.log(`  ${r?.slug ?? "?"}/${t.code}  label="${t.label}"  seats=${t.seats}`);
  console.log(`    customer URL: https://food-ordering-iota-orcin.vercel.app/t/${r?.slug}/${t.code}`);
}
