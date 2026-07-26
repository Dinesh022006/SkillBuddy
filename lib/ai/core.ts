import { GoogleGenerativeAI } from "@google/generative-ai";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// SHA-256 Hash for caching
function hashPrompt(prompt: string, version: string): string {
  return crypto.createHash("sha256").update(`${version}:${prompt}`).digest("hex");
}

// Extract JSON strictly if model wraps it in markdown blocks
function extractJson(text: string): unknown {
  try {
    // Attempt direct parse first
    return JSON.parse(text);
  } catch {
    // Attempt markdown stripping
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    console.warn("[AI] Failed to parse JSON, falling back to text generation");
  }
}

export async function generateStructuredAIInsight<T = unknown>(
  prompt: string, 
  version: string, 
  userId: string,
  featureName: string,
  forceRefresh: boolean = false
): Promise<T> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  
  const promptHash = hashPrompt(prompt, version);

  // Check cache first
  if (!forceRefresh) {
    const cached = await prisma.aIPromptCache.findUnique({
      where: { promptHash },
    });
    if (cached && cached.response) {
      return cached.response as T;
    }
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" } 
  });

  try {
    const result = await model.generateContent(prompt);
    
    // Estimate tokens roughly if API doesn't return exactly (Gemini API provides some metadata)
    const usageMetadata = result.response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || prompt.length / 4;
    const completionTokens = usageMetadata?.candidatesTokenCount || result.response.text().length / 4;
    const totalTokens = usageMetadata?.totalTokenCount || promptTokens + completionTokens;

    // Log Usage
    await prisma.aILog.create({
      data: {
        userId,
        feature: featureName,
        promptTokens: Math.round(promptTokens),
        completionTokens: Math.round(completionTokens),
        totalTokens: Math.round(totalTokens),
      }
    });

    const text = result.response.text();
    const json = extractJson(text);

    // Cache the result
    await prisma.aIPromptCache.upsert({
      where: { promptHash },
      update: { response: json as object, version },
      create: {
        promptHash,
        response: json as object,
        version,
      }
    });

    return json as T;
  } catch (error) {
    console.error(`[AI_ERROR] Feature: ${featureName}`, error);
    throw error;
  }
}
