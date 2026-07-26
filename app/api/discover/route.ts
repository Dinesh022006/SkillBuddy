import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    // Calculate pagination skip
    const skip = (page - 1) * limit;

    // Base query: find users other than current user
    const whereClause: NonNullable<Parameters<typeof prisma.user.findMany>[0]>["where"] = {
      id: { not: dbUser.id },
      deletedAt: null
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { profile: { college: { contains: search, mode: 'insensitive' } } },
        { profile: { branch: { contains: search, mode: 'insensitive' } } },
        { profile: { skills: { some: { skill: { name: { contains: search, mode: 'insensitive' } } } } } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        },
        recommendationsFor: {
          where: { sourceUserId: dbUser.id, type: "AI_MATCH" },
          include: { aiInsight: true }
        },
        connectionsReceived: {
          where: { requesterId: dbUser.id }
        },
        connectionsInitiated: {
          where: { receiverId: dbUser.id }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("[DISCOVER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
