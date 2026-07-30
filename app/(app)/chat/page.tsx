import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import ChatAppContainer from "./ChatAppContainer";

export default async function ChatIndexPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser) return null;

  return <ChatAppContainer />;
}
