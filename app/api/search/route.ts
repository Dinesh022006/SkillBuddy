import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type") || "all";
    const take = 10; // Simple pagination limit for now

    if (!query) {
      return NextResponse.json({ users: [], communities: [], teams: [], posts: [] });
    }

    const searchResults: Record<string, unknown> = {};

    if (type === "all" || type === "users") {
      searchResults.users = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take,
        select: { 
          id: true, 
          fullName: true, 
          username: true, 
          imageUrl: true,
          profile: {
            select: {
              college: true,
              branch: true,
              skills: {
                select: {
                  skill: { select: { id: true, name: true } }
                }
              }
            }
          }
        }
      });
    }

    if (type === "all" || type === "communities") {
      searchResults.communities = await prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          visibility: "PUBLIC",
        },
        take,
        select: { id: true, name: true, description: true, bannerUrl: true }
      });
    }

    if (type === "all" || type === "teams") {
      searchResults.teams = await prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take,
        select: { id: true, name: true, description: true }
      });
    }

    if (type === "all" || type === "posts") {
      searchResults.posts = await prisma.communityPost.findMany({
        where: {
          content: { contains: query, mode: "insensitive" },
        },
        take,
        include: { author: { select: { fullName: true, imageUrl: true } }, community: { select: { name: true } } }
      });
    }

    return NextResponse.json(searchResults);
  } catch (error: unknown) {
    console.error("[SEARCH_GET]", error);
    return new NextResponse((error as Error).message || "Internal Error", { status: 500 });
  }
}
