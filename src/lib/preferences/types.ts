import type { UseCase } from "../dataset/cars";

/**
 * Buyer preferences — the contract between extractor (LLM or keyword)
 * and the scoring engine.
 *
 * Every field the scorer reads lives here.
 * Zod schema (for LLM output validation) will wrap this shape in a later phase.
 */
export interface Preferences {
  /** Maximum budget in lakhs. 0 = no constraint. */
  budgetLakh: number;

  /** Desired use cases (city, highway, family, adventure). */
  useCases: UseCase[];

  /** Minimum number of seats needed. 0 = no constraint. */
  seatsNeeded: number;

  /** Boost mileage dimension weight when true. */
  prioritizeMileage: boolean;

  /** Boost safety dimension weight when true. */
  prioritizeSafety: boolean;

  /** Preferred brands (case-insensitive match). Empty = no preference. */
  brands: string[];

  /** Original user text, kept for debugging / display. Not used by scorer. */
  notes?: string;
}
