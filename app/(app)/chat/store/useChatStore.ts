import { create } from 'zustand';

export type MessageStatus = 'sending' | 'sent' | 'failed';

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
};

export type Room = {
  id: string;
  name?: string | null;
  type: string;
  participants: { user?: { id?: string | null; name?: string | null; clerkId?: string | null; avatarUrl?: string | null; } }[];
  messages?: { content?: string; createdAt?: string }[];
  team?: { name: string };
  community?: { name: string };
  isNewConnection?: boolean;
  unreadCount?: number;
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
  isProfileDrawerOpen: boolean;
  selectedProfileUserId: string | null;
  profileCache: Record<string, any>;
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
  markConversationRead: (roomId: string) => void;
  setTyping: (roomId: string) => void;
  clearTyping: (roomId: string) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  openProfileDrawer: (userId: string) => void;
  closeProfileDrawer: () => void;
  fetchUserProfile: (userId: string) => Promise<void>;
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
  isProfileDrawerOpen: false,
  selectedProfileUserId: null,
  profileCache: {},

  setActiveChat: (chat) => set({ activeChat: chat }),
  clearSelectedConversation: () => set({ activeChat: null, selectedProfileUserId: null, isProfileDrawerOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchRooms: async () => {
    set({ loadingRooms: true });
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        set({ rooms: data });
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
            [roomId]: data.map((m: any) => ({ ...m, status: 'sent' }))
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
        messages: [{ content, createdAt: optimisticMessage.createdAt }] 
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
          // The newly created room ID comes back. 
          // We need to move the optimistic message to the actual new room ID.
          const newRoomId = data.roomId;
          set((state) => {
            const { [roomId]: tempMsgs, ...restMsgs } = state.messages;
            return {
              sending: false,
              messages: {
                ...restMsgs,
                [newRoomId]: tempMsgs.map(m => m.id === optimisticId ? { ...m, status: 'sent', id: data.messageId || m.id } : m)
              }
            };
          });
          // Also fetch rooms again to get the new room in sidebar
          get().fetchRooms();
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
                m.id === optimisticId ? { ...m, status: 'sent', id: data.id || m.id } : m
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
    // Basic implementation: find message, re-try send, etc.
    // For now, we can extract the content and re-call sendMessage, removing the failed one.
    const message = get().messages[roomId]?.find(m => m.id === messageId);
    if (!message) return;

    // Remove the failed message
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).filter(m => m.id !== messageId)
      }
    }));
    
    // Re-send (assuming existing connection for simplicity, or grab isNewConnection from activeChat)
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
            messages: [{ content: message.content || (message.attachments ? 'Attachment' : ''), createdAt: message.createdAt }],
            unreadCount: isUnread ? (r.unreadCount || 0) + 1 : 0
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

  openProfileDrawer: (userId) => {
    set({ isProfileDrawerOpen: true, selectedProfileUserId: userId });
    get().fetchUserProfile(userId);
  },

  closeProfileDrawer: () => {
    set({ isProfileDrawerOpen: false });
  },

  fetchUserProfile: async (userId) => {
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
  }
}));
