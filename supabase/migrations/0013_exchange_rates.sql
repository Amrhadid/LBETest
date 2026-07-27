-- =============================================================================
-- LBET — Exchange rate cache for live EGP→USD pricing display (step: pricing)
-- =============================================================================
-- Idempotent. Requires 0001+.
--
-- Stores the daily EGP→USD rate fetched by a scheduled job (Cloudflare Cron).
-- The pricing page reads the most recent row server-side; it never calls the
-- FX API on page load. Fixed EGP prices stay hardcoded in the app as the source
-- of truth — only the USD equivalent is derived from this rate.
-- =============================================================================

create table if not exists public.exchange_rates (
  id             uuid primary key default gen_random_uuid(),
  base_currency  text not null default 'EGP',
  quote_currency text not null default 'USD',
  rate           numeric not null,
  fetched_at     timestamptz not null default now()
);

create index if not exists idx_exchange_rates_fetched_at
  on public.exchange_rates (fetched_at desc);

alter table public.exchange_rates enable row level security;

-- The rate is non-sensitive; allow public read so the pricing page can render it.
drop policy if exists exchange_rates_public_read on public.exchange_rates;
create policy exchange_rates_public_read on public.exchange_rates
  for select using (true);

-- Writes happen only via the service-role scheduled job (bypasses RLS). No
-- client write grants.
revoke insert, update, delete on public.exchange_rates from anon, authenticated;

-- =============================================================================
-- End of migration.
-- =============================================================================
