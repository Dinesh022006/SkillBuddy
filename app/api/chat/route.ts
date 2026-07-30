import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
 
 
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
        community: { select: { name: true } },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: dbUser.id },
                NOT: { seenBy: { has: dbUser.id } }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const connections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: dbUser.id },
          { receiverId: dbUser.id }
        ]
      },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    const existingChatUserIds = new Set();
    chatRooms.filter(r => r.type === "DIRECT").forEach(r => {
      r.participants.forEach(p => {
        if (p.user.id !== dbUser.id) {
          existingChatUserIds.add(p.user.id);
        }
      });
    });

    const newChats = connections
      .map(c => {
        const otherUser = c.requesterId === dbUser.id ? c.receiver : c.requester;
        return {
          id: otherUser.id,
          isNewConnection: true,
          type: "DIRECT",
          name: otherUser.name,
          participants: [{ user: otherUser }],
          messages: [],
          updatedAt: c.updatedAt
        };
      })
      .filter(c => !existingChatUserIds.has(c.participants[0].user.id));

    const formattedChatRooms = chatRooms.map(room => ({
      ...room,
      participants: room.participants.filter(p => p.user.id !== dbUser.id),
      unreadCount: room._count.messages
    }));

    const allSidebarItems = [...formattedChatRooms, ...newChats].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(allSidebarItems);
  } catch (error) {
    console.error("[CHATROOMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
