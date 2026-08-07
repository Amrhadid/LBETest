import { CERT_PHOTO_ASPECT } from "@/lib/certificates/photoBox";

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

/**
 * Renders the cropped region of `imageSrc` at a fixed output resolution
 * matching the certificate photo box's aspect ratio, returning a JPEG blob
 * ready to upload as-is.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CropPixels,
  outputWidth = 600,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const outputHeight = Math.round(outputWidth / CERT_PHOTO_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image."))),
      "image/jpeg",
      0.92,
    );
  });
}
