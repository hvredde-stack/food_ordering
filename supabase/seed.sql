-- =============================================================
-- Seed data — one demo restaurant. Replace owner_user_id with a
-- real Clerk user id before running, or leave it and update later
-- via the admin UI.
-- =============================================================

insert into restaurants (id, slug, name, description, owner_user_id, currency)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo',
  'Demo Bistro',
  'Sample restaurant seeded for local development.',
  'user_REPLACE_ME',
  'USD'
) on conflict (slug) do nothing;

insert into menu_categories (id, restaurant_id, name, position) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Starters',1),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Mains',2),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Desserts',3),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Drinks',4)
on conflict (id) do nothing;

insert into dishes (restaurant_id, category_id, name, description, price_cents, position) values
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Bruschetta','Toasted bread, tomato, basil',900,1),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Caesar Salad','Romaine, parmesan, croutons',1100,2),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Margherita Pizza','Tomato, mozzarella, basil',1600,1),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Spaghetti Carbonara','Egg, pancetta, pecorino',1800,2),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Grilled Salmon','Lemon butter, asparagus',2400,3),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','Tiramisu','Coffee, mascarpone, cocoa',900,1),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','Sparkling Water','500ml',400,1),
  ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','House Red','Glass',1100,2)
on conflict do nothing;

insert into restaurant_tables (restaurant_id, code, label, seats) values
  ('00000000-0000-0000-0000-000000000001','T-01','Window 1',2),
  ('00000000-0000-0000-0000-000000000001','T-02','Window 2',2),
  ('00000000-0000-0000-0000-000000000001','T-03','Booth A',4),
  ('00000000-0000-0000-0000-000000000001','T-04','Booth B',4),
  ('00000000-0000-0000-0000-000000000001','T-05','Patio 1',6)
on conflict (restaurant_id, code) do nothing;
