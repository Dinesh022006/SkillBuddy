"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Loader2, Users, User, MessagesSquare } from "lucide-react"

type Room = {
  id: string;
  name?: string | null;
  type: string;
  participants: { user?: { name?: string | null } }[];
  messages?: { content: string }[];
  team?: { name: string };
  community?: { name: string };
};

export default function ChatSidebar() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (rooms.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground text-center">No messages yet.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {rooms.map(room => {
        const isActive = pathname === `/chat/${room.id}`;
        
        // Determine room name
        let roomName = room.name || "Chat Room";
        let Icon = MessagesSquare;
        if (room.type === "DIRECT") {
          Icon = User;
          // Ideally find the other participant's name
          const otherParticipant = room.participants.find((p) => p.user?.name);
          if (otherParticipant?.user?.name) roomName = otherParticipant.user.name;
        } else if (room.type === "TEAM") {
          Icon = Users;
          if (room.team?.name) roomName = room.team.name;
        } else if (room.type === "COMMUNITY") {
          Icon = Users;
          if (room.community?.name) roomName = room.community.name;
        }

        const lastMessage = room.messages?.[0]?.content || "No messages yet";

        return (
          <Link 
            key={room.id} 
            href={`/chat/${room.id}`}
            className={`flex items-center gap-3 p-4 border-b hover:bg-accent/50 transition-colors ${isActive ? 'bg-accent/50' : ''}`}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{roomName}</p>
              <p className="text-xs text-muted-foreground truncate">{lastMessage}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
