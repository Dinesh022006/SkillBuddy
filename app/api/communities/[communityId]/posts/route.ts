import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  content: z.string().min(1)
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { content } = postSchema.parse(body);

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: dbUser.id,
          communityId: communityId
        }
      }
    });

    if (!membership) {
      return new NextResponse("Not a member of this community", { status: 403 });
    }

    const post = await prisma.communityPost.create({
      data: {
        content,
        communityId: communityId,
        authorId: dbUser.id
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[COMMUNITY_POSTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const posts = await prisma.communityPost.findMany({
      where: { communityId: communityId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true, reactions: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[COMMUNITY_POSTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
