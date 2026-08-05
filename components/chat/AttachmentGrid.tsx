"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AttachmentPreviewCard } from "./AttachmentPreviewCard";
import type { PendingAttachment } from "@/hooks/usePendingAttachments";
import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentGridProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: () => void;
  onAddMore: () => void;
  onPreview: (url: string) => void;
}

export function AttachmentGrid({ attachments, onRemove, onRetry, onClear, onAddMore, onPreview }: AttachmentGridProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const imagesCount = useMemo(() => attachments.filter(a => a.mimeType.startsWith('image/') || a.mimeType.startsWith('video/')).length, [attachments]);
  const docsCount = useMemo(() => attachments.length - imagesCount, [attachments, imagesCount]);
  
  // Reset focus when attachments empty
  useEffect(() => {
    if (attachments.length === 0) {
      setActiveIndex(-1);
    } else if (activeIndex >= attachments.length) {
      setActiveIndex(attachments.length - 1);
    }
  }, [attachments.length, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (attachments.length === 0) return;
    
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, attachments.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
  };

  if (attachments.length === 0) return null;

  const isSingleImage = attachments.length === 1 && attachments[0].mimeType.startsWith('image/');
  
  // Construct summary text
  let summaryText = "";
  if (attachments.length > 0) {
    if (imagesCount > 0 && docsCount === 0) {
      summaryText = `${imagesCount} Photo${imagesCount !== 1 ? 's' : ''}`;
    } else if (docsCount > 0 && imagesCount === 0) {
      summaryText = `${docsCount} File${docsCount !== 1 ? 's' : ''}`;
    } else if (imagesCount > 0 && docsCount > 0) {
      summaryText = `${imagesCount} Photo${imagesCount !== 1 ? 's' : ''} • ${docsCount} File${docsCount !== 1 ? 's' : ''}`;
    } else {
      summaryText = `Selected • ${attachments.length} files`;
    }
  }

  return (
    <div 
      className="absolute bottom-[calc(100%+8px)] left-2 right-2 sm:left-4 sm:right-4 z-20 pointer-events-none"
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      <div className="w-full bg-card/70 backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden flex flex-col pointer-events-auto">
        
        {/* Horizontal scrollable area */}
        <div 
          className="w-full max-h-[160px] overflow-x-auto p-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          role="region"
          aria-label="Attachment Preview Tray"
        >
          <div className={`flex gap-2 min-w-max items-center ${isSingleImage ? "justify-center w-full" : ""}`}>
            <AnimatePresence mode="popLayout">
              {attachments.map((attachment, index) => (
                <motion.div
                  key={attachment.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  onFocus={() => setActiveIndex(index)}
                >
                  <AttachmentPreviewCard
                    attachment={attachment}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onClickPreview={onPreview}
                    isSingleImage={isSingleImage}
                    isActive={activeIndex === index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add More Button */}
            <motion.div layout>
              <button
                type="button"
                onClick={onAddMore}
                aria-label="Add more files"
                className={`flex flex-col items-center justify-center shrink-0 rounded-xl border border-dashed hover:border-solid hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSingleImage 
                    ? "w-[80px] h-[80px] ml-4 sm:w-[100px] sm:h-[100px]" 
                    : "w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]"
                }`}
                title="Add more files"
              >
                <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">Add</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Toolbar Footer */}
        {!isSingleImage && (
          <div className="px-3 py-1.5 border-t bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {summaryText}
            </span>
            <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear all attachments" className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3 mr-1" /> Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
