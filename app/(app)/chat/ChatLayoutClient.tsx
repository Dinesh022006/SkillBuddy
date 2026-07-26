"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ChatLayoutClient({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoom = pathname !== "/chat";

  return (
    <div className="flex min-h-[500px] h-[calc(100vh-8rem)] bg-background border rounded-xl overflow-hidden shadow-sm relative">
      {/* Sidebar - hidden on mobile if in a chat room */}
      <div
        className={cn(
          "w-full md:w-80 border-r flex-shrink-0 flex flex-col bg-card",
          isChatRoom ? "hidden md:flex" : "flex"
        )}
      >
        {sidebar}
      </div>

      {/* Main Chat Area - hidden on mobile if NOT in a chat room */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background min-w-0",
          !isChatRoom ? "hidden md:flex" : "flex"
        )}
      >
        {children}
      </div>
    </div>
  );
}
