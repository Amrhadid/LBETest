/**
 * Country / network context from the Cloudflare edge request (#4). SERVER ONLY.
 *
 * `getCloudflareContext().cf` carries geo + AS metadata Cloudflare attaches to
 * every request (country, ASN, and the AS organization name). We log it on the
 * attempt and flag requests that originate from datacenter/hosting networks —
 * a common tell for VPNs/proxies used to mask a candidate's real location.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { looksLikeDatacenter } from "@/lib/exam/trust";

export interface RequestNetwork {
  country: string | null; // ISO-3166 alpha-2, e.g. "MA"
  asn: string | null; // autonomous system number as text, e.g. "13335"
  network: string | null; // AS organization name, e.g. "CLOUDFLARENET"
  isDatacenter: boolean;
}

/** Read country/ASN/organization from the current Cloudflare request. */
export function readRequestNetwork(): RequestNetwork {
  let cf: Record<string, unknown> = {};
  try {
    cf = (getCloudflareContext().cf ?? {}) as unknown as Record<string, unknown>;
  } catch {
    // Not inside a Cloudflare request (build/dev) — nothing to read.
  }

  const country =
    typeof cf.country === "string" && cf.country !== "T1" ? cf.country : null;
  const asnRaw = cf.asn;
  const asn =
    asnRaw == null ? null : String(asnRaw);
  const org =
    typeof cf.asOrganization === "string" ? cf.asOrganization : null;

  return {
    country,
    asn,
    network: org,
    isDatacenter: looksLikeDatacenter(org),
  };
}
