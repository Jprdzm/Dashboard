export function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md animate-pulse">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
      <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
      <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
      <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700 mb-6" />
      <div className="h-[200px] rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
