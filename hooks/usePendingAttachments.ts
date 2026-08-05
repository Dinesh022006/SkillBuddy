import { useState, useCallback, useEffect } from 'react';
import { uploadToVercelBlob, validateFile, type UploadedFile } from '@/lib/utils/upload';

export type AttachmentStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  size: number;
  mimeType: string;
  status: AttachmentStatus;
  progress: number;
  error?: string;
  blobData?: UploadedFile;
  abortController?: AbortController;
  duration?: string;
}

const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function usePendingAttachments() {
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      pendingAttachments.forEach(att => {
        if (att.previewUrl && !att.previewUrl.startsWith('data:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
        if (att.status === 'uploading' && att.abortController) {
          att.abortController.abort();
        }
      });
    };
  }, [pendingAttachments]);

  const generateVideoThumbnail = useCallback((file: File): Promise<{ url: string, duration?: string }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, video.duration / 2);
      };

      video.onseeked = () => {
        const duration = formatDuration(video.duration);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ url: dataUrl, duration });
        } else {
          resolve({ url: "", duration });
        }
        URL.revokeObjectURL(url);
      };

      video.onerror = () => {
        resolve({ url: "" });
        URL.revokeObjectURL(url);
      };
    });
  }, []);

  const getAudioDuration = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const url = URL.createObjectURL(file);
      audio.src = url;

      audio.onloadedmetadata = () => {
        resolve(formatDuration(audio.duration));
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        resolve(undefined);
        URL.revokeObjectURL(url);
      };
    });
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    const newAttachments: PendingAttachment[] = [];
    
    for (const file of files) {
      const errorMsg = validateFile(file);
      const id = Math.random().toString(36).substring(7) + Date.now().toString(36);
      
      let previewUrl = "";
      let duration: string | undefined;

      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const videoData = await generateVideoThumbnail(file);
        previewUrl = videoData.url;
        duration = videoData.duration;
      } else if (file.type.startsWith('audio/')) {
        duration = await getAudioDuration(file);
      }

      newAttachments.push({
        id,
        file,
        previewUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        status: errorMsg ? 'error' : 'pending',
        progress: 0,
        error: errorMsg || undefined,
        duration
      });
    }

    if (newAttachments.length > 0) {
      setPendingAttachments(prev => {
        // Prevent duplicates in the current staging queue based on name and size
        const filteredNew = newAttachments.filter(newAtt => 
          !prev.some(existing => existing.file.name === newAtt.file.name && existing.file.size === newAtt.file.size)
        );
        return [...prev, ...filteredNew];
      });
    }
  }, [generateVideoThumbnail, getAudioDuration]);

  const removeFile = useCallback((id: string) => {
    setPendingAttachments(prev => {
      const att = prev.find(p => p.id === id);
      if (att) {
        if (att.previewUrl && !att.previewUrl.startsWith('data:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
        if (att.status === 'uploading' && att.abortController) {
          att.abortController.abort();
        }
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setPendingAttachments(prev => {
      prev.forEach(att => {
        if (att.previewUrl && !att.previewUrl.startsWith('data:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
        if (att.status === 'uploading' && att.abortController) {
          att.abortController.abort();
        }
      });
      return [];
    });
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadedFile[] | null> => {
    // Only upload what is pending or errored
    const toUpload = pendingAttachments.filter(a => a.status === 'pending' || a.status === 'error');
    if (toUpload.length === 0) {
      const successful = pendingAttachments.filter(a => a.status === 'success' && a.blobData).map(a => a.blobData!);
      return successful.length > 0 ? successful : [];
    }

    const controllers = new Map<string, AbortController>();
    toUpload.forEach(att => controllers.set(att.id, new AbortController()));

    setPendingAttachments(prev => prev.map(a => 
      controllers.has(a.id) ? { ...a, status: 'uploading', progress: 0, abortController: controllers.get(a.id) } : a
    ));

    const uploadPromises = toUpload.map(async (att) => {
      try {
        const controller = controllers.get(att.id)!;
        const data = await uploadToVercelBlob(att.file, (progress) => {
          setPendingAttachments(prev => prev.map(p => p.id === att.id ? { ...p, progress } : p));
        }, controller.signal);
        
        setPendingAttachments(prev => prev.map(p => p.id === att.id ? { ...p, status: 'success', progress: 100, blobData: data } : p));
        return data;
      } catch (err: any) {
        setPendingAttachments(prev => prev.map(p => p.id === att.id ? { ...p, status: 'error', error: err.message || 'Upload failed' } : p));
        throw err;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const previouslySuccessful = pendingAttachments.filter(a => a.status === 'success' && a.blobData).map(a => a.blobData!);
      return [...previouslySuccessful, ...results];
    } catch (e) {
      return null;
    }
  }, [pendingAttachments]);

  const retryUpload = useCallback((id: string) => {
    setPendingAttachments(prev => prev.map(a => a.id === id ? { ...a, status: 'pending', error: undefined } : a));
  }, []);

  const cancelUpload = useCallback((id: string) => {
    removeFile(id);
  }, [removeFile]);

  return {
    pendingAttachments,
    addFiles,
    removeFile,
    clear,
    uploadAll,
    retryUpload,
    cancelUpload
  };
}
