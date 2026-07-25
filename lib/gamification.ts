import { prisma } from "@/lib/prisma";

export const XP_AWARDS = {
  PROFILE_COMPLETE: 100,
  CREATE_POST: 20,
  COMMENT: 10,
  JOIN_COMMUNITY: 50,
  JOIN_TEAM: 50,
  CREATE_TEAM: 100,
  RECEIVE_CONNECTION: 20,
  DAILY_LOGIN: 10,
  HACKATHON_PARTICIPATION: 200,
};

// Simple level curve: Level N requires N * 100 XP total.
// E.g. Level 1: 0-99
// Level 2: 100-299 (requires 100 for level 2, 200 for level 3)
export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  let xpRequired = 100;
  let remainingXp = xp;

  while (remainingXp >= xpRequired) {
    remainingXp -= xpRequired;
    level++;
    xpRequired = level * 100;
  }
  return level;
}

export async function awardXP(userId: string, amount: number, reason: string) {
  if (amount <= 0) return;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const newXp = profile.xp + amount;
  const newLevel = calculateLevelFromXP(newXp);

  await prisma.$transaction([
    prisma.xPHistory.create({
      data: {
        profileId: profile.id,
        amount,
        reason,
      },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        xp: newXp,
        level: newLevel,
      },
    }),
  ]);

  return { newXp, newLevel, leveledUp: newLevel > profile.level };
}

export async function updateLearningStreak(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { learningStreak: true },
  });

  if (!profile) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!profile.learningStreak) {
    return prisma.learningStreak.create({
      data: {
        profileId: profile.id,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      },
    });
  }

  const lastActivity = new Date(profile.learningStreak.lastActivityDate);
  const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already updated today
    return profile.learningStreak;
  }

  let newStreak = profile.learningStreak.currentStreak;
  
  if (diffDays === 1) {
    // Consecutive day
    newStreak += 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, profile.learningStreak.longestStreak);

  return prisma.learningStreak.update({
    where: { id: profile.learningStreak.id },
    data: {
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastActivityDate: today,
    },
  });
}
