import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCommunitySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { name, description, tags, visibility } = createCommunitySchema.parse(body);

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return new NextResponse("Community name already exists", { status: 400 });
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        tags,
        visibility,
        chatRoom: {
          create: {
            type: "COMMUNITY",
            name: `${name} Chat`
          }
        },
        members: {
          create: {
            userId: dbUser.id,
            role: "ADMIN"
          }
        }
      },
      include: {
        chatRoom: true
      }
    });

    // Automatically add the creator to the chat room
    if (community.chatRoomId) {
      await prisma.chatParticipant.create({
        data: {
          roomId: community.chatRoomId,
          userId: dbUser.id
        }
      });
    }

    return NextResponse.json(community);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[COMMUNITIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const communities = await prisma.community.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ]
      } : {},
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(communities);
  } catch (error) {
    console.error("[COMMUNITIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
