/**
 * LLM-based preference extractor.
 *
 * Calls Gemini (via provider.ts) with a system instruction that
 * constrains output to the Preferences JSON shape.
 * Zod-validates the response; returns null on any failure so
 * the caller can fall back to the deterministic extractor.
 */

import { callLLM } from "../ai/provider";
import { PreferencesSchema } from "./schema";
import type { Preferences } from "./types";

const SYSTEM_INSTRUCTION = `You are a preference extractor for an Indian used-car marketplace.
Given a buyer's free-text description, return ONLY a valid JSON object with these fields:

{
  "budgetLakh": <number, buyer's budget in lakhs, 0 if not mentioned>,
  "useCases": <array of "city"|"highway"|"family"|"adventure">,
  "seatsNeeded": <number, default 5>,
  "prioritizeMileage": <boolean, true if buyer emphasizes fuel economy>,
  "prioritizeSafety": <boolean, true if buyer emphasizes safety>,
  "brands": <array of brand name strings, empty if no preference>
}

Rules:
- Extract only what the buyer explicitly or implicitly states.
- Do not invent or assume preferences the buyer did not mention.
- Return valid JSON only — no markdown, no explanation, no wrapping.`;

export async function llmExtract(text: string): Promise<Preferences | null> {
  try {
    const raw = await callLLM(text, SYSTEM_INSTRUCTION);
    const parsed: unknown = JSON.parse(raw);
    const result = PreferencesSchema.safeParse(parsed);

    if (!result.success) {
      console.log("path: llm → zod validation failed, falling back");
      return null;
    }

    return { ...result.data, notes: text };
  } catch (err) {
    // NO_API_KEY, network error, JSON parse error — all handled
    const message = err instanceof Error ? err.message : "unknown";
    console.log(`path: llm → error (${message}), falling back`);
    return null;
  }
}
