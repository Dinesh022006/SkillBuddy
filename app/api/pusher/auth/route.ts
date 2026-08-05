import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (!pusherServer) {
      return new NextResponse("Pusher not configured", { status: 500 });
    }

    const formData = await req.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;

    if (!socketId || !channel) {
      return new NextResponse("Missing socket_id or channel_name", { status: 400 });
    }

    const presenceData = {
      user_id: dbUser.id,
      user_info: {
        name: dbUser.name || dbUser.fullName,
        clerkId: dbUser.clerkId,
        avatarUrl: dbUser.avatarUrl,
      }
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("[PUSHER_AUTH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
