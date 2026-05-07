-- =============================================================
-- Migration 04: platform admin tier
-- =============================================================
-- Adds:
--   • platform_admins table — list of Clerk user ids with cross-tenant access
--   • restaurants.status — active | suspended (blocks ordering when suspended)
--
-- Idempotent.
-- =============================================================

create table if not exists platform_admins (
  id            uuid primary key default gen_random_uuid(),
  user_id       text unique not null,        -- Clerk user id (`user_*`)
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  -- Audit: who added them. Null for env-bootstrapped admins.
  invited_by_user_id text
);
create index if not exists platform_admins_user_idx on platform_admins(user_id);

alter table restaurants
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

create index if not exists restaurants_status_idx on restaurants(status);
