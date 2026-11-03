"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Rider } from "@/lib/types";
import { api } from "@/services/api";
import type { RiderForm } from "@/store/app-store";
import { Field, FormActions, FormError, ModalFrame, TextInput } from "./frame";

export function RiderDialog({ rider, onClose }: { rider: Rider | null; onClose: () => void }) {
  const [f, setF] = useState<RiderForm>(
    rider
      ? { id: rider.id, name: rider.name, phone: rider.phone, area: rider.area, username: rider.username, password: "", active: rider.active }
      : { id: "", name: "", phone: "", area: "", username: "", password: "", active: true },
  );
  const [err, setErr] = useState("");
  const set = <K extends keyof RiderForm>(k: K, v: RiderForm[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.riders.save(f);
    if (!res.ok) return setErr(res.error);
    onClose();
    toast(f.id ? "Rider updated" : "Rider account created");
  };

  return (
    <ModalFrame title={f.id ? "Edit rider" : "Add rider"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          <Field label="Full name">
            <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Phone">
            <TextInput inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Assigned area">
            <TextInput value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Maharagama, Nugegoda" />
          </Field>
          <Field label="Username">
            <TextInput value={f.username} onChange={(e) => set("username", e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
              placeholder="Leave blank to keep (edit)"
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={f.active} onChange={() => set("active", !f.active)} className="size-[18px] accent-brand" />
          Active — rider can sign in and collect
        </label>
        <FormError error={err} />
        <FormActions onCancel={onClose} submitLabel="Save rider" />
      </form>
    </ModalFrame>
  );
}
