import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  college: z.string().optional(),
  branch: z.string().optional(),
  year: z.number().optional(),
  github: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  careerGoal: z.string().optional(),
  availability: z.string().optional(),
  codechefUrl: z.string().url().optional().or(z.literal("")),
  codeforcesUrl: z.string().url().optional().or(z.literal("")),
  hackerrankUrl: z.string().url().optional().or(z.literal("")),
  hackerearthUrl: z.string().url().optional().or(z.literal("")),
  kaggleUrl: z.string().url().optional().or(z.literal("")),
  devfolioUrl: z.string().url().optional().or(z.literal("")),
  behanceUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } },
          }
        },
      }
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    const user = await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: [validatedData.firstName, validatedData.lastName].filter(Boolean).join(" "),
      },
      include: { profile: { include: { skills: true, learningGoals: true } } }
    });

    // Calculate completion score
    const dbProfile = user.profile;
    let completion = 0;
    if (user.avatarUrl) completion += 10;
    if (dbProfile?.bio) completion += 10;
    if (dbProfile?.skills && dbProfile.skills.length > 0) completion += 20;
    if (dbProfile?.learningGoals && dbProfile.learningGoals.length > 0) completion += 15;
    if (dbProfile?.careerGoal) completion += 15; // Looking For
    if (dbProfile?.githubUrl) completion += 10;
    if (dbProfile?.linkedinUrl) completion += 5;
    if (dbProfile?.resumeUrl) completion += 5;

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
      profileAny?.behanceUrl
    ].filter(Boolean);
    if (codingProfiles.length > 0) completion += 10;

    const updatedUser = await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        profile: {
          upsert: {
            create: {
              bio: validatedData.bio,
              college: validatedData.college,
              branch: validatedData.branch,
              year: validatedData.year,
              githubUrl: validatedData.github,
              linkedinUrl: validatedData.linkedin,
              portfolioUrl: validatedData.portfolio,
              careerGoal: validatedData.careerGoal,
              availability: validatedData.availability,
              codechefUrl: validatedData.codechefUrl,
              codeforcesUrl: validatedData.codeforcesUrl,
              hackerrankUrl: validatedData.hackerrankUrl,
              hackerearthUrl: validatedData.hackerearthUrl,
              kaggleUrl: validatedData.kaggleUrl,
              devfolioUrl: validatedData.devfolioUrl,
              behanceUrl: validatedData.behanceUrl,
              completion: completion,
            },
            update: {
              bio: validatedData.bio,
              college: validatedData.college,
              branch: validatedData.branch,
              year: validatedData.year,
              githubUrl: validatedData.github,
              linkedinUrl: validatedData.linkedin,
              portfolioUrl: validatedData.portfolio,
              careerGoal: validatedData.careerGoal,
              availability: validatedData.availability,
              codechefUrl: validatedData.codechefUrl,
              codeforcesUrl: validatedData.codeforcesUrl,
              hackerrankUrl: validatedData.hackerrankUrl,
              hackerearthUrl: validatedData.hackerearthUrl,
              kaggleUrl: validatedData.kaggleUrl,
              devfolioUrl: validatedData.devfolioUrl,
              behanceUrl: validatedData.behanceUrl,
              completion: completion,
            }
          }
        }
      },
      include: { profile: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
