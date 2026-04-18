import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function DigestSummary({
  counts,
  total
}: {
  counts: {
    act_now: number;
    review_soon: number;
    for_later: number;
  };
  total: number;
}) {
  const urgentCount = counts.act_now;

  return (
    <Card className="relative overflow-hidden border-0 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.16),transparent_18%)]" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Priority snapshot</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {urgentCount > 0
                ? `${urgentCount} thread${urgentCount === 1 ? "" : "s"} need attention first`
                : "The queue is calm right now"}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Orgis keeps the high-pressure conversations visible, the near-term follow-ups close
              behind, and the reference chatter out of the way.
            </p>
          </div>
          <Badge className="border-white/10 bg-white/10 px-3 py-1 text-white">Total {total}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Act now</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts.act_now}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Review soon</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts.review_soon}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">For later</p>
            <p className="mt-2 text-3xl font-semibold text-white">{counts.for_later}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
