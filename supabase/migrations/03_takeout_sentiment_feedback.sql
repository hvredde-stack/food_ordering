-- =============================================================
-- Migration 03: allow sentiment_events and feedback to omit table_id
-- =============================================================
-- For takeout sessions, table_id is null. The original schema declared
-- both table_id columns NOT NULL, which made the happy/sad buttons and
-- the end-of-visit feedback form fail with a 500 for takeout customers.
--
-- Idempotent.
-- =============================================================

alter table sentiment_events alter column table_id drop not null;
alter table feedback         alter column table_id drop not null;
