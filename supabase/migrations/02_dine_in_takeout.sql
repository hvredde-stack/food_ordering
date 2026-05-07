-- =============================================================
-- Migration 02: dine-in vs takeout dual ordering modes
-- =============================================================
-- Adds:
--   • order_type enum ('dine-in', 'takeout')
--   • restaurants.dine_in_enabled / takeout_enabled toggles
--   • restaurants.takeout_code (master code for the takeout QR)
--   • customer_sessions.order_type + nullable table_id + takeout_code
--   • orders.order_type + nullable table_id + takeout_code + customer_name
--   • order_items.customer_name (per-person attribution)
--
-- Idempotent. Safe to re-run.
-- =============================================================

-- 1. Enum
do $$ begin
  create type order_type as enum ('dine-in', 'takeout');
exception when duplicate_object then null; end $$;

-- 2. restaurants — toggles + master takeout code
alter table restaurants
  add column if not exists dine_in_enabled boolean not null default true,
  add column if not exists takeout_enabled boolean not null default true,
  add column if not exists takeout_code text;

create unique index if not exists restaurants_takeout_code_idx
  on restaurants(takeout_code) where takeout_code is not null;

-- Backfill takeout_code for existing restaurants
update restaurants
  set takeout_code = 'to-' || substr(md5(id::text || extract(epoch from now())::text), 1, 10)
  where takeout_code is null;

-- 3. customer_sessions
alter table customer_sessions
  alter column table_id drop not null,
  add column if not exists order_type order_type not null default 'dine-in',
  add column if not exists takeout_code text;

-- Drop and recreate scope check (so re-runs don't trip on a stale version).
alter table customer_sessions drop constraint if exists session_scope_check;
alter table customer_sessions add constraint session_scope_check check (
  (order_type = 'dine-in' and table_id is not null) or
  (order_type = 'takeout' and takeout_code is not null)
);

create index if not exists sessions_takeout_idx
  on customer_sessions(takeout_code, status) where takeout_code is not null;

-- 4. orders
alter table orders
  alter column table_id drop not null,
  add column if not exists order_type order_type not null default 'dine-in',
  add column if not exists takeout_code text,
  add column if not exists customer_name text;

create index if not exists orders_takeout_status_idx
  on orders(takeout_code, status, created_at desc) where takeout_code is not null;

-- 5. order_items — per-person attribution
alter table order_items
  add column if not exists customer_name text;

-- 6. Backfill customer_name on existing orders/items from session.customer_name
update orders o
  set customer_name = s.customer_name
  from customer_sessions s
  where o.session_id = s.id and o.customer_name is null;

update order_items oi
  set customer_name = o.customer_name
  from orders o
  where oi.order_id = o.id and oi.customer_name is null;

-- 7. Realtime publication adds (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;

-- 8. RLS — allow customers to read other sessions' orders at their table or
-- takeout group. Until we wire customer-side JWT auth, the existing anon
-- policy (none) means all customer queries flow through the API which
-- enforces scoping by cookie. No RLS change needed for v2.
