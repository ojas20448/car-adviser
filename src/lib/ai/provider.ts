/**
 * Thin wrapper around the LLM provider.
 * Default: Google Gemini via @google/generative-ai.
 *
 * Swappable: replace the body of `callLLM` to point at any provider
 * that accepts a prompt string and returns a JSON string.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callLLM(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
