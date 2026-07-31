export type UploadProgressCallback = (progress: number) => void;

export interface UploadedFile {
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export const VALID_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  zip: ['application/zip', 'application/x-zip-compressed']
};

export const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  zip: 50 * 1024 * 1024, // 50MB
};

export function validateFile(file: File): string | null {
  const { type, size } = file;

  if (VALID_FILE_TYPES.image.includes(type)) {
    if (size > MAX_SIZES.image) return `Image ${file.name} exceeds 10MB limit.`;
    return null;
  }
  if (VALID_FILE_TYPES.document.includes(type)) {
    if (size > MAX_SIZES.document) return `Document ${file.name} exceeds 25MB limit.`;
    return null;
  }
  if (VALID_FILE_TYPES.zip.includes(type)) {
    if (size > MAX_SIZES.zip) return `ZIP file ${file.name} exceeds 50MB limit.`;
    return null;
  }

  return `File type ${type} is not supported.`;
}

import { upload } from '@vercel/blob/client';

export async function uploadToVercelBlob(
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<UploadedFile> {
  try {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
      abortSignal: signal,
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      }
    });

    const isImage = VALID_FILE_TYPES.image.includes(file.type);

    return {
      url: blob.url,
      fileName: blob.pathname, // Using pathname as the unique fileName/id
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      // For Vercel Blob, we just use the original URL for image previews
      ...(isImage && { thumbnailUrl: blob.url })
    };
  } catch (error) {
    if (signal?.aborted || (error as Error).name === 'AbortError') {
      throw new Error("Upload cancelled");
    }
    throw new Error((error as Error).message || "Upload failed");
  }
}
