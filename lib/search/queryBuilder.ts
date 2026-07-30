import { Prisma } from "@prisma/client";

export function buildSearchQuery(search: string, userId: string): Prisma.UserFindManyArgs {
  const searchLower = search.trim().toLowerCase();

  return {
    where: {
      id: { not: userId },
      deletedAt: null,
      OR: [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { username: { contains: searchLower, mode: 'insensitive' } },
        { profile: { college: { contains: searchLower, mode: 'insensitive' } } },
        { profile: { skills: { some: { skill: { name: { contains: searchLower, mode: 'insensitive' } } } } } },
        { profile: { learningGoals: { some: { skill: { name: { contains: searchLower, mode: 'insensitive' } } } } } },
        { communities: { some: { community: { name: { contains: searchLower, mode: 'insensitive' } } } } },
      ]
    },
    // We strictly use select to avoid N+1 and massive payloads
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      profile: {
        select: {
          college: true,
          branch: true,
          xp: true,
          interests: true,
          skills: {
            select: { skill: { select: { id: true, name: true } } }
          },
          learningGoals: {
            select: { skill: { select: { id: true, name: true } } }
          }
        }
      },
      communities: {
        select: {
          community: { select: { id: true, name: true } }
        }
      }
    }
  };
}
