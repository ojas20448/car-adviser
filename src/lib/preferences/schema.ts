/**
 * Zod schema for Preferences — validates LLM JSON output.
 *
 * Every field has a `.default()` so partial LLM responses still parse.
 * The `notes` field is NOT part of this schema — it's attached after
 * extraction, never produced by the LLM.
 */

import { z } from "zod/v4";

const UseCaseEnum = z.enum(["city", "highway", "family", "adventure"]);

export const PreferencesSchema = z.object({
  budgetLakh: z.number().min(0).default(0),
  useCases: z.array(UseCaseEnum).default(["city"]),
  seatsNeeded: z.number().int().min(0).default(5),
  prioritizeMileage: z.boolean().default(false),
  prioritizeSafety: z.boolean().default(false),
  brands: z.array(z.string()).default([]),
});
