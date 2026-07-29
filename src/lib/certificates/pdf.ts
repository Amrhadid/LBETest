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
  name: { cx: 0.5, top: 0.352, size: 34 },
  levelNum: { cx: 0.541, top: 0.532, size: 26 },
  score: { rightX: 0.375, top: 0.716, size: 30 },
  date: { cx: 0.196, top: 0.83, size: 9 },
  certId: { cx: 0.388, top: 0.83, size: 8.5 },
  validityUntil: { cx: 0.612, top: 0.85, size: 7.5 },
  qr: { left: 0.66, top: 0.864, size: 0.083 }, // size = fraction of page width
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

export async function generateCertificatePdf(
  input: CertificatePdfInput,
  templatePng: Uint8Array,
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

  return pdf.save();
}
