import { create } from 'zustand';

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'read';

export type Attachment = {
  id?: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

export type Message = {
  id: string;
  content?: string;
  senderId?: string | null;
  sender?: {
    name?: string | null;
    clerkId?: string | null;
  } | null;
  createdAt?: string;
  status?: MessageStatus;
  attachments?: Attachment[];
  seenBy?: string[];
};

export type Room = {
  id: string;
  name?: string | null;
  type: string;
  participants: { user?: { id?: string | null; name?: string | null; clerkId?: string | null; avatarUrl?: string | null; lastSeen?: string | null; } }[];
  messages?: { content?: string; createdAt?: string; attachments?: Attachment[] }[];
  team?: { name: string };
  community?: { name: string };
  isNewConnection?: boolean;
  unreadCount?: number;
  updatedAt?: string;
};

export type ActiveChat = {
  id: string;
  isNewConnection: boolean;
  name: string;
} | null;

interface ChatState {
  activeChat: ActiveChat;
  rooms: Room[];
  messages: Record<string, Message[]>;
  searchQuery: string;
  loadingRooms: boolean;
  loadingMessages: Record<string, boolean>;
  sending: boolean;
  typingUsers: Record<string, boolean>;
  onlineUsers: string[];
  profileCache: Record<string, any>;
  pusherInitialized: boolean;
  typingTimeouts: Record<string, NodeJS.Timeout>;
}

interface ChatActions {
  setActiveChat: (chat: ActiveChat) => void;
  clearSelectedConversation: () => void;
  setSearchQuery: (query: string) => void;
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (
    roomId: string, 
    content: string, 
    isNewConnection: boolean, 
    targetUserId?: string,
    currentUser?: any,
    attachments?: Attachment[]
  ) => Promise<string | undefined>;
  retryMessage: (roomId: string, messageId: string) => Promise<void>;
  appendIncomingMessage: (roomId: string, message: Message) => void;
  updateMessageRead: (roomId: string, userId: string) => void;
  markConversationRead: (roomId: string) => void;
  setTyping: (roomId: string) => void;
  clearTyping: (roomId: string) => void;
  emitTyping: (roomId: string) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  fetchUserProfile: (userId: string) => Promise<void>;
  initPusher: (userId: string) => Promise<void>;
  cleanupPusher: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  activeChat: null,
  rooms: [],
  messages: {},
  searchQuery: "",
  loadingRooms: false,
  loadingMessages: {},
  sending: false,
  typingUsers: {},
  onlineUsers: [],
  profileCache: {},
  pusherInitialized: false,
  typingTimeouts: {},

  setActiveChat: (chat) => set({ activeChat: chat }),
  clearSelectedConversation: () => set({ activeChat: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchRooms: async () => {
    set({ loadingRooms: true });
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        set({ rooms: data });
        // Automatically subscribe to new rooms after fetch if Pusher is active
        const { initPusher, pusherInitialized } = get();
        if (pusherInitialized) {
          // Re-trigger initPusher to ensure all rooms are subscribed
          // We can assume userId is available in the current context, or rely on auth endpoint
          // But to be safe, we just let the component handle it or do it here if we pass userId
        }
      }
    } catch (e) {
      console.error("Failed to fetch rooms:", e);
    } finally {
      set({ loadingRooms: false });
    }
  },

  fetchMessages: async (roomId: string) => {
    if (get().loadingMessages[roomId]) return; // prevent duplicate fetches
    
    set((state) => ({
      loadingMessages: { ...state.loadingMessages, [roomId]: true }
    }));
    try {
      const res = await fetch(`/api/chat/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: data.map((m: any) => ({ 
              ...m, 
              status: m.seenBy?.length > 1 ? 'read' : 'sent' 
            }))
          }
        }));
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      set((state) => ({
        loadingMessages: { ...state.loadingMessages, [roomId]: false }
      }));
    }
  },

  sendMessage: async (roomId, content, isNewConnection, targetUserId, currentUser, attachments) => {
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      senderId: currentUser?.id,
      sender: {
        name: currentUser?.fullName || "You",
        clerkId: currentUser?.id
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      attachments
    };

    set((state) => ({
      sending: true,
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), optimisticMessage]
      },
      // Optimistically update the room's last message in sidebar
      rooms: state.rooms.map(r => r.id === roomId ? { 
        ...r, 
        messages: [{ content, createdAt: optimisticMessage.createdAt, attachments }],
        updatedAt: optimisticMessage.createdAt 
      } : r)
    }));

    try {
      if (isNewConnection && targetUserId) {
        // Start a new conversation
        const res = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId, content, attachments })
        });
        
        if (res.ok) {
          const data = await res.json();
          const newRoomId = data.roomId;
          set((state) => {
            const { [roomId]: tempMsgs, ...restMsgs } = state.messages;
            return {
              sending: false,
              messages: {
                ...restMsgs,
                [newRoomId]: tempMsgs.map(m => m.id === optimisticId ? { ...data.message, status: 'sent' } : m)
              }
            };
          });
          // Also fetch rooms again to get the new room in sidebar
          await get().fetchRooms();
          // Ensure new room is subscribed
          const { initPusher } = get();
          if (currentUser?.id) {
            initPusher(currentUser.id);
          }
          return newRoomId; // Return new room ID to update activeChat
        } else {
          throw new Error("Failed to start conversation");
        }
      } else {
        // Existing conversation
        const res = await fetch(`/api/chat/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, attachments })
        });
        if (res.ok) {
          const data = await res.json();
          set((state) => ({
            sending: false,
            messages: {
              ...state.messages,
              [roomId]: (state.messages[roomId] || []).map(m => 
                m.id === optimisticId ? { ...data, status: 'sent' } : m
              )
            }
          }));
        } else {
          throw new Error("Failed to send message");
        }
      }
    } catch (e) {
      console.error(e);
      // Mark as failed
      set((state) => ({
        sending: false,
        messages: {
          ...state.messages,
          [roomId]: (state.messages[roomId] || []).map(m => 
            m.id === optimisticId ? { ...m, status: 'failed' } : m
          )
        }
      }));
    }
  },

  retryMessage: async (roomId, messageId) => {
    const message = get().messages[roomId]?.find(m => m.id === messageId);
    if (!message) return;

    // Remove the failed message
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).filter(m => m.id !== messageId)
      }
    }));
    
    const { activeChat } = get();
    await get().sendMessage(
      roomId, 
      message.content || "", 
      activeChat?.id === roomId ? activeChat.isNewConnection : false
    );
  },

  appendIncomingMessage: (roomId, message) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      // Prevent duplicates
      if (roomMessages.find(m => m.id === message.id)) return state;
      
      const newMessages = [...roomMessages, { ...message, status: 'sent' as const }];
      
      // Also update the sidebar preview and unread count
      const updatedRooms = state.rooms.map(r => {
        if (r.id === roomId) {
          const isUnread = state.activeChat?.id !== roomId;
          return {
            ...r,
            messages: [{ content: message.content, createdAt: message.createdAt, attachments: message.attachments }],
            unreadCount: isUnread ? (r.unreadCount || 0) + 1 : 0,
            updatedAt: message.createdAt
          };
        }
        return r;
      });

      return {
        messages: { ...state.messages, [roomId]: newMessages },
        rooms: updatedRooms
      };
    });
  },

  updateMessageRead: (roomId, userId) => {
    set((state) => {
      const roomMessages = state.messages[roomId];
      if (!roomMessages) return state;

      const updatedMessages = roomMessages.map(msg => {
        // If sender is NOT the one who read it, they see it as read
        if (msg.senderId !== userId && msg.status !== 'read') {
          return { ...msg, status: 'read' as const, seenBy: [...(msg.seenBy || []), userId] };
        }
        return msg;
      });

      return {
        messages: { ...state.messages, [roomId]: updatedMessages }
      };
    });
  },

  markConversationRead: async (roomId) => {
    const room = get().rooms.find(r => r.id === roomId);
    if (!room || room.unreadCount === 0) return; // Prevent unnecessary API calls

    set((state) => ({
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r)
    }));

    try {
      await fetch(`/api/chat/${roomId}/read`, { method: "POST" });
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  },

  setTyping: (roomId) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: true }
    }));
  },
  
  clearTyping: (roomId) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: false }
    }));
  },

  emitTyping: async (roomId) => {
    // Only emit if not new connection
    const room = get().rooms.find(r => r.id === roomId);
    if (!room || room.isNewConnection) return;

    try {
      const { pusherClient } = await import('@/lib/pusher-client');
      if (!pusherClient) return;

      const channel = pusherClient.channel(`private-room-${roomId}`);
      if (channel) {
        channel.trigger('client-typing', { roomId });
      }
    } catch (e) {
      console.error("Failed to emit typing:", e);
    }
  },

  updatePresence: (userId, isOnline) => {
    set((state) => {
      const isCurrentlyOnline = state.onlineUsers.includes(userId);
      if (isOnline && !isCurrentlyOnline) {
        return { onlineUsers: [...state.onlineUsers, userId] };
      } else if (!isOnline && isCurrentlyOnline) {
        return { onlineUsers: state.onlineUsers.filter(id => id !== userId) };
      }
      return state;
    });
  },
  fetchUserProfile: async (userId: string) => {
    const { profileCache } = get();
    if (profileCache[userId]) return; // Already cached
    
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          profileCache: { ...state.profileCache, [userId]: data }
        }));
      }
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
    }
  },

  initPusher: async (userId: string) => {
    if (get().pusherInitialized) return;
    set({ pusherInitialized: true });

    try {
      const { pusherClient } = await import('@/lib/pusher-client');
      if (!pusherClient) return;

      // Subscribe to global presence channel
      const presenceChannel = pusherClient.subscribe('presence-skillbuddy');
      
      presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        const onlineIds = Object.keys(members.members);
        set({ onlineUsers: onlineIds });
      });

      presenceChannel.bind('pusher:member_added', (member: any) => {
        get().updatePresence(member.id, true);
      });

      presenceChannel.bind('pusher:member_removed', (member: any) => {
        get().updatePresence(member.id, false);
      });

      // Subscribe to all active rooms
      const rooms = get().rooms;
      rooms.forEach(room => {
        if (room.isNewConnection) return;
        
        const channelName = `private-room-${room.id}`;
        let channel = pusherClient.channel(channelName);
        if (!channel) {
          channel = pusherClient.subscribe(channelName);
        }

        channel.bind('new-message', (message: Message) => {
          get().appendIncomingMessage(room.id, message);
          
          // If the message belongs to the active chat, mark it as read immediately
          const { activeChat } = get();
          if (activeChat?.id === room.id) {
             get().markConversationRead(room.id);
          }
        });

        channel.bind('message-read', (data: { userId: string, roomId: string }) => {
          if (data.userId !== userId) {
            get().updateMessageRead(data.roomId, data.userId);
          }
        });

        channel.bind('client-typing', (data: { roomId: string }) => {
          // Ignore our own typing events if they bounce back (though client events usually don't)
          get().setTyping(data.roomId);

          // Clear previous timeout for this room
          const { typingTimeouts } = get();
          if (typingTimeouts[data.roomId]) {
            clearTimeout(typingTimeouts[data.roomId]);
          }

          // Set new timeout to clear typing
          const newTimeout = setTimeout(() => {
            get().clearTyping(data.roomId);
          }, 2000);

          set((state) => ({
            typingTimeouts: { ...state.typingTimeouts, [data.roomId]: newTimeout }
          }));
        });
      });

    } catch (e) {
      console.error("Failed to initialize Pusher:", e);
      set({ pusherInitialized: false });
    }
  },

  cleanupPusher: () => {
    set({ pusherInitialized: false });
    import('@/lib/pusher-client').then(({ pusherClient }) => {
      if (!pusherClient) return;
      pusherClient.disconnect();
    });
  }
}));
