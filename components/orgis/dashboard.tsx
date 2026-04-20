"use client";

import { useEffect, useState } from "react";
import { Inbox, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/orgis/empty-state";
import { HamburgerDrawer } from "@/components/orgis/hamburger-drawer";
import { MessageDrawer } from "@/components/orgis/message-drawer";
import { OrgisLogo } from "@/components/orgis/orgis-logo";
import {
  filterInboxItems,
  formatTimestamp,
  getDigestCounts,
  getSourceCounts,
  previewText,
  priorityBadgeClass,
  priorityLabel,
  sortInboxItems,
  sourceBadgeClass,
  sourceLabel
} from "@/lib/inbox";
import { cn } from "@/lib/utils";
import type { InboxItem, Priority, PriorityFilter, SourcePlatform } from "@/types/orgis";

type BeeperPriorityColor = "red" | "yellow" | "green";

type BeeperBoardMessage = {
  beeperMessageId: string;
  beeperChatId: string;
  accountId: string;
  senderName: string;
  chatName: string;
  sourcePlatform: string;
  rawContent: string;
  messageTimestamp: string;
  priorityColor: BeeperPriorityColor;
  summary: string;
  reason: string;
  triagedAt: string | null;
};

type BeeperBoardGroup = {
  color: BeeperPriorityColor;
  title: string;
  description: string;
  messages: BeeperBoardMessage[];
};

const filterOptions: Array<{ key: PriorityFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "act_now", label: "Act now" },
  { key: "review_soon", label: "Review soon" },
  { key: "for_later", label: "For later" }
];

const sourceOptions: Array<{ key: "all" | SourcePlatform; label: string }> = [
  { key: "all", label: "All apps" },
  { key: "WhatsApp", label: "WhatsApp" },
  { key: "Telegram", label: "Telegram" },
  { key: "Discord", label: "Discord" },
  { key: "Slack", label: "Slack" },
  { key: "Email", label: "Email" },
  { key: "Other", label: "Other" }
];

function sourceMonogram(source: SourcePlatform) {
  switch (source) {
    case "WhatsApp":
      return "WA";
    case "Telegram":
      return "TG";
    case "Discord":
      return "DC";
    case "Slack":
      return "SL";
    case "Email":
      return "EM";
    default:
      return "OT";
  }
}

function toOrgisSource(platform: string): SourcePlatform {
  const normalized = platform.trim().toLowerCase();
  if (normalized.includes("whatsapp")) return "WhatsApp";
  if (normalized.includes("telegram")) return "Telegram";
  if (normalized.includes("discord")) return "Discord";
  if (normalized.includes("slack")) return "Slack";
  if (normalized.includes("email")) return "Email";
  return "Other";
}

function toOrgisPriority(color: BeeperPriorityColor): Priority {
  switch (color) {
    case "red":
      return "act_now";
    case "yellow":
      return "review_soon";
    case "green":
      return "for_later";
  }
}

function toInboxItem(message: BeeperBoardMessage): InboxItem {
  return {
    id: `beeper-${message.beeperMessageId}`,
    source: toOrgisSource(message.sourcePlatform),
    sender: message.senderName || "Someone",
    chatOrThreadName: message.chatName || "Private chat",
    timestamp: message.messageTimestamp,
    rawContent: message.rawContent,
    summary: message.summary || "Incoming message.",
    priority: toOrgisPriority(message.priorityColor),
    reason: message.reason || "No reason stored yet.",
    isThread: false,
    beeperChatId: message.beeperChatId,
    beeperMessageId: message.beeperMessageId,
    accountId: message.accountId
  };
}

type BeeperBoardPayload = {
  groups: BeeperBoardGroup[];
  total: number;
  refreshedAt: string;
};

type ReadFilter = "all" | "unread" | "read";

export function Dashboard() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourcePlatform>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const counts = getDigestCounts(items);
  const sourceCounts = getSourceCounts(items);
  const activeSources = (Object.entries(sourceCounts) as Array<[SourcePlatform, number]>).filter(
    ([, count]) => count > 0
  );

  function isRead(id: string) {
    return readIds.has(id);
  }

  function markRead(id: string) {
    setReadIds((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  function markUnread(id: string) {
    setReadIds((current) => {
      if (!current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("orgis.readIds");
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      setReadIds(new Set(parsed.filter((value) => typeof value === "string")));
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("orgis.readIds", JSON.stringify(Array.from(readIds)));
    } catch {
      // Ignore storage failures (private mode, quota, etc).
    }
  }, [readIds]);

  const filteredBySource =
    sourceFilter === "all" ? items : items.filter((item) => item.source === sourceFilter);
  const filteredByPriority = filterInboxItems(filteredBySource, filter);
  const baseItems = sortInboxItems(filteredByPriority);
  const visibleItems =
    readFilter === "all"
      ? baseItems
      : baseItems.filter((item) => (readFilter === "read" ? isRead(item.id) : !isRead(item.id)));
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    if (selectedItemId && !selectedItem) {
      setSelectedItemId(null);
    }
  }, [selectedItem, selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) {
      return;
    }

    markRead(selectedItemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshFromDatabase() {
      setSyncing(true);

      try {
        const response = await fetch("/api/beeper/board", {
          cache: "no-store"
        });

        const payload = (await response.json()) as BeeperBoardPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Board refresh failed: ${response.status}`);
        }

        const flattened = payload.groups.flatMap((group) => group.messages.map(toInboxItem));

        if (!cancelled) {
          setItems(sortInboxItems(flattened));
          setRefreshedAt(payload.refreshedAt ?? null);
          setSyncError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncError(err instanceof Error ? err.message : "Database refresh failed.");
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    refreshFromDatabase();
    const timer = window.setInterval(refreshFromDatabase, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const emptyState =
    items.length === 0 ? (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No messages in Orgis yet"
        description="No database messages yet. Run a sync to ingest Beeper chats."
      />
    ) : visibleItems.length === 0 ? (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No messages in this filter"
        description="Switch filters to show other threads."
        primaryActionLabel="Show all"
        onPrimaryAction={() => {
          setFilter("all");
          setSourceFilter("all");
          setReadFilter("all");
        }}
      />
    ) : null;

  const baseReadCount = baseItems.reduce((sum, item) => sum + (isRead(item.id) ? 1 : 0), 0);
  const baseUnreadCount = baseItems.length - baseReadCount;

  function handleMarkAllRead() {
    setReadIds((current) => {
      const next = new Set(current);
      for (const item of baseItems) {
        next.add(item.id);
      }
      return next;
    });
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orgis-grid absolute inset-0 opacity-50" />
        <div className="absolute left-[-10%] top-0 h-80 w-80 rounded-full bg-cyan-400/16 blur-3xl" />
        <div className="absolute right-[-8%] top-8 h-80 w-80 rounded-full bg-amber-300/16 blur-3xl" />
        <div className="absolute left-[30%] top-[62%] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <OrgisLogo compact />

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-slate-200 bg-white/90 px-3 py-1 text-slate-700">
                {items.length} threads
              </Badge>
              <Badge className="border-slate-200 bg-white/90 px-3 py-1 text-slate-700">
                {activeSources.length} apps
              </Badge>
              {refreshedAt ? (
                <Badge className="border-slate-200 bg-white/90 px-3 py-1 text-slate-700">
                  Updated {formatTimestamp(refreshedAt)}
                </Badge>
              ) : null}
              <Badge
                className={cn(
                  "border px-3 py-1",
                  syncing
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                )}
              >
                {syncing ? "Refreshing…" : "Live"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-2xl bg-white/90"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {syncError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              Live data unavailable: {syncError}
            </div>
          ) : null}

          <Card className="border-slate-200/80 bg-white/90">
            <CardContent className="p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-rose-200/80 bg-gradient-to-br from-white to-rose-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Act now</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{counts.act_now}</p>
                </div>
                <div className="rounded-[1.5rem] border border-amber-200/80 bg-gradient-to-br from-white to-amber-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Review</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{counts.review_soon}</p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-200/70 bg-gradient-to-br from-white to-sky-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Later</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{counts.for_later}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <main className="mt-6">
          <section className="space-y-4">
            <Card className="border-slate-200/80 bg-white/92">
              <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <CardTitle>Priority list</CardTitle>
                    <CardDescription>Urgency first, then most recent activity.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="w-fit border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      {visibleItems.length} shown
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleMarkAllRead}
                      disabled={baseItems.length === 0 || baseUnreadCount === 0}
                    >
                      Read all
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => {
                    const active = filter === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFilter(option.key)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {sourceOptions
                    .filter((option) => option.key === "all" || sourceCounts[option.key] > 0)
                    .map((option) => {
                      const active = sourceFilter === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSourceFilter(option.key)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                            active
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { key: "all", label: "All", countLabel: `${baseItems.length}` },
                      { key: "unread", label: "Unread", countLabel: `${baseUnreadCount}` },
                      { key: "read", label: "Read", countLabel: `${baseReadCount}` }
                    ] as const
                  ).map((option) => {
                    const active = readFilter === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setReadFilter(option.key)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          "inline-flex items-center gap-2",
                          active
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {option.label}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {option.countLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {emptyState ? (
                  <div className="p-5">{emptyState}</div>
                ) : (
                  <>
                    <div className="hidden grid-cols-[148px_132px_minmax(0,1fr)_112px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid">
                      <span>App</span>
                      <span>Priority</span>
                      <span>Message</span>
                      <span className="text-right">Updated</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {visibleItems.map((item) => {
                        const selected = item.id === selectedItemId;
                        const read = isRead(item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedItemId(item.id)}
                            aria-haspopup="dialog"
                            aria-expanded={selected}
                            className={cn(
                              "w-full px-5 py-4 text-left transition-colors",
                              "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/40 focus-visible:ring-offset-2",
                              selected ? "bg-slate-50" : "bg-transparent"
                            )}
                          >
                            <div className="grid gap-3 md:grid-cols-[148px_132px_minmax(0,1fr)_112px] md:items-center md:gap-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-2xl border text-[11px] font-semibold",
                                    sourceBadgeClass(item.source)
                                  )}
                                  aria-hidden="true"
                                >
                                  {sourceMonogram(item.source)}
                                </span>
                                <Badge className={cn("border", sourceBadgeClass(item.source))}>
                                  {sourceLabel(item.source)}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                                  {priorityLabel(item.priority)}
                                </Badge>
                                {read ? (
                                  <span className="text-xs font-medium text-slate-400">Read</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full bg-sky-500"
                                      aria-hidden="true"
                                    />
                                    New
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    read ? "text-slate-800" : "text-slate-950"
                                  )}
                                >
                                  {item.sender}
                                  <span className="font-normal text-slate-500">
                                    {" "}
                                    | {item.chatOrThreadName}
                                  </span>
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {previewText(item.reason, 110)}
                                </p>
                              </div>

                              <div className="text-left text-xs text-slate-500 md:text-right">
                                {formatTimestamp(item.timestamp)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      <HamburgerDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        connectedApps={activeSources.map(([source, count]) => ({
          source,
          count
        }))}
        lastUpdatedAt={refreshedAt}
      />
      <MessageDrawer
        item={selectedItem}
        onClose={() => setSelectedItemId(null)}
        isRead={selectedItem ? isRead(selectedItem.id) : false}
        onMarkRead={() => {
          if (selectedItem) {
            markRead(selectedItem.id);
          }
        }}
        onMarkUnread={() => {
          if (selectedItem) {
            markUnread(selectedItem.id);
          }
        }}
        onReply={() => {
          if (selectedItem) {
            markRead(selectedItem.id);
          }
        }}
      />
    </div>
  );
}
