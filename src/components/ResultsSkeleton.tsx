export default function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-5 animate-pulse"
        >
          {/* Score ring + text placeholder */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 rounded w-1/2" />
              <div className="h-5 bg-zinc-200 rounded w-1/4 mt-1" />
            </div>
          </div>

          {/* Chip placeholders */}
          <div className="mt-3 flex gap-2">
            <div className="h-6 bg-zinc-200 rounded-full w-24" />
            <div className="h-6 bg-zinc-200 rounded-full w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
