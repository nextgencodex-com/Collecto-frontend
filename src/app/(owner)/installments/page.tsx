"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { DataTable, PageHeader, SegmentedChips, StatusChip, Td, Th } from "@/components/ui-collecto/primitives";
import { RANK, fd, fmt } from "@/lib/calc";
import { custName } from "@/lib/selectors";
import { STATUS_FILTERS } from "@/lib/status";
import type { Status } from "@/lib/types";
import { useDerived } from "@/store/app-store";

export default function InstallmentsPage() {
  const router = useRouter();
  const { D } = useDerived();
  const [st, setSt] = useState<Status | "all">("all");
  const list = D.items.filter((i) => st === "all" || i.status === st).sort((a, b) => RANK[a.status] - RANK[b.status]);
  const { rows, pager } = usePager(list);
  const counts = Object.fromEntries(STATUS_FILTERS.map(([k]) => [k, k === "all" ? D.items.length : D.items.filter((i) => i.status === k).length]));

  return (
    <>
      <PageHeader title="Installments" subtitle="Every installment item with its schedule status" />
      <SegmentedChips options={STATUS_FILTERS} value={st} onChange={setSt} counts={counts} />
      <div className="card overflow-hidden">
        <DataTable
          minWidth={900}
          head={
            <>
              <Th>Customer</Th>
              <Th>Item</Th>
              <Th>Plan</Th>
              <Th right>Price</Th>
              <Th right>Paid</Th>
              <Th right>Balance</Th>
              <Th>Next due</Th>
              <Th>Status</Th>
            </>
          }
        >
          {rows.map((it) => (
            <tr key={it.id} onClick={() => router.push(`/customers/${it.customerId}`)} className="cursor-pointer">
              <Td className="font-semibold whitespace-nowrap !text-ink">{custName(D, it.customerId)}</Td>
              <Td className="whitespace-nowrap">
                <span className="font-mono text-meta text-muted-ink">{it.code}</span> {it.name}
              </Td>
              <Td className="min-w-[150px] !text-13">
                {fmt(it.amount)} {it.freq} · {it.n} payments
              </Td>
              <Td right className="whitespace-nowrap">{fmt(it.price)}</Td>
              <Td right className="whitespace-nowrap">{fmt(it.paid)}</Td>
              <Td right className="font-semibold whitespace-nowrap !text-ink">{fmt(it.balance)}</Td>
              <Td className="whitespace-nowrap">{it.next ? fd(it.next) : "Completed"}</Td>
              <Td>
                <StatusChip status={it.status} />
              </Td>
            </tr>
          ))}
        </DataTable>
        <Pager {...pager} />
        {!list.length && <div className="p-5 text-sm text-muted-ink">No items with this status.</div>}
      </div>
    </>
  );
}
