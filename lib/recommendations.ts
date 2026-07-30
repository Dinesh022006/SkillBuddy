import { prisma } from "@/lib/prisma";

export const recommendationService = {
  async getAIRecommendations(userId: string, limit = 10, skip = 0) {
    // Top compatibility scores based on existing Recommendation table.
    // If we want a dynamic algorithm in real-time we'd calculate on the fly, 
    // but the requirement says "Sort by highest compatibility" and mentions 
    // "Generate a compatibility score using multiple factors".
    // We will query users and sort them by the Recommendation score where type="AI_MATCH".
    
    // Fallback: If no AI_MATCH recommendations exist, fallback to similar skills & goals.
    const recommendations = await prisma.recommendation.findMany({
      where: { sourceUserId: userId, type: "AI_MATCH" },
      orderBy: { score: "desc" },
      skip,
      take: limit,
      include: {
        targetUser: {
          include: {
            profile: {
              include: {
                skills: { include: { skill: true } },
                learningGoals: { include: { skill: true } }
              }
            }
          }
        },
        aiInsight: true
      }
    });

    return recommendations.map(r => ({
      ...r.targetUser,
      matchScore: r.score,
      aiInsight: r.aiInsight
    }));
  },

  async getSkillRecommendations(userId: string, limit = 10, skip = 0) {
    // Find users who share skills with current user
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true }
    });

    if (!currentUserProfile || currentUserProfile.skills.length === 0) return [];

    const skillIds = currentUserProfile.skills.map(s => s.skillId);

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        profile: {
          skills: {
            some: { skillId: { in: skillIds } }
          }
        }
      },
      skip,
      take: limit,
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });

    return users;
  },

  async getLearningRecommendations(userId: string, limit = 10, skip = 0) {
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { learningGoals: true }
    });

    if (!currentUserProfile || currentUserProfile.learningGoals.length === 0) return [];

    const goalIds = currentUserProfile.learningGoals.map(g => g.skillId);

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        profile: {
          learningGoals: {
            some: { skillId: { in: goalIds } }
          }
        }
      },
      skip,
      take: limit,
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });

    return users;
  },

  async getCommunityRecommendations(userId: string, limit = 10, skip = 0) {
    const userCommunities = await prisma.communityMember.findMany({
      where: { userId }
    });

    if (userCommunities.length === 0) return [];

    const communityIds = userCommunities.map(c => c.communityId);

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        communities: {
          some: { communityId: { in: communityIds } }
        }
      },
      skip,
      take: limit,
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } }
          }
        }
      }
    });

    return users;
  },

  async getTopContributors(userId: string, limit = 10, skip = 0) {
    // Dynamic ranking based on XP
    const users = await prisma.user.findMany({
      where: { id: { not: userId } },
      orderBy: {
        profile: { xp: "desc" }
      },
      skip,
      take: limit,
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } },
            userBadges: { include: { badge: true } }
          }
        }
      }
    });

    return users;
  },
  
  async searchUsers(userId: string, search: string, limit = 10, skip = 0) {
    const { executeSearch } = await import('@/lib/search');
    return executeSearch(userId, search, limit, skip);
  }
};
