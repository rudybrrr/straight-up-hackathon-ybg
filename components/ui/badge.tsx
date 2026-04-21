import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950",
  secondary:
    "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  outline: "border-border/70 bg-white/80 text-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
};

export function Badge({ className, variant = "outline", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

