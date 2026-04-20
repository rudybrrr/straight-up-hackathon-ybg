"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  formatFullTimestamp,
  priorityBadgeClass,
  priorityLabel,
  sourceBadgeClass,
  sourceLabel
} from "@/lib/inbox";
import type { InboxItem } from "@/types/orgis";

export function MessageDrawer({
  item,
  onClose,
  isRead,
  onMarkRead,
  onMarkUnread,
  onReply
}: {
  item: InboxItem | null;
  onClose: () => void;
  isRead: boolean;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onReply: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const originalRef = useRef<HTMLElement | null>(null);

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

    closeButtonRef.current?.focus();

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
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 h-full w-full border-l border-slate-200 bg-white shadow-2xl",
          "sm:max-w-xl"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("border", sourceBadgeClass(item.source))}>
                    {sourceLabel(item.source)}
                  </Badge>
                  <Badge className={cn("border", priorityBadgeClass(item.priority))}>
                    {priorityLabel(item.priority)}
                  </Badge>
                  {item.isThread ? (
                    <Badge className="border-white/10 bg-white/10 text-white">Thread</Badge>
                  ) : (
                    <Badge className="border-white/10 bg-white/10 text-white">Message</Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Compiled chat view
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2 text-xl font-semibold tracking-tight text-white"
                  >
                    {item.sender}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">{item.chatOrThreadName}</p>
                </div>
              </div>

              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close drawer"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest activity</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {formatFullTimestamp(item.timestamp)}
                  </p>
                </div>
              </Card>
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Thread size</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {item.messageCount && item.messageCount > 1
                      ? `${item.messageCount} messages`
                      : "Single message"}
                  </p>
                </div>
              </Card>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={isRead ? "outline" : "default"}
                className="rounded-full"
                onClick={isRead ? onMarkUnread : onMarkRead}
              >
                {isRead ? "Mark unread" : "Mark read"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={onReply}
              >
                Reply
              </Button>
            </div>

            {item.isThread ? (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    originalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  View original messages
                </Button>
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Thread summary</p>
                <p className="mt-2 text-base leading-7 text-slate-900">{item.summary}</p>
              </section>

              <Separator />

              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Why it was prioritized</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.reason}</p>
              </section>

              <Separator />

              <section ref={originalRef}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Original message content</p>
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
