/** Official portrait certificate renderer (Cloudflare Workers / edge-safe). */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { DIRECTOR_SIGNATURE_PNG_BASE64 } from "@/lib/certificates/assets";

const INK = rgb(0.012, 0.125, 0.227); // Locrativ Ink #03203A
const TRUST = rgb(0.016, 0.278, 0.396); // Trust Blue #044765
const TEAL = rgb(0, 0.565, 0.55); // Signal Teal #00908C
const GOLD = rgb(0.776, 0.541, 0.118); // brand Gold #C68A1E
const PAPER = rgb(0.992, 0.982, 0.957);
const BODY = rgb(0.12, 0.16, 0.2);

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

function centered(page: PDFPage, font: PDFFont, text: string, y: number, size: number, color = INK) {
  page.drawText(text, { x: (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });
}

function fitted(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum = 14) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function drawQr(page: PDFPage, url: string, x: number, y: number, box: number) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const quiet = 4;
  const px = box / (qr.modules.size + quiet * 2);
  page.drawRectangle({ x, y, width: box, height: box, color: rgb(1, 1, 1) });
  for (let row = 0; row < qr.modules.size; row++) for (let col = 0; col < qr.modules.size; col++) {
    if (qr.modules.data[row * qr.modules.size + col]) page.drawRectangle({
      x: x + (col + quiet) * px,
      y: y + (qr.modules.size - 1 - row + quiet) * px,
      width: px + 0.05, height: px + 0.05, color: INK,
    });
  }
}

function seal(page: PDFPage, x: number, y: number, radius: number, bold: PDFFont, reg: PDFFont) {
  page.drawCircle({ x, y, size: radius, color: GOLD });
  page.drawCircle({ x, y, size: radius - 5, color: PAPER, borderColor: rgb(.88, .7, .33), borderWidth: 1 });
  page.drawCircle({ x, y, size: radius - 9, color: rgb(.97, .9, .69), borderColor: GOLD, borderWidth: 1 });
  centeredAt(page, bold, "OFFICIAL", x, y + 9, 6.5, INK);
  centeredAt(page, bold, "LBE TEST", x, y, 6.5, INK);
  centeredAt(page, bold, "CERTIFICATE", x, y - 9, 6.2, INK);
  centeredAt(page, reg, "★", x, y + 19, 8, GOLD);
}

function centeredAt(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size: number, color = INK) {
  page.drawText(text, { x: x - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });
}

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`LBE Certificate — ${input.certCode}`);
  pdf.setAuthor("Locrativ Business English Test");
  pdf.setProducer("LBETest.com");
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const display = await pdf.embedFont(StandardFonts.TimesRoman);
  const displayBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER });
  // Navy / teal / gold security frame.
  page.drawRectangle({ x: 10, y: 10, width: width - 20, height: height - 20, borderColor: TRUST, borderWidth: 8 });
  page.drawRectangle({ x: 15, y: 15, width: width - 30, height: height - 30, borderColor: GOLD, borderWidth: 2 });
  page.drawRectangle({ x: 19, y: 19, width: width - 38, height: height - 38, borderColor: INK, borderWidth: .7 });
  // Folded upper-left brand corner.
  page.drawSvgPath("M 19 823 L 19 680 L 163 823 Z", { color: INK });
  page.drawSvgPath("M 19 705 L 19 680 L 163 823 L 138 823 Z", { color: TEAL });
  page.drawSvgPath("M 19 692 L 19 680 L 163 823 L 151 823 Z", { color: GOLD });
  // Gold award ribbon.
  page.drawRectangle({ x: 481, y: 737, width: 67, height: 86, color: rgb(.76, .53, .2), borderColor: GOLD, borderWidth: 1 });
  page.drawSvgPath("M 481 737 L 514.5 756 L 548 737 L 548 823 L 481 823 Z", { color: rgb(.78, .57, .28), borderColor: rgb(.91,.74,.4), borderWidth: 1 });
  seal(page, 514.5, 761, 39, bold, reg);

  // Fixed logo lockup.
  centered(page, bold, "LBE", 762, 35, INK);
  page.drawRectangle({ x: 323, y: 769, width: 51, height: 21, color: TEAL });
  page.drawText("TEST", { x: 329, y: 774, size: 13, font: bold, color: rgb(1,1,1) });
  centered(page, bold, "BUSINESS ENGLISH TEST", 744, 9, TEAL);
  centered(page, display, "C E R T I F I C A T E", 676, 37, INK);
  centered(page, bold, "◆   O F   A C H I E V E M E N T   ◆", 642, 12, INK);

  // Restrained dotted world-map watermark.
  const map = [[115,548,70,22],[176,568,55,25],[235,535,38,16],[307,552,42,19],[358,567,35,17],[414,542,68,25],[466,575,42,18],[169,509,40,17],[358,510,45,16],[443,493,35,20]];
  for (const [cx,cy,rx,ry] of map) for (let yy=-ry; yy<=ry; yy+=5) for (let xx=-rx; xx<=rx; xx+=5) if ((xx*xx)/(rx*rx)+(yy*yy)/(ry*ry)<1 && ((xx+yy)/5)%3!==0) page.drawCircle({ x:cx+xx, y:cy+yy, size:1, color:rgb(.88,.87,.83), opacity:.45 });

  centered(page, reg, "—   THIS CERTIFIES THAT   —", 605, 9.5, BODY);
  const name = input.candidateName.trim() || "Candidate";
  centered(page, display, name, 555, fitted(display, name, 430, 34), INK);
  page.drawLine({ start:{x:158,y:534}, end:{x:437,y:534}, thickness:.6, color:GOLD });
  centered(page, reg, "HAS SUCCESSFULLY COMPLETED THE", 505, 9, BODY);
  centered(page, bold, "BUSINESS ENGLISH TEST", 481, 17, TEAL);

  // Level plaque.
  page.drawSvgPath("M 224 460 L 211 438 L 224 416 L 371 416 L 384 438 L 371 460 Z", { color:INK, borderColor:GOLD, borderWidth:1.5 });
  centered(page, displayBold, `LBE ${input.level}`, 432, 25, rgb(.9,.68,.31));
  centered(page, bold, input.levelName.toUpperCase(), 419, fitted(bold,input.levelName.toUpperCase(),145,9.5,7), rgb(1,1,1));
  centered(page, reg, "—   Qualified   —", 393, 13, TEAL);
  centered(page, reg, "Demonstrating strong Business English skills", 377, 8, BODY);
  centered(page, reg, "in real workplace situations.", 365, 8, BODY);

  // Score and fixed competency panel; Helvetica digits use stable tabular widths.
  page.drawRectangle({ x:108,y:276,width:379,height:75,color:rgb(1,.995,.98),borderColor:GOLD,borderWidth:.7 });
  page.drawLine({ start:{x:298,y:289},end:{x:298,y:339},thickness:.6,color:GOLD });
  page.drawText("YOUR SCORE",{x:180,y:329,size:8,font:bold,color:TEAL});
  page.drawText(String(Math.round(input.score)).padStart(2,"0"),{x:180,y:292,size:31,font:bold,color:INK});
  page.drawText("/100",{x:239,y:294,size:15,font:reg,color:INK});
  page.drawText("CORE COMPETENCIES EVALUATED",{x:316,y:329,size:7.2,font:bold,color:TEAL});
  const competencies = [
    { x: 316, y: 311, label: "Reading" },
    { x: 397, y: 311, label: "Listening" },
    { x: 316, y: 296, label: "Writing" },
    { x: 397, y: 296, label: "Speaking" },
    { x: 316, y: 281, label: "Business Knowledge" },
  ];
  for (const competency of competencies) {
    page.drawCircle({ x: competency.x + 3, y: competency.y + 3, size: 2.2, color: GOLD });
    page.drawText(competency.label,{x:competency.x+11,y:competency.y,size:7.5,font:bold,color:INK});
  }

  const info=[{x:130,label:"DATE",a:shortDate(input.issuedAt)},{x:244,label:"CERTIFICATE ID",a:input.certCode},{x:360,label:"VALIDITY",a:"1 Year",b:`(Until ${shortDate(input.expiresAt)})`},{x:469,label:"STATUS",a:"Verified"}];
  for(const item of info){centeredAt(page,bold,item.label,item.x,239,7,TEAL);centeredAt(page,reg,item.a,item.x,223,fitted(reg,item.a,98,8.5,6.5),BODY);if(item.b)centeredAt(page,reg,item.b,item.x,211,7,BODY)}
  for(const x of [187,301,416])page.drawLine({start:{x,y:214},end:{x,y:255},thickness:.5,color:rgb(.68,.7,.7)});

  // The approved transparent signature asset is embedded, never typeset/redrawn.
  const signatureBytes = Uint8Array.from(atob(DIRECTOR_SIGNATURE_PNG_BASE64), (c) => c.charCodeAt(0));
  const signature = await pdf.embedPng(signatureBytes);
  page.drawImage(signature,{x:58,y:119,width:138,height:65});
  page.drawLine({start:{x:50,y:126},end:{x:204,y:126},thickness:.6,color:GOLD});
  centeredAt(page,bold,"Amr Hadid",127,108,10,INK); centeredAt(page,reg,"DIRECTOR",127,94,7,BODY); centeredAt(page,bold,"LBE TEST",127,81,7,TEAL);
  seal(page, 298, 119, 37, bold, reg);
  drawQr(page,input.verifyUrl,397,91,61);
  page.drawText("VERIFY CERTIFICATE",{x:466,y:130,size:6.5,font:bold,color:TEAL});
  page.drawText("Scan the QR code or visit",{x:466,y:117,size:6,font:reg,color:BODY});
  page.drawText("LBETest.com/verify",{x:466,y:105,size:6,font:reg,color:BODY});

  // Permanent footer bar.
  page.drawSvgPath("M 83 19 L 113 54 L 482 54 L 512 19 Z",{color:INK});
  centered(page,bold,"RELIABLE     •     SECURE     •     RECOGNIZED GLOBALLY",35,7.5,rgb(1,1,1));
  centered(page,bold,"THE WORLD’S FIRST BUSINESS ENGLISH PROFICIENCY TEST",23,7,GOLD);
  return pdf.save();
}
