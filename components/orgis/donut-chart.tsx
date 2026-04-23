import { cn } from "@/lib/utils";

type DonutSlice = {
  key: string;
  label: string;
  value: number;
  className: string;
};

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0
  }).format(value);
}

export function DonutChart({
  title,
  subtitle,
  slices,
  size = 168,
  strokeWidth = 18,
  align = "start",
  showDetails = true
}: {
  title: string;
  subtitle?: string;
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  align?: "start" | "center";
  showDetails?: boolean;
}) {
  const safeSize = Math.max(120, Math.min(240, Math.floor(size)));
  const safeStrokeWidth = Math.max(10, Math.min(28, Math.floor(strokeWidth)));
  const radius = (safeSize - safeStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const cleaned = slices.map((slice) => ({
    ...slice,
    value: Number.isFinite(slice.value) ? Math.max(0, slice.value) : 0
  }));
  const total = cleaned.reduce((sum, slice) => sum + slice.value, 0);

  let progress = 0;
  const arcs = cleaned.map((slice) => {
    const fraction = total > 0 ? slice.value / total : 0;
    const length = fraction * circumference;
    const offset = progress * circumference;
    progress += fraction;

    return {
      ...slice,
      fraction,
      length,
      offset
    };
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center justify-center text-center" : "sm:flex-row sm:items-center sm:gap-6"
      )}
    >
      <div className="relative shrink-0">
        <svg
          width={safeSize}
          height={safeSize}
          viewBox={`0 0 ${safeSize} ${safeSize}`}
          role="img"
          aria-label={title}
          className="block"
        >
          <title>{title}</title>
          {subtitle ? <desc>{subtitle}</desc> : null}

          <circle
            cx={safeSize / 2}
            cy={safeSize / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--border) / 0.9)"
            strokeWidth={safeStrokeWidth}
          />

          <g transform={`rotate(-90 ${safeSize / 2} ${safeSize / 2})`}>
            {arcs.map((slice) =>
              slice.length > 0 ? (
                <circle
                  key={slice.key}
                  cx={safeSize / 2}
                  cy={safeSize / 2}
                  r={radius}
                  fill="transparent"
                  strokeWidth={safeStrokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${slice.length} ${circumference - slice.length}`}
                  strokeDashoffset={-slice.offset}
                  className={cn("transition-[stroke-dasharray] duration-300", slice.className)}
                />
              ) : null
            )}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Overview
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">threads</p>
        </div>
      </div>

      {showDetails ? (
        <div className={cn("min-w-0", align === "center" ? "w-full max-w-md" : undefined)}>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}

        <div className="mt-4 space-y-2">
          {arcs.map((slice) => (
            <div
              key={slice.key}
              className="flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card/70 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", slice.className)}
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium text-foreground">
                  {slice.label}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm text-foreground/80">
                <span className="tabular-nums">{slice.value}</span>
                <span className="text-muted-foreground">
                  {formatPercent(slice.fraction)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : null}
    </div>
  );
}

