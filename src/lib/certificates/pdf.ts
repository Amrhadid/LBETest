/**
 * Certificate PDF generation — Cloudflare Workers / edge-safe.
 *
 * Verified to run on the Worker runtime with no Node-only APIs:
 *  - pdf-lib with StandardFonts (Helvetica) → no fontkit, no font fetch.
 *  - qrcode's `create()` gives a pure module matrix; we draw the QR by filling
 *    squares directly into the PDF (no canvas, no PNG encoder, no fs).
 *  - Returns a Uint8Array ready to upload to Storage.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const NAVY = rgb(0.043, 0.165, 0.290); // #0B2A4A
const TEAL = rgb(0.071, 0.702, 0.651); // #12B3A6
const GOLD = rgb(0.957, 0.718, 0.251); // #F4B740
const GREY = rgb(0.42, 0.47, 0.53);

export interface CertificatePdfInput {
  candidateName: string;
  level: number; // 1..5
  levelName: string;
  /** Raw score (correct answers), e.g. 34 out of totalItems. */
  score: number;
  totalItems: number;
  certCode: string;
  issuedAt: Date;
  /** Absolute URL the QR encodes, e.g. https://lbetest.com/verify/<code>. */
  verifyUrl: string;
}

/** Draw a QR code for `url` as filled squares within the given box. */
function drawQr(
  page: import("pdf-lib").PDFPage,
  url: string,
  x: number,
  y: number,
  box: number,
) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const px = box / size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) {
        page.drawRectangle({
          x: x + c * px,
          // PDF origin is bottom-left; QR rows run top→bottom.
          y: y + (size - 1 - r) * px,
          width: px,
          height: px,
          color: NAVY,
        });
      }
    }
  }
}

export async function generateCertificatePdf(
  input: CertificatePdfInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`LBE Certificate — ${input.certCode}`);
  pdf.setProducer("LBETest.com");

  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);

  // Border frame.
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: GOLD,
    borderWidth: 2,
  });

  const centerText = (
    text: string,
    y: number,
    size: number,
    font = reg,
    color = NAVY,
  ) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centerText("LOCRATIV BUSINESS ENGLISH", height - 96, 13, bold, TEAL);
  centerText("Certificate of Proficiency", height - 150, 34, bold, NAVY);
  centerText("This certifies that", height - 210, 13, reg, GREY);
  centerText(input.candidateName || "Candidate", height - 258, 30, bold, NAVY);
  centerText(
    "has demonstrated Business English proficiency at",
    height - 306,
    13,
    reg,
    GREY,
  );
  centerText(
    `LBE ${input.level} — ${input.levelName}`,
    height - 352,
    26,
    bold,
    TEAL,
  );
  centerText(
    `Score: ${input.score} / ${input.totalItems}`,
    height - 392,
    14,
    reg,
    NAVY,
  );

  // Footer: issue date + verification code (left), QR (right).
  const issued = input.issuedAt.toISOString().slice(0, 10);
  page.drawText(`Issued: ${issued}`, {
    x: 60,
    y: 90,
    size: 11,
    font: reg,
    color: GREY,
  });
  page.drawText(`Verification code: ${input.certCode}`, {
    x: 60,
    y: 70,
    size: 11,
    font: bold,
    color: NAVY,
  });
  page.drawText("Verify at lbetest.com/verify", {
    x: 60,
    y: 52,
    size: 9,
    font: reg,
    color: GREY,
  });

  drawQr(page, input.verifyUrl, width - 150, 52, 92);

  return pdf.save();
}
