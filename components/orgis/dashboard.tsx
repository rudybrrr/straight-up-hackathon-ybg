"use client";

import { useEffect, useRef, useState } from "react";
import { Filter, Inbox, Menu, Pin, PinOff, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/orgis/empty-state";
import { EdgeSprite } from "@/components/orgis/edge-sprite";
import { HamburgerDrawer } from "@/components/orgis/hamburger-drawer";
import { MessageDrawer } from "@/components/orgis/message-drawer";
import { OrgisLogo } from "@/components/orgis/orgis-logo";
import { DonutChart } from "@/components/orgis/donut-chart";
import {
  filterInboxItems,
  formatTimestamp,
  getDigestCounts,
  getSourceCounts,
  previewText,
  matchesInboxSearch,
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
  isPinned: boolean;
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
    accountId: message.accountId,
    isPinned: message.isPinned
  };
}

type BeeperBoardPayload = {
  groups: BeeperBoardGroup[];
  total: number;
  refreshedAt: string;
};

type BeeperTriagePreferences = {
  familyRedEnabled: boolean;
  businessRedEnabled: boolean;
};

type ReadFilter = "all" | "unread" | "read";
type ViewMode = "priority" | "new";
type PinFilter = "all" | "pinned";

export function Dashboard() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourcePlatform>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [pinFilter, setPinFilter] = useState<PinFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("priority");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [clearingRead, setClearingRead] = useState(false);
  const [confirmClearRead, setConfirmClearRead] = useState(false);
  const [clearReadError, setClearReadError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => (typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default")
  );
  const [redAlertsEnabled, setRedAlertsEnabled] = useState<boolean>(false);
  const [triagePreferences, setTriagePreferences] = useState<BeeperTriagePreferences>({
    familyRedEnabled: false,
    businessRedEnabled: false
  });
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const seenRedIdsRef = useRef<Set<string>>(new Set());
  const initialBoardLoadedRef = useRef(false);

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("orgis.snoozed");
      if (raw === null) {
        return;
      }

      setSnoozed(raw === "true");
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("orgis.snoozed", String(snoozed));
    } catch {
      // Ignore storage failures.
    }
  }, [snoozed]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("orgis.redAlertsEnabled");
      if (raw === null) {
        return;
      }

      setRedAlertsEnabled(raw === "true");
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("orgis.redAlertsEnabled", String(redAlertsEnabled));
    } catch {
      // Ignore storage failures (private mode, quota, etc).
    }
  }, [redAlertsEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/beeper/preferences", {
          cache: "no-store"
        });

        const payload = (await response.json()) as BeeperTriagePreferences & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Preferences load failed: ${response.status}`);
        }

        if (!cancelled) {
          setTriagePreferences({
            familyRedEnabled: Boolean(payload.familyRedEnabled),
            businessRedEnabled: Boolean(payload.businessRedEnabled)
          });
          setPreferenceError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPreferenceError(error instanceof Error ? error.message : "Preferences load failed.");
        }
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updatePreference(
    key: keyof BeeperTriagePreferences,
    enabled: boolean
  ) {
    setPreferenceError(null);
    setTriagePreferences((current) => ({ ...current, [key]: enabled }));

    try {
      const response = await fetch("/api/beeper/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ [key]: enabled })
      });

      const payload = (await response.json()) as BeeperTriagePreferences & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Preferences update failed: ${response.status}`);
      }

      setTriagePreferences({
        familyRedEnabled: Boolean(payload.familyRedEnabled),
        businessRedEnabled: Boolean(payload.businessRedEnabled)
      });
    } catch (error) {
      setPreferenceError(error instanceof Error ? error.message : "Preferences update failed.");
      setTriagePreferences((current) => ({ ...current, [key]: !enabled }));
    }
  }

  async function handleToggleFamilyRed() {
    await updatePreference("familyRedEnabled", !triagePreferences.familyRedEnabled);
  }

  async function handleToggleBusinessRed() {
    await updatePreference("businessRedEnabled", !triagePreferences.businessRedEnabled);
  }

  const filteredBySource =
    sourceFilter === "all" ? items : items.filter((item) => item.source === sourceFilter);
  const filteredByPriority = filterInboxItems(filteredBySource, viewMode === "priority" ? filter : "all");

  const baseItems =
    viewMode === "new"
      ? [...filteredByPriority].sort((a, b) => {
          const pinDelta = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
          if (pinDelta !== 0) {
            return pinDelta;
          }

          const timeDelta = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          if (timeDelta !== 0) {
            return timeDelta;
          }

          return a.sender.localeCompare(b.sender);
      })
      : sortInboxItems(filteredByPriority);

  const pinVisibleBaseItems = pinFilter === "pinned" ? baseItems.filter((item) => item.isPinned) : baseItems;
  const searchedItems = pinVisibleBaseItems.filter((item) => matchesInboxSearch(item, searchQuery));

  const visibleItems =
    readFilter === "all"
      ? searchedItems
      : searchedItems.filter((item) =>
          readFilter === "read" ? isRead(item.id) : !isRead(item.id)
        );
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
        const currentRedIds = new Set(
          flattened.filter((item) => item.priority === "act_now").map((item) => item.id)
        );
        const newRedItems = flattened.filter(
          (item) => item.priority === "act_now" && !seenRedIdsRef.current.has(item.id)
        );

        if (!cancelled) {
          setItems(sortInboxItems(flattened));
          setRefreshedAt(payload.refreshedAt ?? null);
          setSyncError(null);

          if (initialBoardLoadedRef.current && redAlertsEnabled && newRedItems.length > 0) {
            const canNotify =
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted";

            if (canNotify) {
              for (const item of newRedItems) {
                const notification = new Notification("Orgis red alert", {
                  body: `${item.sender} in ${item.chatOrThreadName}: ${item.summary}`,
                  tag: item.id
                });

                notification.onclick = () => {
                  window.focus();
                  setSelectedItemId(item.id);
                  notification.close();
                };
              }
            }
          }

          seenRedIdsRef.current = currentRedIds;
          initialBoardLoadedRef.current = true;
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
  }, [redAlertsEnabled]);

  async function handleToggleRedAlerts() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setSyncError("This browser does not support notifications.");
      return;
    }

    if (redAlertsEnabled) {
      setRedAlertsEnabled(false);
      return;
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    setNotificationPermission(permission);

    if (permission === "granted") {
      setRedAlertsEnabled(true);
      seenRedIdsRef.current = new Set(
        items.filter((item) => item.priority === "act_now").map((item) => item.id)
      );
    }
  }

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
        description={
          searchQuery
            ? `No messages match "${searchQuery}".`
            : viewMode === "new"
              ? "No unread messages right now."
              : "Switch filters to show other threads."
        }
        primaryActionLabel="Show all"
        onPrimaryAction={() => {
          setFilter("all");
          setSourceFilter("all");
          setReadFilter("all");
          setViewMode("priority");
          setPinFilter("all");
          setSearchQuery("");
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

  async function handleClearRead() {
    if (clearingRead) {
      return;
    }

    if (!confirmClearRead) {
      setConfirmClearRead(true);
      setClearReadError(null);

      window.setTimeout(() => {
        setConfirmClearRead(false);
      }, 4500);

      return;
    }

    const readItems = baseItems.filter((item) => isRead(item.id));
    const deletableReadItems = readItems.filter((item) => !item.isPinned);
    const beeperMessageIds = deletableReadItems
      .map((item) => item.beeperMessageId)
      .filter((value): value is string => Boolean(value));

    if (beeperMessageIds.length === 0) {
      setConfirmClearRead(false);
      setClearReadError(null);
      return;
    }

    setClearingRead(true);
    setClearReadError(null);

    try {
      const response = await fetch("/api/beeper/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messageIds: beeperMessageIds
        })
      });

      const payload = (await response.json()) as { ok?: boolean; deleted?: number; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `Delete failed: ${response.status}`);
      }

      const deletedIdSet = new Set(deletableReadItems.map((item) => item.id));

      setItems((current) => current.filter((item) => !deletedIdSet.has(item.id)));
      setReadIds((current) => {
        const next = new Set(current);
        for (const id of deletedIdSet) {
          next.delete(id);
        }
        return next;
      });
      setSelectedItemId((current) => (current && deletedIdSet.has(current) ? null : current));
      setConfirmClearRead(false);
      setClearReadError(null);
    } catch (error) {
      setClearReadError(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setClearingRead(false);
    }
  }

  async function togglePinForItem(targetItem: InboxItem) {
    if (pinBusy) {
      return;
    }

    const messageId = targetItem.beeperMessageId;
    if (!messageId) {
      setSyncError("This message cannot be pinned.");
      return;
    }

    const nextPinned = !Boolean(targetItem.isPinned);
    setPinBusy(true);
    setSyncError(null);

    setItems((current) =>
      sortInboxItems(
        current.map((item) =>
          item.id === targetItem.id ? { ...item, isPinned: nextPinned } : item
        )
      )
    );

    try {
      const response = await fetch("/api/beeper/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messageId,
          pinned: nextPinned
        })
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `Pin update failed: ${response.status}`);
      }
    } catch (error) {
      setItems((current) =>
        sortInboxItems(
          current.map((item) =>
            item.id === targetItem.id ? { ...item, isPinned: !nextPinned } : item
          )
        )
      );
      setSyncError(error instanceof Error ? error.message : "Pin update failed.");
    } finally {
      setPinBusy(false);
    }
  }

  async function handleTogglePin() {
    if (!selectedItem) {
      return;
    }

    await togglePinForItem(selectedItem);
  }

  function handleToggleSnooze() {
    setSnoozed((current) => {
      const next = !current;
      if (next) {
        setSelectedItemId(null);
      }
      return next;
    });
  }

  return (
    <div className="relative min-h-screen">
      <EdgeSprite />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orgis-grid absolute inset-0 opacity-35 dark:opacity-20" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-secondary transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <OrgisLogo compact />

            <div className="flex flex-wrap items-center gap-2">
              {snoozed ? (
                <Badge className="border-border/70 bg-card/70 px-3 py-1 text-muted-foreground">
                  Snoozed
                </Badge>
              ) : null}
              <Badge className="border-border/70 bg-card/70 px-3 py-1 text-muted-foreground">
                {items.length} threads
              </Badge>
              <Badge className="border-border/70 bg-card/70 px-3 py-1 text-muted-foreground">
                {activeSources.length} apps
              </Badge>
              {refreshedAt ? (
                <Badge className="border-border/70 bg-card/70 px-3 py-1 text-muted-foreground">
                  Updated {formatTimestamp(refreshedAt)}
                </Badge>
              ) : null}
              <Badge
                className={cn(
                  "border px-3 py-1",
                  syncing
                    ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200"
                )}
              >
                {syncing ? "Refreshing..." : "Live"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-2xl bg-card/70"
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
        {snoozed ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-xl bg-card/70">
              <CardHeader className="space-y-2">
                <CardTitle>Snooze mode</CardTitle>
                <CardDescription>
                  Your inbox is hidden while Orgis continues running in the background.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" className="rounded-full" onClick={handleToggleSnooze}>
                    Resume
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setMenuOpen(true)}
                  >
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {syncError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                  Live data unavailable: {syncError}
                </div>
              ) : null}

              <Card className="bg-card/70">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-4xl">
                  <DonutChart
                    title="Queue distribution"
                    subtitle="Act now, review soon, and for later at a glance."
                    align="center"
                    showDetails={false}
                    slices={[
                      {
                        key: "act_now",
                        label: "Act now",
                        value: counts.act_now,
                            className: "text-rose-600 stroke-rose-500"
                          },
                          {
                            key: "review_soon",
                            label: "Review",
                            value: counts.review_soon,
                            className: "text-amber-600 stroke-amber-500"
                          },
                          {
                            key: "for_later",
                            label: "Later",
                            value: counts.for_later,
                            className: "text-sky-600 stroke-sky-500"
                          }
                        ]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <main className="mt-6">
              <section className="space-y-4">
                <Card className="bg-card/70">
                  <CardHeader className="space-y-4 border-b border-border/70 pb-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <CardTitle>Priority list</CardTitle>
                    <CardDescription>
                      {viewMode === "new"
                        ? "Unread messages only, sorted by latest activity."
                        : "Urgency first, then most recent activity."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="w-fit border-border/70 bg-muted/40 px-3 py-1 text-muted-foreground">
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("priority")}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      viewMode === "priority"
                        ? "border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                        : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    Priority view
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("new");
                      setReadFilter("unread");
                      setPinFilter("all");
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      viewMode === "new"
                        ? "border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                        : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    New messages
                  </button>

                  <button
                    type="button"
                    onClick={() => setPinFilter((current) => (current === "pinned" ? "all" : "pinned"))}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      pinFilter === "pinned"
                        ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-950/20 dark:text-amber-200"
                        : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Pin className="h-4 w-4" />
                      Pinned
                    </span>
                  </button>

                  <Button
                    type="button"
                    variant={filtersOpen ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    aria-label={filtersOpen ? "Hide filters" : "Show filters"}
                    aria-pressed={filtersOpen}
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search sender, chat, or message"
                    className="h-11 w-full rounded-full border border-border/70 bg-background pl-11 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border focus:ring-2 focus:ring-ring/25"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {filtersOpen ? (
                  <>
                    {viewMode === "priority" ? (
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
                                  ? "border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                                  : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

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
                                  ? "border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                                  : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
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
                                ? "border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                                : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                            )}
                          >
                            {option.label}
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs",
                                active
                                  ? "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-900"
                                  : "bg-muted/60 text-muted-foreground"
                              )}
                            >
                              {option.countLabel}
                            </span>
                          </button>
                        );
                      })}

                      {readFilter === "read" ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                          disabled={clearingRead || baseReadCount === 0}
                          onClick={handleClearRead}
                        >
                          {clearingRead
                            ? "Clearing..."
                            : confirmClearRead
                              ? "Confirm clear"
                              : "Clear read"}
                        </Button>
                      ) : null}
                    </div>

                    {readFilter === "read" && clearReadError ? (
                      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {clearReadError}
                      </div>
                    ) : null}

                    {pinFilter === "pinned" ? (
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                        Showing pinned messages
                      </div>
                    ) : null}

                    {searchQuery ? (
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Searching for &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : null}
                  </>
                ) : null}
              </CardHeader>

              <CardContent className="p-0">
                {emptyState ? (
                  <div className="p-5">{emptyState}</div>
                ) : (
                  <>
                    <div className="hidden grid-cols-[148px_132px_minmax(0,1fr)_112px] gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                      <span className="border-r border-border/70 pr-4">App</span>
                      <span className="border-r border-border/70 pr-4">Priority</span>
                      <span className="border-r border-border/70 pr-4">Message</span>
                      <span className="text-right">Updated</span>
                    </div>

                    <div className="divide-y divide-border/70">
                      {visibleItems.map((item) => {
                        const selected = item.id === selectedItemId;
                        const read = isRead(item.id);

                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            aria-haspopup="dialog"
                            aria-expanded={selected}
                            onClick={() => setSelectedItemId(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedItemId(item.id);
                              }
                            }}
                            className={cn(
                              "relative w-full px-5 py-4 text-left transition-[transform,background-color,box-shadow] duration-200",
                              "hover:-translate-y-[1px] hover:bg-muted/30 hover:shadow-soft",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              selected ? "bg-muted/30 shadow-soft" : "bg-transparent"
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute left-0 top-0 h-full w-1 rounded-r-full",
                                item.priority === "act_now"
                                  ? "bg-gradient-to-b from-rose-500/90 to-rose-500/20"
                                  : item.priority === "review_soon"
                                    ? "bg-gradient-to-b from-amber-500/90 to-amber-500/20"
                                    : "bg-gradient-to-b from-sky-500/70 to-sky-500/10"
                              )}
                            />
                            <div className="grid gap-3 md:grid-cols-[148px_132px_minmax(0,1fr)_112px] md:items-center md:gap-4">
                              <div className="flex items-center gap-2 md:border-r md:border-border/70 md:pr-4">
                                <span
                                  aria-hidden="true"
                                  className="h-6 w-6 rounded-xl border border-border/70 bg-gradient-to-br from-muted/40 to-background shadow-sm"
                                />
                                <Badge className={cn("border", sourceBadgeClass(item.source))}>
                                  {sourceLabel(item.source)}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 md:border-r md:border-border/70 md:pr-4">
                                <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                                  {priorityLabel(item.priority)}
                                </Badge>
                                {read ? (
                                  <span className="text-xs font-medium text-muted-foreground">Read</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-200">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full bg-sky-500"
                                      aria-hidden="true"
                                    />
                                    New
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 md:border-r md:border-border/70 md:pr-4">
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    read ? "text-foreground/80" : "text-foreground"
                                  )}
                                >
                                  {item.sender}
                                  <span className="font-normal text-muted-foreground">
                                    {" "}
                                    | {item.chatOrThreadName}
                                  </span>
                                  {item.isPinned ? (
                                    <span
                                      className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                                      title="Pinned"
                                      aria-label="Pinned"
                                    >
                                      <Pin className="h-3 w-3" />
                                    </span>
                                  ) : null}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {previewText(item.reason, 110)}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-left text-xs text-muted-foreground md:border-l md:border-border/70 md:pl-4 md:text-right">
                                <span>{formatTimestamp(item.timestamp)}</span>
                                <button
                                  type="button"
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                                    item.isPinned
                                      ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/45"
                                      : "border-border/70 bg-card/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  )}
                                  aria-label={item.isPinned ? "Unpin message" : "Pin message"}
                                  title={item.isPinned ? "Unpin" : "Pin"}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void togglePinForItem(item);
                                  }}
                                >
                                  {item.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
          </>
        )}
      </div>

      <HamburgerDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        connectedApps={activeSources.map(([source, count]) => ({
          source,
          count
        }))}
        lastUpdatedAt={refreshedAt}
        notificationPermission={notificationPermission}
        redAlertsEnabled={redAlertsEnabled}
        onToggleRedAlerts={handleToggleRedAlerts}
        familyRedEnabled={triagePreferences.familyRedEnabled}
        businessRedEnabled={triagePreferences.businessRedEnabled}
        onToggleFamilyRed={handleToggleFamilyRed}
        onToggleBusinessRed={handleToggleBusinessRed}
        preferenceError={preferenceError}
        snoozed={snoozed}
        onToggleSnooze={handleToggleSnooze}
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
        isPinned={selectedItem ? Boolean(selectedItem.isPinned) : false}
        pinBusy={pinBusy}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
