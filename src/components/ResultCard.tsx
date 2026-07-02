"use client";

import type { Car } from "@/lib/dataset/cars";

interface ResultCardProps {
  car: Car;
  score: number;
  reasons: string[];
  isCompare: boolean;
  compareDisabled: boolean;
  onCompareToggle: () => void;
}

export default function ResultCard({
  car,
  score,
  reasons,
  isCompare,
  compareDisabled,
  onCompareToggle,
}: ResultCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: score ring + car info */}
      <div className="flex items-start gap-4">
        <ScoreRing score={score} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight truncate">
            {car.make} {car.model}
          </h3>
          <p className="text-sm text-zinc-500 truncate">{car.variant}</p>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className="text-lg font-bold">₹{car.priceLakh}L</span>
            <span className="text-xs text-zinc-400">
              {car.year} · {formatKm(car.kmDriven)} · {ordinalOwner(car.ownerCount)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {capitalize(car.fuelType)} · {car.transmission === "automatic" ? "AT" : "MT"} · {car.mileageKmpl} kmpl
          </p>
        </div>
      </div>

      {/* Reason chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {reasons.slice(0, 3).map((reason, i) => (
          <span
            key={i}
            className="inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
          >
            {reason}
          </span>
        ))}
      </div>

      {/* Compare checkbox */}
      <label
        className={`mt-3 flex items-center gap-2 text-xs select-none ${
          compareDisabled && !isCompare
            ? "text-zinc-300 cursor-not-allowed"
            : "text-zinc-500 cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={isCompare}
          disabled={compareDisabled && !isCompare}
          onChange={onCompareToggle}
          className="rounded border-zinc-300 accent-zinc-900 disabled:opacity-40"
        />
        Compare
      </label>
    </div>
  );
}

/* ── Score ring ──────────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-400";

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-zinc-100"
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {score}
      </span>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatKm(km: number): string {
  return km >= 1000 ? `${(km / 1000).toFixed(0)}k km` : `${km} km`;
}

function ordinalOwner(n: number): string {
  if (n === 1) return "1st owner";
  if (n === 2) return "2nd owner";
  if (n === 3) return "3rd owner";
  return `${n}th owner`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
