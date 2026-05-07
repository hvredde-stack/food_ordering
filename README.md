# Food Ordering — multi-tenant SaaS restaurant platform

Four interfaces in one Next.js 15 app:

| Surface  | Path                       | Purpose                                  | Auth         |
| -------- | -------------------------- | ---------------------------------------- | ------------ |
| Customer | `/t/<slug>/<table-code>`   | Scan-to-order, live tracking, feedback   | Session cookie (no login) |
| Kitchen  | `/kitchen/<slug>`          | Real-time order queue, item status, sentiment pulse | Clerk + restaurant ownership |
| Server   | `/server`                  | Scan a table QR to mark it cleaned       | Clerk + restaurant ownership |
| Admin    | `/admin`                   | Menu, tables, orders, analytics          | Clerk + restaurant ownership |

Single Vercel deployment; route groups (`(customer)`, `(kitchen)`, `(server)`, `(admin)`) keep code isolated.

## Stack

- **Next.js 15** (App Router, Server Components)
- **Supabase** Postgres + Realtime (Postgres Changes)
- **Clerk** for admin auth only
- **S3-compatible** storage for dish images (works with AWS S3, Cloudflare R2, Backblaze B2, MinIO)
- **Tailwind CSS** + a tiny in-house UI kit
- **Recharts** for the analytics dashboard

## Setup

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run, in order:
   - `supabase/schema.sql`  — tables, indexes, triggers, realtime publication, analytics views
   - `supabase/policies.sql` — RLS
   - `supabase/seed.sql`     — optional demo data (one restaurant + tables + menu)
3. From **Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** (further down the page) → `SUPABASE_JWT_SECRET`

### 3. Clerk (admin / kitchen / server auth)

1. Create an app at clerk.com.
2. Copy publishable + secret keys into `.env.local`.
3. Set sign-in/up URLs as in `.env.example`.
4. **Activate the native Clerk ↔ Supabase integration** (this is what lets RLS see Clerk's session token without a shared JWT secret):
   - Open https://dashboard.clerk.com/setup/supabase → activate the integration. Copy the **Clerk Frontend API URL** (or "domain") it gives you.
   - In your Supabase dashboard → **Authentication** → **Sign In / Providers** → **Add provider** → **Clerk** → paste the Clerk domain and save.
   - That's the whole config. No session-template tweaks needed; the integration auto-adds `role: "authenticated"` to Clerk's tokens, and the Clerk user id arrives in RLS as `auth.jwt() ->> 'sub'`.

### 4. Storage (Supabase Storage)

In the Supabase dashboard → **Storage** → **New bucket**:
- Name: `dish-images` (or override via `SUPABASE_STORAGE_BUCKET`)
- **Public bucket: ON** (the menu is public, and we render images by their public URL)
- File size limit: ~5 MB is plenty for menu photos

The admin upload flow uses a service-role-signed upload URL; no extra CORS configuration is needed because uploads target your Supabase project directly.

### 5. Env

Copy `.env.example` to `.env.local` and fill in.

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000.

## End-to-end test path

1. Visit `/admin/sign-up`, create an account → you're redirected to `/admin`.
   - The first GET to `/api/admin/restaurant` auto-creates a restaurant for you.
2. Visit `/admin/menu` → add categories + dishes (upload images if S3 is wired up).
3. Visit `/admin/tables` → add tables (e.g. `T-01`). Each shows a printable QR.
4. Scan that QR (or click "Open") → you're at `/t/<slug>/T-01`. Confirm party size to start a session.
5. Order from `/menu` → submits at `/cart`.
6. Open `/kitchen/<slug>` (in another tab) → the order appears live. Click *Start* → *Ready* → *Served*.
7. The customer's `/order/<id>` page updates in real time.
8. Hit the floating Smile/Frown anytime — it shows on the kitchen dashboard pulse.
9. After all items are *Served*, fill out `/feedback`. Session ends.
10. From `/server`, scan the same table QR → any active session at that table is invalidated.
11. `/admin/analytics` shows volume, peak hours, top dishes, sentiment trend, and recent feedback.

## Key design notes

### Multi-tenancy & realtime authorization

Every domain table carries `restaurant_id`. Tenant scoping happens in three layers:

1. **Clerk middleware** gates `/admin`, `/kitchen`, `/server` (and their `/api/*` routes). Pages and APIs additionally enforce that the URL/body slug matches the signed-in user's owned restaurant — a Clerk user cannot read or mutate another tenant's data.
2. **Server-side API routes** use the Supabase **service role** and explicitly filter by the admin's restaurant (Clerk-derived) or the customer's session restaurant (cookie-derived).
3. **Realtime** is gated via the **native Clerk ↔ Supabase Third-Party Auth integration**. The browser uses Clerk's session token as the Supabase access token (via supabase-js's `accessToken` callback). Supabase verifies it against Clerk's JWKS — no shared secret is needed. RLS policies on `orders` / `order_items` / `sentiment_events` allow `authenticated` SELECT when `auth.jwt() ->> 'sub'` (the Clerk user id) matches the row's `restaurants.owner_user_id`.

   Customers don't have a Clerk session, so the customer order-tracking page **polls** the API every 4 s instead of subscribing — the session cookie keeps each request scoped to the customer's own order. This eliminates the need for symmetric JWT secrets entirely.

The public menu (`restaurants`, `menu_categories`, `dishes`, `restaurant_tables`) is readable by `anon`. `customer_sessions` and `feedback` have no read policy — they're only reachable through the API.

### Customer sessions (no auth)

- A POST to `/api/sessions` creates a `customer_sessions` row, sets a random token in an HTTP-only cookie, and returns the session.
- Every API call uses the cookie to look up the session, validate `status = 'active'` and `expires_at > now()`, and slide the expiry by `CUSTOMER_SESSION_TTL_SECONDS` (default 1800 = 30 min).
- Inactive sessions are flipped to `expired`. Server-cleaning flips them to `cleaned` immediately.

### Real-time

The customer order page, kitchen dashboard, and admin orders page all subscribe to `postgres_changes` filtered by `restaurant_id` (or `id` for a single order). The schema's `supabase_realtime` publication includes `orders`, `order_items`, `sentiment_events`, and `customer_sessions`.

### Order status rollup

A trigger (`sync_order_totals`) recomputes `orders.total_cents` and `orders.status` whenever an `order_item` is inserted/updated/deleted — so the order's overall status is always derived from its items.

### Analytics

`/api/admin/analytics` aggregates last-N-days of orders, items, sentiment, and feedback in a single round trip. For higher volumes, swap to the `v_*` views in `schema.sql` or to a materialized view.

## Project layout

```
.
├── middleware.ts                  Clerk gates /admin only
├── supabase/                      schema.sql, policies.sql, seed.sql
├── src/
│   ├── app/
│   │   ├── (customer)/            scan → menu → cart → tracking → feedback
│   │   ├── (kitchen)/             live queue
│   │   ├── (server)/              clean a table
│   │   ├── (admin)/               sign-in/up + dashboard
│   │   ├── api/                   sessions, menu, orders, sentiment,
│   │   │                          feedback, server/clean, kitchen/*, admin/*
│   │   ├── layout.tsx             root + Clerk provider
│   │   └── page.tsx               landing
│   ├── components/                ui kit, customer cart + sentiment
│   └── lib/                       env, supabase clients, session, auth, s3, utils
```

## What's intentionally minimal in v1

- **One Clerk user = one restaurant owner.** Multiple staff working the same restaurant currently share a Clerk login. Adding a `staff_members` table with roles (owner/kitchen/server) is the natural next step.
- **No payments** — the brief excluded them.
- **No printer integration.** Add it by listening to `INSERT` on `orders` from a server.
- **Analytics aggregation is computed on read.** Switch to a materialized view (already a `v_*` template in `schema.sql`) once volume grows.

## Scripts

- `npm run dev`       — start Next dev server
- `npm run build`     — production build
- `npm run typecheck` — TS only
- `npm run lint`      — Next/eslint
