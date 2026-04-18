import { cn } from "@/lib/utils";
import type { PriorityFilter } from "@/types/orgis";

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
    <div className="flex h-full flex-col justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">Focus view</p>
        <p className="text-sm leading-6 text-slate-600">
          Jump between urgency lanes without losing the cross-platform sort order.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => {
          const active = value === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-[1.25rem] border px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                active
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-white/10 text-white" : "bg-white text-slate-600"
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
