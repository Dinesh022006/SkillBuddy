import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });

    if (!targetUser) return new NextResponse("Target user not found", { status: 404 });

    // Fetch shared communities
    const sharedCommunities = await prisma.communityMember.findMany({
      where: {
        userId: targetUser.id,
        community: {
          members: { some: { userId: dbUser.id } }
        }
      },
      include: { community: { select: { name: true } } }
    });

    // Fetch mutual connections (simplified)
    const currentUserConnections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: dbUser.id }, { receiverId: dbUser.id }]
      }
    });
    const targetUserConnections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: targetUser.id }, { receiverId: targetUser.id }]
      }
    });

    const getConnectedUserIds = (conns: any[], myId: string) => 
      conns.map(c => c.requesterId === myId ? c.receiverId : c.requesterId);

    const myConnectedIds = new Set(getConnectedUserIds(currentUserConnections, dbUser.id));
    const theirConnectedIds = new Set(getConnectedUserIds(targetUserConnections, targetUser.id));
    
    // Intersect
    let mutualCount = 0;
    for (const id of theirConnectedIds) {
      if (myConnectedIds.has(id) && id !== dbUser.id) mutualCount++;
    }

    return NextResponse.json({
      ...targetUser,
      sharedCommunities: sharedCommunities.map(sc => sc.community.name),
      mutualConnectionsCount: mutualCount
    });

  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
