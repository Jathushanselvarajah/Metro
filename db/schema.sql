-- Minimal schema for Dernier Metro API
-- One simple table: config(key text primary key, value jsonb)

CREATE TABLE IF NOT EXISTS public.config (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);


