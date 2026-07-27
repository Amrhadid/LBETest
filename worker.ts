// Custom Cloudflare Worker entry.
//
// OpenNext generates `.open-next/worker.js` (fetch handler only) on every build.
// To run a Cloudflare Cron Trigger we wrap that generated handler and add a
// `scheduled` handler, re-exporting its named exports (Durable Objects) so the
// deploy is unchanged apart from the added cron.
//
// This file is excluded from tsconfig because it imports the build-time
// generated worker; esbuild (wrangler) bundles it at deploy time.
//
// @ts-nocheck
import openNextWorker from "./.open-next/worker.js";
import { refreshExchangeRate } from "./src/lib/pricing/rate.server";

export default {
  fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    // Daily EGP→USD refresh. Defensive: never throws; a failure just leaves the
    // last cached rate in place.
    ctx.waitUntil(
      refreshExchangeRate(env).then((r) => {
        if (!r.ok) console.error("exchange-rate refresh failed:", r.error);
        else console.log("exchange-rate refreshed:", r.rate);
      }),
    );
  },
};

// Re-export Durable Object classes (and any other named exports) the OpenNext
// worker declares, so bindings continue to resolve.
export * from "./.open-next/worker.js";
