import { NextResponse } from "next/server";

import { refreshExchangeRate } from "@/lib/pricing/rate.server";

export const dynamic = "force-dynamic";

/**
 * Refresh the cached EGP→USD rate. Invoked by the daily Cloudflare Cron (via the
 * Worker's scheduled handler) and available for a manual refresh. Never throws;
 * a failed fetch leaves the last cached rate in place.
 */
export async function GET() {
  const result = await refreshExchangeRate();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
