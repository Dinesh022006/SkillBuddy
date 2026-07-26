import { Metadata } from "next";
import ChatSidebar from "./ChatSidebar";
import ChatLayoutClient from "./ChatLayoutClient";

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
    <ChatLayoutClient
      sidebar={
        <>
          <div className="p-4 border-b shrink-0">
            <h2 className="font-semibold text-lg">Messages</h2>
          </div>
          <ChatSidebar />
        </>
      }
    >
      {children}
    </ChatLayoutClient>
  );
}
