"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Freq } from "@/lib/types";
import { api } from "@/services/api";
import type { ProductForm } from "@/store/app-store";
import { Field, FormActions, FormError, ModalFrame, SelectInput, TextInput, decimal, digits } from "./frame";

export function ProductDialog({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState<ProductForm>({ code: "", pname: "", purchase: "", cash: "", price: "", freq: "weekly", amount: "", period: "", stock: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof ProductForm, v: string) => setF((x) => ({ ...x, [k]: v }));
  // money fields accept paise; stock and period are whole numbers
  const num = (k: keyof ProductForm, label: string, money = true) => (
    <Field label={label}>
      <TextInput inputMode={money ? "decimal" : "numeric"} value={f[k]} onChange={(e) => set(k, (money ? decimal : digits)(e.target.value))} />
    </Field>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.products.create(f);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast("Product added");
  };

  return (
    <ModalFrame title="Add product" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          <Field label="Item code">
            <TextInput value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="e.g. KT-110" />
          </Field>
          <Field label="Item name">
            <TextInput value={f.pname} onChange={(e) => set("pname", e.target.value)} />
          </Field>
          {num("purchase", "Purchase price")}
          {num("cash", "Cash selling price")}
          {num("price", "Installment price")}
          {num("stock", "Opening stock", false)}
          <Field label="Default frequency">
            <SelectInput value={f.freq} onChange={(e) => set("freq", e.target.value as Freq)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </SelectInput>
          </Field>
          {num("period", "Period (months)", false)}
          {num("amount", "Amount per payment")}
        </div>
        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Add product" />
      </form>
    </ModalFrame>
  );
}

export function StockDialog({ code, pname, onClose }: { code: string; pname: string; onClose: () => void }) {
  const [qty, setQty] = useState("1");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.products.addStock(code, qty);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast(`${res.value} unit(s) added to ${pname}`);
  };
  return (
    <ModalFrame title="Add stock" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="text-sm text-body">
          {code} · {pname}
        </div>
        <Field label="Units received">
          <TextInput inputMode="numeric" value={qty} onChange={(e) => setQty(digits(e.target.value))} autoFocus />
        </Field>
        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Add stock" />
      </form>
    </ModalFrame>
  );
}
