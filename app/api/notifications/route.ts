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

    // Lightweight consistency check for pending connections
    const pendingConnections = await prisma.connection.findMany({
      where: {
        receiverId: dbUser.id,
        status: "PENDING"
      },
      include: {
        requester: { select: { name: true } }
      }
    });

    if (pendingConnections.length > 0) {
      const existingNotifs = await prisma.notification.findMany({
        where: {
          userId: dbUser.id,
          type: "CONNECTION_REQUEST"
        },
        select: { senderId: true }
      });

      const existingSenderIds = new Set(existingNotifs.map(n => n.senderId));

      const missingConnections = pendingConnections.filter(
        c => !existingSenderIds.has(c.requesterId)
      );

      if (missingConnections.length > 0) {
        await prisma.notification.createMany({
          data: missingConnections.map(c => ({
            userId: dbUser.id,
            senderId: c.requesterId,
            type: "CONNECTION_REQUEST",
            title: "New Connection Request",
            message: `${c.requester.name || "A user"} sent you a connection request.`,
            link: "/connections"
          }))
        });
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    await prisma.notification.updateMany({
      where: { userId: dbUser.id, read: false },
      data: { read: true }
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
