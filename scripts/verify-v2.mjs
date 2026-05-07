// Verify the v2 migration applied + the deploy is current.
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
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}

const restaurants = await q(
  "restaurants?select=id,slug,name,dine_in_enabled,takeout_enabled,takeout_code"
);
console.log(`\n[Restaurants] (${restaurants.length})`);
for (const r of restaurants) {
  console.log(`  slug=${r.slug}`);
  console.log(`    dine_in:  ${r.dine_in_enabled}`);
  console.log(`    takeout:  ${r.takeout_enabled}  code=${r.takeout_code ?? "(unset)"}`);
}

console.log(`\n[Live URLs to test]`);
for (const r of restaurants) {
  console.log(`  Admin:    https://tapserve.ca/admin`);
  console.log(`  Settings: https://tapserve.ca/admin/settings`);
  console.log(`  Kitchen:  https://tapserve.ca/kitchen/${r.slug}`);
  if (r.takeout_code) {
    console.log(`  Takeout:  https://tapserve.ca/to/${r.slug}/${r.takeout_code}`);
  }
}
