"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link2, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onToggleRedAlerts,
  familyRedEnabled,
  businessRedEnabled,
  onToggleFamilyRed,
  onToggleBusinessRed,
  preferenceError,
  snoozed,
  onToggleSnooze
}: {
  open: boolean;
  onClose: () => void;
  connectedApps: Array<{ source: SourcePlatform; count: number }>;
  lastUpdatedAt: string | null;
  notificationPermission: NotificationPermission;
  redAlertsEnabled: boolean;
  onToggleRedAlerts: () => void | Promise<void>;
  familyRedEnabled: boolean;
  businessRedEnabled: boolean;
  onToggleFamilyRed: () => void | Promise<void>;
  onToggleBusinessRed: () => void | Promise<void>;
  preferenceError: string | null;
  snoozed: boolean;
  onToggleSnooze: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [username, setUsername] = useState("");
  const [usernameLoaded, setUsernameLoaded] = useState(false);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const canUseTheme = useMemo(
    () => typeof window !== "undefined" && typeof document !== "undefined",
    []
  );

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canUseTheme) {
      return;
    }

    const stored = window.localStorage.getItem("orgis.theme");
    const resolved = stored === "dark" ? "dark" : "light";
    setTheme(resolved);
  }, [canUseTheme, mounted]);

  useEffect(() => {
    if (!mounted || !canUseTheme) {
      return;
    }

    try {
      const stored = window.localStorage.getItem("orgis.username");
      if (stored && typeof stored === "string") {
        setUsername(stored);
      }
    } catch {
      // ignore storage errors
    } finally {
      setUsernameLoaded(true);
    }
  }, [canUseTheme, mounted]);

  useEffect(() => {
    if (!mounted || !canUseTheme || !usernameLoaded) {
      return;
    }

    try {
      window.localStorage.setItem("orgis.username", username);
    } catch {
      // ignore storage errors
    }
  }, [canUseTheme, mounted, username, usernameLoaded]);

  useEffect(() => {
    if (!mounted || !canUseTheme) {
      return;
    }

    try {
      window.localStorage.setItem("orgis.theme", theme);
    } catch {
      // ignore storage errors
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [canUseTheme, mounted, theme]);

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
          "absolute right-0 top-0 h-full w-full border-l border-border/70 bg-card/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/80",
          "sm:max-w-sm",
          "transform-gpu transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
          visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Orgis
                </p>
                <h2 id={titleId} className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  Account
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
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
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Username
                </p>
                <div className="rounded-3xl border border-border/70 bg-card/70 px-4 py-4 transition-colors">
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                    className="rounded-2xl"
                    autoComplete="nickname"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Connected Apps
                  </p>
                </div>

                {connectedApps.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                    No apps detected yet. When messages arrive, apps will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedApps.map((app) => (
                      <div
                        key={app.source}
                        className="flex items-center justify-between rounded-3xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors"
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
                          <span className="text-sm font-medium text-foreground">
                            {sourceLabel(app.source)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {app.count} message{app.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Preferences
                  </p>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card/70 px-4 py-4 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Snooze
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {snoozed ? "Main content hidden." : "Hide the inbox instantly."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={snoozed ? "secondary" : "outline"}
                      className="rounded-2xl"
                      onClick={onToggleSnooze}
                    >
                      {snoozed ? "Resume" : "Snooze"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card/70 px-4 py-4 transition-colors">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Theme
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex-1 rounded-2xl"
                      onClick={() => setTheme("light")}
                      disabled={!canUseTheme}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex-1 rounded-2xl"
                      onClick={() => setTheme("dark")}
                      disabled={!canUseTheme}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground transition-colors">
                  Notifications:{" "}
                  <span className="font-semibold text-foreground">{notificationPermission}</span>
                </div>
                <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-slate-600 transition-colors dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-slate-200">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">Red alerts</p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    variant={redAlertsEnabled ? "secondary" : "default"}
                    onClick={onToggleRedAlerts}
                  >
                    {redAlertsEnabled ? "Disable red alerts" : "Enable red alerts"}
                  </Button>
                </div>

                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/70 px-4 py-4 text-sm text-muted-foreground transition-colors">
                  <p className="font-semibold text-foreground">Family messages always red</p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    variant={familyRedEnabled ? "secondary" : "default"}
                    onClick={onToggleFamilyRed}
                  >
                    {familyRedEnabled ? "On" : "Off"}
                  </Button>
                </div>

                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/70 px-4 py-4 text-sm text-muted-foreground transition-colors">
                  <p className="font-semibold text-foreground">Business messages always red</p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    variant={businessRedEnabled ? "secondary" : "default"}
                    onClick={onToggleBusinessRed}
                  >
                    {businessRedEnabled ? "On" : "Off"}
                  </Button>
                </div>

                {preferenceError ? (
                  <p className="text-xs leading-5 text-rose-600">{preferenceError}</p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}
