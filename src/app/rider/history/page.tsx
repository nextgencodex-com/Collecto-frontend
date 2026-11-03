"use client";
import { TODAY, fds, fmt, sum } from "@/lib/calc";
import { custName, itemLabel } from "@/lib/selectors";
import type { Payment } from "@/lib/types";
import { useRider } from "@/hooks/use-rider";

export default function RiderHistoryPage() {
  const r = useRider();
  if (!r) return null;
  const mine = r.D.pays.filter((p) => p.riderId === r.me.id).slice().reverse();
  const g: Record<string, Payment[]> = {};
  mine.forEach((p) => (g[p.date] = g[p.date] || []).push(p));
  const days = Object.keys(g).sort().reverse().slice(0, 20);

  return (
    <>
      {days.map((d) => (
        <div key={d} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 text-[15px] font-semibold tracking-normal text-ink">{d === TODAY ? "Today" : fds(d)}</h2>
            <span className="text-13 text-muted-ink">
              {g[d].length} payment{g[d].length === 1 ? "" : "s"} · {fmt(sum(g[d].map((p) => p.amount)))}
            </span>
          </div>
          <div>
            {g[d].map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-line py-[13px]">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">{custName(r.D, p.customerId)}</span>
                  <span className="text-meta text-muted-ink">
                    {p.time} · {itemLabel(r.D, p.itemId)}
                  </span>
                  <span className="font-mono text-xs text-muted-ink">{p.txn}</span>
                </div>
                <span className="text-[15px] font-semibold whitespace-nowrap text-ink">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!mine.length && <div className="p-5 text-center text-sm text-muted-ink">No payments collected yet.</div>}
    </>
  );
}
