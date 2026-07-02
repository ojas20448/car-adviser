"use client";

import { useState } from "react";
import type { Car } from "@/lib/dataset/cars";

/* ── Types ──────────────────────────────────────────────────────── */

interface CompareViewProps {
  cars: { car: Car; score: number }[];
  onRemove: (id: string) => void;
  onClose: () => void;
  onSave?: (name: string, carIds: string[]) => Promise<boolean>;
}

interface CompareRow {
  label: string;
  render: (car: Car) => string;
  /** Return a numeric value for best-cell highlighting. */
  numericValue?: (car: Car) => number;
  /** "min" = lowest wins (price), "max" = highest wins (mileage). */
  best?: "min" | "max";
}

/* ── Row definitions ────────────────────────────────────────────── */

const ROWS: CompareRow[] = [
  {
    label: "Price",
    render: (c) => `₹${c.priceLakh}L`,
    numericValue: (c) => c.priceLakh,
    best: "min",
  },
  {
    label: "Mileage",
    render: (c) => `${c.mileageKmpl} kmpl`,
    numericValue: (c) => c.mileageKmpl,
    best: "max",
  },
  {
    label: "Safety",
    render: (c) => (c.ncapStars > 0 ? `${c.ncapStars}★` : "Not rated"),
    numericValue: (c) => c.ncapStars,
    best: "max",
  },
  {
    label: "Seats",
    render: (c) => `${c.seats}`,
    numericValue: (c) => c.seats,
    best: "max",
  },
  {
    label: "Body type",
    render: (c) => formatBodyType(c.bodyType),
  },
  {
    label: "Fuel",
    render: (c) => capitalize(c.fuelType),
  },
  {
    label: "Year",
    render: (c) => `${c.year}`,
    numericValue: (c) => c.year,
    best: "max",
  },
  {
    label: "KM driven",
    render: (c) => `${(c.kmDriven / 1000).toFixed(0)}k km`,
    numericValue: (c) => c.kmDriven,
    best: "min",
  },
];

/* ── Highlight helper ───────────────────────────────────────────── */

/**
 * Returns the set of indices that hold the best value.
 * Ties are all highlighted.
 */
function bestIndices(values: number[], mode: "min" | "max"): Set<number> {
  const target = mode === "min" ? Math.min(...values) : Math.max(...values);
  const indices = new Set<number>();
  values.forEach((v, i) => {
    if (v === target) indices.add(i);
  });
  // Don't highlight if all values are equal (no differentiator)
  return indices.size === values.length ? new Set<number>() : indices;
}

/* ── Component ──────────────────────────────────────────────────── */

export default function CompareView({ cars, onRemove, onClose, onSave }: CompareViewProps) {
  const [shortlistName, setShortlistName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    if (!shortlistName.trim() || !onSave) return;
    setSaveStatus("saving");
    const ok = await onSave(
      shortlistName.trim(),
      cars.map(({ car }) => car.id),
    );
    setSaveStatus(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveStatus("idle"), 2000);
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft />
          Back to results
        </button>
        <h2 className="text-lg font-semibold">
          Comparing {cars.length} cars
        </h2>
        <button
          onClick={() => {
            cars.forEach(({ car }) => onRemove(car.id));
          }}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Save shortlist */}
      {onSave && (
        <div className="mb-6 flex items-center gap-3">
          <input
            type="text"
            value={shortlistName}
            onChange={(e) => setShortlistName(e.target.value)}
            placeholder="Name this shortlist…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm
                       placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1
                       focus:ring-zinc-500 outline-none"
          />
          <button
            onClick={handleSave}
            disabled={!shortlistName.trim() || saveStatus === "saving"}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white
                       hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors whitespace-nowrap"
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved ✓"
                : "Save shortlist"}
          </button>
          {saveStatus === "error" && (
            <span className="text-xs text-red-500">Failed to save</span>
          )}
        </div>
      )}

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-[500px] text-sm">
          {/* Car headers */}
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="py-4 px-4 text-left text-xs font-medium text-zinc-500 w-28">
                Attribute
              </th>
              {cars.map(({ car, score }) => (
                <th key={car.id} className="py-4 px-4 text-left">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={score} />
                      <span className="font-semibold text-base">
                        {car.make} {car.model}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 font-normal">
                      {car.variant}
                    </span>
                    <button
                      onClick={() => onRemove(car.id)}
                      className="mt-1 text-xs text-red-500 hover:text-red-700 transition-colors self-start"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {ROWS.map((row) => {
              // Compute best indices for highlighting
              const highlights =
                row.numericValue && row.best
                  ? bestIndices(
                      cars.map(({ car }) => row.numericValue!(car)),
                      row.best,
                    )
                  : new Set<number>();

              return (
                <tr key={row.label} className="border-b border-zinc-50">
                  <td className="py-3 px-4 text-xs font-medium text-zinc-500">
                    {row.label}
                  </td>
                  {cars.map(({ car }, i) => (
                    <td
                      key={car.id}
                      className={`py-3 px-4 font-medium ${
                        highlights.has(i)
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-zinc-900"
                      }`}
                    >
                      {row.render(car)}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Review blurb row */}
            <tr>
              <td className="py-3 px-4 text-xs font-medium text-zinc-500 align-top">
                Review
              </td>
              {cars.map(({ car }) => (
                <td key={car.id} className="py-3 px-4 align-top">
                  {car.pros.length > 0 && (
                    <p className="text-xs text-emerald-700">
                      <span className="font-medium">+</span> {car.pros[0]}
                    </p>
                  )}
                  {car.cons.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      <span className="font-medium">−</span> {car.cons[0]}
                    </p>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Subcomponents & helpers ─────────────────────────────────────── */

function ScoreBadge({ score }: { score: number }) {
  const bg =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${bg}`}>
      {score}
    </span>
  );
}

function ArrowLeft() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function formatBodyType(bt: string): string {
  return bt
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
