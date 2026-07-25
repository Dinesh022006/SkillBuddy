type ProfileData = {
  skills: string[]
  learningGoals: string[]
  availability: string
  careerGoal: string
  interests: string[]
}

export type CompatibilityScore = {
  totalScore: number
  breakdown: {
    skillsMatch: number // Max 40
    learningGoals: number // Max 25
    availability: number // Max 15
    careerGoal: number // Max 10
    interests: number // Max 10
  }
}

/**
 * Collaboration Intelligence Engine (CIE) - Rule-based Compatibility Scoring
 * 
 * Future Enhancement: 
 * - Integrate with pgvector for semantic search.
 * - Replace exact matching with NLP / Embeddings.
 */
export function calculateCompatibility(
  source: ProfileData,
  target: ProfileData
): CompatibilityScore {
  let score = 0
  const breakdown = {
    skillsMatch: 0,
    learningGoals: 0,
    availability: 0,
    careerGoal: 0,
    interests: 0,
  }

  // 1. Skills Match (Max 40)
  // Check if target has skills the source wants to learn, or vice versa
  const commonSkills = source.skills.filter((s) => target.skills.includes(s)).length
  if (commonSkills > 0) {
    breakdown.skillsMatch = Math.min(40, commonSkills * 10)
    score += breakdown.skillsMatch
  }

  // 2. Learning Goals (Max 25)
  // Check if they share learning goals
  const commonGoals = source.learningGoals.filter((g) => target.learningGoals.includes(g)).length
  if (commonGoals > 0) {
    breakdown.learningGoals = Math.min(25, commonGoals * 12.5)
    score += breakdown.learningGoals
  }

  // 3. Availability (Max 15)
  // Exact match for now
  if (source.availability && target.availability && source.availability === target.availability) {
    breakdown.availability = 15
    score += breakdown.availability
  }

  // 4. Career Goal (Max 10)
  if (source.careerGoal && target.careerGoal && source.careerGoal === target.careerGoal) {
    breakdown.careerGoal = 10
    score += breakdown.careerGoal
  }

  // 5. Interests (Max 10)
  const commonInterests = source.interests.filter((i) => target.interests.includes(i)).length
  if (commonInterests > 0) {
    breakdown.interests = Math.min(10, commonInterests * 5)
    score += breakdown.interests
  }

  return {
    totalScore: score,
    breakdown,
  }
}

export function determineRecommendationType(source: ProfileData, target: ProfileData): string {
  // Simple heuristic
  const sourceNeedsTargetSkill = source.learningGoals.some(g => target.skills.includes(g))
  const targetNeedsSourceSkill = target.learningGoals.some(g => source.skills.includes(g))
  
  if (sourceNeedsTargetSkill && targetNeedsSourceSkill) {
    return 'Skill Exchange'
  }
  
  const commonGoals = source.learningGoals.filter(g => target.learningGoals.includes(g)).length
  if (commonGoals > 0) {
    return 'Study Buddy'
  }

  return 'Project Partner'
}
