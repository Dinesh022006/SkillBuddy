"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, Download, FileText, FileArchive, FileType, FileCode, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Message, Attachment } from "@/app/(app)/chat/store/useChatStore";
import { Reply, SmilePlus, MoreHorizontal } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onRetry: () => void;
  onImageClick: (url: string) => void;
  onProfileClick?: () => void;
  highlightQuery?: string;
}

import { LinkifyText } from "./LinkifyText";
import { parseUrls } from "@/lib/chat/url-parser";
import { LinkPreviewCard } from "./LinkPreviewCard";

export function MessageBubble({ message, isOwn, onRetry, onImageClick, onProfileClick, highlightQuery }: MessageBubbleProps) {
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
    <div id={`message-${message.id}`} className={cn("flex flex-col mb-4", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <div className="flex items-baseline gap-2 mb-1 ml-1">
          <span 
            className={cn("text-[13px] font-semibold", onProfileClick ? "cursor-pointer hover:underline text-primary" : "text-foreground")} 
            onClick={onProfileClick}
          >
            {message.sender?.name}
          </span>
        </div>
      )}
      
      <div className={cn("flex items-end gap-2 max-w-[85%] group relative", isOwn ? "flex-row-reverse" : "flex-row")}>
        {isOwn && isFailed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0 text-destructive mb-1"
            onClick={onRetry}
            title="Retry sending"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        
        <div 
          className={cn(
            "flex flex-col relative", 
            isSending ? "opacity-70" : ""
          )}
        >
          {/* Action Bar (Hover) */}
          <div className={cn(
            "absolute top-0 -mt-8 hidden group-hover:flex items-center bg-background border shadow-sm rounded-md px-1 py-0.5 z-10 animate-in fade-in zoom-in duration-200",
            isOwn ? "right-0" : "left-0"
          )}>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"><Reply className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"><SmilePlus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>

          {/* Text Content */}
          {message.content && (
            <div 
              className={cn(
                "px-3 pt-2 pb-6 min-w-[80px] rounded-2xl relative text-[15px] leading-relaxed",
                isOwn 
                  ? isFailed 
                    ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-br-none"
                    : "bg-primary text-primary-foreground rounded-br-none shadow-sm" 
                  : "bg-muted text-foreground rounded-bl-none shadow-sm"
              )}
            >
              <LinkifyText text={message.content} highlightQuery={highlightQuery} />
              
              {/* Conditional Rich Link Preview */}
              {(() => {
                const urls = parseUrls(message.content || "");
                const hasAttachments = message.attachments && message.attachments.length > 0;
                
                if (urls.length === 1 && !hasAttachments) {
                  return (
                    <div className="mt-2 mb-1">
                      <LinkPreviewCard url={urls[0].url} />
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="absolute bottom-1 right-2 flex items-center gap-1">
                <span className={cn("text-[10px]", isOwn ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                  {message.createdAt && formatMessageTime(message.createdAt)}
                </span>
                {isOwn && !isFailed && !isSending && (
                  <span className={cn("text-[10px] ml-0.5", message.status === 'read' ? "text-blue-300" : "text-primary-foreground/70")}>
                    {message.status === 'read' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={cn("flex flex-wrap gap-2", isOwn ? "justify-end" : "justify-start", message.content ? "mt-1" : "")}>
              {message.attachments.map(renderAttachment)}
            </div>
          )}
        </div>
      </div>
      
      {isOwn && isFailed && (
        <span className="text-[11px] text-destructive mt-1 mr-1 flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3" /> Failed to send
        </span>
      )}
    </div>
  );
}
