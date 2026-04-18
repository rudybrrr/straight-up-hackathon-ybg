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
          "group border-slate-200/80 bg-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft",
          selected && "border-slate-900 ring-1 ring-slate-900"
        )}
      >
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", sourceBadgeClass(item.source))}>{sourceLabel(item.source)}</Badge>
              <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                {priorityLabel(item.priority)}
              </Badge>
              {item.messageCount && item.messageCount > 1 ? (
                <Badge variant="secondary">{threadLabel}</Badge>
              ) : null}
            </div>

            <div className="text-xs text-slate-500">{formatTimestamp(item.timestamp)}</div>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-base font-semibold text-slate-950">
                {item.sender}
                <span className="font-normal text-slate-500"> | {item.chatOrThreadName}</span>
              </p>
              <p
                className="text-sm leading-6 text-slate-600"
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden"
                }}
              >
                {item.summary}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {previewText(item.rawContent, 140)}
            </div>
            <p className="text-xs leading-5 text-slate-500">{item.reason}</p>
          </div>
        </div>
      </Card>
    </button>
  );
}
