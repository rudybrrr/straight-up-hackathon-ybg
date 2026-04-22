"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pin, PinOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  onReply,
  isPinned,
  pinBusy,
  onTogglePin
}: {
  item: InboxItem | null;
  onClose: () => void;
  isRead: boolean;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onReply: () => void;
  isPinned: boolean;
  pinBusy: boolean;
  onTogglePin: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const originalRef = useRef<HTMLElement | null>(null);
  const replyRef = useRef<HTMLElement | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const itemId = item?.id ?? null;
  const beeperChatId = item?.beeperChatId ?? null;

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    setReplyText("");
    setReplyError(null);
    setReplySuccess(null);

    window.requestAnimationFrame(() => {
      if (beeperChatId) {
        replyTextareaRef.current?.focus();
      } else {
        closeButtonRef.current?.focus();
      }
    });

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
  }, [beeperChatId, itemId]);

  if (!mounted || !item) {
    return null;
  }

  const canReply = Boolean(item.beeperChatId);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close detail drawer"
        className="absolute inset-0 z-0 bg-slate-950/45 transition-opacity duration-200 motion-reduce:transition-none"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 z-10 h-full w-full border-l border-border/70 bg-card shadow-2xl",
          "sm:max-w-xl"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 bg-slate-950 px-6 py-5 text-white">
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

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  onClick={onTogglePin}
                  disabled={pinBusy}
                >
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  <span>{pinBusy ? "Saving..." : isPinned ? "Unpin" : "Pin"}</span>
                </Button>

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
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-none">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Latest activity
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatFullTimestamp(item.timestamp)}
                  </p>
                </div>
              </Card>
              <Card className="shadow-none">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Thread size</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
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
                onClick={() => {
                  replyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.setTimeout(() => replyTextareaRef.current?.focus(), 120);
                }}
                disabled={!canReply}
              >
                Reply
              </Button>
              {canReply ? (
                <a
                  href={`beeper://chat/${encodeURIComponent(item.beeperChatId ?? "")}`}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/40"
                >
                  Open in Beeper
                </a>
              ) : null}
            </div>

            {canReply ? (
              <section
                ref={replyRef}
                className="mt-4 rounded-3xl border border-border/70 bg-card/70 p-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Reply
                  </p>
                  {replyError ? <p className="text-xs font-medium text-rose-700">{replyError}</p> : null}
                  {!replyError && replySuccess ? (
                    <p className="text-xs font-medium text-emerald-700">{replySuccess}</p>
                  ) : null}
                </div>
                <Textarea
                  ref={replyTextareaRef}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Type a reply to send via Beeper…"
                  className="mt-3 min-h-24 rounded-3xl"
                  disabled={replyBusy}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={replyBusy || replyText.trim().length === 0}
                    onClick={async () => {
                      if (!item.beeperChatId) {
                        return;
                      }

                      setReplyBusy(true);
                      setReplyError(null);
                      setReplySuccess(null);

                      try {
                        const response = await fetch("/api/beeper/reply", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            chatId: item.beeperChatId,
                            text: replyText.trim()
                          })
                        });

                        const payload = (await response.json()) as { ok?: boolean; error?: string };
                        if (!response.ok || !payload.ok) {
                          throw new Error(payload.error ?? `Reply failed: ${response.status}`);
                        }

                        onReply();
                        setReplyText("");
                        setReplySuccess("Sent to Beeper.");
                      } catch (error) {
                        setReplyError(error instanceof Error ? error.message : "Reply failed.");
                      } finally {
                        setReplyBusy(false);
                      }
                    }}
                  >
                    {replyBusy ? "Sending…" : "Send reply"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={replyBusy}
                    onClick={() => setReplyText("")}
                  >
                    Clear
                  </Button>
                </div>
              </section>
            ) : (
              <div className="mt-4 rounded-3xl border border-dashed border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                Reply is unavailable for this message (missing Beeper chat id).
              </div>
            )}

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
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Thread summary
                </p>
                <p className="mt-2 text-base leading-7 text-foreground">{item.summary}</p>
              </section>

              <Separator />

              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Why it was prioritized
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/80">{item.reason}</p>
              </section>

              <Separator />

              <section ref={originalRef}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Original message content
                </p>
                <div className="mt-2 rounded-3xl border border-border/70 bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/80">
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
