-- TapServe — migration 06
-- Per-restaurant staff allowlist. Each row authorizes one email to sign
-- in as staff for one restaurant. Onboarding model:
--
--   1. Owner adds an email to the restaurant_staff table for their
--      restaurant (via /admin/settings → Team).
--   2. Staff person signs up / signs in to TapServe via Clerk (Google,
--      email+password, whatever's enabled).
--   3. The first time they hit /after-sign-in, we look up their Clerk
--      email in restaurant_staff. If a row matches with a null user_id,
--      we capture their Clerk user id so subsequent auth lookups are
--      O(1) on user_id (no email scan needed).
--   4. Staff can now access /<slug>/admin, /<slug>/server, and
--      /<slug>/kitchen with the same permissions as the owner. To
--      revoke, owner deletes the row.
--
-- The shape is intentionally minimal — no roles, no per-surface scoping,
-- no audit trail beyond invited_by_user_id. Staff = co-owner for v1.

create table if not exists restaurant_staff (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  email           text not null,
  -- Captured on first sign-in via after-sign-in router. Indexed (partial)
  -- so the hot path is a fast point lookup.
  user_id         text,
  invited_by_user_id text not null,
  created_at      timestamptz not null default now(),
  -- One email may only be staff at one restaurant once. Combined with
  -- the FK on_delete cascade, deleting a restaurant cleans up its team.
  unique (restaurant_id, lower(email))
);

create index if not exists restaurant_staff_user_idx
  on restaurant_staff(user_id) where user_id is not null;

create index if not exists restaurant_staff_restaurant_idx
  on restaurant_staff(restaurant_id);

-- RLS: writes happen through service_role (Next.js API routes). Reads
-- aren't exposed to anon or authenticated — staff lookups go through
-- the API too. So no policies needed; just enable RLS to deny all
-- direct client access.
alter table restaurant_staff enable row level security;
