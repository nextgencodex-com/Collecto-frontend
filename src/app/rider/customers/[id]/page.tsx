"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExtensionNote } from "@/components/ui-collecto/extension-note";
import { Avatar, StatusChip } from "@/components/ui-collecto/primitives";
import { fd, fmt } from "@/lib/calc";
import { itemLabel } from "@/lib/selectors";
import { useRider } from "@/hooks/use-rider";

export default function RiderCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const r = useRider();
  if (!r) return null;
  const c = r.D.cmap[id];
  if (!c) return <div className="p-5 text-center text-sm text-muted-ink">Customer not found.</div>;
  const pays = r.D.pays.filter((p) => p.customerId === c.id).slice(-5).reverse();
  const stat = (label: string, value: string, color = "#18181B") => (
    <div className="card flex flex-col gap-0.5 px-2.5 py-3">
      <span className="text-meta font-medium text-muted-ink">{label}</span>
      <span className="num text-base font-bold whitespace-nowrap" style={{ color }}>
        {value}
      </span>
    </div>
  );
  const btn = "flex h-[46px] items-center justify-center rounded-[10px] border border-line-input bg-white text-sm font-semibold text-ink hover:text-ink hover:no-underline";

  return (
    <>
      <div className="card flex flex-col gap-3.5 p-4">
        <div className="flex items-center gap-3.5">
          <Avatar id={c.id} name={c.name} photo={c.photo} size={60} className="!text-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-lg font-semibold text-ink">{c.name}</span>
            <span className="self-start">
              <StatusChip status={c.status} />
            </span>
          </div>
        </div>
        <div className="text-sm leading-normal text-body">
          {c.address}, {c.city}
          <br />
          NIC {c.nic}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${c.phone.replace(/\D/g, "")}`} className={btn}>
            Call {c.phone}
          </a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className={btn}>
            Navigate
          </a>
        </div>
      </div>

      <ExtensionNote customerId={c.id} />

      <div className="grid grid-cols-3 gap-2">
        {stat("Due now", fmt(c.dueNow))}
        {stat("Overdue", fmt(c.overdue), "#C81E3A")}
        {stat("Balance", fmt(c.balance))}
      </div>

      <h2 className="m-0 mt-1 text-base font-semibold text-ink">Active items</h2>
      {c.act.map((it) => (
        <div key={it.id} className="card flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-meta text-muted-ink">{it.code}</span>
              <span className="text-base font-semibold text-ink">{it.name}</span>
            </div>
            <StatusChip status={it.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <span className="text-muted-ink">Total price</span>
            <span className="text-right text-ink">{fmt(it.price)}</span>
            <span className="text-muted-ink">Paid</span>
            <span className="text-right text-success">{fmt(it.paid)}</span>
            <span className="text-muted-ink">Balance</span>
            <span className="text-right text-ink">{fmt(it.balance)}</span>
            <span className="text-muted-ink">Frequency</span>
            <span className="text-right text-ink">
              {it.freq === "weekly" ? "Weekly" : "Monthly"} · {fmt(it.amount)}
            </span>
            <span className="text-muted-ink">Next payment</span>
            <span className="text-right text-ink">{it.next ? fd(it.next) : "Completed"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-line-card pt-3">
            <span className="text-sm font-medium text-body">Amount due</span>
            <span className="num text-lg font-bold text-ink">{fmt(it.dueNow)}</span>
          </div>
        </div>
      ))}
      {!c.act.length && (
        <div className="rounded-xl border border-dashed border-line-input bg-white p-5 text-center text-sm text-muted-ink">All items for this customer are fully paid.</div>
      )}
      {c.act.length > 0 && (
        <Link
          href={`/rider/customers/${c.id}/collect`}
          className="sticky bottom-[88px] grid h-[60px] place-items-center rounded-xl bg-brand text-[17px] font-bold tracking-[.01em] text-white shadow-[0_8px_20px_rgba(124,92,250,.28)] hover:bg-brand-hover hover:text-white hover:no-underline"
        >
          COLLECT PAYMENT
        </Link>
      )}

      <h2 className="m-0 mt-1 text-base font-semibold text-ink">Recent payments</h2>
      <div>
        {pays.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-line py-[13px]">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm text-ink">{itemLabel(r.D, p.itemId)}</span>
              <span className="text-meta text-muted-ink">
                {fd(p.date)} · {p.time}
              </span>
            </div>
            <span className="text-sm font-semibold whitespace-nowrap text-ink">{fmt(p.amount)}</span>
          </div>
        ))}
        {!pays.length && <div className="p-3.5 text-sm text-muted-ink">No payments yet.</div>}
      </div>
    </>
  );
}
