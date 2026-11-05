"use client";
import { useState } from "react";
import { toast } from "sonner";
import { decimal } from "@/components/modals/frame";
import { fmt, r2, signed } from "@/lib/calc";
import { api } from "@/services/api";
import { useRider } from "@/hooks/use-rider";

export default function RiderClosingPage() {
  const r = useRider();
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  if (!r) return null;
  const { expected, collected, pending, tp, closing } = r;

  if (closing)
    return (
      <>
        <div className="flex flex-col gap-1 rounded-xl bg-success-soft p-4">
          <span className="text-base font-semibold text-success">✓ Day closed at {closing.time}</span>
          <span className="text-13 text-success">The owner has been notified.</span>
        </div>
        <div className="card grid grid-cols-[1fr_auto] gap-3 p-4 text-[15px]">
          <span className="text-muted-ink">Expected</span>
          <span className="font-semibold text-ink">{fmt(closing.expected)}</span>
          <span className="text-muted-ink">Collected ({closing.count})</span>
          <span className="font-semibold text-ink">{fmt(closing.collected)}</span>
          <span className="text-muted-ink">Pending</span>
          <span className="font-semibold text-ink">{fmt(closing.pending)}</span>
          <span className="text-muted-ink">Cash submitted</span>
          <span className="font-semibold text-ink">{fmt(closing.cash)}</span>
          <span className="text-muted-ink">Difference</span>
          <span className="font-semibold text-ink">{signed(closing.cash - closing.collected)}</span>
          <span className="text-muted-ink">Note</span>
          <span className="text-ink">{closing.note || "—"}</span>
        </div>
      </>
    );

  const diff = cash === "" ? null : r2(+cash - collected);
  const submit = async () => {
    const res = await api.closings.submit({ cash, note });
    if (!res.ok) return setErr(res.error);
    setCash("");
    setNote("");
    setErr("");
    toast("Daily closing submitted");
  };

  return (
    <>
      <div className="card grid grid-cols-[1fr_auto] gap-3 p-4 text-[15px]">
        <span className="text-muted-ink">Expected today</span>
        <span className="font-semibold text-ink">{fmt(expected)}</span>
        <span className="text-muted-ink">Collected ({tp.length} payments)</span>
        <span className="font-semibold text-success">{fmt(collected)}</span>
        <span className="text-muted-ink">Pending</span>
        <span className="font-semibold text-warning">{fmt(pending)}</span>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
        Cash submitted
        <div className="flex h-14 items-center gap-2 rounded-[10px] border border-line-input bg-white px-3.5 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(124,92,250,.15)]">
          <span className="text-[15px] font-semibold text-muted-ink">Rs.</span>
          <input
            inputMode="decimal"
            value={cash}
            onChange={(e) => {
              setCash(decimal(e.target.value));
              setErr("");
            }}
            placeholder="0"
            className="num min-w-0 flex-1 border-0 bg-transparent text-[22px] font-bold text-ink !shadow-none outline-none"
          />
        </div>
      </label>
      <div className="flex justify-between text-sm">
        <span className="text-muted-ink">Difference vs collected</span>
        <span className="font-semibold" style={{ color: diff === null ? "#71717A" : diff < 0 ? "#C81E3A" : "#15803D" }}>
          {diff === null ? "—" : signed(diff)}
        </span>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
        Note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Required if cash differs"
          className="resize-y rounded-[10px] border border-line-input p-3 text-[15px] font-normal text-ink"
        />
      </label>
      {err && (
        <div role="alert" className="rounded-[10px] bg-danger-soft p-3 text-sm text-danger">
          {err}
        </div>
      )}
      <button onClick={submit} className="h-14 rounded-xl border-0 bg-brand text-base font-bold text-white hover:bg-brand-hover">
        Submit closing
      </button>
    </>
  );
}
