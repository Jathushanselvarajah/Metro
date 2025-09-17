-- Seed values for Dernier Metro API
-- Safe to re-run: upserts on conflict

INSERT INTO public.config (key, value) VALUES 
('metro.last', '{"Chatelet": "01:15", "Nation": "01:20"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

