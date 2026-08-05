"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewCardProps {
  url: string;
}

interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

// Global cache to prevent refetching the same preview across components/renders
const previewCache = new Map<string, PreviewData | 'error'>();

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPreview() {
      if (previewCache.has(url)) {
        const cached = previewCache.get(url);
        if (cached === 'error') {
          if (isMounted) setError(true);
        } else {
          if (isMounted) {
            setData(cached as PreviewData);
            setError(false);
          }
        }
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        
        const preview = await res.json();
        previewCache.set(url, preview);
        if (isMounted) {
          setData(preview);
          setError(false);
        }
      } catch (err) {
        previewCache.set(url, 'error');
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPreview();
    
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full sm:max-w-[360px] border rounded-xl bg-background overflow-hidden mt-1 shadow-lg opacity-70">
        <Skeleton className="h-[160px] w-full rounded-none" />
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    );
  }

  // Graceful fallback: If it errored or returned no useful data, just render nothing (the URL is already clickable above)
  if (error || (!data?.title && !data?.image && !data?.description)) {
    return null; 
  }

  const hostname = new URL(url).hostname;

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full sm:max-w-[360px] border rounded-xl overflow-hidden mt-1 bg-background text-foreground hover:bg-muted/30 transition-all shadow-lg hover:-translate-y-[2px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Preview link for ${data.title || hostname}`}
    >
      {data.image && (
        <div className="w-full bg-muted border-b relative overflow-hidden flex items-center justify-center h-[160px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={data.image} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300 rounded-t-xl"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-0.5">
          <div className="flex items-center gap-2 overflow-hidden">
            {data.favicon ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={data.favicon} alt="Favicon" className="w-3.5 h-3.5 rounded-sm object-cover shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{data.siteName || hostname}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {data.title && (
          <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {data.title}
          </h4>
        )}
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
