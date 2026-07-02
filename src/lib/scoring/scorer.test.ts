import { describe, it, expect } from "vitest";
import { scoreCar } from "./scorer";
import type { Car } from "../dataset/cars";
import type { Preferences } from "../preferences/types";

/** Minimal car factory — fill every field, override what matters. */
function makeCar(overrides: Partial<Car> = {}): Car {
  return {
    id: "test-car",
    make: "TestBrand",
    model: "TestModel",
    variant: "Base",
    year: 2022,
    kmDriven: 25000,
    ownerCount: 1,
    priceLakh: 10,
    bodyType: "compact_suv",
    seats: 5,
    fuelType: "petrol",
    transmission: "manual",
    mileageKmpl: 20,
    ncapStars: 3,
    useCaseTags: ["city"],
    pros: [],
    cons: [],
    ...overrides,
  };
}

/** Minimal prefs factory. */
function makePrefs(overrides: Partial<Preferences> = {}): Preferences {
  return {
    budgetLakh: 10,
    useCases: ["city"],
    seatsNeeded: 5,
    prioritizeMileage: false,
    prioritizeSafety: false,
    brands: [],
    ...overrides,
  };
}

describe("scoreCar", () => {
  it("5-star car scores higher than 3-star when prioritizeSafety is true", () => {
    const fiveStar = makeCar({ ncapStars: 5 });
    const threeStar = makeCar({ ncapStars: 3 });
    const prefs = makePrefs({ prioritizeSafety: true });

    const a = scoreCar(fiveStar, prefs);
    const b = scoreCar(threeStar, prefs);

    expect(a.overall).toBeGreaterThan(b.overall);
  });

  it("car within budget scores higher than car 30% over budget, otherwise identical", () => {
    const withinBudget = makeCar({ priceLakh: 10 });
    const overBudget = makeCar({ priceLakh: 13 }); // 30% over ₹10L
    const prefs = makePrefs({ budgetLakh: 10 });

    const a = scoreCar(withinBudget, prefs);
    const b = scoreCar(overBudget, prefs);

    expect(a.overall).toBeGreaterThan(b.overall);
  });
});
