"use client";

import { useEffect, useState } from "react";
import type { BeeperBoardGroup } from "@/lib/beeper-board";

type BoardPayload = {
  groups: BeeperBoardGroup[];
  total: number;
  refreshedAt: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function colorClasses(color: "red" | "yellow" | "green") {
  switch (color) {
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "yellow":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export function BeeperBoardLive({ initialGroups }: { initialGroups: BeeperBoardGroup[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/beeper/board", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Board refresh failed: ${response.status}`);
        }

        const payload = (await response.json()) as BoardPayload;
        if (!cancelled) {
          setGroups(payload.groups);
          setRefreshedAt(payload.refreshedAt);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Board refresh failed.");
        }
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const total = groups.reduce((sum, group) => sum + group.messages.length, 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Beeper Priority Board
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Incoming messages grouped by reply urgency</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            New Beeper messages are stored in MySQL, sent to OpenAI for a red, yellow, or green tag,
            and shown here in simple grouped HTML.
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              {total} messages
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Live refresh
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              {refreshedAt ? `Updated ${formatTime(refreshedAt)}` : "Loading..."}
            </span>
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </header>

        <section className="grid gap-6 xl:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.color}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colorClasses(group.color)}`}>
                {group.title}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{group.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>

              <div className="mt-5 space-y-4">
                {group.messages.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No messages in this group yet.
                  </p>
                ) : (
                  group.messages.map((message) => (
                    <article key={message.beeperMessageId} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{message.senderName}</p>
                          <p className="text-xs text-slate-500">
                            {message.chatName} · {message.sourcePlatform}
                          </p>
                        </div>
                        <time className="text-xs text-slate-500">{formatTime(message.messageTimestamp)}</time>
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-800">
                        {message.summary || "Incoming message."}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{message.reason || "No reason stored yet."}</p>
                      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {message.rawContent}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
