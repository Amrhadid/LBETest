/**
 * Official LBE Test certificate renderer — Cloudflare Workers / edge-safe.
 *
 * The design is the uploaded artwork (`public/LBETemplate.jpg`, a blank
 * A4-portrait template). We embed it as a full-page background and overlay ONLY
 * the dynamic fields at coordinates measured by scanning the template pixels
 * (see the detection tooling). Everything else — logo, seal, signature, borders,
 * skill icons, and all fixed text — is baked into the template.
 *
 * Dynamic: candidate name, optional candidate photo, score, level number, level
 * name, level description, certificate id, candidate id, issue date, valid until,
 * and the verify QR. `templatePng` is supplied by the caller (ASSETS binding at
 * runtime; disk in the preview tooling).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

const INK = rgb(0.055, 0.122, 0.239); // deep navy
const GOLD = rgb(0.776, 0.541, 0.118);
const BODY = rgb(0.16, 0.2, 0.26);

// A4 portrait points; the template art has the same aspect ratio (1055×1491).
const W = 595.28;
const H = 841.89;

export interface CertificatePdfInput {
  candidateName: string;
  /** Optional candidate photo (JPEG or PNG bytes). Box left blank if absent. */
  candidatePhoto?: Uint8Array | null;
  /** Percentage score, 0–100. */
  score: number;
  level: number;
  levelName: string;
  levelDescription: string;
  /** Certificate ID (public code). */
  certCode: string;
  /** Candidate ID (the candidate's stable identifier). */
  candidateId: string;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
}

/**
 * Field geometry as fractions of the page, measured from the TOP-LEFT of the
 * template by scanning its pixels. `line` fractions are the detected underline
 * positions; text baselines sit a small gap ABOVE them so the line reads as an
 * underline. Boxes are [left, top, right, bottom].
 */
const POS = {
  name: { cx: 0.487, line: 0.3587, size: 30, maxW: 0.50 },
  photo: { l: 0.774, t: 0.263, r: 0.909, b: 0.401 },
  score: { rightX: 0.333, line: 0.577, size: 46 },
  levelNum: { leftX: 0.792, baseline: 0.558, size: 58 },
  levelName: { line: 0.5802, size: 15, maxW: 0.30 },
  desc1: { cx: 0.5015, line: 0.6277, size: 11.5 },
  desc2: { cx: 0.5015, line: 0.6502, size: 11.5 },
  certId: { cx: 0.171, line: 0.8135, size: 10 },
  candId: { cx: 0.397, line: 0.8135, size: 10 },
  issue: { cx: 0.606, line: 0.8135, size: 10 },
  validUntil: { cx: 0.812, line: 0.8135, size: 10 },
  qr: { l: 0.747, t: 0.834, size: 0.126 },
} as const;

/**
 * Left edge (page-width fraction) of the baked "LBE" wordmark next to the
 * dynamic level number, measured by scanning the template art. "QUALIFIED"
 * (or any level name) is centred between this and the dynamic level number's
 * drawn right edge — NOT a hardcoded fraction — so it stays centred under
 * "LBE <n>" regardless of the level digit's width.
 */
const LBE_WORDMARK_LEFT_X = 0.5498;

/** ~3pt gap so the baseline sits above the underline (not through the text). */
const GAP = 3 / H;

function shortDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(d).toUpperCase();
}

/** Draw `text` centred on cx, baseline `top` fraction from the page top. */
function centerAt(page: PDFPage, font: PDFFont, text: string, cx: number, top: number, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx * W - w / 2, y: H * (1 - top), size, font, color });
}

/** Shrink `size` until `text` fits within `maxWFrac` of the page width. */
function fit(font: PDFFont, text: string, size: number, maxWFrac: number, min = 10) {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > maxWFrac * W) s -= 0.5;
  return s;
}

/** Wrap text to at most two lines that each fit `maxWFrac` of the page width. */
function wrapTwo(font: PDFFont, text: string, size: number, maxWFrac: number): [string, string] {
  const words = text.split(/\s+/);
  const maxW = maxWFrac * W;
  let l1 = "";
  let i = 0;
  for (; i < words.length; i++) {
    const t = l1 ? `${l1} ${words[i]}` : words[i];
    if (font.widthOfTextAtSize(t, size) > maxW && l1) break;
    l1 = t;
  }
  const l2 = words.slice(i).join(" ");
  return [l1, l2];
}

function drawQr(page: PDFPage, url: string, leftFrac: number, topFrac: number, sizeFrac: number) {
  const box = sizeFrac * W;
  const x = leftFrac * W;
  const y = H * (1 - topFrac) - box;
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const p = box / n;
  page.drawRectangle({ x, y, width: box, height: box, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.data[r * n + c]) {
        page.drawRectangle({ x: x + c * p, y: y + (n - 1 - r) * p, width: p + 0.05, height: p + 0.05, color: INK });
      }
    }
  }
}

async function embedPhoto(pdf: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await pdf.embedJpg(bytes);
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await pdf.embedPng(bytes);
  } catch {
    /* unsupported/corrupt image — leave the box blank */
  }
  return null;
}

export async function generateCertificatePdf(
  input: CertificatePdfInput,
  templatePng: Uint8Array,
  opts: { debug?: boolean; gridOnly?: boolean } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`LBE Certificate — ${input.certCode}`);
  pdf.setAuthor("LBE Test");
  pdf.setProducer("LBETest.com");

  const page = pdf.addPage([W, H]);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Embed by detected format: JPEG (FF D8) is embedded as-is (cheap); PNG is
  // decoded/re-encoded (kept for backward compatibility with a PNG template).
  const isJpeg = templatePng[0] === 0xff && templatePng[1] === 0xd8;
  const templateImg = isJpeg
    ? await pdf.embedJpg(templatePng)
    : await pdf.embedPng(templatePng);
  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  if (opts.gridOnly) {
    drawCalibration(page, sans);
    return pdf.save();
  }

  // Candidate name.
  const name = input.candidateName.trim().toUpperCase() || "CANDIDATE";
  centerAt(page, serifBold, name, POS.name.cx, POS.name.line - GAP, fit(serifBold, name, POS.name.size, POS.name.maxW, 14), INK);

  // Candidate photo (optional) — fills the framed box if present, otherwise a
  // faint "PHOTO" label so the empty box doesn't read as an unfinished layout.
  const bx = POS.photo.l * W, by = H * (1 - POS.photo.b);
  const bw = (POS.photo.r - POS.photo.l) * W, bh = (POS.photo.b - POS.photo.t) * H;
  const photoImg = input.candidatePhoto && input.candidatePhoto.length > 0
    ? await embedPhoto(pdf, input.candidatePhoto)
    : null;
  if (photoImg) {
    const inset = 2;
    page.drawImage(photoImg, { x: bx + inset, y: by + inset, width: bw - 2 * inset, height: bh - 2 * inset });
  } else {
    const label = "PHOTO";
    const size = 9;
    const w = sansBold.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: bx + (bw - w) / 2, y: by + bh / 2 - size / 2, size, font: sansBold, color: rgb(0.75, 0.75, 0.75),
    });
  }

  // Score (right-aligned just before the baked "/100").
  const scoreText = String(Math.round(input.score));
  page.drawText(scoreText, {
    x: POS.score.rightX * W - serifBold.widthOfTextAtSize(scoreText, POS.score.size),
    y: H * (1 - (POS.score.line - GAP)), size: POS.score.size, font: serifBold, color: INK,
  });

  // Level number after the baked "LBE" (gold), and level name on the line below.
  const levelDigits = String(input.level);
  page.drawText(levelDigits, {
    x: POS.levelNum.leftX * W, y: H * (1 - POS.levelNum.baseline), size: POS.levelNum.size, font: serifBold, color: GOLD,
  });
  const levelNumRightX = POS.levelNum.leftX + serifBold.widthOfTextAtSize(levelDigits, POS.levelNum.size) / W;
  const levelNameCx = (LBE_WORDMARK_LEFT_X + levelNumRightX) / 2;
  const lname = input.levelName.toUpperCase();
  centerAt(page, serifBold, lname, levelNameCx, POS.levelName.line - GAP, fit(serifBold, lname, POS.levelName.size, POS.levelName.maxW, 9), INK);

  // Level description (up to two centred lines).
  const [d1, d2] = wrapTwo(sans, input.levelDescription.trim(), POS.desc1.size, 0.52);
  if (d1) centerAt(page, sans, d1, POS.desc1.cx, POS.desc1.line - GAP, POS.desc1.size, BODY);
  if (d2) centerAt(page, sans, d2, POS.desc2.cx, POS.desc2.line - GAP, POS.desc2.size, BODY);

  // Bottom info row.
  centerAt(page, sansBold, input.certCode, POS.certId.cx, POS.certId.line - GAP, POS.certId.size, INK);
  centerAt(page, sansBold, input.candidateId || "—", POS.candId.cx, POS.candId.line - GAP, POS.candId.size, INK);
  centerAt(page, sansBold, shortDate(input.issuedAt), POS.issue.cx, POS.issue.line - GAP, POS.issue.size, INK);
  centerAt(page, sansBold, shortDate(input.expiresAt), POS.validUntil.cx, POS.validUntil.line - GAP, POS.validUntil.size, INK);

  drawQr(page, input.verifyUrl, POS.qr.l, POS.qr.t, POS.qr.size);

  if (opts.debug) drawCalibration(page, sans);

  return pdf.save();
}

// ---------------------------------------------------------------------------
// Calibration overlay (debug tooling only; never in production output).
// ---------------------------------------------------------------------------
function drawCalibration(page: PDFPage, font: PDFFont) {
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps, major = i % 4 === 0, x = f * W, yTop = H * (1 - f), t = major ? 0.6 : 0.25;
    page.drawRectangle({ x, y: 0, width: t, height: H, color: rgb(0, 0, 0.85), opacity: major ? 0.5 : 0.22 });
    page.drawRectangle({ x: 0, y: yTop, width: W, height: t, color: rgb(0.85, 0, 0), opacity: major ? 0.5 : 0.22 });
    if (major) {
      page.drawText(f.toFixed(2), { x: x + 0.5, y: H - 8, size: 5.5, font, color: rgb(0, 0, 0.85) });
      page.drawText(f.toFixed(2), { x: 1, y: yTop - 1.5, size: 5.5, font, color: rgb(0.85, 0, 0) });
    }
  }
}
