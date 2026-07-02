"use client";

import { useEffect, useState } from "react";

interface SavedShortlist {
  id: string;
  name: string;
  carIds: string[];
  createdAt: string;
}

interface SavedShortlistsProps {
  onLoad: (carIds: string[]) => void;
  /** Increments when a new shortlist is saved, triggering a refresh. */
  refreshKey: number;
}

/**
 * Dropdown that lists saved shortlists and lets the user reload one.
 * Gracefully handles missing/unavailable database — shows nothing.
 */
export default function SavedShortlists({ onLoad, refreshKey }: SavedShortlistsProps) {
  const [shortlists, setShortlists] = useState<SavedShortlist[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/shortlist")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SavedShortlist[]) => setShortlists(data))
      .catch(() => setShortlists([])); // DB unavailable — ignore
  }, [refreshKey]);

  if (shortlists.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm
                   text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
      >
        <BookmarkIcon />
        Saved ({shortlists.length})
        <ChevronDown open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
          {shortlists.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onLoad(s.carIds);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors"
            >
              <span className="font-medium text-zinc-900">{s.name}</span>
              <span className="block text-xs text-zinc-400">
                {s.carIds.length} cars ·{" "}
                {new Date(s.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2h8a1 1 0 011 1v11l-5-3-5 3V3a1 1 0 011-1z" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
