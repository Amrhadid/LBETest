/**
 * Server-side read + refresh of the cached EGP→USD rate. SERVER/EDGE ONLY
 * (no Node APIs — deploys to Cloudflare Workers).
 */

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { EXCHANGE_RATE_API } from "@/lib/pricing/exchange-rate";

/** Read the most recent cached rate. Returns null if none/unavailable. */
export async function getLatestUsdRate(): Promise<number | null> {
  const { url, anonKey, serviceKey } = getServerSupabaseEnv();
  const key = serviceKey ?? anonKey; // public read policy allows anon
  if (!url || !key) return null;
  try {
    const supa = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supa
      .from("exchange_rates")
      .select("rate")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const rate = data?.rate != null ? Number(data.rate) : null;
    return rate && Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}

interface SupabaseEnvLike {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

/**
 * Fetch the current EGP→USD rate and append it to exchange_rates. Fully
 * defensive: on ANY failure it returns { ok: false } and never throws, so the
 * pricing page keeps showing the last cached value.
 *
 * `env` is passed by the Cron scheduled handler (which has no request context);
 * route handlers can omit it and fall back to the request-time env.
 */
export async function refreshExchangeRate(
  env?: SupabaseEnvLike,
): Promise<{ ok: boolean; rate?: number; error?: string }> {
  const fallback = env ? { url: undefined, serviceKey: undefined } : getServerSupabaseEnv();
  const url = env?.NEXT_PUBLIC_SUPABASE_URL ?? fallback.url;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY ?? fallback.serviceKey;
  if (!url || !key) return { ok: false, error: "supabase env missing" };

  try {
    const res = await fetch(EXCHANGE_RATE_API, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { ok: false, error: `api status ${res.status}` };

    const data = (await res.json()) as {
      result?: string;
      rates?: { USD?: number };
    };
    const rate = data?.rates?.USD;
    if (rate == null || !Number.isFinite(rate) || rate <= 0) {
      return { ok: false, error: "no valid USD rate in response" };
    }

    const supa = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supa
      .from("exchange_rates")
      .insert({ base_currency: "EGP", quote_currency: "USD", rate });
    if (error) return { ok: false, error: error.message };

    return { ok: true, rate };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }
}
