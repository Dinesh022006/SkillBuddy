import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    await prisma.message.updateMany({
      where: {
        roomId,
        senderId: { not: dbUser.id },
        NOT: { seenBy: { has: dbUser.id } }
      },
      data: {
        seenBy: {
          push: dbUser.id
        }
      }
    });

    if (pusherServer) {
      await pusherServer.trigger(`private-room-${roomId}`, 'message-read', {
        userId: dbUser.id,
        roomId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAT_READ]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
