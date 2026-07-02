"use client";

import type { Car } from "@/lib/dataset/cars";

interface CompareBarProps {
  cars: { car: Car; score: number }[];
  onRemove: (id: string) => void;
  onCompare: () => void;
}

/**
 * Sticky bottom bar that appears when ≥1 car is checked for comparison.
 * Prompts to pick at least 2; enables "Compare" button when ≥2 selected.
 */
export default function CompareBar({ cars, onRemove, onCompare }: CompareBarProps) {
  const ready = cars.length >= 2;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-5xl flex items-center gap-4 px-4 py-3">
        {/* Selected car pills */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {cars.map(({ car }) => (
            <span
              key={car.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 pl-3 pr-1.5 py-1 text-xs font-medium text-zinc-700 whitespace-nowrap"
            >
              {car.make} {car.model}
              <button
                onClick={() => onRemove(car.id)}
                className="rounded-full p-0.5 hover:bg-zinc-300 transition-colors"
                aria-label={`Remove ${car.model}`}
              >
                <XIcon />
              </button>
            </span>
          ))}

          {!ready && (
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              Select at least 2 cars to compare
            </span>
          )}
        </div>

        {/* Compare button */}
        <button
          onClick={onCompare}
          disabled={!ready}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white
                     hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors whitespace-nowrap"
        >
          Compare{ready ? ` (${cars.length})` : ""}
        </button>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
