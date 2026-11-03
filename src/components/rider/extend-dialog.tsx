"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Field, FormError, ModalFrame } from "@/components/modals/frame";
import { TODAY, addD, fds, fmt } from "@/lib/calc";
import type { CalcCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

const QUICK: [string, number][] = [
  ["Tomorrow", 1],
  ["In 3 days", 3],
  ["Next week", 7],
];

/** Rider grants a short payment extension: records the promised date and notifies the owner. */
export function ExtendDialog({ c, onClose }: { c: CalcCustomer; onClose: () => void }) {
  const [until, setUntil] = useState(addD(TODAY, 1));
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.customers.extendPayment(c.id, until, reason);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast("Extension saved · owner notified");
  };

  return (
    <ModalFrame title="Extend payment" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-[10px] bg-app px-3.5 py-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold text-ink">{c.name}</span>
            <span className="text-13 text-muted-ink">
              {c.city} · {c.phone}
            </span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-meta text-muted-ink">Due now</span>
            <span className="num text-base font-bold text-ink">{fmt(c.dueNow)}</span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-13 font-medium text-body">Customer will pay on</span>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map(([label, days]) => {
              const d = addD(TODAY, days);
              const on = until === d;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setUntil(d)}
                  aria-pressed={on}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center rounded-[10px] border text-13 font-semibold",
                    on ? "border-brand bg-brand-soft text-brand-ink" : "border-line-input bg-white text-ink hover:bg-hover",
                  )}
                >
                  {label}
                  <span className="text-xs font-normal text-muted-ink">{fds(d)}</span>
                </button>
              );
            })}
          </div>
          <input
            type="date"
            aria-label="Or pick a date"
            min={addD(TODAY, 1)}
            max={addD(TODAY, 30)}
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="h-12 rounded-[10px] border border-line-input bg-white px-3 text-[15px] text-ink"
          />
        </div>

        <Field label="Reason">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Will pay after salary on Friday"
            className="resize-y rounded-[10px] border border-line-input p-3 text-[15px] font-normal text-ink"
          />
        </Field>

        <FormError error={err} />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-[10px] border border-line-input bg-white text-[15px] font-semibold text-ink hover:bg-hover">
            Cancel
          </button>
          <button type="submit" className="h-12 rounded-[10px] border-0 bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover">
            Save extension
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
