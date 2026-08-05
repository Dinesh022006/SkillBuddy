import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-pusher-signature");

    if (!signature || !pusherServer) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Pusher webhook parser expects headers object
    const headersObj: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersObj[key] = val;
    });

    const webhook = pusherServer.webhook({
      rawBody: rawBody,
      headers: headersObj
    });

    if (!webhook.isValid()) {
      return new NextResponse("Invalid webhook signature", { status: 401 });
    }

    const events = webhook.getEvents();
    
    for (const event of events) {
      if (event.name === "member_removed") {
        const userId = (event as any).user_id;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeen: new Date() }
          });
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PUSHER_WEBHOOK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
