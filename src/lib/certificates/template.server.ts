/**
 * Load the certificate background artwork at runtime. SERVER/EDGE ONLY.
 *
 * The blank template (`public/Certificate-template.png`) is served as a static
 * asset via the Cloudflare ASSETS binding, so we fetch it at generation time
 * rather than bundling ~1.5 MB of base64 into the Worker. `generateCertificatePdf`
 * takes the bytes as an argument, keeping it pure/testable.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

const TEMPLATE_PATH = "/Certificate-template.png";

export async function loadCertificateTemplate(): Promise<Uint8Array> {
  const { env } = getCloudflareContext();
  const assets = (env as unknown as {
    ASSETS?: { fetch: (req: Request) => Promise<Response> };
  }).ASSETS;
  if (!assets) {
    throw new Error("ASSETS binding unavailable — cannot load certificate template.");
  }
  const res = await assets.fetch(
    new Request(`https://assets.local${TEMPLATE_PATH}`),
  );
  if (!res.ok) {
    throw new Error(`Certificate template asset returned ${res.status}.`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
