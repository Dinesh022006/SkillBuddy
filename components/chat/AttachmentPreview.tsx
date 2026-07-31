"use client";

import { X, FileText, FileArchive, FileType, FileCode, ImageIcon, Loader2, AlertCircle, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StagedFile {
  id: string;
  file: File;
  previewUrl: string | null;
  isUploading: boolean;
  progress: number;
  error?: string;
  uploadedData?: any; // To store Vercel Blob response
  abortController?: AbortController;
}

interface AttachmentPreviewProps {
  stagedFiles: StagedFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
}

export function AttachmentPreview({ stagedFiles, onRemove, onRetry, onMove }: AttachmentPreviewProps) {
  if (stagedFiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 max-h-[300px] overflow-y-auto bg-muted/30 border-t border-b">
      {stagedFiles.map((staged, index) => {
        const isImage = staged.file.type.startsWith("image/");
        const isZip = staged.file.type.includes("zip");
        const isPdf = staged.file.type.includes("pdf");
        const isDoc = staged.file.type.includes("word");
        const isTxt = staged.file.type.includes("text");

        const FileIcon = isImage ? ImageIcon : (isZip ? FileArchive : (isPdf ? FileText : (isDoc ? FileType : (isTxt ? FileCode : FileText))));
        const iconColor = isImage ? 'text-primary' : (isZip ? 'text-yellow-500' : (isPdf ? 'text-red-500' : (isDoc ? 'text-blue-500' : 'text-gray-500')));

        return (
          <div 
            key={staged.id} 
            className="flex items-center gap-3 p-2 pr-3 bg-background border rounded-lg shadow-sm relative group"
          >
            {/* Reorder Buttons */}
            {onMove && (
              <div className="flex flex-col -mr-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-none rounded-t-md hover:bg-muted" 
                  onClick={() => onMove(staged.id, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-none rounded-b-md hover:bg-muted" 
                  onClick={() => onMove(staged.id, 'down')}
                  disabled={index === stagedFiles.length - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Preview Image / Icon */}
            <div className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-md border bg-muted/50 overflow-hidden ${iconColor}`}>
              {isImage && staged.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={staged.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <FileIcon className="h-5 w-5" />
              )}
            </div>

            {/* Details & Progress */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate pr-2" title={staged.file.name}>
                  {staged.file.name}
                </p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                  {(staged.file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${staged.error ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${staged.progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] font-bold ${staged.error ? 'text-destructive' : 'text-muted-foreground'} truncate max-w-[200px]`} title={staged.error}>
                  {staged.error ? staged.error : (staged.isUploading ? 'Uploading...' : 'Completed')}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {staged.progress}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {staged.error && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-foreground" 
                  onClick={() => onRetry(staged.id)}
                  title="Retry"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {staged.isUploading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-2" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(staged.id)}
                title={staged.isUploading ? "Cancel" : "Remove"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
