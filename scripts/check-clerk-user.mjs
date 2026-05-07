// Check what email Clerk has for this user.
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

const r = await fetch("https://api.clerk.com/v1/users?limit=20", {
  headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
});
if (!r.ok) {
  console.log("Clerk API error:", r.status, await r.text());
  process.exit(1);
}
const users = await r.json();
console.log(`\nFound ${users.length} Clerk user(s):\n`);
for (const u of users) {
  const primary = u.email_addresses?.find((e) => e.id === u.primary_email_address_id);
  console.log(`user_id: ${u.id}`);
  console.log(`  primary email:    ${primary?.email_address ?? "(none)"}`);
  console.log(`  all emails:       ${u.email_addresses?.map((e) => e.email_address).join(", ") ?? "(none)"}`);
  console.log(`  first_name:       ${u.first_name ?? "(none)"}`);
  console.log(`  username:         ${u.username ?? "(none)"}`);
  console.log("");
}
console.log(`PLATFORM_ADMIN_EMAILS in .env.local: "${env.PLATFORM_ADMIN_EMAILS ?? ""}"`);
