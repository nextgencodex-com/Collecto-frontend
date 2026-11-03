"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ModalFrame, digits } from "@/components/modals/frame";
import { StatusChip } from "@/components/ui-collecto/primitives";
import { fmt, sum } from "@/lib/calc";
import { api } from "@/services/api";
import { useRider } from "@/hooks/use-rider";

type Sel = Record<string, { on: boolean; val: string }>;

export default function RiderCollectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const r = useRider();
  const c = r?.D.cmap[id];
  // pre-select every item with an amount due now
  const [sel, setSel] = useState<Sel>(() =>
    Object.fromEntries((c?.act ?? []).map((x) => [x.id, { on: x.dueNow > 0, val: x.dueNow > 0 ? String(x.dueNow) : "" }])),
  );
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (!r) return null;
  if (!c) return <div className="p-5 text-center text-sm text-muted-ink">Customer not found.</div>;

  const chosen = c.act.filter((x) => sel[x.id]?.on && +sel[x.id].val > 0);
  const total = sum(c.act.map((x) => (sel[x.id]?.on ? +sel[x.id].val || 0 : 0)));

  const review = () => {
    const on = c.act.filter((x) => sel[x.id]?.on);
    if (!on.length) return setErr("Select at least one item to collect.");
    for (const x of on) {
      const v = +sel[x.id].val;
      if (!(v > 0)) return setErr(`Enter an amount for ${x.name}.`);
      if (v > x.balance) return setErr(`Amount for ${x.name} is more than its balance (${fmt(x.balance)}).`);
    }
    setErr("");
    setConfirm(true);
  };

  const submit = async () => {
    await api.payments.record(
      c.id,
      chosen.map((x) => ({ itemId: x.id, amount: +sel[x.id].val })),
    );
    toast("Payment recorded · owner notified");
    router.replace("/rider/success");
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-13 text-muted-ink">Collecting from</span>
          <span className="text-lg font-semibold text-ink">{c.name}</span>
        </div>
        <StatusChip status={c.status} />
      </div>

      {c.act.map((x) => {
        const s = sel[x.id] ?? { on: false, val: "" };
        return (
          <div key={x.id} className="card flex flex-col gap-3 p-3.5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={s.on}
                onChange={() => setSel((z) => ({ ...z, [x.id]: { ...s, on: !s.on } }))}
                className="size-6 flex-none accent-brand"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-ink">{x.name}</span>
                <span className="text-meta text-muted-ink">
                  {x.code} · Due {fmt(x.dueNow)} · Balance {fmt(x.balance)}
                </span>
              </span>
            </label>
            <div className="flex h-[52px] items-center gap-2 rounded-[10px] border border-line-input bg-white px-3.5 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(124,92,250,.15)]">
              <span className="text-[15px] font-semibold text-muted-ink">Rs.</span>
              <input
                inputMode="numeric"
                aria-label={`Amount for ${x.name}`}
                value={s.val}
                onChange={(e) => setSel((z) => ({ ...z, [x.id]: { on: true, val: digits(e.target.value) } }))}
                placeholder="0"
                className="num min-w-0 flex-1 border-0 bg-transparent text-xl font-bold text-ink !shadow-none outline-none"
              />
            </div>
          </div>
        );
      })}

      <div className="card flex items-center justify-between p-4">
        <span className="text-[15px] font-medium text-body">Total to collect</span>
        <span className="num text-2xl font-bold text-ink">{fmt(total)}</span>
      </div>
      {err && (
        <div role="alert" className="rounded-[10px] bg-danger-soft p-3 text-sm text-danger">
          {err}
        </div>
      )}
      <button onClick={review} className="h-[60px] rounded-xl border-0 bg-brand text-[17px] font-bold tracking-[.06em] text-white hover:bg-brand-hover">
        COLLECT
      </button>
      <div className="text-center text-meta text-muted-ink">You will confirm the amount before it is submitted.</div>

      {confirm && (
        <ModalFrame title="Confirm payment" onClose={() => setConfirm(false)}>
          <div className="text-sm text-body">
            Collecting from <strong className="text-ink">{c.name}</strong>
          </div>
          <div className="flex flex-col rounded-[10px] border border-line-card">
            {chosen.map((x) => (
              <div key={x.id} className="flex justify-between gap-3 border-b border-line-row px-3.5 py-3 text-sm">
                <span className="text-body">
                  {x.code} · {x.name}
                </span>
                <span className="font-semibold whitespace-nowrap text-ink">{fmt(+sel[x.id].val)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 p-3.5 text-base">
              <span className="font-semibold text-ink">Total</span>
              <span className="num text-2xl font-bold text-ink">{fmt(total)}</span>
            </div>
          </div>
          <div className="text-13 text-muted-ink">Completed payments cannot be deleted or edited by riders.</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirm(false)} className="h-[52px] rounded-[10px] border border-line-input bg-white text-[15px] font-semibold text-ink hover:bg-hover">
              Cancel
            </button>
            <button onClick={submit} className="h-[52px] rounded-[10px] border-0 bg-success text-[15px] font-bold text-white hover:bg-[#166534]">
              Confirm &amp; submit
            </button>
          </div>
        </ModalFrame>
      )}
    </>
  );
}
