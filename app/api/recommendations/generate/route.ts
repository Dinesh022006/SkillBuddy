import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/ai/recommendation-service";
import { z } from "zod";

const generateSchema = z.object({
  targetUserId: z.string().uuid(),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });
    
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { targetUserId, forceRefresh } = generateSchema.parse(body);

    if (dbUser.id === targetUserId) {
      return new NextResponse("Cannot generate recommendation for yourself", { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });

    if (!targetUser) return new NextResponse("Target user not found", { status: 404 });

    const recommendation = await generateRecommendation(dbUser, targetUser, forceRefresh);

    return NextResponse.json(recommendation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[RECOMMENDATION_GENERATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
