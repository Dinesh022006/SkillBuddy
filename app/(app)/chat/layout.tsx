import { Metadata } from "next";

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
    <div className="h-full w-full max-w-7xl mx-auto py-6">
      {children}
    </div>
  );
}
