import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  maxMembers: z.number().min(2).max(10).default(4),
  hackathonName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { name, description, requiredSkills, maxMembers, hackathonName } = createTeamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        name,
        description,
        requiredSkills,
        maxMembers,
        hackathonName,
        chatRoom: {
          create: {
            type: "TEAM",
            name: `${name} Chat`
          }
        },
        members: {
          create: {
            userId: dbUser.id,
            role: "LEADER"
          }
        }
      },
      include: {
        chatRoom: true
      }
    });

    if (team.chatRoomId) {
      await prisma.chatParticipant.create({
        data: {
          roomId: team.chatRoomId,
          userId: dbUser.id
        }
      });
    }

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[TEAMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const teams = await prisma.team.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { hackathonName: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("[TEAMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
