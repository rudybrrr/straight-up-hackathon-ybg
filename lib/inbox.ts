import type { InboxItem, Priority, PriorityFilter, SourcePlatform } from "@/types/orgis";

export const priorityOrder: Record<Priority, number> = {
  act_now: 0,
  review_soon: 1,
  for_later: 2
};

export function sortInboxItems(items: InboxItem[]) {
  return [...items].sort((a, b) => {
    const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const timeDelta = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }

    return a.sender.localeCompare(b.sender);
  });
}

export function filterInboxItems(items: InboxItem[], filter: PriorityFilter) {
  if (filter === "all") {
    return items;
  }

  return items.filter((item) => item.priority === filter);
}

export function getDigestCounts(items: InboxItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.priority] += 1;
      return acc;
    },
    { act_now: 0, review_soon: 0, for_later: 0 }
  );
}

export function getSourceCounts(items: InboxItem[]) {
  return items.reduce<Record<SourcePlatform, number>>(
    (acc, item) => {
      acc[item.source] += 1;
      return acc;
    },
    {
      WhatsApp: 0,
      Telegram: 0,
      Discord: 0,
      Slack: 0,
      Email: 0,
      Other: 0
    }
  );
}

export function priorityLabel(priority: Priority) {
  switch (priority) {
    case "act_now":
      return "Act now";
    case "review_soon":
      return "Review soon";
    case "for_later":
      return "For later";
  }
}

export function sourceLabel(source: SourcePlatform) {
  return source;
}

export function sourceBadgeClass(source: SourcePlatform) {
  switch (source) {
    case "WhatsApp":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Telegram":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Discord":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Slack":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Email":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-stone-200 bg-stone-100 text-stone-700";
  }
}

export function priorityBadgeClass(priority: Priority) {
  switch (priority) {
    case "act_now":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "review_soon":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "for_later":
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatFullTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

export function previewText(value: string, maxLength = 120) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trimEnd()}...`;
}

export function formatMessageBody(value: string) {
  return value
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
