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
    <Card className="border-slate-200/80 bg-slate-950 text-white shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Digest</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {urgentCount > 0
                ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need immediate attention`
                : "Nothing is urgent right now"}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Keep the urgent items at the top, review the important ones soon, and let the rest wait.
            </p>
          </div>
          <Badge className="border-white/10 bg-white/10 px-3 py-1 text-white">Total {total}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Act now</p>
            <p className="mt-2 text-3xl font-semibold">{counts.act_now}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Review soon</p>
            <p className="mt-2 text-3xl font-semibold">{counts.review_soon}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">For later</p>
            <p className="mt-2 text-3xl font-semibold">{counts.for_later}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

