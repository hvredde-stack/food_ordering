-- TapServe — migration 05
-- Weight-priced menu items (e.g. "$15/lb fish pakora").
--
-- 1. dishes.price_unit       — what unit the dish is sold in.
--                              'each' is the default and matches every existing row;
--                              'lb' / 'kg' / 'oz' / 'g' for weight-priced dishes.
-- 2. order_items.quantity    — was integer, now numeric(10,3) so 1.5 lb works.
--                              The check (quantity > 0) survives a type swap.
-- 3. order_items.unit        — snapshot of dish.price_unit at order time.
--                              Same default as dishes so existing rows backfill cleanly.
--
-- The sync_order_totals trigger keeps working: numeric * integer is numeric;
-- coalesce(sum, 0) into v_total (int) auto-rounds. We make the rounding
-- explicit with round() so we don't depend on PG's coercion behaviour.

-- Add price_unit to dishes
alter table dishes
  add column if not exists price_unit text not null default 'each'
  check (price_unit in ('each', 'lb', 'kg', 'oz', 'g'));

-- Drop the analytics view that references order_items.quantity — PG won't
-- alter a column type while a view depends on it. Recreated below with
-- the same shape after the column change.
drop view if exists v_top_dishes;

-- Allow fractional quantity on order_items
alter table order_items
  alter column quantity type numeric(10,3) using quantity::numeric(10,3);

-- Recreate the analytics view. Identical shape; sum() over numeric is
-- numeric, so units_sold becomes numeric instead of bigint — that's
-- fine for the platform overview which just renders it.
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

-- Snapshot the unit on each order line. Defaulting to 'each' is the safe
-- backfill: any existing line predates weight pricing.
alter table order_items
  add column if not exists unit text not null default 'each'
  check (unit in ('each', 'lb', 'kg', 'oz', 'g'));

-- Replace the trigger so v_total uses explicit rounding instead of relying
-- on int coercion of a numeric expression. Behaviour for existing data
-- (integer quantities) is unchanged.
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
