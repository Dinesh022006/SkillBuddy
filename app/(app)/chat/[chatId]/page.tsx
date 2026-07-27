import ChatWindow from "./ChatWindow";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  if (!chatId) notFound();

  const clerkUser = await currentUser();
  if (!clerkUser) notFound();

  const [dbUser, chatRoom] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: clerkUser.id } }),
    prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        participants: true
      }
    })
  ]);

  if (!dbUser || !chatRoom) notFound();

  const isParticipant = chatRoom.participants.some(p => p.userId === dbUser.id);
  if (!isParticipant) notFound();

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <ChatWindow chatId={chatId} />
    </div>
  );
}
