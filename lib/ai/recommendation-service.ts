import { prisma } from "@/lib/prisma";
import { generateAIInsight } from "./gemini";

type UserProfileData = {
  id: string;
  name?: string | null;
  updatedAt?: Date;
  profile?: {
    college?: string | null;
    branch?: string | null;
    bio?: string | null;
    careerGoal?: string | null;
    availability?: string | null;
    skills?: { skill: { name: string } }[];
    learningGoals?: { skill: { name: string } }[];
    interests?: string[];
    updatedAt?: Date;
  } | null;
};

// Helper to format a user for the prompt
function formatUserForPrompt(user: UserProfileData) {
  const profile = user.profile || {};
  return {
    name: user.name || "Anonymous",
    college: profile.college || "Not specified",
    branch: profile.branch || "Not specified",
    bio: profile.bio || "Not specified",
    careerGoal: profile.careerGoal || "Not specified",
    availability: profile.availability || "Not specified",
    skills: profile.skills?.map((s) => s.skill.name) || [],
    learningGoals: profile.learningGoals?.map((g) => g.skill.name) || [],
    interests: profile.interests || [],
  };
}

export async function generateRecommendation(sourceUser: UserProfileData, targetUser: UserProfileData, forceRefresh: boolean = false) {
  // Check if a recommendation already exists
  const existingRecommendation = await prisma.recommendation.findUnique({
    where: {
      sourceUserId_targetUserId_type: {
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
        type: "AI_MATCH"
      }
    },
    include: { aiInsight: true }
  });

  const sourceUpdated = sourceUser.profile?.updatedAt || sourceUser.updatedAt;
  const targetUpdated = targetUser.profile?.updatedAt || targetUser.updatedAt;
  
  let isStale = false;
  if (existingRecommendation) {
    const recUpdated = existingRecommendation.updatedAt;
    if ((sourceUpdated && sourceUpdated > recUpdated) || (targetUpdated && targetUpdated > recUpdated)) {
      isStale = true;
    }
  }

  if (existingRecommendation && existingRecommendation.aiInsight && !isStale && !forceRefresh) {
    return existingRecommendation;
  }

  const prompt = `
You are an expert AI Collaboration Matchmaker. Analyze the following two students and determine their compatibility for collaboration, side projects, hackathons, or study groups.

User 1 (Source):
${JSON.stringify(formatUserForPrompt(sourceUser), null, 2)}

User 2 (Target):
${JSON.stringify(formatUserForPrompt(targetUser), null, 2)}

Provide your response strictly in the following JSON format:
{
  "compatibilityScore": <number between 0 and 100>,
  "matchSummary": "<a 2-3 sentence summary of why they are a good or bad match>",
  "sharedSkills": ["<skill 1>", "<skill 2>"],
  "complementarySkills": ["<skill 1>", "<skill 2>"],
  "collaborationSuggestions": ["<suggestion 1>", "<suggestion 2>"],
  "recommendedProjects": ["<project idea 1>", "<project idea 2>"],
  "learningOpportunities": ["<opportunity 1>", "<opportunity 2>"],
  "confidenceScore": <number between 0 and 100>
}
  `;

  const aiResponseRaw = await generateAIInsight(prompt);
  const aiResponse = aiResponseRaw as {
    compatibilityScore?: number;
    matchSummary?: string;
    sharedSkills?: string[];
    complementarySkills?: string[];
    collaborationSuggestions?: string[];
    recommendedProjects?: string[];
    learningOpportunities?: string[];
    confidenceScore?: number;
  };

  const data = {
    score: aiResponse.compatibilityScore || 0,
    type: "AI_MATCH",
    aiInsight: {
      create: {
        matchSummary: aiResponse.matchSummary || "",
        sharedSkills: aiResponse.sharedSkills || [],
        complementarySkills: aiResponse.complementarySkills || [],
        collaborationSuggestions: aiResponse.collaborationSuggestions || [],
        recommendedProjects: aiResponse.recommendedProjects || [],
        learningOpportunities: aiResponse.learningOpportunities || [],
        confidenceScore: aiResponse.confidenceScore || 0,
      }
    }
  };

  if (existingRecommendation) {
    // Upsert or update existing. Prisma doesn't allow nested create/update easily inside update if aiInsight might exist, 
    // but aiInsight is 1-to-1. We can just delete the old AI Insight and recreate.
    if (existingRecommendation.aiInsight) {
      await prisma.aIInsight.delete({ where: { recommendationId: existingRecommendation.id } });
    }
    return await prisma.recommendation.update({
      where: { id: existingRecommendation.id },
      data,
      include: { aiInsight: true }
    });
  } else {
    return await prisma.recommendation.create({
      data: {
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
        ...data
      },
      include: { aiInsight: true }
    });
  }
}
