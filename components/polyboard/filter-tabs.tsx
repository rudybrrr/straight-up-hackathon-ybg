import { cn } from "@/lib/utils";
import type { PriorityFilter } from "@/types/polyboard";

export function FilterTabs({
  value,
  onChange,
  counts,
  total
}: {
  value: PriorityFilter;
  onChange: (value: PriorityFilter) => void;
  counts: {
    act_now: number;
    review_soon: number;
    for_later: number;
  };
  total: number;
}) {
  const tabs: Array<{ key: PriorityFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: total },
    { key: "act_now", label: "Act now", count: counts.act_now },
    { key: "review_soon", label: "Review soon", count: counts.review_soon },
    { key: "for_later", label: "For later", count: counts.for_later }
  ];

  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">Filters</p>
        <p className="text-sm leading-6 text-slate-600">
          Switch between priority buckets to triage the inbox quickly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((tab) => {
          const active = value === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-all duration-200",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

