import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1)
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { content } = messageSchema.parse(body);

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!room) return new NextResponse("Room not found", { status: 404 });

    const isParticipant = room.participants.some(p => p.userId === dbUser.id);
    if (!isParticipant) {
      return new NextResponse("Not a participant", { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        roomId: chatId,
        senderId: dbUser.id,
        seenBy: [dbUser.id]
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, clerkId: true }
        }
      }
    });

    await pusherServer.trigger(`room-${chatId}`, 'new-message', message);

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!room) return new NextResponse("Room not found", { status: 404 });

    const isParticipant = room.participants.some(p => p.userId === dbUser.id);
    if (!isParticipant) {
      return new NextResponse("Not a participant", { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { roomId: chatId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, clerkId: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
