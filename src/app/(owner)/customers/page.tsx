"use client";
import Link from "next/link";
import { useState } from "react";
import { Avatar, Btn, NativeSelect, PageHeader, PillSearch, SegmentedChips, StatusChip } from "@/components/ui-collecto/primitives";
import { fmt } from "@/lib/calc";
import { matchCustomer } from "@/lib/selectors";
import { STATUS_FILTERS } from "@/lib/status";
import type { Status } from "@/lib/types";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function CustomersPage() {
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<Status | "all">("all");
  const [rider, setRider] = useState("all");

  const list = D.custs.filter((c) => matchCustomer(c, q) && (st === "all" || c.status === st) && (rider === "all" || c.riderId === rider));
  const counts = Object.fromEntries(STATUS_FILTERS.map(([k]) => [k, k === "all" ? D.custs.length : D.custs.filter((c) => c.status === k).length]));

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${list.length} of ${D.custs.length} customers`}
        actions={
          <Btn variant="primary" onClick={() => open({ type: "customer" })}>
            Add customer
          </Btn>
        }
      />

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-0 flex-[1_1_280px]">
            <PillSearch value={q} onChange={setQ} placeholder="Search by name, NIC or phone number" label="Search customers" />
          </div>
          <NativeSelect value={rider} onChange={(e) => setRider(e.target.value)} className="flex-[0_1_220px]" aria-label="Filter by rider">
            <option value="all">All riders</option>
            {data.riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <SegmentedChips options={STATUS_FILTERS} value={st} onChange={setSt} counts={counts} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4">
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="card flex flex-col gap-3.5 p-4 text-left transition-[box-shadow,border-color] hover:border-[#D4D4D8] hover:no-underline hover:shadow-[0_4px_14px_rgba(24,24,27,.06)]"
          >
            <div className="flex w-full items-center gap-3">
              <Avatar id={c.id} name={c.name} photo={c.photo} size={44} className="!text-[15px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="text-13 text-muted-ink">
                  {c.city} · {c.phone}
                </span>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-2">
              <StatusChip status={c.status} />
              <span className="text-meta text-muted-ink">{c.riderName}</span>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 border-t border-dashed border-line-card pt-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-meta text-muted-ink">Due now</span>
                <span className="num text-base font-semibold text-ink">{fmt(c.dueNow)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-meta text-muted-ink">Balance</span>
                <span className="num text-base font-semibold text-ink">{fmt(c.balance)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!list.length && (
        <div className="rounded-xl border border-dashed border-line-input bg-white p-8 text-center text-sm text-muted-ink">No customers match these filters.</div>
      )}
    </>
  );
}
