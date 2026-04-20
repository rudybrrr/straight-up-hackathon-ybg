import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatTimestamp,
  previewText,
  priorityBadgeClass,
  priorityLabel,
  sourceBadgeClass,
  sourceLabel
} from "@/lib/inbox";
import type { InboxItem } from "@/types/orgis";

function priorityAccentClass(priority: InboxItem["priority"]) {
  switch (priority) {
    case "act_now":
      return "bg-rose-500";
    case "review_soon":
      return "bg-amber-500";
    case "for_later":
      return "bg-slate-400";
  }
}

export function InboxCard({
  item,
  selected,
  onSelect
}: {
  item: InboxItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const threadLabel = item.isThread
    ? `${item.messageCount ?? 2} message${(item.messageCount ?? 2) === 1 ? "" : "s"}`
    : "Single message";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="w-full text-left"
      aria-pressed={selected}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-slate-200/80 bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft",
          selected && "border-slate-900 ring-1 ring-slate-900"
        )}
      >
        <div className={cn("absolute inset-y-4 left-4 w-1 rounded-full", priorityAccentClass(item.priority))} />

        <div className="p-5 pl-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", sourceBadgeClass(item.source))}>
                {sourceLabel(item.source)}
              </Badge>
              <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                {priorityLabel(item.priority)}
              </Badge>
              {item.messageCount && item.messageCount > 1 ? (
                <Badge variant="secondary">{threadLabel}</Badge>
              ) : null}
            </div>

            <div className="text-xs text-slate-500">{formatTimestamp(item.timestamp)}</div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-base font-semibold text-slate-950">
              {item.sender}
              <span className="font-normal text-slate-500"> in {item.chatOrThreadName}</span>
            </p>
            <p className="text-sm leading-6 text-slate-700">{item.summary}</p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
              {previewText(item.rawContent, 160)}
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white px-3 py-3 text-xs leading-6 text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">
                Why it ranks here
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
