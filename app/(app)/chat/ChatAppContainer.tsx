"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { MessagesSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "./store/useChatStore";

import { useUser } from "@clerk/nextjs";

export default function ChatAppContainer() {
  const { user } = useUser();
  const { activeChat, setActiveChat, fetchRooms, initPusher, cleanupPusher } = useChatStore();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (user?.id) {
      initPusher(user.id);
    }
    return () => {
      cleanupPusher();
    };
  }, [user?.id, initPusher, cleanupPusher]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (e.defaultPrevented) return;
        
        const state = useChatStore.getState();
        
        // If a Radix dialog, dropdown, or popover is open, ignore
        const hasOpenOverlay = document.querySelector(
          '[data-state="open"][role="dialog"], [data-state="open"][role="menu"], [data-state="open"][role="listbox"], [data-state="open"][role="menuitem"]'
        );
        if (hasOpenOverlay) return;

        if (state.activeChat) {
          state.clearSelectedConversation();
        }
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-[500px] h-[calc(100vh-8rem)] bg-background border rounded-xl overflow-hidden shadow-sm relative">
      {/* Permanent Sidebar */}
      <div className="w-80 border-r flex-shrink-0 flex flex-col bg-card">
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background min-w-0 relative">
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full">
            <ChatWindow />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center h-full animate-in fade-in duration-500 px-4">
            <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
              <MessagesSquare className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">Your Messages</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Select a conversation from the sidebar to continue chatting, or start a new conversation with your connections and team members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
