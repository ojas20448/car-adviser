/**
 * Preference extraction orchestrator.
 *
 * Tries LLM extraction first (if API key is set).
 * Falls back to deterministic keyword extraction on any failure.
 * Always returns a valid Preferences object.
 */

import { llmExtract } from "./llm-extractor";
import { fallbackExtract } from "./fallback-extractor";
import type { Preferences } from "./types";

export async function extractPreferences(text: string): Promise<Preferences> {
  // Try LLM path first
  const llmResult = await llmExtract(text);
  if (llmResult) {
    console.log("path: llm");
    return llmResult;
  }

  // Deterministic fallback — always succeeds
  console.log("path: fallback");
  return fallbackExtract(text);
}
