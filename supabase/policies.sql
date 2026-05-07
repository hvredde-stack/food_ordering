-- =============================================================
-- Row-Level Security policies
-- =============================================================
-- Auth model (2026 native Clerk ↔ Supabase Third-Party Auth):
--
--   • Writes go through Next.js API routes that authenticate via Clerk
--     (admin/staff) or the customer session cookie. Those routes use
--     the SERVICE ROLE key, which bypasses RLS.
--
--   • Browsers SUBSCRIBE to realtime authenticated as Clerk users.
--     Supabase verifies the Clerk session token via JWKS; auth.jwt()
--     exposes the Clerk claims, including `sub` (the Clerk user id).
--     RLS lets the owner read rows for their own restaurant only.
--
--   • Customer pages POLL via Next.js API routes (no realtime there),
--     so customers never need a Supabase JWT — eliminating the
--     symmetric-secret JWT path entirely.
--
--   • Public menu read remains anon-allowed (a menu IS public).
--
--   • customer_sessions and feedback are deliberately not exposed to
--     anon or authenticated; the API gates them.
-- =============================================================

alter table restaurants          enable row level security;
alter table menu_categories      enable row level security;
alter table dishes               enable row level security;
alter table restaurant_tables    enable row level security;
alter table customer_sessions    enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table sentiment_events     enable row level security;
alter table feedback             enable row level security;

-- Reset all existing public policies (idempotent re-run).
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ─── Public menu read (anon can browse a restaurant's menu) ───
create policy "anon read restaurants" on restaurants
  for select to anon using (true);

create policy "anon read menu categories" on menu_categories
  for select to anon using (true);

create policy "anon read available dishes" on dishes
  for select to anon using (available = true);

create policy "anon read tables" on restaurant_tables
  for select to anon using (true);

-- ─── Authenticated owners (Clerk) read their own restaurant's data ───
-- The Clerk user id arrives as auth.jwt() ->> 'sub' once Clerk is
-- configured as a Supabase Third-Party Auth provider. We reuse the
-- restaurants.owner_user_id link rather than embedding restaurant_id
-- as a Clerk custom claim, so no Clerk session-template setup is
-- required beyond the default integration.

create policy "owner reads restaurant" on restaurants
  for select to authenticated
  using (owner_user_id = auth.jwt() ->> 'sub');

create policy "owner reads orders" on orders
  for select to authenticated
  using (
    restaurant_id in (
      select id from restaurants where owner_user_id = auth.jwt() ->> 'sub'
    )
  );

create policy "owner reads order items" on order_items
  for select to authenticated
  using (
    restaurant_id in (
      select id from restaurants where owner_user_id = auth.jwt() ->> 'sub'
    )
  );

create policy "owner reads sentiment" on sentiment_events
  for select to authenticated
  using (
    restaurant_id in (
      select id from restaurants where owner_user_id = auth.jwt() ->> 'sub'
    )
  );
