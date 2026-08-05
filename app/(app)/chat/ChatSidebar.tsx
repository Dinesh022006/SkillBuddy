"use client"

import { useChatStore } from "./store/useChatStore"
import { Search, Inbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatConversationPreview } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/UserAvatar"
import { Attachment } from "./store/useChatStore"

function getPreviewText(message?: { content?: string; attachments?: Attachment[] }) {
  if (!message) return "No messages yet";
  
  if (message.content && message.content.trim().length > 0) {
    return message.content;
  }

  if (message.attachments && message.attachments.length > 0) {
    const firstAttachment = message.attachments[0];
    const mime = firstAttachment.mimeType || "";
    
    if (mime.startsWith("image/")) return "📷 Photo";
    if (mime.startsWith("video/")) return "🎥 Video";
    if (mime.startsWith("audio/")) return "🎵 Voice message";
    if (mime.includes("pdf") || mime.includes("word") || mime.includes("text") || mime.includes("document")) {
      return `📄 ${firstAttachment.fileName}`;
    }
    return "📎 Attachment";
  }

  return "No messages yet";
}

export default function ChatSidebar() {
  const { 
    activeChat, 
    setActiveChat, 
    rooms, 
    loadingRooms, 
    searchQuery, 
    setSearchQuery,
    onlineUsers,
    markConversationRead,
    typingUsers
  } = useChatStore();

  const handleSelectChat = (id: string, isNewConnection: boolean, name: string) => {
    setActiveChat({ id, isNewConnection, name });
    markConversationRead(id);
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    // Determine room name
    let roomName = room.name || "Chat Room";
    if (room.type === "DIRECT") {
      const otherParticipant = room.participants.find((p) => p.user?.name);
      if (otherParticipant?.user?.name) roomName = otherParticipant.user.name;
    } else if (room.type === "TEAM") {
      if (room.team?.name) roomName = room.team.name;
    } else if (room.type === "COMMUNITY") {
      if (room.community?.name) roomName = room.community.name;
    }

    const lastMessage = room.messages?.[0]?.content || "";

    return roomName.toLowerCase().includes(q) || lastMessage.toLowerCase().includes(q);
  }).sort((a, b) => {
    const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    return timeB - timeA;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingRooms ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-3 w-[80%]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground animate-in fade-in duration-300">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <p className="font-medium text-foreground">
              {searchQuery ? "No matches found" : "No conversations yet"}
            </p>
            <p className="text-sm mt-1 max-w-[200px]">
              {searchQuery ? "Try adjusting your search terms." : "Start a conversation to see it here."}
            </p>
          </div>
        ) : (
          filteredRooms.map(room => {
            const isNew = !!room.isNewConnection;
            const isActive = activeChat?.id === room.id;
            
            // Determine room name
            let roomName = room.name || "Chat Room";
            let otherUserId: string | null = null;
            let avatarUrl: string | null = null;
            
            if (room.type === "DIRECT") {
              const otherParticipant = room.participants.find((p) => p.user?.name);
              if (otherParticipant?.user?.name) {
                roomName = otherParticipant.user.name;
                otherUserId = otherParticipant.user.clerkId || null;
                avatarUrl = otherParticipant.user.avatarUrl || null;
              }
            } else if (room.type === "TEAM") {
              if (room.team?.name) roomName = room.team.name;
            } else if (room.type === "COMMUNITY") {
              if (room.community?.name) roomName = room.community.name;
            }

            const lastMessage = room.messages?.[0];
            const lastMessageText = getPreviewText(lastMessage);
            const lastMessageTime = lastMessage?.createdAt ? formatConversationPreview(lastMessage.createdAt) : "";
            
            const isOnline = otherUserId && onlineUsers.includes(otherUserId);
            const unreadCount = room.unreadCount || 0;
            const isTyping = typingUsers[room.id];

            return (
              <button 
                key={room.id} 
                onClick={() => handleSelectChat(room.id, isNew, roomName)}
                className={cn(
                  "w-full text-left flex items-center gap-3 p-3 mx-2 my-1 rounded-xl transition-all duration-200 relative group",
                  isActive 
                    ? "bg-primary/10 hover:bg-primary/15" 
                    : "hover:bg-muted/80"
                )}
                style={{ width: 'calc(100% - 16px)' }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <div className="relative shrink-0 ml-1">
                  <UserAvatar userId={otherUserId} name={roomName} imageUrl={avatarUrl} size="md" className="shadow-sm" />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-background bg-green-500 rounded-full shadow-sm"></span>
                  )}
                </div>
                
                <div className="overflow-hidden flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={cn(
                      "text-[15px] truncate pr-2 transition-colors", 
                      unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                      isActive && "text-primary font-semibold"
                    )}>
                      {roomName}
                    </p>
                    {lastMessageTime && !isTyping && (
                      <span className={cn(
                        "text-[11px] shrink-0 font-medium tracking-tight", 
                        unreadCount > 0 ? "text-primary" : "text-muted-foreground/80",
                        isActive && unreadCount === 0 && "text-primary/70"
                      )}>
                        {lastMessageTime}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center h-5">
                    {isTyping ? (
                      <p className="text-[13px] truncate pr-2 text-primary font-medium animate-pulse">Typing...</p>
                    ) : (
                      <p className={cn(
                        "text-[13px] truncate pr-2", 
                        unreadCount > 0 ? "font-semibold text-foreground/90" : "text-muted-foreground/80 font-normal"
                      )}>
                        {lastMessageText}
                      </p>
                    )}
                    {unreadCount > 0 && !isTyping && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm min-w-[20px] text-center flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
