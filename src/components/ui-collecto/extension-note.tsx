"use client";
import { Icon } from "@/components/icon";
import { fd } from "@/lib/calc";
import { activeExtension } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";

/** Amber notice shown when a rider has extended this customer's payment. */
export function ExtensionNote({ customerId }: { customerId: string }) {
  const data = useAppStore((s) => s.data);
  const ext = activeExtension(data, customerId);
  if (!ext) return null;
  const rider = data.riders.find((r) => r.id === ext.riderId)?.name ?? "Rider";
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-3.5 py-3 text-13 leading-normal text-warning">
      <Icon name="ic-cal" size={16} className="mt-0.5" />
      <span>
        <strong className="font-semibold">Payment extended to {fd(ext.until)}</strong> · {ext.reason}
        <span className="block text-meta opacity-80">
          by {rider} on {fd(ext.date)} · {ext.time}
        </span>
      </span>
    </div>
  );
}
