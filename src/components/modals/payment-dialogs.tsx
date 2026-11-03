"use client";
import { useState } from "react";
import { toast } from "sonner";
import { fd, fmt } from "@/lib/calc";
import type { LastTx } from "@/lib/types";
import { api } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import { Field, FormActions, FormError, ModalFrame, TextInput, digits } from "./frame";

export function CorrectPaymentDialog({ payId, onClose }: { payId: string; onClose: () => void }) {
  const data = useAppStore((s) => s.data);
  const p = data.payments.find((x) => x.id === payId);
  const cust = data.customers.find((c) => c.id === p?.customerId);
  const [amount, setAmount] = useState(p ? String(p.amount) : "");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  if (!p) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.payments.correct(payId, amount, reason);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast("Correction saved to audit log");
  };

  return (
    <ModalFrame title="Correct payment" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="rounded-[10px] bg-warning-soft px-3.5 py-3 text-13 leading-normal text-warning">
          Corrections never delete the transaction. The old and new values, your name and the reason are written to the audit log.
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-ink">Transaction</span>
          <span className="font-mono text-ink">{p.txn}</span>
          <span className="text-muted-ink">Customer</span>
          <span className="text-ink">{cust?.name ?? "—"}</span>
          <span className="text-muted-ink">Current amount</span>
          <span className="font-semibold text-ink">{fmt(p.amount)}</span>
        </div>
        <Field label="Corrected amount (Rs.)">
          <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(digits(e.target.value))} />
        </Field>
        <Field label="Reason">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-y rounded-lg border border-line-input px-3 py-2.5 text-sm text-ink"
          />
        </Field>
        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Save correction" />
      </form>
    </ModalFrame>
  );
}

export function receiptText(shop: { name: string; address: string }, l: LastTx) {
  return [
    shop.name,
    shop.address,
    "Payment receipt",
    "Customer: " + l.cust,
    "Date: " + fd(l.date) + " " + l.time,
    ...l.lines.map((x) => x.txn + "  " + x.item + "  " + fmt(x.amount)),
    "Total: " + fmt(l.total),
    "Collected by: " + l.rider,
  ].join("\n");
}

export function ReceiptDialog({ onClose }: { onClose: () => void }) {
  const shop = useAppStore((s) => s.data.shop);
  const l = useAppStore((s) => s.lastTx);
  if (!l) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText(shop, l));
      toast("Receipt copied");
    } catch {}
  };
  return (
    <ModalFrame title="Digital receipt" onClose={onClose}>
      <div className="flex flex-col items-center gap-0.5 border-b border-dashed border-line-input pb-3 text-center">
        <span className="text-base font-bold text-ink">{shop.name}</span>
        <span className="text-meta text-muted-ink">
          {shop.address} · {shop.phone}
        </span>
        <span className="mt-1.5 text-meta font-semibold tracking-[.08em] text-body">PAYMENT RECEIPT</span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <span className="text-muted-ink">Customer</span>
        <span className="text-right text-ink">{l.cust}</span>
        <span className="text-muted-ink">Date &amp; time</span>
        <span className="text-right text-ink">
          {fd(l.date)} · {l.time}
        </span>
        <span className="text-muted-ink">Collected by</span>
        <span className="text-right text-ink">{l.rider}</span>
      </div>
      <div className="flex flex-col border-y border-dashed border-line-input py-2">
        {l.lines.map((x) => (
          <div key={x.txn} className="flex justify-between gap-3 py-1.5 text-sm">
            <span className="flex flex-col">
              <span className="text-ink">{x.item}</span>
              <span className="font-mono text-meta text-muted-ink">{x.txn}</span>
            </span>
            <span className="font-semibold whitespace-nowrap text-ink">{fmt(x.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-base">
        <span className="font-semibold text-ink">Total paid</span>
        <span className="font-bold text-ink">{fmt(l.total)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="h-12 rounded-[10px] border border-line-input bg-white text-sm font-semibold text-ink hover:bg-hover">
          Copy receipt
        </button>
        <button onClick={onClose} className="h-12 rounded-[10px] border-0 bg-brand text-sm font-semibold text-white hover:bg-brand-hover">
          Done
        </button>
      </div>
    </ModalFrame>
  );
}
