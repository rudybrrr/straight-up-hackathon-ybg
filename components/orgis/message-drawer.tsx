"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatFullTimestamp, priorityBadgeClass, priorityLabel, sourceBadgeClass, sourceLabel } from "@/lib/inbox";
import { X } from "lucide-react";
import type { InboxItem } from "@/types/orgis";

export function MessageDrawer({
  item,
  onClose
}: {
  item: InboxItem | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!item) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item]);

  if (!mounted || !item) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close detail drawer"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full border-l border-slate-200 bg-white shadow-2xl",
          "sm:max-w-xl"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("border", sourceBadgeClass(item.source))}>
                  {sourceLabel(item.source)}
                </Badge>
                <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                  {priorityLabel(item.priority)}
                </Badge>
                {item.isThread ? <Badge variant="secondary">Thread</Badge> : <Badge variant="secondary">Message</Badge>}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">{item.sender}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.chatOrThreadName}</p>
              </div>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-slate-200 bg-slate-50">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timestamp</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{formatFullTimestamp(item.timestamp)}</p>
                </div>
              </Card>
              <Card className="border-slate-200 bg-slate-50">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Count</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {item.messageCount && item.messageCount > 1
                      ? `${item.messageCount} messages`
                      : "Single message"}
                  </p>
                </div>
              </Card>
            </div>

            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Summary</p>
                <p className="mt-2 text-base leading-7 text-slate-900">{item.summary}</p>
              </section>

              <Separator />

              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Why this priority</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.reason}</p>
              </section>

              <Separator />

              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Raw content</p>
                <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                    {item.rawContent}
                  </pre>
                </div>
              </section>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}
