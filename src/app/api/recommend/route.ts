/**
 * POST /api/recommend
 *
 * Body: { text: string, budgetLakh?: number, useCases?: UseCase[],
 *         seatsNeeded?: number, prioritizeMileage?: boolean,
 *         prioritizeSafety?: boolean, brands?: string[] }
 *
 * 1. Extract preferences from `text` (LLM or fallback).
 * 2. Merge any explicit body fields over extracted ones.
 * 3. Score all cars, return top 5 sorted by score descending.
 *
 * Every car fact in the response comes from the dataset.
 * The LLM is used ONLY to populate the Preferences object —
 * it never describes or replaces a car.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPreferences } from "@/lib/preferences/extract";
import { scoreCars } from "@/lib/scoring/scorer";
import { getAllCars } from "@/lib/dataset/cars";
import type { UseCase } from "@/lib/dataset/cars";
import type { Preferences } from "@/lib/preferences/types";

interface RecommendBody {
  text: string;
  budgetLakh?: number;
  useCases?: UseCase[];
  seatsNeeded?: number;
  prioritizeMileage?: boolean;
  prioritizeSafety?: boolean;
  brands?: string[];
}

export async function POST(request: NextRequest) {
  let body: RecommendBody;

  try {
    body = (await request.json()) as RecommendBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json(
      { error: "\"text\" (string) is required" },
      { status: 400 },
    );
  }

  // 1. Extract preferences from free text
  const extracted = await extractPreferences(body.text);

  // 2. Merge explicit body fields over extracted values
  const prefs: Preferences = {
    ...extracted,
    ...(body.budgetLakh !== undefined && { budgetLakh: body.budgetLakh }),
    ...(body.useCases !== undefined && { useCases: body.useCases }),
    ...(body.seatsNeeded !== undefined && { seatsNeeded: body.seatsNeeded }),
    ...(body.prioritizeMileage !== undefined && {
      prioritizeMileage: body.prioritizeMileage,
    }),
    ...(body.prioritizeSafety !== undefined && {
      prioritizeSafety: body.prioritizeSafety,
    }),
    ...(body.brands !== undefined && { brands: body.brands }),
  };

  // 3. Score all cars, sort descending, return top 5
  const ranked = scoreCars(getAllCars(), prefs);
  const top5 = ranked.slice(0, 5);

  return NextResponse.json({
    preferences: prefs,
    recommendations: top5.map(({ car, scoreCard }) => ({
      car,
      score: scoreCard.overall,
      dimensions: scoreCard.dimensions,
      reasons: scoreCard.reasons,
    })),
  });
}
