"use client";

import { useState } from "react";
import type { UseCase } from "@/lib/dataset/cars";

interface IntakeFormProps {
  onSubmit: (text: string, budgetLakh: number, useCases: UseCase[]) => void;
  isLoading: boolean;
}

export default function IntakeForm({ onSubmit, isLoading }: IntakeFormProps) {
  const [text, setText] = useState("");
  const [budgetLakh, setBudgetLakh] = useState(10);
  const [useCases, setUseCases] = useState<UseCase[]>(["city"]);

  function toggleUseCase(uc: UseCase) {
    setUseCases((prev) =>
      prev.includes(uc) ? prev.filter((u) => u !== uc) : [...prev, uc],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(text, budgetLakh, useCases);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Find your next car
        </h1>
        <p className="mt-2 text-zinc-500">
          Tell us what you need — we&rsquo;ll match you with the right one.
        </p>
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell us about you — your budget, who's driving, city or highway, family size, and what matters most."
        rows={4}
        required
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm
                   placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1
                   focus:ring-zinc-500 outline-none resize-none"
      />

      {/* Budget slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">Budget</span>
          <span className="font-medium">₹{budgetLakh} lakh</span>
        </div>
        <input
          type="range"
          min={2}
          max={25}
          step={1}
          value={budgetLakh}
          onChange={(e) => setBudgetLakh(Number(e.target.value))}
          className="w-full accent-zinc-900"
        />
        <div className="flex justify-between text-xs text-zinc-400">
          <span>₹2L</span>
          <span>₹25L</span>
        </div>
      </div>

      {/* City / Highway segmented toggle */}
      <div className="space-y-2">
        <span className="text-sm text-zinc-600">Primary use</span>
        <div className="flex gap-2">
          {(["city", "highway"] as const).map((uc) => (
            <button
              key={uc}
              type="button"
              onClick={() => toggleUseCase(uc)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
                ${
                  useCases.includes(uc)
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
            >
              {uc === "city" ? "City" : "Highway"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white
                   hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Spinner />
            Finding cars…
          </>
        ) : (
          "Find my cars"
        )}
      </button>
    </form>
  );
}

/* ── Inline spinner ─────────────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
