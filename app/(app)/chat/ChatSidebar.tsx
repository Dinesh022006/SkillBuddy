"use client"

import { useChatStore } from "./store/useChatStore"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatConversationPreview } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/UserAvatar"

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
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">
            {searchQuery ? "No conversations match your search." : "No messages yet."}
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
            const lastMessageText = lastMessage?.content || "No messages yet";
            const lastMessageTime = lastMessage?.createdAt ? formatConversationPreview(lastMessage.createdAt) : "";
            
            const isOnline = otherUserId && onlineUsers.includes(otherUserId);
            const unreadCount = room.unreadCount || 0;
            const isTyping = typingUsers[room.id];

            return (
              <button 
                key={room.id} 
                onClick={() => handleSelectChat(room.id, isNew, roomName)}
                className={cn(
                  "w-full text-left flex items-center gap-3 p-4 border-b hover:bg-accent/50 transition-colors relative",
                  isActive && "bg-accent/50"
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar userId={otherUserId} name={roomName} imageUrl={avatarUrl} size="md" />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-background bg-green-500 rounded-full"></span>
                  )}
                </div>
                
                <div className="overflow-hidden flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={cn("text-sm truncate pr-2", unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground")}>
                      {roomName}
                    </p>
                    {lastMessageTime && !isTyping && (
                      <span className={cn("text-xs shrink-0", unreadCount > 0 ? "text-blue-500 font-bold" : "text-muted-foreground")}>
                        {lastMessageTime}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    {isTyping ? (
                      <p className="text-xs truncate pr-2 text-primary font-medium italic">Typing...</p>
                    ) : (
                      <p className={cn("text-xs truncate pr-2", unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground font-normal")}>
                        {lastMessageText}
                      </p>
                    )}
                    {unreadCount > 0 && !isTyping && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {unreadCount}
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
