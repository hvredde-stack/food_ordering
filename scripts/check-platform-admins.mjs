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

const r = await fetch(`${URL}/rest/v1/platform_admins?select=*`, { headers });
const admins = await r.json();
console.log(`\nplatform_admins (${admins.length}):`);
for (const a of admins) {
  console.log(`  user_id=${a.user_id}  email=${a.email}  display_name=${a.display_name}`);
}

const r2 = await fetch(`${URL}/rest/v1/restaurants?select=id,slug,owner_user_id,status`, { headers });
const restaurants = await r2.json();
console.log(`\nrestaurants (${restaurants.length}):`);
for (const x of restaurants) {
  console.log(`  ${x.slug}  owner=${x.owner_user_id}  status=${x.status}`);
}
