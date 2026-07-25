import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const { skillId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { profile: true },
    });
    if (!user?.profile) return new NextResponse("Profile not found", { status: 404 });

    await prisma.userSkill.deleteMany({
      where: { profileId: user.profile.id, skillId },
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PROFILE_SKILLS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
