-- Migration: make restaurant_tables.code uniqueness case-insensitive.
-- Run this in the Supabase SQL editor on an existing project.
-- Idempotent: safe to re-run.

-- 1. Drop the old case-sensitive unique constraint if present.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'restaurant_tables_restaurant_id_code_key'
  ) then
    alter table restaurant_tables
      drop constraint restaurant_tables_restaurant_id_code_key;
  end if;
end $$;

-- 2. Add a case-insensitive unique index.
create unique index if not exists restaurant_tables_rest_code_ci_idx
  on restaurant_tables (restaurant_id, lower(code));
