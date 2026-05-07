-- =============================================================
-- TapServe — multi-tenant SaaS schema
-- =============================================================
-- Run this entire file in the Supabase SQL editor on a fresh
-- project. It is idempotent (drops and recreates) — DO NOT run
-- against a database that already has real data.
-- =============================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
do $$ begin
  create type order_status as enum ('pending','preparing','ready','served','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_status as enum ('pending','preparing','ready','served','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('active','expired','cleaned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sentiment_kind as enum ('happy','sad');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('dine-in','takeout');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------
create table if not exists restaurants (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text,
  logo_url        text,
  -- Clerk user id of the owner (admin). One owner per restaurant in v1.
  owner_user_id   text not null,
  currency        text not null default 'USD',
  timezone        text not null default 'UTC',
  -- Mode toggles (admin can disable either flow).
  dine_in_enabled boolean not null default true,
  takeout_enabled boolean not null default true,
  -- Master takeout code — used in /to/<slug>/<takeout_code> URL + master QR.
  takeout_code    text,
  -- Platform admin can suspend a tenant; suspended restaurants block ordering.
  status          text not null default 'active' check (status in ('active', 'suspended')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists restaurants_status_idx on restaurants(status);

-- Platform admins (your company / SaaS staff). Onboard restaurants and see
-- cross-tenant data. Bootstrapped from PLATFORM_ADMIN_EMAILS env var.
create table if not exists platform_admins (
  id            uuid primary key default gen_random_uuid(),
  user_id       text unique not null,
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  invited_by_user_id text
);
create index if not exists platform_admins_user_idx on platform_admins(user_id);
create index if not exists restaurants_owner_idx on restaurants(owner_user_id);
create unique index if not exists restaurants_takeout_code_idx
  on restaurants(takeout_code) where takeout_code is not null;

-- ---------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------
create table if not exists menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  position      int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists menu_categories_rest_idx on menu_categories(restaurant_id, position);

create table if not exists dishes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid references menu_categories(id) on delete set null,
  name          text not null,
  description   text,
  price_cents   int not null check (price_cents >= 0),
  -- 'each' is the default; weight-priced dishes use lb/kg/oz/g and the
  -- customer picks a fractional quantity at checkout.
  price_unit    text not null default 'each' check (price_unit in ('each', 'lb', 'kg', 'oz', 'g')),
  image_url     text,
  available     boolean not null default true,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists dishes_rest_idx on dishes(restaurant_id, available);
create index if not exists dishes_cat_idx on dishes(category_id, position);

-- ---------------------------------------------------------------
-- Tables (the physical kind)
-- ---------------------------------------------------------------
create table if not exists restaurant_tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  -- Server-friendly label, e.g. "T-12". Unique within a restaurant,
  -- case-insensitive (so "T20" and "t20" can't both exist).
  code          text not null,
  label         text,
  seats         int  not null default 2,
  created_at    timestamptz not null default now()
);
create unique index if not exists restaurant_tables_rest_code_ci_idx
  on restaurant_tables (restaurant_id, lower(code));
create index if not exists tables_rest_idx on restaurant_tables(restaurant_id);

-- ---------------------------------------------------------------
-- Customer sessions (table-bound, no auth)
-- ---------------------------------------------------------------
create table if not exists customer_sessions (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  -- Dine-in: table_id required, takeout_code null.
  -- Takeout:  takeout_code required, table_id null.
  table_id        uuid references restaurant_tables(id) on delete cascade,
  takeout_code    text,
  order_type      order_type not null default 'dine-in',
  -- Random token issued to the client; stored in an HTTP-only cookie.
  token           text unique not null,
  status          session_status not null default 'active',
  party_size      int,
  customer_name   text,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  expires_at      timestamptz not null,
  cleaned_at      timestamptz,
  cleaned_by_user_id text,
  constraint session_scope_check check (
    (order_type = 'dine-in' and table_id is not null) or
    (order_type = 'takeout' and takeout_code is not null)
  )
);
create index if not exists sessions_rest_status_idx on customer_sessions(restaurant_id, status);
create index if not exists sessions_table_status_idx on customer_sessions(table_id, status);
create index if not exists sessions_takeout_idx
  on customer_sessions(takeout_code, status) where takeout_code is not null;

-- ---------------------------------------------------------------
-- Orders + items
-- ---------------------------------------------------------------
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  -- Dine-in orders carry table_id; takeout orders carry takeout_code.
  table_id      uuid references restaurant_tables(id) on delete restrict,
  takeout_code  text,
  session_id    uuid not null references customer_sessions(id) on delete cascade,
  order_type    order_type not null default 'dine-in',
  -- Snapshot of the customer's name at order time (also stored on items).
  customer_name text,
  status        order_status not null default 'pending',
  total_cents   int not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists orders_rest_status_idx on orders(restaurant_id, status, created_at desc);
create index if not exists orders_session_idx on orders(session_id, created_at desc);
create index if not exists orders_table_idx on orders(table_id, created_at desc);
create index if not exists orders_takeout_status_idx
  on orders(takeout_code, status, created_at desc) where takeout_code is not null;

create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  dish_id       uuid not null references dishes(id) on delete restrict,
  -- Snapshot fields so analytics survive dish edits.
  dish_name     text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  -- Weight-priced dishes (e.g. "1.5 lb fish pakora") need fractional qty.
  quantity      numeric(10,3) not null default 1 check (quantity > 0),
  -- Snapshot of dish.price_unit at order time.
  unit          text not null default 'each' check (unit in ('each', 'lb', 'kg', 'oz', 'g')),
  status        item_status not null default 'pending',
  notes         text,
  -- Per-item attribution: which person at the table/takeout group ordered this.
  customer_name text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists order_items_rest_status_idx on order_items(restaurant_id, status);
create index if not exists order_items_dish_idx on order_items(dish_id);

-- ---------------------------------------------------------------
-- Per-restaurant staff allowlist (added in migration 06).
-- Authorizes additional Clerk users to act on a restaurant alongside
-- its owner. user_id is captured on first sign-in for a fast lookup.
-- ---------------------------------------------------------------
create table if not exists restaurant_staff (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  email           text not null,
  user_id         text,
  invited_by_user_id text not null,
  created_at      timestamptz not null default now(),
  unique (restaurant_id, lower(email))
);
create index if not exists restaurant_staff_user_idx
  on restaurant_staff(user_id) where user_id is not null;
create index if not exists restaurant_staff_restaurant_idx
  on restaurant_staff(restaurant_id);

-- ---------------------------------------------------------------
-- Sentiment + feedback
-- ---------------------------------------------------------------
create table if not exists sentiment_events (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id    uuid not null references customer_sessions(id) on delete cascade,
  -- Nullable: takeout sessions have no table.
  table_id      uuid references restaurant_tables(id) on delete cascade,
  kind          sentiment_kind not null,
  created_at    timestamptz not null default now()
);
create index if not exists sentiment_rest_time_idx on sentiment_events(restaurant_id, created_at desc);
create index if not exists sentiment_session_idx on sentiment_events(session_id, created_at desc);

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id    uuid not null references customer_sessions(id) on delete cascade unique,
  -- Nullable: takeout sessions have no table.
  table_id      uuid references restaurant_tables(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);
create index if not exists feedback_rest_time_idx on feedback(restaurant_id, created_at desc);

-- ---------------------------------------------------------------
-- Triggers — keep updated_at + denormalized order total fresh.
-- ---------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists tg_restaurants_touch on restaurants;
create trigger tg_restaurants_touch before update on restaurants
  for each row execute procedure touch_updated_at();

drop trigger if exists tg_dishes_touch on dishes;
create trigger tg_dishes_touch before update on dishes
  for each row execute procedure touch_updated_at();

drop trigger if exists tg_orders_touch on orders;
create trigger tg_orders_touch before update on orders
  for each row execute procedure touch_updated_at();

drop trigger if exists tg_order_items_touch on order_items;
create trigger tg_order_items_touch before update on order_items
  for each row execute procedure touch_updated_at();

-- Recompute order.total_cents and roll order.status up from item statuses.
create or replace function sync_order_totals() returns trigger as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
  v_total int;
  v_pending int;
  v_preparing int;
  v_ready int;
  v_served int;
  v_cancelled int;
  v_total_count int;
  v_new_status order_status;
begin
  -- Explicit round() because quantity is numeric(10,3) for weight-priced
  -- dishes; coercing the product directly to int relies on PG behaviour
  -- that we'd rather not depend on.
  select coalesce(round(sum(unit_price_cents * quantity)), 0)::int into v_total
    from order_items where order_id = v_order_id and status <> 'cancelled';

  select
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'preparing'),
    count(*) filter (where status = 'ready'),
    count(*) filter (where status = 'served'),
    count(*) filter (where status = 'cancelled'),
    count(*)
  into v_pending, v_preparing, v_ready, v_served, v_cancelled, v_total_count
  from order_items where order_id = v_order_id;

  if v_total_count = 0 or v_total_count = v_cancelled then
    v_new_status := 'cancelled';
  elsif v_served + v_cancelled = v_total_count then
    v_new_status := 'served';
  elsif v_ready + v_served + v_cancelled = v_total_count then
    v_new_status := 'ready';
  elsif v_preparing > 0 or v_ready > 0 then
    v_new_status := 'preparing';
  else
    v_new_status := 'pending';
  end if;

  update orders set total_cents = v_total, status = v_new_status, updated_at = now()
    where id = v_order_id;
  return null;
end;
$$ language plpgsql;

drop trigger if exists tg_order_items_sync on order_items;
create trigger tg_order_items_sync after insert or update or delete on order_items
  for each row execute procedure sync_order_totals();

-- ---------------------------------------------------------------
-- Realtime publication — orders, items, sentiment, sessions.
-- ---------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table sentiment_events;
alter publication supabase_realtime add table customer_sessions;

-- ---------------------------------------------------------------
-- Analytics views (computed on read; cheap for v1).
-- ---------------------------------------------------------------
create or replace view v_order_volume_by_hour as
select
  restaurant_id,
  date_trunc('hour', created_at) as hour,
  count(*) as orders,
  sum(total_cents) as revenue_cents
from orders
where status <> 'cancelled'
group by 1, 2;

create or replace view v_top_dishes as
select
  oi.restaurant_id,
  oi.dish_id,
  oi.dish_name,
  sum(oi.quantity) as units_sold,
  sum(oi.unit_price_cents * oi.quantity) as revenue_cents
from order_items oi
where oi.status <> 'cancelled'
group by 1, 2, 3
order by units_sold desc;

create or replace view v_sentiment_by_day as
select
  restaurant_id,
  date_trunc('day', created_at) as day,
  count(*) filter (where kind = 'happy') as happy,
  count(*) filter (where kind = 'sad')   as sad
from sentiment_events
group by 1, 2;
