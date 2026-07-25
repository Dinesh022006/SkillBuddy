import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return new NextResponse("Goal name required", { status: 400 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { profile: true },
    });
    if (!user?.profile) return new NextResponse("Profile not found", { status: 404 });

    const skill = await prisma.skill.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });

    const goal = await prisma.learningGoal.upsert({
      where: { profileId_skillId: { profileId: user.profile.id, skillId: skill.id } },
      update: {},
      create: { profileId: user.profile.id, skillId: skill.id },
      include: { skill: true },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[PROFILE_GOALS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
