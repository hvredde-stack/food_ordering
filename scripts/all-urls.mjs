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
const APP = "https://tapserve.ca";

async function q(p) {
  const r = await fetch(`${URL}/rest/v1/${p}`, { headers });
  if (!r.ok) throw new Error(`${p} -> ${r.status}`);
  return r.json();
}

// Real, used restaurants only — those with at least 1 table OR a non-stub name.
const restaurants = await q(
  "restaurants?select=slug,name,takeout_code,dine_in_enabled,takeout_enabled,status&order=created_at.asc"
);
const tables = await q("restaurant_tables?select=restaurant_id,code,seats");
const tablesBySlug = new Map();
for (const r of restaurants) tablesBySlug.set(r.slug, []);
for (const t of tables) {
  const r = restaurants.find((x) => x.id ? x.id === t.restaurant_id : false);
  // we don't have id here; just include all by re-fetching with id
}

const restaurantsWithId = await q(
  "restaurants?select=id,slug,name,takeout_code,dine_in_enabled,takeout_enabled,status&order=created_at.asc"
);
const tableMap = new Map();
for (const r of restaurantsWithId) tableMap.set(r.id, []);
for (const t of tables) {
  const list = tableMap.get(t.restaurant_id);
  if (list) list.push(t.code);
}

console.log(`\n========== PUBLIC ==========`);
console.log(`Marketing landing:   ${APP}/`);
console.log(`Sign in:             ${APP}/admin/sign-in`);
console.log(`Sign up:             ${APP}/admin/sign-up`);
console.log(`Onboarding (auto):   ${APP}/onboarding`);

console.log(`\n========== STAFF (auto-resolves to signed-in user's restaurant) ==========`);
console.log(`Restaurant admin:    ${APP}/admin`);
console.log(`Server app:          ${APP}/server`);
console.log(`Kitchen:             ${APP}/kitchen`);

console.log(`\n========== PLATFORM (your company / SaaS owner) ==========`);
console.log(`Platform overview:   ${APP}/platform`);
console.log(`Restaurants list:    ${APP}/platform/restaurants`);
console.log(`Onboard new:         ${APP}/platform/restaurants/new`);
console.log(`Manage admins:       ${APP}/platform/admins`);

console.log(`\n========== PER-RESTAURANT ==========`);
const real = restaurantsWithId.filter(
  (r) => (tableMap.get(r.id) ?? []).length > 0 || !/^My Restaurant$/.test(r.name)
);
for (const r of real) {
  console.log(`\n--- ${r.name} (slug: ${r.slug}) [${r.status}] ---`);
  console.log(`  Kitchen:           ${APP}/kitchen/${r.slug}`);
  console.log(`  Restaurant detail: ${APP}/platform/restaurants/${r.id}`);
  if (r.takeout_enabled && r.takeout_code) {
    console.log(`  Customer takeout:  ${APP}/to/${r.slug}/${r.takeout_code}`);
  }
  if (r.dine_in_enabled) {
    const ts = tableMap.get(r.id) ?? [];
    if (ts.length === 0) {
      console.log(`  Customer dine-in:  (no tables yet)`);
    } else {
      for (const code of ts) {
        console.log(`  Table ${code}:        ${APP}/t/${r.slug}/${encodeURIComponent(code)}`);
      }
    }
  }
}
