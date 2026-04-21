import { cn } from "@/lib/utils";

export function OrgisLogo({
  subtitle,
  compact = false
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 overflow-visible">
      <div
        className={cn(
          "flex shrink-0 flex-col justify-center gap-1 rounded-[1.35rem] bg-slate-950 shadow-soft ring-1 ring-white/10 dark:bg-slate-900",
          compact ? "h-11 w-11 p-3" : "h-14 w-14 p-3.5"
        )}
        aria-hidden="true"
      >
        <span className="h-1.5 w-full rounded-full bg-white" />
        <span className="h-1.5 w-4/5 rounded-full bg-cyan-300" />
        <span className="h-1.5 w-3/5 rounded-full bg-amber-300" />
      </div>

      <div className="space-y-1">
        <div
          className={cn(
            "inline-block overflow-visible pr-4 pb-[0.06em] leading-[0.92] tracking-[-0.06em]",
            compact ? "text-3xl font-black" : "text-4xl font-black sm:text-5xl"
          )}
        >
          <span className="text-slate-950 dark:text-white">Org</span>
          <span className="inline-block pr-[0.12em] bg-gradient-to-r from-cyan-600 via-sky-600 to-amber-500 bg-clip-text text-transparent">
            is
          </span>
        </div>

        {subtitle ? (
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
