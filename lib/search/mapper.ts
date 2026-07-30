import { DiscoverUser } from "@/components/discover/UserCard";
import { SearchCandidate } from "./ranker";

export function mapToDiscoverUser(candidate: SearchCandidate): DiscoverUser {
  return {
    id: candidate.id,
    name: candidate.name,
    avatarUrl: candidate.avatarUrl,
    profile: candidate.profile ? {
      college: candidate.profile.college,
      branch: candidate.profile.branch,
      xp: candidate.profile.xp,
      skills: candidate.profile.skills,
      userBadges: [] // Optional/not fetched for search performance
    } : null,
    // matchScore and aiInsight are omitted for search unless computed dynamically later
  };
}
