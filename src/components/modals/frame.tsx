"use client";
import { Dialog } from "radix-ui";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Centered dialog matching the prototype: 16px radius, 20px padding, scrolls inside the overlay. */
export function ModalFrame({ title, width = 540, onClose, children }: { title: string; width?: number; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 flex items-start justify-center overflow-auto bg-[rgba(24,24,27,0.275)] px-3 py-[clamp(12px,6vh,64px)] data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <Dialog.Content
            aria-describedby={undefined}
            className="flex w-full flex-col rounded-2xl bg-white shadow-[0_20px_50px_rgba(24,24,27,0.138)] outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-[.98]"
            style={{ maxWidth: width }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line-card px-5 py-4">
              <Dialog.Title className="m-0 text-[17px] font-semibold text-ink">{title}</Dialog.Title>
              <Dialog.Close aria-label="Close" className="size-9 rounded-lg border-0 bg-app text-base text-body hover:bg-[#E4E4E7]">
                ✕
              </Dialog.Close>
            </div>
            <div className="flex flex-col gap-4 p-5">{children}</div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const fieldCls = "h-10 w-full rounded-lg border border-line-input bg-white px-3 text-sm text-ink";

export function Field({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return <label className={cn("flex flex-col gap-1.5 text-13 font-medium text-body", className)}>{label}{children}</label>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.type === "date" && "px-2.5", props.className)} />;
}

export function SelectInput({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(fieldCls, "px-2", props.className)}>
      {children}
    </select>
  );
}

export function FormError({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-13 text-danger">
      {error}
    </div>
  );
}

export function FormActions({ onCancel, submitLabel, onSubmit }: { onCancel: () => void; submitLabel: string; onSubmit?: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-line-input bg-white px-4 text-sm font-medium text-ink hover:bg-hover">
        Cancel
      </button>
      <button type={onSubmit ? "button" : "submit"} onClick={onSubmit} className="h-10 rounded-lg border-0 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover">
        {submitLabel}
      </button>
    </div>
  );
}

/** Numeric-only text input helper. */
export const digits = (v: string) => v.replace(/[^\d]/g, "");

/** Money input helper: digits with an optional decimal point and at most 2 decimals (paise). */
export const decimal = (v: string) =>
  v
    .replace(/[^\d.]/g, "")
    .replace(/^(\d*\.\d*)\./, "$1")
    .replace(/^(\d*\.\d{2}).*$/, "$1");
