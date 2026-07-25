"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { pusherClient } from "@/lib/pusher-client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  content: string;
  senderId?: string | null;
  sender?: {
    name?: string | null;
    clerkId?: string | null;
  } | null;
  createdAt?: string;
};

export default function ChatWindow({ chatId }: { chatId: string }) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${chatId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();

    // Subscribe to Pusher
    const channelName = `room-${chatId}`;
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind("new-message", (message: Message) => {
      setMessages((current) => {
        // Prevent duplicates
        if (current.find(m => m.id === message.id)) return current;
        return [...current, message];
      });
    });

    return () => {
      channel.unbind("new-message");
      pusherClient.unsubscribe(channelName);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Optimistic UI update
    const optimisticMessage = {
      id: Math.random().toString(),
      content: newMessage,
      senderId: user?.id,
      sender: {
        name: user?.fullName || "You",
        clerkId: user?.id
      },
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    const inputContent = newMessage;
    setNewMessage("");

    try {
      await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputContent })
      });
    } catch (e) {
      console.error(e);
      // Could handle failure by removing optimistic message here
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground pt-10">
            No messages yet. Send a message to start the conversation!
          </div>
        )}
        
        {messages.map((message) => {
          const isOwn = message.sender?.clerkId === user?.id;
          return (
            <div key={message.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              <div className="text-xs text-muted-foreground mb-1 ml-1">{message.sender?.name}</div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isOwn ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"}`}>
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </>
  );
}
