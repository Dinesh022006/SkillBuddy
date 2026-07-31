"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Loader2, AlertCircle, RefreshCw, Search, Video, Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { useChatStore } from "./store/useChatStore";
import { formatMessageTime, formatMessageDivider } from "@/lib/utils/date";
import ProfileDrawer from "./ProfileDrawer";
import { FileUploadButton } from "@/components/chat/FileUploadButton";
import { AttachmentPreview, type StagedFile } from "@/components/chat/AttachmentPreview";
import { MessageBubble } from "@/components/chat/MessageBubble";
import dynamic from "next/dynamic";
import { validateFile, uploadToVercelBlob } from "@/lib/utils/upload";
import { Smile } from "lucide-react";

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
    openProfileDrawer,
    markConversationRead
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<{url: string, name: string}[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatId = activeChat?.id;
  const isNewConnection = activeChat?.isNewConnection;
  const targetUserName = activeChat?.name;

  // We map the store array fallback
  const chatMessages = (chatId ? messages[chatId] : []) || [];
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

  useEffect(() => {
    if (!chatId || isNewConnection) return;
    
    // Lazy import pusherClient to avoid SSR issues if it's not setup yet
    import("@/lib/pusher-client").then(({ pusherClient }) => {
      if (!pusherClient) return;

      const channelName = `room-${chatId}`;
      const channel = pusherClient.subscribe(channelName);
      
      channel.bind("new-message", (message: any) => {
        useChatStore.getState().appendIncomingMessage(chatId, message);
      });

      return () => {
        channel.unbind("new-message");
        pusherClient.unsubscribe(channelName);
      };
    });
  }, [chatId, isNewConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, typingUsers.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (chatId && !isNewConnection) {
      setTyping(chatId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        clearTyping(chatId);
      }, 2500);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const error = validateFile(file);
      const id = Math.random().toString(36).substring(7);
      
      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      const abortController = new AbortController();

      const newStagedFile: StagedFile = {
        id,
        file,
        previewUrl,
        isUploading: !error,
        progress: 0,
        error: error || undefined,
        abortController,
      };
      
      setStagedFiles(prev => [...prev, newStagedFile]);
      
      if (!error) {
        uploadToVercelBlob(file, (progress) => {
          setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
        }, abortController.signal).then(uploadedData => {
          setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, isUploading: false, progress: 100, uploadedData } : f));
        }).catch(err => {
          setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, isUploading: false, error: err.message } : f));
        });
      }
    });
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.isUploading && file.abortController) {
        file.abortController.abort();
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const retryStagedFile = (id: string) => {
    const fileToRetry = stagedFiles.find(f => f.id === id);
    if (!fileToRetry || fileToRetry.isUploading) return;

    const abortController = new AbortController();
    
    setStagedFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, isUploading: true, error: undefined, progress: 0, abortController } 
        : f
    ));

    uploadToVercelBlob(fileToRetry.file, (progress) => {
      setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
    }, abortController.signal).then(uploadedData => {
      setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, isUploading: false, progress: 100, uploadedData } : f));
    }).catch(err => {
      setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, isUploading: false, error: err.message } : f));
    });
  };

  const moveStagedFile = (id: string, direction: 'up' | 'down') => {
    setStagedFiles(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index < 0) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newFiles = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newFiles[index];
      newFiles[index] = newFiles[targetIndex];
      newFiles[targetIndex] = temp;
      
      return newFiles;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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
  };

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
    }, 0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !chatId) return;
    if (!newMessage.trim() && stagedFiles.length === 0) return;
    
    // Prevent send if any file is still uploading or has error
    if (stagedFiles.some(f => f.isUploading || f.error)) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isNewConnection) clearTyping(chatId);

    const inputContent = newMessage;
    const attachments = stagedFiles.map(f => f.uploadedData).filter(Boolean);
    
    setNewMessage("");
    setStagedFiles([]);

    await sendMessage(
      chatId, 
      inputContent, 
      isNewConnection || false, 
      isNewConnection ? chatId : undefined,
      user,
      attachments.length > 0 ? attachments : undefined
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

  if (currentRoom?.type === "DIRECT") {
    const otherParticipant = currentRoom.participants.find((p) => p.user?.id && p.user.id !== user?.id);
    if (otherParticipant?.user) {
      otherUserId = otherParticipant.user.clerkId || otherParticipant.user.id || null;
      avatarUrl = otherParticipant.user.avatarUrl || undefined;
    }
  }

  const isOnline = otherUserId && onlineUsers.includes(otherUserId);
  const isTyping = chatId ? typingUsers[chatId] : false;

  let statusText = "Last seen recently";
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
        <div className="flex items-center justify-between p-4 border-b bg-background shrink-0 h-[72px]">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-1.5 -ml-1.5 rounded-lg transition-colors"
            onClick={() => otherUserId && openProfileDrawer(otherUserId)}
          >
            <UserAvatar userId={otherUserId} name={targetUserName} imageUrl={avatarUrl} size="md" />
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-sm leading-none">{targetUserName}</span>
              <span className={cn("text-xs mt-1.5", isTyping ? "text-primary font-medium" : isOnline ? "text-green-600" : "text-muted-foreground")}>
                {statusText}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isNewConnection ? (
          <div className="flex flex-col items-center justify-center text-center pt-20 h-full animate-in fade-in duration-500 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold tracking-tight mb-2">
              Start your first conversation with {targetUserName}
            </h3>
            <p className="text-muted-foreground">
              Send a message, share ideas, ask questions, or begin collaborating on projects together.
            </p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground pt-10">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : null}
        
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <Fragment key={date}>
            <div className="flex justify-center my-4">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {date}
              </span>
            </div>
            {msgs.map((message) => {
              const isOwn = message.sender?.clerkId === user?.id;
              const isFailed = message.status === 'failed';
              const isSending = message.status === 'sending';
              
              return (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwn={isOwn} 
                  onRetry={() => retryMessage(chatId, message.id)} 
                  onImageClick={(url) => {
                    const images = (message.attachments || [])
                      .filter(a => a.mimeType.startsWith('image/'))
                      .map(a => ({ url: a.url, name: a.originalName }));
                    const index = images.findIndex(img => img.url === url);
                    setPreviewImages(images);
                    setPreviewIndex(index >= 0 ? index : 0);
                  }} 
                />
              );
            })}
          </Fragment>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start animate-in fade-in">
            <div className="text-xs text-muted-foreground mb-1 ml-1">{targetUserName} is typing...</div>
            <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-muted rounded-bl-none flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col bg-background border-t shrink-0">
        <AttachmentPreview 
          stagedFiles={stagedFiles} 
          onRemove={removeStagedFile} 
          onRetry={retryStagedFile} 
          onMove={moveStagedFile}
        />
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <FileUploadButton onFilesSelected={handleFiles} disabled={sending} />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={sending} />
            <Input 
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0" 
              disabled={sending || (!newMessage.trim() && stagedFiles.length === 0) || stagedFiles.some(f => f.isUploading || f.error)}
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>

      <ProfileDrawer />
      <ImageViewer 
        images={previewImages} 
        initialIndex={previewIndex} 
        onClose={() => setPreviewImages([])} 
      />
    </div>
  );
}
