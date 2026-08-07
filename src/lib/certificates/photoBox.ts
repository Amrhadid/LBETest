/**
 * Certificate photo box geometry, mirrored from `POS.photo` in `pdf.ts`
 * (page-width/height fractions). Kept in sync manually — if the template
 * artwork's photo box moves, update both places.
 */
const PHOTO_BOX = { l: 0.774, t: 0.263, r: 0.909, b: 0.401 } as const;
const PAGE_W = 595.28;
const PAGE_H = 841.89;

/**
 * Width/height ratio of the printed photo box. Client-side crops are locked
 * to this aspect so the final PDF draw (which stretches to fill the box,
 * see `pdf.ts`) never distorts the image.
 */
export const CERT_PHOTO_ASPECT =
  ((PHOTO_BOX.r - PHOTO_BOX.l) * PAGE_W) / ((PHOTO_BOX.b - PHOTO_BOX.t) * PAGE_H);
