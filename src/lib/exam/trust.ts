/**
 * Composite suspicion ("trust") scoring for an attempt — pure and testable.
 *
 * HIGHER = more suspicious. Admin-only; never shown to the candidate. Weights
 * live in one adjustable config object so tuning is a single edit, not magic
 * numbers scattered around.
 */

export interface TrustWeights {
  tabBlur: number; // per tab-blur event
  fullscreenExit: number; // per fullscreen exit
  violation: number; // per recorded violation (round-2 auto-punish)
  fastSection: number; // per section finished implausibly fast
  duplicateAnswer: number; // per open-ended answer near-identical to another candidate
  datacenter: number; // one-off: attempt came from a datacenter/hosting IP
  sharedFingerprint: number; // one-off: device fingerprint seen on other candidates
}

/** Adjustable weights. Tune here. */
export const DEFAULT_TRUST_WEIGHTS: TrustWeights = {
  tabBlur: 4,
  fullscreenExit: 4,
  violation: 8,
  fastSection: 12,
  duplicateAnswer: 20,
  datacenter: 15,
  sharedFingerprint: 25,
};

export const TRUST_MAX = 100;

export interface TrustSignals {
  tabBlur: number;
  fullscreenExit: number;
  violations: number;
  fastSections: number;
  duplicateAnswers: number;
  datacenter: boolean;
  sharedFingerprint: boolean;
}

export interface TrustResult {
  score: number; // 0..TRUST_MAX (higher = more suspicious)
  breakdown: Record<keyof TrustSignals, number>; // points contributed by each
}

export function computeTrustScore(
  s: TrustSignals,
  w: TrustWeights = DEFAULT_TRUST_WEIGHTS,
): TrustResult {
  const breakdown = {
    tabBlur: s.tabBlur * w.tabBlur,
    fullscreenExit: s.fullscreenExit * w.fullscreenExit,
    violations: s.violations * w.violation,
    fastSections: s.fastSections * w.fastSection,
    duplicateAnswers: s.duplicateAnswers * w.duplicateAnswer,
    datacenter: s.datacenter ? w.datacenter : 0,
    sharedFingerprint: s.sharedFingerprint ? w.sharedFingerprint : 0,
  };
  const raw = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score: Math.min(TRUST_MAX, Math.round(raw)), breakdown };
}

// ---------------------------------------------------------------------------
// Timing analysis (#2)
// ---------------------------------------------------------------------------

/** Realistic minimum seconds to complete a section, from reading + answering. */
export function sectionMinSeconds(
  sourceWordCount: number,
  itemCount: number,
  opts?: { readingWpm?: number; secondsPerItem?: number },
): number {
  const wpm = opts?.readingWpm ?? 200;
  const perItem = opts?.secondsPerItem ?? 8;
  return Math.round((sourceWordCount / wpm) * 60 + itemCount * perItem);
}

/** A section is "suspiciously fast" below this fraction of the realistic min. */
export const FAST_SECTION_FRACTION = 0.5;

export function isSectionFast(
  actualSeconds: number,
  minSeconds: number,
  fraction = FAST_SECTION_FRACTION,
): boolean {
  if (!Number.isFinite(actualSeconds) || actualSeconds <= 0) return false;
  return actualSeconds < minSeconds * fraction;
}

// ---------------------------------------------------------------------------
// Text similarity for duplicate-answer detection (#3)
// ---------------------------------------------------------------------------

export function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Jaccard similarity of two texts' word sets (0..1). Cheap, catches copy-paste. */
export function textSimilarity(a: string, b: string): number {
  const A = new Set(normalizeTokens(a));
  const B = new Set(normalizeTokens(b));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Answers at/above this similarity are flagged as possible collusion. */
export const DUPLICATE_THRESHOLD = 0.85;

// ---------------------------------------------------------------------------
// Datacenter / hosting-provider heuristic (#4)
// ---------------------------------------------------------------------------

const DATACENTER_HINTS = [
  "amazon", "aws", "google", "gcp", "microsoft", "azure", "digitalocean",
  "ovh", "hetzner", "linode", "vultr", "oracle", "alibaba", "tencent",
  "cloudflare", "leaseweb", "contabo", "scaleweb", "hosting", "datacenter",
  "data center", "colo", "server", "vps", "m247", "choopa", "hostinger",
];

/** Rough datacenter/hosting classification from the AS organization name. */
export function looksLikeDatacenter(asOrganization?: string | null): boolean {
  if (!asOrganization) return false;
  const s = asOrganization.toLowerCase();
  return DATACENTER_HINTS.some((h) => s.includes(h));
}
