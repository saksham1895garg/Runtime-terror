/**
 * Server-side ImageKit client for authenticated media uploads.
 * 
 * IMPORTANT: This file must ONLY be imported in server-side code (API routes, server components).
 * The private key must NEVER be exposed to the browser.
 * 
 * Upload flow:
 * 1. Browser requests upload authentication params from our API
 * 2. Our API signs the request using the private key
 * 3. Browser uploads directly to ImageKit using signed params
 * 4. Browser sends back the media metadata to our API
 * 5. Our API stores the metadata in Supabase
 */

import ImageKit from 'imagekit';

let imagekitInstance: ImageKit | null = null;

export function getImageKit(): ImageKit {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      'Missing ImageKit environment variables. Check IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env.local'
    );
  }

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitInstance;
}

/**
 * Generate authentication parameters for client-side upload.
 * Returns token, expire, and signature that the browser needs
 * to upload directly to ImageKit.
 */
export function getUploadAuthParams() {
  const ik = getImageKit();
  return ik.getAuthenticationParameters();
}

/**
 * Validate uploaded media constraints.
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 50,
  MAX_FILES_PER_REPORT: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
} as const;

export function validateFileType(mimeType: string): boolean {
  return [
    ...UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
    ...UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES,
  ].includes(mimeType as any);
}

export function validateFileSize(sizeBytes: number, isVideo: boolean): boolean {
  const maxMB = isVideo ? UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB : UPLOAD_LIMITS.MAX_FILE_SIZE_MB;
  return sizeBytes <= maxMB * 1024 * 1024;
}
