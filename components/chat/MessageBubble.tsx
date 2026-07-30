"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, Download, FileText, FileArchive, FileType, FileCode, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils/date";
import type { Message, Attachment } from "@/app/(app)/chat/store/useChatStore";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onRetry: () => void;
  onImageClick: (url: string) => void;
}

export function MessageBubble({ message, isOwn, onRetry, onImageClick }: MessageBubbleProps) {
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.mimeType.startsWith('image/');

    if (isImage) {
      return (
        <div 
          key={attachment.id || attachment.url} 
          className="relative mt-2 rounded-lg overflow-hidden cursor-pointer group border bg-muted flex items-center justify-center min-h-[150px] min-w-[200px]"
          onClick={() => onImageClick(attachment.url)}
          style={{ maxWidth: '300px', maxHeight: '300px' }}
        >
          {/* Loading Skeleton fallback */}
          <div className="absolute inset-0 bg-muted animate-pulse -z-10 flex items-center justify-center text-muted-foreground/50">
             <ImageIcon className="h-8 w-8" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={attachment.thumbnailUrl || attachment.url} 
            alt={attachment.originalName}
            className="w-full h-auto object-cover max-h-[300px] transition-transform group-hover:scale-105 z-10"
            loading="lazy"
          />
        </div>
      );
    }

    // Document or ZIP
    const isZip = attachment.mimeType.includes('zip');
    const isPdf = attachment.mimeType.includes('pdf');
    const isDoc = attachment.mimeType.includes('word');
    const isTxt = attachment.mimeType.includes('text');
    
    const FileIcon = isZip ? FileArchive : (isPdf ? FileText : (isDoc ? FileType : (isTxt ? FileCode : FileText)));
    const iconColor = isZip ? 'text-yellow-500' : (isPdf ? 'text-red-500' : (isDoc ? 'text-blue-500' : 'text-gray-500'));
    const fileExt = isZip ? 'ZIP' : (isPdf ? 'PDF' : (isDoc ? 'DOC' : (isTxt ? 'TXT' : 'FILE')));

    return (
      <div 
        key={attachment.id || attachment.url}
        className={`flex items-center gap-3 mt-2 p-3 rounded-lg border max-w-sm ${isOwn ? 'bg-primary-foreground/10 border-primary-foreground/20' : 'bg-background'}`}
      >
        <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-background ${iconColor} bg-opacity-10 border shadow-sm`}>
          <FileIcon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight mb-1" title={attachment.originalName}>
            {attachment.originalName}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold opacity-80">
            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB • {fileExt}
          </p>
        </div>
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noreferrer" 
          download
          className={`shrink-0 flex items-center justify-center rounded-full h-8 w-8 transition-colors ${isOwn ? 'hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-baseline gap-2 mb-1 ml-1">
        <span className="text-xs text-muted-foreground font-medium">{message.sender?.name}</span>
        <span className="text-[10px] text-muted-foreground/60">
          {message.createdAt && formatMessageTime(message.createdAt)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 max-w-[85%]">
        {isOwn && isFailed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0 text-destructive"
            onClick={onRetry}
            title="Retry sending"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        
        <div 
          className={`flex flex-col gap-1 p-1 ${isOwn ? "items-end" : "items-start"} ${isSending ? "opacity-70" : ""}`}
        >
          {/* Text Content */}
          {message.content && (
            <div 
              className={`px-4 py-2 rounded-2xl ${
                isOwn 
                  ? isFailed 
                    ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-br-none"
                    : "bg-primary text-primary-foreground rounded-br-none" 
                  : "bg-muted rounded-bl-none"
              }`}
            >
              {message.content}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isOwn ? "justify-end" : "justify-start"} ${message.content ? "mt-1" : ""}`}>
              {message.attachments.map(renderAttachment)}
            </div>
          )}
        </div>
      </div>
      
      {isOwn && isFailed && (
        <span className="text-[10px] text-destructive mt-1 mr-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Failed to send
        </span>
      )}
    </div>
  );
}
