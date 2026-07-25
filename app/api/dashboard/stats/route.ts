import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { profile: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const userId = user.id;

    // Run parallel counts for performance
    const [
      totalConnections,
      pendingRequests,
      communitiesJoined,
      teamsJoined,
      activeChats,
      messagesSent,
      aiMatchesGenerated,
      streak,
    ] = await Promise.all([
      prisma.connection.count({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
          status: "ACCEPTED",
        },
      }),
      prisma.connection.count({
        where: { receiverId: userId, status: "PENDING" },
      }),
      prisma.communityMember.count({
        where: { userId },
      }),
      prisma.teamMember.count({
        where: { userId },
      }),
      prisma.chatParticipant.count({
        where: { userId },
      }),
      prisma.message.count({
        where: { senderId: userId },
      }),
      prisma.recommendation.count({
        where: { targetUserId: userId },
      }),
      prisma.learningStreak.findUnique({
        where: { profileId: user.profile?.id ?? "" },
        select: { currentStreak: true, longestStreak: true },
      }),
    ]);

    // Simple activity metrics (last 7 days vs last 30 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [weeklyActivity, monthlyActivity] = await Promise.all([
      prisma.activity.count({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.activity.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      totalConnections,
      pendingRequests,
      communitiesJoined,
      teamsJoined,
      activeChats,
      messagesSent,
      aiMatchesGenerated,
      profileCompletion: user.profile?.completion || 0,
      xp: user.profile?.xp || 0,
      level: user.profile?.level || 1,
      weeklyActivity,
      monthlyActivity,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
