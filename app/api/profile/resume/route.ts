import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function DELETE() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { profile: true },
    });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const resumeUrl = user.profile?.resumeUrl;
    if (!resumeUrl) return new NextResponse("No resume to delete", { status: 400 });

    // Find the associated file asset to get its key
    const asset = await prisma.fileAsset.findFirst({ where: { url: resumeUrl } });
    if (asset) {
      // Delete file from UploadThing storage
      await utapi.deleteFiles(asset.fileKey);
      // Remove record from DB
      await prisma.fileAsset.delete({ where: { id: asset.id } });
    }

    // Update profile to remove resume URL
    const updatedUser = await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        profile: { update: { resumeUrl: null } },
      },
      include: {
        profile: {
          include: {
            skills: true,
            learningGoals: true,
          }
        }
      },
    });

    // Recalculate completion score (same logic as PATCH, without resume weight)
    let completion = 0;
    if (updatedUser.avatarUrl) completion += 10;
    const dbProfile = updatedUser.profile;
    if (dbProfile?.bio) completion += 10;
    if (dbProfile?.skills?.length) completion += 20;
    if (dbProfile?.learningGoals?.length) completion += 15;
    if (dbProfile?.careerGoal) completion += 15;
    if (dbProfile?.githubUrl) completion += 10;
    if (dbProfile?.linkedinUrl) completion += 5;
    // Coding profiles weight
    // @ts-expect-error coding profiles extraction
    const profileAny = dbProfile as Record<string, string | undefined>;
    const codingProfiles = [
      profileAny?.leetcodeUrl,
      profileAny?.codechefUrl,
      profileAny?.codeforcesUrl,
      profileAny?.hackerrankUrl,
      profileAny?.hackerearthUrl,
      profileAny?.kaggleUrl,
      profileAny?.devfolioUrl,
      profileAny?.behanceUrl,
    ].filter(Boolean);
    if (codingProfiles.length > 0) completion += 10;

    // Persist new completion
    await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: { profile: { update: { completion } } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESUME_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
