/**
 * Load the certificate background artwork at runtime. SERVER/EDGE ONLY.
 *
 * The template is served as a static asset (`public/LBETemplate.jpg`). JPEG,
 * not PNG: pdf-lib embeds JPEG bytes directly (no pixel decode), so certificate
 * generation stays cheap enough for the Worker's CPU budget — a large PNG made
 * pdf-lib inflate ~1.5M pixels and blew the resource limit.
 *
 * We fetch it via the Cloudflare ASSETS binding, and fall back to an HTTPS fetch
 * of the public asset if that binding isn't available. `generateCertificatePdf`
 * takes the bytes as an argument, keeping it pure/testable.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { siteConfig } from "@/lib/site";

const TEMPLATE_PATH = "/LBETemplate.jpg";

export async function loadCertificateTemplate(): Promise<Uint8Array> {
  // Preferred: the Cloudflare ASSETS binding (no external request).
  try {
    const { env } = getCloudflareContext();
    const assets = (env as unknown as {
      ASSETS?: { fetch: (req: Request) => Promise<Response> };
    }).ASSETS;
    if (assets) {
      const res = await assets.fetch(
        new Request(`https://assets.local${TEMPLATE_PATH}`),
      );
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    // Not in a Cloudflare context, or the binding failed — fall back below.
  }

  // Fallback: fetch the public asset over HTTPS from our own site.
  const res = await fetch(`https://${siteConfig.domain}${TEMPLATE_PATH}`);
  if (!res.ok) {
    throw new Error(`Certificate template asset returned ${res.status}.`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
