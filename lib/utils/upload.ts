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

export async function uploadToCloudinary(
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<UploadedFile> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");

  // Get secure signature
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder: "chat_attachments",
  };

  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paramsToSign }),
  });

  if (!signRes.ok) {
    let errMsg = "Failed to get upload signature.";
    try {
      const errBody = await signRes.json();
      if (errBody.error) errMsg = errBody.error;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errMsg);
  }

  const { signature, apiKey } = await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", "chat_attachments");
  
  // Choose endpoint type
  const isImage = VALID_FILE_TYPES.image.includes(file.type);
  const resourceType = isImage ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    if (signal) {
      if (signal.aborted) {
        return reject(new Error("Upload cancelled"));
      }
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        
        const uploadedFile: UploadedFile = {
          url: response.secure_url,
          fileName: response.public_id,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        };

        if (isImage) {
          uploadedFile.width = response.width;
          uploadedFile.height = response.height;
          // Create a thumbnail url using Cloudinary transformations
          const uploadParts = response.secure_url.split('/upload/');
          uploadedFile.thumbnailUrl = `${uploadParts[0]}/upload/c_thumb,w_200,h_200/${uploadParts[1]}`;
        }

        resolve(uploadedFile);
      } else {
        let errorMsg = "Upload failed.";
        try {
          const error = JSON.parse(xhr.responseText);
          errorMsg = error.error?.message || errorMsg;
        } catch (e) {
          errorMsg = `Upload failed with status ${xhr.status}`;
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}
