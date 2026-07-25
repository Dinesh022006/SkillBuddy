import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

 
export async function GET(req: Request) {
  try {
    void req;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: dbUser.id },
          { receiverId: dbUser.id }
        ]
      },
      include: {
        requester: {
          select: { id: true, name: true, avatarUrl: true, profile: { select: { college: true, branch: true } } }
        },
        receiver: {
          select: { id: true, name: true, avatarUrl: true, profile: { select: { college: true, branch: true } } }
        }
      }
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("[CONNECTIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
