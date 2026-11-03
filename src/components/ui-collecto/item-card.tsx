"use client";
import { fd, fmt } from "@/lib/calc";
import { itemPct, scheduleRows } from "@/lib/selectors";
import type { CalcItem } from "@/lib/types";
import { StatusChip, TargetTrack } from "./primitives";

/** Active installment item card with expandable repayment schedule (customer profile). */
export function ItemCard({ it, riderName, open, onToggle }: { it: CalcItem; riderName: string; open: boolean; onToggle: () => void }) {
  const pct = itemPct(it);
  return (
    <div className="card flex min-w-0 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-meta text-muted-ink">{it.code}</span>
          <span className="text-base font-semibold text-ink">{it.name}</span>
        </div>
        <StatusChip status={it.status} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Money label="Total price" value={fmt(it.price)} />
        <Money label="Paid" value={fmt(it.paid)} color="#15803D" />
        <Money label="Balance" value={fmt(it.balance)} />
      </div>
      <TargetTrack pct={pct} tone="green" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-13">
        <span className="text-muted-ink">Plan</span>
        <span className="text-right text-ink">
          {fmt(it.amount)} {it.freq} · {it.n} payments
        </span>
        <span className="text-muted-ink">Next due</span>
        <span className="text-right text-ink">{it.next ? fd(it.next) : "Completed"}</span>
        <span className="text-muted-ink">Due now</span>
        <span className="text-right font-semibold text-ink">{fmt(it.dueNow)}</span>
        <span className="text-muted-ink">Rider</span>
        <span className="text-right text-ink">{riderName}</span>
      </div>
      <button onClick={onToggle} aria-expanded={open} className="self-start border-0 bg-transparent p-0 text-13 font-medium text-brand">
        {open ? "Hide schedule" : "View schedule"}
      </button>
      {open && (
        <div className="max-h-80 overflow-auto rounded-lg border border-line-row">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["#", "Due date", "Amount", "Status"].map((h, i) => (
                  <th key={h} className={`sticky top-0 bg-subtle px-3 py-2 text-meta font-semibold text-muted-ink ${i >= 2 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleRows(it).map((r) => (
                <tr key={r.no}>
                  <td className="border-t border-line-row px-3 py-2 text-13 text-muted-ink">{r.no}</td>
                  <td className="border-t border-line-row px-3 py-2 text-13 whitespace-nowrap text-ink">{fd(r.date)}</td>
                  <td className="border-t border-line-row px-3 py-2 text-right text-13 whitespace-nowrap text-ink">{fmt(r.amount)}</td>
                  <td className="border-t border-line-row px-3 py-2 text-right">
                    <StatusChip status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Money({ label, value, color = "#18181B" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-meta text-muted-ink">{label}</span>
      <span className="num text-[15px] font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
