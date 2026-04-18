"use client";

import { useEffect, useState } from "react";
import { Inbox, Menu } from "lucide-react";
import { seededInbox } from "@/data/seeded-inbox";
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
import type { InboxItem, PriorityFilter, SourcePlatform } from "@/types/orgis";

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

export function Dashboard() {
  const [items] = useState<InboxItem[]>(() => sortInboxItems(seededInbox));
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourcePlatform>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const counts = getDigestCounts(items);
  const sourceCounts = getSourceCounts(items);
  const activeSources = (Object.entries(sourceCounts) as Array<[SourcePlatform, number]>).filter(
    ([, count]) => count > 0
  );

  const filteredBySource =
    sourceFilter === "all" ? items : items.filter((item) => item.source === sourceFilter);
  const visibleItems = sortInboxItems(filterInboxItems(filteredBySource, filter));
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    if (selectedItemId && !selectedItem) {
      setSelectedItemId(null);
    }
  }, [selectedItem, selectedItemId]);

  const emptyState =
    items.length === 0 ? (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No messages in Orgis yet"
        description="Connect chat apps to start compiling your priority list."
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
        }}
      />
    ) : null;

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
                  <Badge className="w-fit border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    {visibleItems.length} shown
                  </Badge>
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
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-950">
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

      <HamburgerDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MessageDrawer item={selectedItem} onClose={() => setSelectedItemId(null)} />
    </div>
  );
}
