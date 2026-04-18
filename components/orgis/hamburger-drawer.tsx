"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HamburgerDrawer({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">Signed out</p>
                  <p className="truncate text-sm text-slate-600">Account settings (placeholder)</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Connected Apps
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  Placeholder: manage WhatsApp / Telegram / Discord / Slack connections here.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Preferences
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  Placeholder: notifications, triage rules, and priority defaults.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}
