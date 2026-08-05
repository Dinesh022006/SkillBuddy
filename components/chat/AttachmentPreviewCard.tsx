"use client";

import { X, FileText, FileArchive, FileType, FileCode, PlayCircle, Loader2, RefreshCw, CheckCircle2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memo } from "react";
import type { PendingAttachment } from "@/hooks/usePendingAttachments";

interface AttachmentPreviewCardProps {
  attachment: PendingAttachment;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onClickPreview?: (url: string) => void;
  isSingleImage?: boolean;
  isActive?: boolean;
}

export const AttachmentPreviewCard = memo(function AttachmentPreviewCard({ 
  attachment, 
  onRemove,
  onRetry,
  onClickPreview,
  isSingleImage,
  isActive
}: AttachmentPreviewCardProps) {
  const isImage = attachment.mimeType.startsWith("image/");
  const isVideo = attachment.mimeType.startsWith("video/");
  const isAudio = attachment.mimeType.startsWith("audio/");
  const isPdf = attachment.mimeType.includes("pdf");
  const isWord = attachment.mimeType.includes("word");
  const isExcel = attachment.mimeType.includes("excel") || attachment.mimeType.includes("spreadsheetml");
  const isPowerPoint = attachment.mimeType.includes("powerpoint") || attachment.mimeType.includes("presentationml");
  const isZip = attachment.mimeType.includes("zip");
  
  const FileIcon = isPdf ? FileText :
                   isWord ? FileType :
                   isExcel ? FileCode : 
                   isPowerPoint ? FileType :
                   isZip ? FileArchive : 
                   isAudio ? Music : FileText;

  const fileSizeMB = (attachment.size / (1024 * 1024)).toFixed(2);
  const isVisualMedia = isImage || isVideo;

  const handleDoubleClick = () => {
    if (attachment.previewUrl && !attachment.previewUrl.startsWith('data:')) {
      window.open(attachment.previewUrl, '_blank');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isVisualMedia && onClickPreview && attachment.previewUrl) {
      onClickPreview(attachment.previewUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleClick(e as any);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onRemove(attachment.id);
    }
  };

  const CircularProgress = ({ progress }: { progress: number }) => (
    <div className="relative flex items-center justify-center">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle className="text-white/20" strokeWidth="4" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
        <circle 
          className="text-primary transition-all duration-300 ease-in-out" 
          strokeWidth="4" 
          strokeDasharray="100" 
          strokeDashoffset={100 - progress} 
          strokeLinecap="round" 
          stroke="currentColor" 
          fill="transparent" 
          r="16" cx="20" cy="20" 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm drop-shadow-md">
        {Math.round(progress)}
      </div>
    </div>
  );

  // Single Image Layout (Hero)
  if (isSingleImage && isImage) {
    return (
      <div 
        role="button"
        tabIndex={0}
        aria-label={`Preview ${attachment.filename}`}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative group w-[220px] h-[140px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow shrink-0 flex flex-col bg-muted border cursor-pointer mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isActive ? "ring-2 ring-primary ring-offset-2" : ""
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove attachment"
          className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md bg-black/70 hover:bg-black/90 text-white hover:scale-110 duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          disabled={attachment.status === 'success'}
        >
          <X className="h-4 w-4" />
        </Button>

        {attachment.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={attachment.previewUrl} 
            alt={attachment.filename}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.03] duration-300"
          />
        )}
        
        {/* Upload Overlay */}
        {(attachment.status === 'uploading' || attachment.status === 'success') && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 z-10 transition-all">
            {attachment.status === 'uploading' ? (
              <CircularProgress progress={attachment.progress} />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-400 animate-in zoom-in" />
            )}
          </div>
        )}

        {/* Error Overlay */}
        {attachment.status === 'error' && (
          <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center p-4 z-10 text-white">
            <span className="text-xs font-bold mb-2 text-center leading-tight truncate w-full">
              {attachment.error || "Upload failed"}
            </span>
            {onRetry && (
              <Button type="button" size="sm" variant="secondary" className="h-7 text-xs px-3 rounded-full shadow-sm text-destructive" onClick={(e) => { e.stopPropagation(); onRetry(attachment.id); }}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Multiple Files or Non-Image layout
  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label={`Preview ${attachment.filename}`}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative group w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden border bg-background shadow-sm hover:shadow transition-shadow shrink-0 flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive ? "ring-2 ring-primary" : ""
      )}
      title={attachment.filename}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Remove attachment"
        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md bg-black/70 hover:bg-black/90 text-white hover:scale-110 duration-200 focus:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(attachment.id);
        }}
        disabled={attachment.status === 'uploading'}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Visual Preview */}
      <div className={cn(
        "w-full bg-muted relative flex flex-col items-center justify-center overflow-hidden shrink-0",
        isVisualMedia ? "h-full" : "h-[65%]"
      )}>
        {isVisualMedia ? (
          <>
            {attachment.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={attachment.previewUrl} 
                alt={attachment.filename}
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.05] duration-300"
              />
            ) : (
              <FileIcon className="h-8 w-8 text-muted-foreground opacity-50" />
            )}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle className="h-8 w-8 text-white opacity-90 shadow-sm rounded-full bg-black/30" />
              </div>
            )}
            {isVideo && attachment.duration && (
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded font-medium">
                {attachment.duration}
              </div>
            )}
          </>
        ) : isAudio ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground mt-1 relative w-full h-full">
            <Music className="h-6 w-6 sm:h-7 sm:w-7 text-primary mb-1" />
            {attachment.duration && (
              <div className="text-[9px] font-medium text-muted-foreground">
                {attachment.duration}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-full">
            <FileIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        )}
        
        {/* Upload Overlay */}
        {(attachment.status === 'uploading' || attachment.status === 'success') && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 z-10 transition-all">
            {attachment.status === 'uploading' ? (
              <CircularProgress progress={attachment.progress} />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-400 animate-in zoom-in" />
            )}
          </div>
        )}

        {/* Error Overlay */}
        {attachment.status === 'error' && (
          <div className="absolute inset-0 bg-destructive/90 flex flex-col items-center justify-center p-2 z-10">
            {onRetry && (
              <Button type="button" size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-sm text-destructive" onClick={(e) => { e.stopPropagation(); onRetry(attachment.id); }}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info (Only for non-visual media like documents/zips) */}
      {!isVisualMedia && (
        <div className="px-2 flex flex-col flex-1 justify-center min-w-0 bg-background border-t pb-0.5">
          <p className="text-[9px] sm:text-[10px] font-medium truncate text-foreground leading-tight">
            {attachment.filename}
          </p>
          <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate leading-tight">
            {fileSizeMB} MB
          </p>
        </div>
      )}
    </div>
  );
});
