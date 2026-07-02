/**
 * Deterministic keyword/regex preference extractor.
 *
 * Pure function — no network, no LLM, no side effects.
 * Works when no API key is set or when LLM output is malformed.
 */

import type { Preferences } from "./types";
import type { UseCase } from "../dataset/cars";
import { getAllCars } from "../dataset/cars";

// ─── Keyword maps ────────────────────────────────────────────────

const USE_CASE_KEYWORDS: Record<UseCase, string[]> = {
  city: ["city", "commute", "commuting", "parking", "urban", "traffic"],
  highway: ["highway", "long drive", "road trip", "touring", "roadtrip"],
  family: ["family", "kids", "children", "wife", "parents"],
  adventure: ["adventure", "off-road", "offroad", "mountain", "camping"],
};

const MILEAGE_KEYWORDS = [
  "mileage",
  "fuel efficient",
  "fuel-efficient",
  "economical",
  "fuel economy",
  "low running cost",
];

const SAFETY_KEYWORDS = ["safety", "ncap", "crash", "airbag", "airbags", "safe"];

// ─── Sub-extractors ──────────────────────────────────────────────

/**
 * Budget: scan for numbers near "lakh" / "lac" / "L".
 * Handles "under 10 lakh", "₹8L", "budget 12", "around 15 lakh".
 */
function extractBudget(text: string): number {
  const patterns = [
    // "10 lakh", "under 15 lakh", "₹8L", "around 12 lac"
    /(?:under|below|around|within|upto|up\s*to)?\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|l\b)/i,
    // "budget is 10", "spend 12", "afford 8"
    /(?:budget|spend|afford)\s*(?:is|of|:)?\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return 0; // no constraint
}

/**
 * Use cases: match keywords, default to ["city"].
 */
function extractUseCases(text: string): UseCase[] {
  const matched: UseCase[] = [];
  for (const [useCase, keywords] of Object.entries(USE_CASE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(useCase as UseCase);
    }
  }
  return matched.length > 0 ? matched : ["city"];
}

/**
 * Seats: "7 seater" → 7, "6 seater" → 6, default 5.
 */
function extractSeats(text: string): number {
  if (/7\s*seat|seven\s*seat/i.test(text)) return 7;
  if (/6\s*seat|six\s*seat/i.test(text)) return 6;
  return 5;
}

/**
 * Brands: scan for known brand names present in the dataset.
 */
function extractBrands(text: string): string[] {
  const knownBrands = [...new Set(getAllCars().map((c) => c.make))];
  return knownBrands.filter((brand) =>
    text.includes(brand.toLowerCase()),
  );
}

// ─── Public API ──────────────────────────────────────────────────

export function fallbackExtract(text: string): Preferences {
  const lower = text.toLowerCase();

  return {
    budgetLakh: extractBudget(lower),
    useCases: extractUseCases(lower),
    seatsNeeded: extractSeats(lower),
    prioritizeMileage: MILEAGE_KEYWORDS.some((kw) => lower.includes(kw)),
    prioritizeSafety: SAFETY_KEYWORDS.some((kw) => lower.includes(kw)),
    brands: extractBrands(lower),
    notes: text,
  };
}
