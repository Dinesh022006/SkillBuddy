"use client";

import React, { useMemo } from 'react';
import { parseUrls, isValidProtocol } from '@/lib/chat/url-parser';
import { cn } from '@/lib/utils';

interface LinkifyTextProps {
  text: string;
  highlightQuery?: string;
  className?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <mark key={i} className="bg-yellow-400 text-black rounded-sm px-[2px]">{part}</mark> 
          : part
      )}
    </>
  );
}

export const LinkifyText = React.memo(function LinkifyText({ text, highlightQuery, className }: LinkifyTextProps) {
  const elements = useMemo(() => {
    if (!text) return null;
    
    const matches = parseUrls(text);
    if (!matches || matches.length === 0) {
      return <HighlightedText text={text} highlight={highlightQuery} />;
    }

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match: any, i: number) => {
      // Add text before the match
      if (match.index > lastIndex) {
        const preText = text.substring(lastIndex, match.index);
        result.push(<HighlightedText key={`text-${i}`} text={preText} highlight={highlightQuery} />);
      }

      // Add the link itself
      // Validate protocol (prevent javascript: etc)
      let safeUrl = match.url;
      let displayUrl = match.text;
      try {
        const parsed = new URL(match.url);
        displayUrl = parsed.hostname.replace(/^www\./, '') + (parsed.pathname !== '/' ? parsed.pathname : '') + parsed.search + parsed.hash;
      } catch (e) {
        displayUrl = match.text.replace(/^https?:\/\/(www\.)?/, '');
      }

      // If it doesn't start with a known protocol, and isValidProtocol fails, it might be a relative/broken link.
      // linkify-it usually normalizes to http:// if missing.
      if (!isValidProtocol(safeUrl)) {
        // Fallback safety: if somehow invalid, render as plain text
        result.push(<HighlightedText key={`link-fallback-${i}`} text={match.text} highlight={highlightQuery} />);
      } else {
        result.push(
          <a
            key={`link-${i}`}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-xs font-normal text-blue-300 hover:underline cursor-pointer transition-colors break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm inline-flex items-center align-bottom max-w-full sm:max-w-[45ch] truncate",
              className
            )}
            onClick={(e) => e.stopPropagation()} // Prevent bubble to bubble click
            aria-label={`Open link in new tab: ${displayUrl}`}
          >
            <span className="truncate w-full"><HighlightedText text={displayUrl} highlight={highlightQuery} /></span>
          </a>
        );
      }

      lastIndex = match.lastIndex;
    });

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      const postText = text.substring(lastIndex);
      result.push(<HighlightedText key="text-end" text={postText} highlight={highlightQuery} />);
    }

    return result;
  }, [text, highlightQuery, className]);

  return <>{elements}</>;
});
