/**
 * Deterministic scoring engine.
 *
 * scoreCar(car, prefs) → ScoreCard { overall: 0–100, dimensions[], reasons[] }
 *
 * Pure function — no LLM, no side effects, fully unit-testable.
 * Every displayed number comes from the dataset; reasons are templated
 * from computed values, never invented.
 */

import type { Car, UseCase } from "../dataset/cars";
import type { Preferences } from "../preferences/types";

// ─── Types ────────────────────────────────────────────────────────

export type DimensionKey =
  | "budget"
  | "useCase"
  | "seats"
  | "mileage"
  | "safety"
  | "brand";

export interface DimensionScore {
  key: DimensionKey;
  /** Raw score for this dimension, 0–1. */
  score: number;
  /** Weight applied after priority adjustments + normalization. */
  weight: number;
}

export interface ScoreCard {
  /** Weighted composite, 0–100, rounded. */
  overall: number;
  /** Per-dimension breakdown (always 6 entries). */
  dimensions: DimensionScore[];
  /** Templated, human-readable reasons. Max 4, highest signal first. */
  reasons: string[];
}

// ─── Base weights — sum to 1.0, easy to tune ─────────────────────

export const BASE_WEIGHTS: Record<DimensionKey, number> = {
  budget: 0.30,
  useCase: 0.25,
  seats: 0.15,
  mileage: 0.10,
  safety: 0.10,
  brand: 0.10,
};

/** Multiplier applied when the user explicitly prioritizes a dimension. */
const PRIORITY_BOOST = 2.0;

// ─── Dimension scorers ───────────────────────────────────────────

/**
 * Budget score.
 *
 * Within budget or cheaper → 1.0 (never penalize cheaper cars).
 * Linear interpolation between breakpoints:
 *   0% over  → 1.0
 *   10% over → 0.7
 *   33% over → 0.0
 *   >33%     → 0.0
 */
function scoreBudget(carPriceLakh: number, budgetLakh: number): number {
  if (budgetLakh <= 0) return 1; // no budget constraint
  const overFraction = (carPriceLakh - budgetLakh) / budgetLakh;

  if (overFraction <= 0) return 1.0; // within budget — full marks
  if (overFraction >= 0.33) return 0.0; // too far over — zero

  // 0 → 1.0, 0.10 → 0.7  (slope = -3.0)
  if (overFraction <= 0.10) {
    return 1.0 - 3.0 * overFraction;
  }

  // 0.10 → 0.7, 0.33 → 0.0  (slope = -0.7/0.23 ≈ -3.043)
  return 0.7 * (1 - (overFraction - 0.10) / 0.23);
}

/**
 * Use-case score.
 *
 * Fraction of the buyer's desired use cases that the car also covers.
 * No preference → 1.0 (neutral).
 */
function scoreUseCase(carTags: UseCase[], userUseCases: UseCase[]): number {
  if (userUseCases.length === 0) return 1.0;
  const matched = userUseCases.filter((uc) => carTags.includes(uc)).length;
  return matched / userUseCases.length;
}

/**
 * Seats score.
 *
 * Meets or exceeds → 1.0.
 * One seat short   → 0.3  (barely viable).
 * Two+ short       → 0.0  (non-starter).
 * No constraint    → 1.0.
 */
function scoreSeats(carSeats: number, seatsNeeded: number): number {
  if (seatsNeeded <= 0) return 1.0;
  const diff = carSeats - seatsNeeded;
  if (diff >= 0) return 1.0;
  if (diff === -1) return 0.3;
  return 0.0;
}

/**
 * Mileage score.
 *
 * Linear 0–1, capped at 35 kmpl (or cost-equivalent for EV/CNG).
 * 35 kmpl is "excellent" territory; anything above still gets 1.0.
 */
const MILEAGE_CAP = 35;

function scoreMileage(mileageKmpl: number): number {
  return Math.min(mileageKmpl, MILEAGE_CAP) / MILEAGE_CAP;
}

/**
 * Safety score.
 *
 * ncapStars / 5.  Not rated (0) → 0.0.
 */
function scoreSafety(ncapStars: number): number {
  return ncapStars / 5;
}

/**
 * Brand score.
 *
 * Preferred brand     → 1.0.
 * Not preferred       → 0.3  (mild penalty, not zero — still a valid car).
 * No brand preference → 1.0  (neutral).
 */
function scoreBrand(carMake: string, preferredBrands: string[]): number {
  if (preferredBrands.length === 0) return 1.0;
  const match = preferredBrands.some(
    (b) => b.toLowerCase() === carMake.toLowerCase(),
  );
  return match ? 1.0 : 0.3;
}

// ─── Weight adjustment ───────────────────────────────────────────

/**
 * Clone base weights, boost prioritized dimensions, re-normalize to sum 1.0.
 */
function adjustWeights(prefs: Preferences): Record<DimensionKey, number> {
  const w = { ...BASE_WEIGHTS };

  if (prefs.prioritizeSafety) w.safety *= PRIORITY_BOOST;
  if (prefs.prioritizeMileage) w.mileage *= PRIORITY_BOOST;

  // Normalize so weights always sum to 1.0
  const total = (Object.keys(w) as DimensionKey[]).reduce(
    (sum, k) => sum + w[k],
    0,
  );
  for (const key of Object.keys(w) as DimensionKey[]) {
    w[key] /= total;
  }
  return w;
}

// ─── Reason builder ──────────────────────────────────────────────

/**
 * Build human-readable reasons from computed values only.
 * Highest signal first, cap at 4. Never invent numbers.
 */
function buildReasons(
  car: Car,
  prefs: Preferences,
  dims: DimensionScore[],
): string[] {
  const reasons: string[] = [];
  const byKey = Object.fromEntries(dims.map((d) => [d.key, d.score])) as Record<
    DimensionKey,
    number
  >;

  // Budget — strongest positive or negative signal
  if (byKey.budget >= 1.0 && prefs.budgetLakh > 0) {
    reasons.push(
      `₹${car.priceLakh.toFixed(1)}L — within your ₹${prefs.budgetLakh}L budget`,
    );
  } else if (byKey.budget > 0 && byKey.budget < 1.0) {
    const overPct = Math.round(
      ((car.priceLakh - prefs.budgetLakh) / prefs.budgetLakh) * 100,
    );
    reasons.push(
      `₹${car.priceLakh.toFixed(1)}L — ${overPct}% over your ₹${prefs.budgetLakh}L budget`,
    );
  }

  // Use case
  if (byKey.useCase >= 0.8 && prefs.useCases.length > 0) {
    const matched = prefs.useCases.filter((uc) =>
      car.useCaseTags.includes(uc),
    );
    reasons.push(`Strong match for ${matched.join(", ")} use`);
  }

  // Safety
  if (car.ncapStars >= 4) {
    reasons.push(`${car.ncapStars}-star NCAP safety rating`);
  }

  // Mileage
  if (byKey.mileage >= 0.7) {
    reasons.push(`${car.mileageKmpl} kmpl fuel efficiency`);
  }

  // Brand
  if (byKey.brand >= 1.0 && prefs.brands.length > 0) {
    reasons.push(`Preferred brand: ${car.make}`);
  }

  // Seats
  if (
    byKey.seats >= 1.0 &&
    prefs.seatsNeeded > 0 &&
    car.seats >= prefs.seatsNeeded
  ) {
    reasons.push(
      `${car.seats} seats — fits your ${prefs.seatsNeeded}-seater need`,
    );
  }

  return reasons.slice(0, 4);
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Score a single car against buyer preferences.
 * Pure function — same inputs always produce the same ScoreCard.
 */
export function scoreCar(car: Car, prefs: Preferences): ScoreCard {
  const weights = adjustWeights(prefs);

  const dimensions: DimensionScore[] = [
    {
      key: "budget",
      score: scoreBudget(car.priceLakh, prefs.budgetLakh),
      weight: weights.budget,
    },
    {
      key: "useCase",
      score: scoreUseCase(car.useCaseTags, prefs.useCases),
      weight: weights.useCase,
    },
    {
      key: "seats",
      score: scoreSeats(car.seats, prefs.seatsNeeded),
      weight: weights.seats,
    },
    {
      key: "mileage",
      score: scoreMileage(car.mileageKmpl),
      weight: weights.mileage,
    },
    {
      key: "safety",
      score: scoreSafety(car.ncapStars),
      weight: weights.safety,
    },
    {
      key: "brand",
      score: scoreBrand(car.make, prefs.brands),
      weight: weights.brand,
    },
  ];

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) * 100,
  );

  const reasons = buildReasons(car, prefs, dimensions);

  return { overall, dimensions, reasons };
}

/**
 * Score all cars, return sorted by overall score descending.
 */
export function scoreCars(
  cars: Car[],
  prefs: Preferences,
): Array<{ car: Car; scoreCard: ScoreCard }> {
  return cars
    .map((car) => ({ car, scoreCard: scoreCar(car, prefs) }))
    .sort((a, b) => b.scoreCard.overall - a.scoreCard.overall);
}
