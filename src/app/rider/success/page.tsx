"use client";
import Link from "next/link";
import { fd, fmt } from "@/lib/calc";
import { useAppStore } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function RiderSuccessPage() {
  const l = useAppStore((s) => s.lastTx);
  const open = useUI((s) => s.open);
  if (!l)
    return (
      <div className="flex flex-col items-center gap-3 p-5 text-center text-sm text-muted-ink">
        No recent payment.
        <Link href="/rider" className="font-medium">
          Back to home
        </Link>
      </div>
    );

  const sec = "grid h-12 place-items-center rounded-[10px] border border-line-input bg-white text-sm font-semibold text-ink hover:bg-hover hover:text-ink hover:no-underline";
  return (
    <>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-line-card bg-white px-4 py-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#22C55E] text-[30px] font-bold text-white">✓</span>
        <span className="mt-1.5 text-lg font-semibold text-ink">Payment successful</span>
        <span className="num text-[32px] font-bold text-ink">{fmt(l.total)}</span>
        <span className="text-sm text-muted-ink">from {l.cust}</span>
      </div>
      <div className="card flex flex-col gap-3 p-4">
        {l.lines.map((x) => (
          <div key={x.txn} className="flex items-start justify-between gap-3 border-b border-line-row pb-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-mono text-13 text-ink">{x.txn}</span>
              <span className="text-13 text-muted-ink">{x.item}</span>
            </div>
            <span className="text-[15px] font-semibold whitespace-nowrap text-ink">{fmt(x.amount)}</span>
          </div>
        ))}
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-ink">Customer</span>
          <span className="text-right text-ink">{l.cust}</span>
          <span className="text-muted-ink">Date &amp; time</span>
          <span className="text-right text-ink">
            {fd(l.date)} · {l.time}
          </span>
          <span className="text-muted-ink">Rider</span>
          <span className="text-right text-ink">{l.rider}</span>
        </div>
      </div>
      <button onClick={() => open({ type: "receipt" })} className="h-[52px] rounded-[10px] border-0 bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover">
        View receipt
      </button>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/rider/customers/${l.custId}`} className={sec}>
          Back to customer
        </Link>
        <Link href="/rider" className={sec}>
          Home
        </Link>
      </div>
    </>
  );
}
