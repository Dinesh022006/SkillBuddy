"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, Video, FileText, Mic, Link as LinkIcon, 
  Search, Download, ExternalLink, Play, Pause, FileIcon
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtuosoGrid } from "react-virtuoso";

interface SharedMediaGalleryProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

type MediaType = "images" | "videos" | "documents" | "voice" | "links";

export default function SharedMediaGallery({ roomId, isOpen, onClose }: SharedMediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<MediaType>("images");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for fetching
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Preview state for images/videos
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);

  // Fetch logic
  const fetchMedia = useCallback(async (reset: boolean = false) => {
    if (!isOpen || !roomId) return;
    if (loading) return;
    if (!reset && !hasMore) return;

    setLoading(true);
    try {
      const cursor = reset ? null : nextCursor;
      const url = new URL(`/api/chat/${roomId}/media`, window.location.origin);
      url.searchParams.set("type", activeTab);
      if (cursor) url.searchParams.set("cursor", cursor);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setItems(prev => reset ? data.items : [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to fetch media", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, isOpen, activeTab, searchQuery, nextCursor, hasMore, loading]);

  // Effect to reset when tab or search changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        fetchMedia(true);
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, activeTab, searchQuery]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMedia(false);
    }
  }, [loading, hasMore, fetchMedia]);

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderEmptyState = (icon: React.ReactNode, title: string, desc: string) => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );

  const renderImages = () => {
    if (!loading && items.length === 0) {
      return renderEmptyState(<ImageIcon size={32} />, "No images", "Images shared in this chat will appear here.");
    }
    
    return (
      <VirtuosoGrid
        style={{ height: "calc(100vh - 200px)" }}
        data={items}
        endReached={loadMore}
        listClassName="grid grid-cols-3 gap-1 md:gap-2 p-1"
        itemClassName="aspect-square relative group cursor-pointer overflow-hidden rounded-md bg-muted/30 border border-transparent hover:border-primary/50 transition-colors shadow-sm"
        itemContent={(index, item) => (
          <div className="w-full h-full relative" onClick={() => setPreviewMedia(item)}>
            {/* Fallback skeleton before image loads fully */}
            <div className="absolute inset-0 bg-muted animate-pulse -z-10" />
            <img 
              src={item.url} 
              alt={item.fileName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 z-10 relative"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
              <ImageIcon className="text-white drop-shadow-md" size={24} />
            </div>
          </div>
        )}
        components={{
          Footer: () => loading ? <div className="p-4 flex justify-center"><Skeleton className="w-8 h-8 rounded-full" /></div> : null
        }}
      />
    );
  };

  const renderVideos = () => {
    if (!loading && items.length === 0) {
      return renderEmptyState(<Video size={32} />, "No videos", "Videos shared in this chat will appear here.");
    }

    return (
      <VirtuosoGrid
        style={{ height: "calc(100vh - 200px)" }}
        data={items}
        endReached={loadMore}
        listClassName="grid grid-cols-2 gap-2 p-1"
        itemClassName="aspect-video relative group cursor-pointer overflow-hidden rounded-md bg-muted/30 border border-transparent hover:border-primary/50 transition-colors shadow-sm"
        itemContent={(index, item) => (
          <div className="w-full h-full relative" onClick={() => setPreviewMedia(item)}>
            <div className="absolute inset-0 bg-muted animate-pulse -z-10" />
            <video 
              src={item.url}
              className="w-full h-full object-cover z-10 relative"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20 group-hover:bg-black/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-primary/90 transition-all shadow-lg">
                <Play className="text-white ml-1" size={24} />
              </div>
            </div>
            {item.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-semibold text-white z-20">
                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        )}
        components={{
          Footer: () => loading ? <div className="p-4 flex justify-center"><Skeleton className="w-8 h-8 rounded-full" /></div> : null
        }}
      />
    );
  };

  const renderDocuments = () => {
    if (!loading && items.length === 0) {
      return renderEmptyState(<FileText size={32} />, "No documents", "Files and documents shared in this chat will appear here.");
    }

    return (
      <div className="flex flex-col gap-2 overflow-y-auto h-[calc(100vh-200px)] pr-2" onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
          loadMore();
        }
      }}>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.fileName || item.originalName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                <span>•</span>
                <span>{item.user?.name}</span>
                <span>•</span>
                <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(item.url, item.fileName || item.originalName)}>
                <Download size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.url, "_blank")}>
                <ExternalLink size={16} />
              </Button>
            </div>
          </div>
        ))}
        {loading && <div className="p-4 flex justify-center"><Skeleton className="w-8 h-8 rounded-full" /></div>}
      </div>
    );
  };

  const renderVoice = () => {
    if (!loading && items.length === 0) {
      return renderEmptyState(<Mic size={32} />, "No voice notes", "Voice notes shared in this chat will appear here.");
    }

    return (
      <div className="flex flex-col gap-2 overflow-y-auto h-[calc(100vh-200px)] pr-2" onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
          loadMore();
        }
      }}>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-full border bg-card hover:bg-accent/50 transition-colors">
            <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full shrink-0">
              <Play size={18} />
            </Button>
            <div className="flex-1">
              {/* Fake Waveform placeholder */}
              <div className="flex items-center h-8 gap-0.5 opacity-50">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="w-1 bg-foreground rounded-full" style={{ height: `${Math.max(10, Math.random() * 100)}%` }} />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 w-16">
              <span className="text-xs font-medium">0:00</span>
              <span className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), "MMM d")}</span>
            </div>
          </div>
        ))}
        {loading && <div className="p-4 flex justify-center"><Skeleton className="w-8 h-8 rounded-full" /></div>}
      </div>
    );
  };

  const renderLinks = () => {
    if (!loading && items.length === 0) {
      return renderEmptyState(<LinkIcon size={32} />, "No links", "Links shared in this chat will appear here.");
    }

    return (
      <div className="flex flex-col gap-2 overflow-y-auto h-[calc(100vh-200px)] pr-2" onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
          loadMore();
        }
      }}>
        {items.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <LinkIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-primary hover:underline break-all line-clamp-2">{item.url}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                <span className="font-medium text-foreground">{item.domain}</span>
                <span>•</span>
                <span>{item.uploadedBy?.name}</span>
                <span>•</span>
                <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </a>
        ))}
        {loading && <div className="p-4 flex justify-center"><Skeleton className="w-8 h-8 rounded-full" /></div>}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 gap-0 flex flex-col border-l">
        <SheetHeader className="p-4 border-b flex-shrink-0 text-left bg-background/95 backdrop-blur z-10 sticky top-0">
          <SheetTitle>Shared Media</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col bg-muted/20">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType)} className="flex-1 flex flex-col w-full h-full">
            <div className="px-4 pt-4 pb-2 border-b bg-background">
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search media..."
                  className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <TabsList className="w-full h-auto p-1 bg-muted/50 flex flex-wrap justify-start gap-1">
                <TabsTrigger value="images" className="flex-1 min-w-[70px] text-xs h-8"><ImageIcon className="w-3 h-3 mr-1.5" /> Images</TabsTrigger>
                <TabsTrigger value="videos" className="flex-1 min-w-[70px] text-xs h-8"><Video className="w-3 h-3 mr-1.5" /> Videos</TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 min-w-[70px] text-xs h-8"><FileText className="w-3 h-3 mr-1.5" /> Docs</TabsTrigger>
                <TabsTrigger value="voice" className="flex-1 min-w-[70px] text-xs h-8"><Mic className="w-3 h-3 mr-1.5" /> Voice</TabsTrigger>
                <TabsTrigger value="links" className="flex-1 min-w-[70px] text-xs h-8"><LinkIcon className="w-3 h-3 mr-1.5" /> Links</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4 overflow-hidden relative">
              <TabsContent value="images" className="h-full mt-0 data-[state=inactive]:hidden">
                {renderImages()}
              </TabsContent>
              <TabsContent value="videos" className="h-full mt-0 data-[state=inactive]:hidden">
                {renderVideos()}
              </TabsContent>
              <TabsContent value="documents" className="h-full mt-0 data-[state=inactive]:hidden">
                {renderDocuments()}
              </TabsContent>
              <TabsContent value="voice" className="h-full mt-0 data-[state=inactive]:hidden">
                {renderVoice()}
              </TabsContent>
              <TabsContent value="links" className="h-full mt-0 data-[state=inactive]:hidden">
                {renderLinks()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>

      {/* Preview Modal for Images/Videos */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col backdrop-blur-sm transition-opacity"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPreviewMedia(null);
          }}
          tabIndex={0}
          autoFocus
        >
          <div className="flex items-center justify-between p-4 bg-black/50 text-white sticky top-0 z-10">
            <div className="flex flex-col">
              <span className="font-medium text-sm truncate max-w-sm">{previewMedia.fileName || previewMedia.originalName}</span>
              <span className="text-xs text-white/70">
                {previewMedia.user?.name} • {format(new Date(previewMedia.createdAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => handleDownload(previewMedia.url, previewMedia.fileName)}>
                <Download size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => window.open(previewMedia.url, "_blank")}>
                <ExternalLink size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full ml-2" onClick={() => setPreviewMedia(null)}>
                <Search className="w-5 h-5 rotate-45" /> {/* Close icon using search rotate or Lucide X */}
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={() => setPreviewMedia(null)}>
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              {previewMedia.mimeType?.startsWith("video/") ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[calc(100vh-120px)] rounded shadow-2xl"
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.fileName}
                  className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
