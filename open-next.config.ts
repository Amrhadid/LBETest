import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext Cloudflare adapter config. Defaults are fine for a marketing site;
// when Supabase-backed features arrive, wire an R2/KV incremental cache and
// tags cache here (see https://opennext.js.org/cloudflare/caching).
export default defineCloudflareConfig();
