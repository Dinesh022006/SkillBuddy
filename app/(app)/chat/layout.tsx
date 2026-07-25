import { Metadata } from "next";
import ChatSidebar from "./ChatSidebar";

export const metadata: Metadata = {
  title: "Chat - SkillBuddy AI",
  description: "Realtime messaging with your communities and teams.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <div className="w-80 border-r flex-shrink-0 flex flex-col bg-card hidden md:flex">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ChatSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
