import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { recommendationService } from "@/lib/recommendations";

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
    const section = searchParams.get("section") || "search";
    
    const skip = (page - 1) * limit;

    let users = [];

    // Search explicitly overrides sections if present
    if (search) {
      users = await recommendationService.searchUsers(dbUser.id, search, limit, skip);
    } else {
      switch (section) {
        case "ai_recommended":
          users = await recommendationService.getAIRecommendations(dbUser.id, limit, skip);
          break;
        case "similar_skills":
          users = await recommendationService.getSkillRecommendations(dbUser.id, limit, skip);
          break;
        case "similar_goals":
          users = await recommendationService.getLearningRecommendations(dbUser.id, limit, skip);
          break;
        case "shared_communities":
          users = await recommendationService.getCommunityRecommendations(dbUser.id, limit, skip);
          break;
        case "top_contributors":
          users = await recommendationService.getTopContributors(dbUser.id, limit, skip);
          break;
        default:
          return new NextResponse("Invalid section", { status: 400 });
      }
    }

    return NextResponse.json({
      data: users,
      meta: {
        page,
        limit,
      }
    });

  } catch (error) {
    console.error("[DISCOVER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
