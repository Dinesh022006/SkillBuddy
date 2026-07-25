import { MessagesSquare } from "lucide-react";
import Link from "next/link";

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MessagesSquare className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Your Messages</h3>
      <p className="text-sm max-w-md mb-6">
        Select a conversation from the sidebar to continue chatting, or start a new conversation with your connections and team members.
      </p>
      <div className="flex gap-3">
        <Link href="/connections" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          View Connections
        </Link>
        <Link href="/discover" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Find New People
        </Link>
      </div>
    </div>
  );
}
