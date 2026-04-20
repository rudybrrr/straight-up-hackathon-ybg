"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link2, ShieldCheck, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimestamp, sourceBadgeClass, sourceLabel } from "@/lib/inbox";
import type { SourcePlatform } from "@/types/orgis";

export function HamburgerDrawer({
  open,
  onClose,
  connectedApps,
  lastUpdatedAt,
  notificationPermission,
  redAlertsEnabled,
  onToggleRedAlerts
}: {
  open: boolean;
  onClose: () => void;
  connectedApps: Array<{ source: SourcePlatform; count: number }>;
  lastUpdatedAt: string | null;
  notificationPermission: NotificationPermission;
  redAlertsEnabled: boolean;
  onToggleRedAlerts: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (open) {
      setRendered(true);
      setVisible(false);

      const frame1 = window.requestAnimationFrame(() => {
        const frame2 = window.requestAnimationFrame(() => {
          setVisible(true);
        });

        return () => window.cancelAnimationFrame(frame2);
      });

      return () => window.cancelAnimationFrame(frame1);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => {
      setRendered(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  if (!mounted || !rendered) {
    return null;
  }

  return createPortal(
    <div className={cn("fixed inset-0 z-50", !visible && "pointer-events-none")}>
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]",
          "transition-opacity duration-200 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 h-full w-full border-l border-slate-200 bg-white shadow-2xl",
          "sm:max-w-sm",
          "transform-gpu transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
          visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Orgis
                </p>
                <h2 id={titleId} className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                  Account
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {lastUpdatedAt ? `Updated ${formatTimestamp(lastUpdatedAt)}` : "Live feed"}
                </p>
              </div>

              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-2xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">Signed out</p>
                  <p className="truncate text-sm text-slate-600">Account (placeholder)</p>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Connected Apps
                  </p>
                </div>

                {connectedApps.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    No apps detected yet. When messages arrive, apps will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedApps.map((app) => (
                      <div
                        key={app.source}
                        className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full border",
                              sourceBadgeClass(app.source),
                              "shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium text-slate-900">
                            {sourceLabel(app.source)}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {app.count} message{app.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Preferences
                  </p>
                </div>
                <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-rose-700">Red alerts</p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    variant={redAlertsEnabled ? "secondary" : "default"}
                    onClick={onToggleRedAlerts}
                  >
                    {redAlertsEnabled ? "Disable red alerts" : "Enable red alerts"}
                  </Button>
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
