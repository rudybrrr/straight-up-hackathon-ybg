"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgisLogo } from "@/components/orgis/orgis-logo";
import { cn } from "@/lib/utils";
import { Dashboard } from "@/components/orgis/dashboard";

export function LandingGate() {
  const [phase, setPhase] = useState<"landing" | "exiting" | "app">("landing");
  const [appVisible, setAppVisible] = useState(false);

  useEffect(() => {
    if (phase !== "app") return;
    setAppVisible(false);
    const frame = window.requestAnimationFrame(() => setAppVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  if (phase === "app") {
    return (
      <div
        className={cn(
          "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
          appVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        <Dashboard />
      </div>
    );
  }

  const exiting = phase === "exiting";

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orgis-grid absolute inset-0 opacity-25 dark:opacity-15" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div
          className={cn(
            "w-full max-w-xl transition-[opacity,transform,filter] duration-300 ease-out motion-reduce:transition-none",
            exiting ? "opacity-0 translate-y-2 blur-[2px]" : "opacity-100 translate-y-0 blur-0"
          )}
        >
          <Card
            className={cn(
              "border-border/70 bg-card shadow-soft",
              "ring-1 ring-black/5 dark:ring-white/10"
            )}
          >
            <CardHeader className="items-center gap-5 pb-2 text-center">
              <OrgisLogo />
              <div className="space-y-2">
                <CardTitle className="text-xl">Your priority inbox, simplified.</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  Sort, read, and reply across chats in one clean queue.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mt-4 flex items-center justify-center">
                <Button
                  type="button"
                  className="rounded-full px-6"
                  onClick={() => {
                    if (exiting) return;
                    setPhase("exiting");
                    window.setTimeout(() => setPhase("app"), 280);
                  }}
                >
                  Get started
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
