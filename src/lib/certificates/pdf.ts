/**
 * Official certificate renderer — Cloudflare Workers / edge-safe.
 *
 * The visual design is the uploaded artwork (`public/Certificate-template.png`,
 * a blank A4-portrait template). We embed it as a full-page background and
 * overlay ONLY the dynamic fields (name, level number, score, date, certificate
 * id, validity date, QR). This makes every generated certificate pixel-identical
 * to the approved design with only the variables swapped.
 *
 * `templatePng` is supplied by the caller: at runtime via the Cloudflare ASSETS
 * binding (see loadCertificateTemplate), and from disk in the preview tooling.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

const INK = rgb(0.012, 0.125, 0.227); // Locrativ Ink #03203A
const GOLD = rgb(0.855, 0.62, 0.18);

// A4 portrait points; the template art has the same aspect ratio (1054×1492).
const W = 595.28;
const H = 841.89;

export interface CertificatePdfInput {
  candidateName: string;
  level: number;
  levelName: string;
  /** Percentage score, from 0 through 100. */
  score: number;
  certCode: string;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
}

/**
 * Overlay field positions, as fractions of the page measured from the TOP-LEFT
 * of the template (so they map 1:1 to the artwork). Tune here if the art moves.
 */
const POS = {
  name: { cx: 0.5, top: 0.35, size: 34 },
  levelNum: { cx: 0.548, top: 0.507, size: 28 },
  // For underlined fields, `top` (the baseline) sits a ~3pt gap ABOVE the
  // detected underline so the line reads as an underline, not a strikethrough.
  // Detected line positions: score 0.7144, date/certId 0.8373, validity 0.8456.
  score: { rightX: 0.375, top: 0.71, size: 30 },
  date: { cx: 0.196, top: 0.834, size: 9 },
  certId: { cx: 0.388, top: 0.834, size: 8.5 },
  validityUntil: { cx: 0.605, top: 0.849, size: 7.5 },
  qr: { left: 0.662, top: 0.872, size: 0.083 }, // size = fraction of page width
};

function shortDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(d);
}

/** Draw `text` horizontally centred on `cx`, baseline at `top` (from page top). */
function centerAt(page: PDFPage, font: PDFFont, text: string, cx: number, top: number, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx * W - w / 2, y: H * (1 - top), size, font, color });
}

/** Draw the QR for `url` as filled squares inside a box (points, y from top). */
function drawQr(page: PDFPage, url: string, leftFrac: number, topFrac: number, sizeFrac: number) {
  const box = sizeFrac * W;
  const x = leftFrac * W;
  const yTop = H * (1 - topFrac); // top edge of the box in PDF coords
  const y = yTop - box; // bottom edge
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const px = box / n;
  page.drawRectangle({ x, y, width: box, height: box, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.data[r * n + c]) {
        page.drawRectangle({
          x: x + c * px,
          y: y + (n - 1 - r) * px,
          width: px + 0.05,
          height: px + 0.05,
          color: INK,
        });
      }
    }
  }
}

/**
 * Calibration overlay: a labelled fractional grid + a baseline/center marker for
 * every dynamic field, drawn on top of the artwork. Lets us read each field's
 * true slot position against the template in one render instead of guessing.
 * Only used by the debug tooling — never in production output.
 */
function drawCalibration(page: PDFPage, font: PDFFont) {
  const steps = 40; // every 0.025
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const major = i % 4 === 0; // every 0.10
    const x = f * W;
    const yTop = H * (1 - f);
    const t = major ? 0.6 : 0.25;
    // Grid lines drawn as thin filled rects (strokes don't rasterize reliably).
    page.drawRectangle({ x, y: 0, width: t, height: H, color: rgb(0, 0, 0.85), opacity: major ? 0.5 : 0.22 });
    page.drawRectangle({ x: 0, y: yTop, width: W, height: t, color: rgb(0.85, 0, 0), opacity: major ? 0.5 : 0.22 });
    if (major) {
      page.drawText(f.toFixed(2), { x: x + 0.5, y: H - 8, size: 5.5, font, color: rgb(0, 0, 0.85) });
      page.drawText(f.toFixed(2), { x: 1, y: yTop - 1.5, size: 5.5, font, color: rgb(0.85, 0, 0) });
    }
  }
  // Mark each field: a magenta baseline strip + its label.
  const mark = (label: string, cx: number, top: number, halfW = 0.06) => {
    const y = H * (1 - top);
    page.drawRectangle({ x: (cx - halfW) * W, y, width: 2 * halfW * W, height: 0.8, color: rgb(1, 0, 1), opacity: 0.9 });
    page.drawText(`${label} ${top.toFixed(3)}`, { x: (cx - halfW) * W, y: y + 2, size: 5, font, color: rgb(0.6, 0, 0.6) });
  };
  mark("name", POS.name.cx, POS.name.top);
  mark("level", POS.levelNum.cx, POS.levelNum.top, 0.03);
  mark("score", POS.score.rightX - 0.03, POS.score.top, 0.03);
  mark("date", POS.date.cx, POS.date.top);
  mark("certId", POS.certId.cx, POS.certId.top);
  mark("until", POS.validityUntil.cx, POS.validityUntil.top);
  // QR box outline (as 4 thin filled rects).
  const qx = POS.qr.left * W, qs = POS.qr.size * W, qyTop = H * (1 - POS.qr.top), qy = qyTop - qs;
  for (const r of [
    { x: qx, y: qy, width: qs, height: 1 }, { x: qx, y: qyTop, width: qs, height: 1 },
    { x: qx, y: qy, width: 1, height: qs }, { x: qx + qs, y: qy, width: 1, height: qs },
  ]) page.drawRectangle({ ...r, color: rgb(0, 0.6, 0), opacity: 0.9 });
}

export async function generateCertificatePdf(
  input: CertificatePdfInput,
  templatePng: Uint8Array,
  opts: { debug?: boolean; gridOnly?: boolean } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`LBE Certificate — ${input.certCode}`);
  pdf.setAuthor("Locrativ Business English Test");
  pdf.setProducer("LBETest.com");

  const page = pdf.addPage([W, H]);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Full-page artwork background.
  const bg = await pdf.embedPng(templatePng);
  page.drawImage(bg, { x: 0, y: 0, width: W, height: H });

  // --- Overlays (dynamic only) --------------------------------------------
  if (opts.gridOnly) {
    drawCalibration(page, sans);
    return pdf.save();
  }
  const name = input.candidateName.trim() || "Candidate";
  // Shrink the name to fit if it's long.
  let nameSize = POS.name.size;
  while (nameSize > 16 && serifBold.widthOfTextAtSize(name, nameSize) > 0.72 * W) nameSize -= 0.5;
  centerAt(page, serifBold, name, POS.name.cx, POS.name.top, nameSize, INK);

  // Level number inside the "LBE _" badge (gold on the navy plaque).
  centerAt(page, serifBold, String(input.level), POS.levelNum.cx, POS.levelNum.top, POS.levelNum.size, GOLD);

  // Score: right-aligned just before the baked "/100".
  const scoreText = String(Math.round(input.score));
  const sw = sansBold.widthOfTextAtSize(scoreText, POS.score.size);
  page.drawText(scoreText, {
    x: POS.score.rightX * W - sw,
    y: H * (1 - POS.score.top),
    size: POS.score.size,
    font: sansBold,
    color: INK,
  });

  centerAt(page, sans, shortDate(input.issuedAt), POS.date.cx, POS.date.top, POS.date.size, INK);
  centerAt(page, sans, input.certCode, POS.certId.cx, POS.certId.top, POS.certId.size, INK);
  centerAt(page, sans, shortDate(input.expiresAt), POS.validityUntil.cx, POS.validityUntil.top, POS.validityUntil.size, INK);

  drawQr(page, input.verifyUrl, POS.qr.left, POS.qr.top, POS.qr.size);

  if (opts.debug) drawCalibration(page, sans);

  return pdf.save();
}
