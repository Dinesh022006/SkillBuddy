// We type the candidate using any or a specific type mapped from Prisma output
export interface SearchCandidate {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  profile: {
    college: string | null;
    branch: string | null;
    xp: number | null;
    interests: string[];
    skills: { skill: { id: string; name: string } }[];
    learningGoals: { skill: { id: string; name: string } }[];
  } | null;
  communities: { community: { id: string; name: string } }[];
}

export function rankAndFilterCandidates(candidates: SearchCandidate[], search: string): SearchCandidate[] {
  const searchLower = search.trim().toLowerCase();

  const validMatches = candidates.map(user => {
    const name = (user.name || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    const college = (user.profile?.college || "").toLowerCase();
    const interests = (user.profile?.interests || []).map(i => i.toLowerCase());
    const skills = (user.profile?.skills || []).map(s => s.skill.name.toLowerCase());
    const goals = (user.profile?.learningGoals || []).map(g => g.skill.name.toLowerCase());
    const communities = (user.communities || []).map(c => c.community.name.toLowerCase());
    
    let score = 0;
    
    if (name === searchLower || username === searchLower) score += 100;
    else if (name.startsWith(searchLower) || username.startsWith(searchLower)) score += 50;
    else if (name.includes(searchLower) || username.includes(searchLower)) score += 30;
    
    if (college.includes(searchLower)) score += 20;
    
    if (skills.some(s => s.includes(searchLower))) score += 15;
    if (goals.some(g => g.includes(searchLower))) score += 10;
    if (interests.some(i => i.includes(searchLower))) score += 10;
    if (communities.some(c => c.includes(searchLower))) score += 10;
    
    return { user, score };
  }).filter(match => match.score > 0);
  
  // Sort by highest score first
  validMatches.sort((a, b) => b.score - a.score);

  return validMatches.map(m => m.user);
}
