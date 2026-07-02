"use client";

import { useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import ResultCard from "@/components/ResultCard";
import ResultsSkeleton from "@/components/ResultsSkeleton";
import CompareBar from "@/components/CompareBar";
import CompareView from "@/components/CompareView";
import SavedShortlists from "@/components/SavedShortlists";
import type { Car } from "@/lib/dataset/cars";
import type { DimensionScore } from "@/lib/scoring/scorer";
import type { UseCase } from "@/lib/dataset/cars";

/* ── Types ──────────────────────────────────────────────────────── */

interface Recommendation {
  car: Car;
  score: number;
  dimensions: DimensionScore[];
  reasons: string[];
}

type AppStatus = "idle" | "loading" | "results" | "error" | "empty";

const MAX_COMPARE = 3;

/* ── Page ───────────────────────────────────────────────────────── */

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [shortlistRefresh, setShortlistRefresh] = useState(0);

  /* ── Handlers ───────────────────────────────────────────────── */

  async function handleSubmit(
    text: string,
    budgetLakh: number,
    useCases: UseCase[],
  ) {
    setStatus("loading");
    setError("");
    setCompareIds(new Set());
    setShowCompare(false);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          budgetLakh,
          ...(useCases.length > 0 && { useCases }),
        }),
      });

      if (!res.ok) throw new Error(`Server error (${res.status})`);

      const data = await res.json();

      if (!data.recommendations?.length) {
        setStatus("empty");
      } else {
        setRecommendations(data.recommendations);
        setStatus("results");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setStatus("error");
    }
  }

  /** Toggle compare checkbox — capped at MAX_COMPARE. */
  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  }

  /** Remove a car from comparison. Auto-close compare view if < 2 remain. */
  function removeFromCompare(id: string) {
    const willRemain = compareIds.size - (compareIds.has(id) ? 1 : 0);
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (willRemain < 2) {
      setShowCompare(false);
    }
  }

  /** Save shortlist to database. Returns true on success. */
  async function handleSaveShortlist(
    name: string,
    carIds: string[],
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, carIds }),
      });
      if (!res.ok) return false;
      setShortlistRefresh((n) => n + 1);
      return true;
    } catch {
      return false;
    }
  }

  /** Load a saved shortlist — select those car IDs and open compare view. */
  function handleLoadShortlist(carIds: string[]) {
    // Only select cars that exist in current recommendations
    const validIds = carIds.filter((id) =>
      recommendations.some((r) => r.car.id === id),
    );
    if (validIds.length < 2) return; // need at least 2 to compare
    setCompareIds(new Set(validIds.slice(0, MAX_COMPARE)));
    setShowCompare(true);
  }

  /* ── Derived state ──────────────────────────────────────────── */

  const showResults = status !== "idle";
  const compareDisabled = compareIds.size >= MAX_COMPARE;
  const comparedCars = recommendations
    .filter((r) => compareIds.has(r.car.id))
    .map((r) => ({ car: r.car, score: r.score }));

  return (
    <main
      className={`flex flex-1 flex-col items-center px-4 md:px-8 ${
        showResults ? "py-12" : "justify-center"
      } ${compareIds.size > 0 && status === "results" && !showCompare ? "pb-24" : ""}`}
    >
      {/* Intake form — always visible unless in compare view */}
      {!showCompare && (
        <IntakeForm onSubmit={handleSubmit} isLoading={status === "loading"} />
      )}

      {/* Results area */}
      {showResults && (
        <div className="w-full max-w-5xl mt-10">
          {/* Loading */}
          {status === "loading" && <ResultsSkeleton />}

          {/* Error */}
          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-3 text-sm font-medium text-red-600 underline
                           hover:text-red-800 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {status === "empty" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <p className="text-sm text-zinc-600">
                No matches found. Try widening your budget or adjusting your
                preferences.
              </p>
            </div>
          )}

          {/* Compare view */}
          {status === "results" && showCompare && (
            <CompareView
              cars={comparedCars}
              onRemove={removeFromCompare}
              onClose={() => setShowCompare(false)}
              onSave={handleSaveShortlist}
            />
          )}

          {/* Results header with saved shortlists */}
          {status === "results" && !showCompare && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Results
              </h2>
              <SavedShortlists
                onLoad={handleLoadShortlist}
                refreshKey={shortlistRefresh}
              />
            </div>
          )}

          {/* Results grid */}
          {status === "results" && !showCompare && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <ResultCard
                  key={rec.car.id}
                  car={rec.car}
                  score={rec.score}
                  reasons={rec.reasons}
                  isCompare={compareIds.has(rec.car.id)}
                  compareDisabled={compareDisabled}
                  onCompareToggle={() => toggleCompare(rec.car.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky compare bar */}
      {status === "results" && !showCompare && compareIds.size > 0 && (
        <CompareBar
          cars={comparedCars}
          onRemove={removeFromCompare}
          onCompare={() => setShowCompare(true)}
        />
      )}
    </main>
  );
}
