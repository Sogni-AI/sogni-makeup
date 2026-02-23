/**
 * Image Processing Utilities
 *
 * Provides common image manipulation functions for the Sogni Makeover app
 * including resizing, compression, format conversion, cropping, and validation.
 */

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Resize an image file while maintaining its aspect ratio.
 * The output dimensions will not exceed maxWidth x maxHeight.
 * Returns a new File with the resized image in its original format (or PNG for non-JPEG/WebP).
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Calculate the scale factor to fit within max dimensions
  const scale = Math.min(1, maxWidth / origW, maxHeight / origH);

  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  // If no resize needed, return the original
  if (scale >= 1) {
    bitmap.close();
    return file;
  }

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to get 2d context for image resize');
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const outputType = ACCEPTED_IMAGE_TYPES.includes(file.type) ? file.type : 'image/png';
  const blob = await canvas.convertToBlob({ type: outputType, quality: 0.92 });
  return new File([blob], file.name, { type: outputType, lastModified: Date.now() });
}

/**
 * Compress an image file using JPEG encoding at the specified quality (0-1).
 * Non-JPEG inputs will be converted to JPEG.
 */
export async function compressImage(
  file: File,
  quality: number
): Promise<File> {
  const clampedQuality = Math.max(0, Math.min(1, quality));
  const bitmap = await createImageBitmap(file);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to get 2d context for image compression');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: clampedQuality });

  // Derive a .jpg filename
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Convert a File to a base64 data URL string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 data URL string back to a Blob.
 * Accepts strings with or without the data URL prefix.
 */
export function base64ToBlob(base64: string): Blob {
  let mimeType = 'application/octet-stream';
  let data = base64;

  // Parse data URL prefix if present
  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    data = match[2];
  }

  const byteString = atob(data);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteArray], { type: mimeType });
}

/**
 * Center-crop an image to a 4:5 aspect ratio (portrait).
 * Fits the largest 4:5 rectangle inside the original image.
 */
export async function cropToPortrait(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const TARGET_RATIO = 4 / 5;

  // Already 4:5
  if (Math.abs(width / height - TARGET_RATIO) < 0.001) {
    bitmap.close();
    return file;
  }

  let cropW: number, cropH: number;
  if (width / height > TARGET_RATIO) {
    // Image is wider than 4:5 — height is the constraint
    cropH = height;
    cropW = Math.round(height * TARGET_RATIO);
  } else {
    // Image is taller than 4:5 — width is the constraint
    cropW = width;
    cropH = Math.round(width / TARGET_RATIO);
  }

  const offsetX = Math.round((width - cropW) / 2);
  const offsetY = Math.round((height - cropH) / 2);

  const canvas = new OffscreenCanvas(cropW, cropH);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to get 2d context for portrait crop');
  }

  ctx.drawImage(bitmap, offsetX, offsetY, cropW, cropH, 0, 0, cropW, cropH);
  bitmap.close();

  const outputType = ACCEPTED_IMAGE_TYPES.includes(file.type) ? file.type : 'image/png';
  const blob = await canvas.convertToBlob({ type: outputType, quality: 0.92 });
  return new File([blob], file.name, { type: outputType, lastModified: Date.now() });
}

/**
 * Validate an image file for type and size constraints.
 *
 * Accepted types: JPEG, PNG, WebP
 * Maximum size: 10 MB
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Accepted types: JPG, PNG, WebP.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size ${sizeMB} MB exceeds the maximum of 10 MB.`
    };
  }

  return { valid: true };
}
