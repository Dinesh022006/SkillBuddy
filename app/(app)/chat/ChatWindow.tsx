"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Loader2, AlertCircle, RefreshCw, Search, Video, Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { useChatStore, type Message } from "./store/useChatStore";
import { formatMessageTime, formatMessageDivider, formatLastSeen } from "@/lib/utils/date";
import { ProfileDrawer } from "@/components/chat/ProfileDrawer";
import SharedMediaGallery from "@/components/chat/SharedMediaGallery";
import { FileUploadButton } from "@/components/chat/FileUploadButton";
import { AttachmentPreview, type StagedFile } from "@/components/chat/AttachmentPreview";
import { MessageBubble } from "@/components/chat/MessageBubble";
import dynamic from "next/dynamic";
import { validateFile, uploadToVercelBlob } from "@/lib/utils/upload";
import { Smile } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, ChevronUp, ChevronDown, User, FileImage, Search as SearchIcon, BellOff, Trash2, Ban } from "lucide-react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { motion, AnimatePresence } from "framer-motion";
import { usePendingAttachments } from "@/hooks/usePendingAttachments";
import { AttachmentGrid } from "@/components/chat/AttachmentGrid";

const ImageViewer = dynamic(() => import("@/components/chat/ImageViewer").then(mod => mod.ImageViewer), { ssr: false });
const EmojiPicker = dynamic(() => import("@/components/chat/EmojiPicker").then(mod => mod.EmojiPicker), { 
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="icon" disabled className="text-muted-foreground shrink-0 rounded-full">
      <Smile className="h-5 w-5" />
    </Button>
  )
});


export default function ChatWindow() {
  const { user } = useUser();
  const { 
    activeChat, 
    messages, 
    loadingMessages, 
    sending, 
    fetchMessages, 
    sendMessage, 
    retryMessage,
    typingUsers,
    setTyping,
    clearTyping,
    onlineUsers,
    rooms,
    markConversationRead
  } = useChatStore();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dialogConfig, setDialogConfig] = useState<{ isOpen: boolean; title: string; description: string }>({
    isOpen: false,
    title: "",
    description: "",
  });
  const [newMessage, setNewMessage] = useState("");
  const { pendingAttachments, addFiles, removeFile, retryUpload, uploadAll, clear } = usePendingAttachments();
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<{url: string, name: string}[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatId = activeChat?.id;
  const isNewConnection = activeChat?.isNewConnection;
  const targetUserName = activeChat?.name;

  // We map the store array fallback
  const chatMessages = useMemo<Message[]>(() => (chatId ? messages[chatId] : null) || [], [chatId, messages]);
  const isLoading = chatId && loadingMessages[chatId];

  useEffect(() => {
    if (chatId && !isNewConnection) {
      fetchMessages(chatId);
    }
  }, [chatId, isNewConnection, fetchMessages]);

  // Mark conversation read automatically when opened or receiving new messages while open
  useEffect(() => {
    if (chatId && !isNewConnection) {
      markConversationRead(chatId);
    }
  }, [chatId, chatMessages.length, isNewConnection, markConversationRead]);

  // Pusher subscriptions are now handled globally in useChatStore


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only capture Ctrl+F if not in search input, otherwise standard behavior
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setIsSearchActive(true);
    } else if (e.key === 'Escape' && isSearchActive) {
      e.preventDefault();
      setIsSearchActive(false);
      setSearchQuery("");
    }
  }, [isSearchActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        scrollToSearchResult(currentSearchIndex - 1);
      } else {
        scrollToSearchResult(currentSearchIndex + 1);
      }
    }
  }, [currentSearchIndex]);

  // Derived Search Results (No longer duplicated in state)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !isSearchActive) {
      return [];
    }
    const query = searchQuery.toLowerCase();
    return chatMessages
      .map((m, index) => {
        let match = false;
        if (m.content?.toLowerCase().includes(query)) match = true;
        if (m.sender?.name?.toLowerCase().includes(query)) match = true;
        if (m.createdAt && formatMessageTime(m.createdAt).toLowerCase().includes(query)) match = true;
        if (m.attachments?.some(a => a.originalName.toLowerCase().includes(query) || a.mimeType.toLowerCase().includes(query))) match = true;
        return match ? index : -1;
      })
      .filter(index => index !== -1);
  }, [chatMessages, searchQuery, isSearchActive]);

  // Sync Search Index safely without loops
  useEffect(() => {
    setCurrentSearchIndex(prev => {
      const target = searchResults.length > 0 ? searchResults.length - 1 : 0;
      return prev === target ? prev : target;
    });
  }, [searchResults.length, searchQuery]);

  // Auto-scroll logic (preventing unnecessary scrolls)
  useEffect(() => {
    if (!isSearchActive && chatMessages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: chatMessages.length - 1,
        align: 'end',
        behavior: 'smooth'
      });
    }
  }, [chatMessages.length, isSearchActive]); // Removed typingUsers.length to avoid unnecessary scrolling

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    
    if (chatId && !isNewConnection) {
      // Local throttle to avoid spamming Pusher
      if (!typingTimeoutRef.current) {
        useChatStore.getState().emitTyping(chatId);
      } else {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  const scrollToSearchResult = useCallback((index: number) => {
    if (searchResults.length === 0) return;
    const newIndex = Math.max(0, Math.min(index, searchResults.length - 1));
    setCurrentSearchIndex(prev => prev === newIndex ? prev : newIndex);
    
    const messageIndex = searchResults[newIndex];
    virtuosoRef.current?.scrollToIndex({
      index: messageIndex,
      align: 'center',
      behavior: 'smooth'
    });
  }, [searchResults]);

  const openComingSoon = (title: string, description: string) => {
    setDialogConfig({ isOpen: true, title, description });
  };

  const handleFiles = useCallback((files: File[]) => {
    addFiles(files);
  }, [addFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setNewMessage(prev => prev + emoji);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const text = newMessage;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    
    setNewMessage(newText);
    
    // Set cursor position after emoji
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
      // Auto-resize
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
    }, 0);
  };



  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sending || (!newMessage.trim() && pendingAttachments.length === 0) || !chatId) return;
    
    // Prevent send if any file is actively uploading
    if (pendingAttachments.some(f => f.status === 'uploading')) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isNewConnection) clearTyping(chatId);

    const inputContent = newMessage;
    
    // Upload files sequentially/concurrently via the hook
    const uploadedFiles = await uploadAll();
    if (uploadedFiles === null) {
      // Meaning at least one failed, keep UI intact to let them retry
      return;
    }

    setNewMessage("");
    clear(); // Clear pending attachments

    await sendMessage(
      chatId, 
      inputContent, 
      isNewConnection || false, 
      isNewConnection ? chatId : undefined,
      user,
      uploadedFiles.length > 0 ? uploadedFiles : undefined
    );
  };

  if (!chatId) return null; // Handled by container

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // Group messages by date string
  const groupedMessages: Record<string, typeof chatMessages> = {};
  chatMessages.forEach((msg) => {
    const divider = msg.createdAt ? formatMessageDivider(msg.createdAt) : "Today";
    if (!groupedMessages[divider]) groupedMessages[divider] = [];
    groupedMessages[divider].push(msg);
  });

  // Resolve status text
  const currentRoom = rooms.find(r => r.id === chatId);
  let otherUserId: string | null = null;
  let avatarUrl: string | undefined = undefined;
  let lastSeenAt: string | null = null;

  if (currentRoom?.type === "DIRECT") {
    const otherParticipant = currentRoom.participants.find((p) => p.user?.id && p.user.id !== user?.id);
    if (otherParticipant?.user) {
      otherUserId = otherParticipant.user.clerkId || otherParticipant.user.id || null;
      avatarUrl = otherParticipant.user.avatarUrl || undefined;
      lastSeenAt = otherParticipant.user.lastSeen || null;
    }
  }

  const isOnline = otherUserId && onlineUsers.includes(otherUserId);
  const isTyping = chatId ? typingUsers[chatId] : false;

  let statusText = lastSeenAt ? formatLastSeen(lastSeenAt) : "Last seen recently";
  if (isTyping) {
    statusText = "Typing...";
  } else if (isOnline) {
    statusText = "Online";
  }

  return (
    <div 
      className="flex flex-col h-full w-full relative overflow-hidden"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {dragActive && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl flex items-center justify-center animate-in fade-in">
          <div className="flex flex-col items-center justify-center p-8 bg-background shadow-xl rounded-2xl pointer-events-none">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <RefreshCw className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-1">Drop files to attach</h3>
            <p className="text-muted-foreground text-sm">Images, Documents, and ZIP files supported</p>
          </div>
        </div>
      )}

      {/* Chat Header */}
      {!isNewConnection && (
        <div className="flex flex-col border-b bg-background shrink-0 h-[72px] justify-center relative overflow-hidden z-10">
          <AnimatePresence initial={false}>
            {!isSearchActive ? (
              <motion.div 
                key="profile-header"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-4 absolute inset-0 bg-background"
              >
                <div className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-lg transition-colors" onClick={() => {
                  if (currentRoom?.type === "DIRECT") {
                    const otherPart = currentRoom.participants.find((p) => p.user?.id && p.user.id !== user?.id);
                    if (otherPart?.user?.id) setSelectedProfileId(otherPart.user.id);
                  }
                }}>
                  <UserAvatar 
                    userId={otherUserId}
                    name={targetUserName} 
                    imageUrl={avatarUrl}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <h2 className="font-semibold">{targetUserName}</h2>
                    <span className={cn("text-xs font-medium", isTyping ? "text-primary" : isOnline ? "text-green-600" : "text-muted-foreground")}>
                      {statusText}
                    </span>
                  </div>
                </div>
              
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSearchActive(true)}>
                    <SearchIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => openComingSoon("Video Calling", "Face-to-face video calling is currently under development. Join the waitlist to be notified when it drops!")}>
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => openComingSoon("Voice Calling", "Crystal-clear voice calling is coming soon. Stay tuned for our next big update!")}>
                    <Phone className="h-5 w-5" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
                      <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => {
                        if (currentRoom?.type === "DIRECT") {
                          const otherPart = currentRoom.participants.find((p) => p.user?.id && p.user.id !== user?.id);
                          if (otherPart?.user?.id) setSelectedProfileId(otherPart.user.id);
                        }
                      }}>
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsMediaGalleryOpen(true)}>
                        <FileImage className="mr-2 h-4 w-4" />
                        <span>Shared Media & Files</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsSearchActive(true)}>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        <span>Search in Conversation</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openComingSoon("Mute Notifications", "Notification preferences per chat are coming soon.")}>
                        <BellOff className="mr-2 h-4 w-4" />
                        <span>Mute Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => openComingSoon("Clear Chat", "Are you sure you want to clear this chat? This feature is coming soon.")}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Clear Chat</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => openComingSoon("Delete Conversation", "Are you sure you want to permanently delete this conversation? This feature is coming soon.")}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Conversation</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => openComingSoon("Block User", "Are you sure you want to block this user? They will no longer be able to message you.")}>
                        <Ban className="mr-2 h-4 w-4" />
                        <span>Block User</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="search-header"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 p-4 absolute inset-0 bg-background"
              >
                <div className="flex-1 flex items-center bg-muted h-11 rounded-xl px-3 border-none transition-colors focus-within:bg-muted/80">
                  <SearchIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Input 
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search messages..."
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none h-full text-base"
                    autoFocus
                  />
                  {searchQuery.trim() !== "" && (
                    <span className="text-sm font-medium text-muted-foreground ml-2 whitespace-nowrap shrink-0">
                      {searchResults.length > 0 ? `${currentSearchIndex + 1} / ${searchResults.length}` : "0 results"}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => scrollToSearchResult(currentSearchIndex - 1)}
                    disabled={searchResults.length === 0 || currentSearchIndex <= 0}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => scrollToSearchResult(currentSearchIndex + 1)}
                    disabled={searchResults.length === 0 || currentSearchIndex >= searchResults.length - 1}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {isNewConnection ? (
          <div className="flex flex-col items-center justify-center text-center pt-20 h-full animate-in fade-in duration-500 max-w-lg mx-auto overflow-y-auto">
            <h3 className="text-2xl font-bold tracking-tight mb-2">
              Start your first conversation with {targetUserName}
            </h3>
            <p className="text-muted-foreground">
              Send a message, share ideas, ask questions, or begin collaborating on projects together.
            </p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground pt-10 overflow-y-auto h-full">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="w-full h-full"
            data={chatMessages}
            initialTopMostItemIndex={chatMessages.length - 1}
            itemContent={(index, message) => {
              const prevMessage = index > 0 ? chatMessages[index - 1] : null;
              const dateDivider = message.createdAt ? formatMessageDivider(message.createdAt) : "Today";
              const prevDateDivider = prevMessage?.createdAt ? formatMessageDivider(prevMessage.createdAt) : "Today";
              const showDivider = index === 0 || dateDivider !== prevDateDivider;

              const isOwn = message.sender?.clerkId === user?.id;
              const isHighlighted = isSearchActive && searchResults.length > 0 && searchResults[currentSearchIndex] === index;

              return (
                <div className="px-4 py-2">
                  {showDivider && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {dateDivider}
                      </span>
                    </div>
                  )}
                  <div className={cn("transition-colors duration-300 rounded-xl", isHighlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5" : "")}>
                    <MessageBubble 
                      message={message} 
                      isOwn={isOwn} 
                      onRetry={() => retryMessage(chatId, message.id)} 
                      onImageClick={(url) => {
                        const images = (message.attachments || [])
                          .filter(a => a.mimeType.startsWith('image/'))
                          .map(a => ({ url: a.url, name: a.originalName }));
                        const idx = images.findIndex(img => img.url === url);
                        setPreviewImages(images);
                        setPreviewIndex(idx >= 0 ? idx : 0);
                      }} 
                      onProfileClick={() => {
                        if ((message.sender as any)?.id) setSelectedProfileId((message.sender as any).id);
                        // fallback to finding it in participants if not directly on sender
                        else if (currentRoom) {
                          const part = currentRoom.participants.find(p => p.user?.clerkId === message.sender?.clerkId || p.user?.name === message.sender?.name);
                          if (part?.user?.id) setSelectedProfileId(part.user.id);
                        }
                      }}
                      highlightQuery={isSearchActive ? searchQuery : undefined}
                    />
                  </div>
                </div>
              );
            }}
            components={{
              Footer: () => {
                if (isTyping) {
                  return (
                    <div className="flex flex-col items-start animate-in fade-in p-4">
                      <div className="text-xs text-muted-foreground mb-1 ml-1">{targetUserName} is typing...</div>
                      <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-muted rounded-bl-none flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  );
                }
                return <div className="h-4" />;
              }
            }}
          />
        )}
      </div>

      <div className="flex flex-col bg-background border-t shrink-0 relative z-20">
        <AttachmentGrid 
          attachments={pendingAttachments} 
          onRemove={removeFile} 
          onRetry={retryUpload} 
          onClear={clear}
          onAddMore={() => document.getElementById('chat-file-upload')?.click()}
          onPreview={(url) => {
            setPreviewImages([{ url, name: 'Preview' }]);
            setPreviewIndex(0);
          }}
        />
        <div className="p-4 bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <div className="flex-1 flex items-end gap-2 bg-muted/40 border rounded-3xl pr-2 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
              <div className="flex items-center gap-1 shrink-0 p-2">
                <FileUploadButton onFilesSelected={handleFiles} disabled={sending} />
                <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={sending} />
              </div>
              
              <Textarea 
                ref={inputRef as any}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 min-h-[44px] max-h-[200px] py-3 bg-transparent border-0 focus-visible:ring-0 shadow-none resize-none leading-relaxed"
                rows={1}
                disabled={sending}
                style={{ height: '44px' }}
              />
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="submit" 
                size="icon" 
                className="h-11 w-11 rounded-full shrink-0 shadow-sm" 
                disabled={sending || (!newMessage.trim() && pendingAttachments.length === 0) || pendingAttachments.some(f => f.status === 'uploading' || f.status === 'error')}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
              </Button>
            </motion.div>
          </form>
        </div>
      </div>

      <ProfileDrawer userId={selectedProfileId} isOpen={!!selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      
      {chatId && (
        <SharedMediaGallery
          roomId={chatId}
          isOpen={isMediaGalleryOpen}
          onClose={() => setIsMediaGalleryOpen(false)}
        />
      )}

      <ImageViewer 
        images={previewImages} 
        initialIndex={previewIndex} 
        onClose={() => setPreviewImages([])} 
      />

      <Dialog open={dialogConfig.isOpen} onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogConfig.title}</DialogTitle>
            <DialogDescription>
              {dialogConfig.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}>
              Close
            </Button>
            <Button>Notify Me</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

