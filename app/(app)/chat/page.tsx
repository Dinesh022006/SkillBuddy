import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center h-full animate-in fade-in duration-500">
      <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
        <MessagesSquare className="h-12 w-12 text-primary/40" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight mb-2">Your Messages</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Select a conversation from the sidebar to continue chatting, or start a new conversation with your connections and team members.
      </p>
      <div className="flex gap-4">
        <Link href="/connections">
          <Button variant="outline" className="transition-transform hover:scale-105">View Connections</Button>
        </Link>
        <Link href="/discover">
          <Button className="transition-transform hover:scale-105">Find New People</Button>
        </Link>
      </div>
    </div>
  );
}
