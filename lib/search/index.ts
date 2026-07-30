import { prisma } from "@/lib/prisma";
import { buildSearchQuery } from "./queryBuilder";
import { rankAndFilterCandidates, SearchCandidate } from "./ranker";
import { mapToDiscoverUser } from "./mapper";
import { DiscoverUser } from "@/components/discover/UserCard";

export async function executeSearch(userId: string, search: string, limit: number, skip: number): Promise<DiscoverUser[]> {
  if (!search || search.trim() === "") return [];

  // 1. Build optimized database query
  const queryArgs = buildSearchQuery(search, userId);

  // 2. Fetch candidates from database
  // The query builder restricts the payload size using `select`
  const rawCandidates = (await prisma.user.findMany(queryArgs)) as unknown as SearchCandidate[];

  // 3. Rank, filter, and validate in-memory
  const validatedCandidates = rankAndFilterCandidates(rawCandidates, search);

  // 4. Paginate
  const paginatedCandidates = validatedCandidates.slice(skip, skip + limit);

  // 5. Map to generic DiscoverUser schema
  return paginatedCandidates.map(mapToDiscoverUser);
}
