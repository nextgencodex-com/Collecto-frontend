"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ExtensionNote } from "@/components/ui-collecto/extension-note";
import { ItemCard } from "@/components/ui-collecto/item-card";
import { Avatar, Btn, StatusChip } from "@/components/ui-collecto/primitives";
import { fd, fmt, proj } from "@/lib/calc";
import { itemLabel, riderName } from "@/lib/selectors";
import { api } from "@/services/api";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const c = D.cmap[id];

  if (!c)
    return (
      <>
        <Link href="/customers" className="self-start text-sm font-medium">
          ← All customers
        </Link>
        <div className="rounded-xl border border-dashed border-line-input bg-white p-8 text-center text-sm text-muted-ink">Customer not found.</div>
      </>
    );

  const b = { lat0: c.lat - 0.012, lat1: c.lat + 0.012, lng0: c.lng - 0.02, lng1: c.lng + 0.02 };
  const pin = proj(c.lat, c.lng, b);
  const pays = D.pays.filter((p) => p.customerId === c.id).slice().reverse();
  const hist = c.its.slice().sort((a, b) => b.start.localeCompare(a.start));
  const stats: [string, number][] = [
    ["Total purchased", c.total],
    ["Paid", c.paid],
    ["Balance", c.balance],
    ["Due now", c.dueNow],
  ];

  const assign = async (rid: string) => {
    const res = await api.customers.assignRider(c.id, rid);
    toast(res.ok ? `Customer reassigned to ${D.rmap[rid].name}` : res.error);
  };

  const info = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-meta text-muted-ink">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );

  return (
    <>
      <Link href="/customers" className="self-start text-sm font-medium">
        ← All customers
      </Link>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-4">
        <div className="card flex min-w-0 flex-col gap-5 p-5 min-[760px]:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar id={c.id} name={c.name} photo={c.photo} size={72} className="!text-2xl" />
            <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
              <h1 className="m-0 text-[22px] font-semibold text-ink">{c.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={c.status} />
                <span className="text-13 text-muted-ink">
                  Customer {c.id} · since {fd(c.since)}
                </span>
              </div>
            </div>
            <Btn variant="primary" onClick={() => open({ type: "item", customerId: c.id, lockCustomer: true })}>
              Add item
            </Btn>
          </div>
          <ExtensionNote customerId={c.id} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-6 gap-y-4">
            {info("NIC", c.nic)}
            {info("Phone", <a href={`tel:${c.phone.replace(/\D/g, "")}`}>{c.phone}</a>)}
            {info("Address", c.address)}
            {info("City / area", c.city)}
            <label className="flex flex-col gap-1 text-meta text-muted-ink">
              Assigned rider
              <select value={c.riderId} onChange={(e) => assign(e.target.value)} className="h-9 rounded-lg border border-line-input bg-white px-2 text-sm text-ink">
                {data.riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-0.5">
              <span className="text-meta text-muted-ink">Notes</span>
              <span className="text-sm text-body">{c.notes || "—"}</span>
            </div>
          </div>
        </div>

        <div className="card flex min-h-[260px] flex-col overflow-hidden">
          <div className="map-img relative min-h-[220px] flex-1 overflow-hidden" style={{ backgroundPosition: "center 82%" }}>
            <div className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
              <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white">{c.name}</span>
              <span className="h-2.5 w-0.5 bg-ink" />
              <span className="-mt-0.5 size-2.5 rounded-full border-2 border-white bg-ink" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line-card px-4 py-3">
            <span className="text-13 text-muted-ink">Map location</span>
            <a href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-13 font-medium">
              <span className="gpin size-4" />
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
        {stats.map(([label, v]) => (
          <div key={label} className="card flex flex-col gap-1 px-5 py-4">
            <span className="text-13 font-medium text-muted-ink">{label}</span>
            <span className="num text-[22px] font-semibold text-ink">{fmt(v)}</span>
          </div>
        ))}
      </div>

      <h2 className="m-0 mt-2 text-[17px] font-semibold text-ink">Active items</h2>
      {!c.act.length && (
        <div className="rounded-xl border border-dashed border-line-input bg-white p-6 text-sm text-muted-ink">No active installment items. Use “Add item” to start a plan.</div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] items-start gap-4">
        {c.act.map((it) => (
          <ItemCard key={it.id} it={it} riderName={riderName(D, it.riderId)} open={openItem === it.id} onToggle={() => setOpenItem((o) => (o === it.id ? null : it.id))} />
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-4">
        <div className="card min-w-0">
          <div className="border-b border-line-card px-5 py-4">
            <h2 className="m-0 text-base font-semibold text-ink">Payment history</h2>
          </div>
          <div className="max-h-[420px] overflow-auto">
            {pays.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-line-row px-5 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{itemLabel(D, p.itemId)}</span>
                  <span className="text-meta text-muted-ink">
                    <span className="font-mono">{p.txn}</span> · {fd(p.date)} {p.time} · {riderName(D, p.riderId)}
                  </span>
                </div>
                <span className="text-sm font-semibold whitespace-nowrap text-ink">{fmt(p.amount)}</span>
              </div>
            ))}
            {!pays.length && <div className="p-5 text-sm text-muted-ink">No payments recorded yet.</div>}
          </div>
        </div>
        <div className="card min-w-0">
          <div className="border-b border-line-card px-5 py-4">
            <h2 className="m-0 text-base font-semibold text-ink">Purchase history</h2>
          </div>
          {hist.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-3 border-b border-line-row px-5 py-3">
              <div className="flex min-w-40 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  {it.code} · {it.name}
                </span>
                <span className="text-meta text-muted-ink">
                  {fd(it.start)} → {fd(it.last)} · {fmt(it.price)}
                </span>
              </div>
              <StatusChip status={it.status} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
