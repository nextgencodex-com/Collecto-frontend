"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TODAY, addD, fd, fmt, r2, sched } from "@/lib/calc";
import type { Freq } from "@/lib/types";
import { api } from "@/services/api";
import { type ItemForm, useAppStore } from "@/store/app-store";
import { Field, FormActions, FormError, ModalFrame, SelectInput, TextInput, decimal, digits } from "./frame";

export function ItemDialog({ customerId = "", code = "", lockCustomer, onClose }: { customerId?: string; code?: string; lockCustomer?: boolean; onClose: () => void }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const [f, setF] = useState<ItemForm>(() => {
    const p = data.products.find((x) => x.code === code);
    const c = data.customers.find((x) => x.id === customerId);
    return {
      customerId,
      code,
      price: p ? String(p.price) : "",
      freq: p ? p.freq : "weekly",
      period: p ? String(p.period) : "",
      amount: p ? String(p.amount) : "",
      start: addD(TODAY, 7),
      riderId: c ? c.riderId : data.riders[0]?.id ?? "",
    };
  });
  const [err, setErr] = useState("");

  // Field changes cascade exactly like the prototype's setF()
  const set = (k: keyof ItemForm, v: string) =>
    setF((s) => {
      const n: ItemForm = { ...s, [k]: v };
      if (k === "code") {
        const p = data.products.find((x) => x.code === v);
        if (p) Object.assign(n, { price: String(p.price), freq: p.freq, period: String(p.period), amount: String(p.amount) });
      }
      if (k === "customerId") {
        const c = data.customers.find((x) => x.id === v);
        if (c) n.riderId = c.riderId;
      }
      if (k === "price" || k === "freq" || k === "period") {
        const cnt = n.freq === "weekly" ? +n.period * 4 : +n.period;
        if (+n.price > 0 && cnt > 0) n.amount = String(Math.ceil(+n.price / cnt / 10) * 10);
      }
      return n;
    });

  const price = +f.price;
  const amount = +f.amount;
  const ok = price > 0 && amount > 0 && amount <= price && !!f.start;
  const ds = ok ? sched({ price, amount, freq: f.freq, start: f.start }) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.items.create(f);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast("Installment plan created · schedule generated");
    router.push(`/customers/${res.value}`);
  };

  return (
    <ModalFrame title="Add item / installment" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Customer">
          <SelectInput value={f.customerId} onChange={(e) => set("customerId", e.target.value)} disabled={lockCustomer}>
            <option value="">Select customer</option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.nic}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Item (code · name)">
          <SelectInput value={f.code} onChange={(e) => set("code", e.target.value)}>
            <option value="">Select product</option>
            {data.products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} · {p.name} ({p.stock} in stock)
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
          <Field label="Price (Rs.)">
            <TextInput inputMode="decimal" value={f.price} onChange={(e) => set("price", decimal(e.target.value))} />
          </Field>
          <Field label="Payment period (months)">
            <TextInput inputMode="numeric" value={f.period} onChange={(e) => set("period", digits(e.target.value))} />
          </Field>
          <Field label="Frequency">
            <SelectInput value={f.freq} onChange={(e) => set("freq", e.target.value as Freq)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </SelectInput>
          </Field>
          <Field label="Amount per payment">
            <TextInput inputMode="decimal" value={f.amount} onChange={(e) => set("amount", decimal(e.target.value))} />
          </Field>
          <Field label="Start date">
            <TextInput type="date" value={f.start} onChange={(e) => set("start", e.target.value)} />
          </Field>
          <Field label="Assigned rider (the customer's rider)">
            <SelectInput value={f.riderId} onChange={(e) => set("riderId", e.target.value)} disabled>
              {data.riders
                .filter((r) => r.active || r.id === f.riderId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.area}
                  </option>
                ))}
            </SelectInput>
          </Field>
        </div>

        <div className="flex flex-col gap-2 rounded-[10px] bg-app px-4 py-3.5">
          <span className="text-13 font-medium text-muted-ink">Generated schedule</span>
          {ok ? (
            <>
              <span className="text-[15px] font-semibold text-ink">
                {ds.length} {f.freq} payments of {fmt(amount)}
                {Math.round(price * 100) % Math.round(amount * 100) ? ` (last ${fmt(r2(price - amount * (ds.length - 1)))})` : ""}
              </span>
              <span className="text-13 text-body">
                {fd(ds[0])} → {fd(ds[ds.length - 1])}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ds.slice(0, 6).map((x) => (
                  <span key={x} className="rounded-full border border-line-card bg-white px-2 py-[3px] text-xs text-body">
                    {fd(x)}
                  </span>
                ))}
                {ds.length > 6 && <span className="self-center text-meta text-muted-ink">+ {ds.length - 6} more</span>}
              </div>
            </>
          ) : (
            <span className="text-13 text-muted-ink">Choose a product and payment terms to preview the schedule.</span>
          )}
        </div>

        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Create plan" />
      </form>
    </ModalFrame>
  );
}
