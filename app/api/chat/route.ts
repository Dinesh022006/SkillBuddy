import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
  try {
    void _req;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { userId: dbUser.id }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { name: true } }
          }
        },
        team: { select: { name: true } },
        community: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error("[CHATROOMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
