"use client";
import { useState } from "react";
import { RiderVisitList } from "@/components/rider/customer-row";
import { PillSearch, SegmentedChips } from "@/components/ui-collecto/primitives";
import { RANK } from "@/lib/calc";
import { useRider } from "@/hooks/use-rider";

type F = "all" | "OVERDUE" | "DUE" | "PAID";
const FILTERS: [F, string][] = [
  ["all", "All"],
  ["OVERDUE", "Overdue"],
  ["DUE", "Due today"],
  ["PAID", "Paid"],
];

export default function RiderCustomersPage() {
  const r = useRider();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<F>("all");
  if (!r) return null;

  const rq = q.trim().toLowerCase();
  const rqd = rq.replace(/\D/g, "") || "#";
  const list = r.mine
    .filter(
      (c) =>
        (!rq || c.name.toLowerCase().includes(rq) || c.address.toLowerCase().includes(rq) || c.phone.replace(/\D/g, "").includes(rqd)) &&
        (st === "all" || c.status === st),
    )
    .sort((a, b) => RANK[a.status] - RANK[b.status]);

  return (
    <>
      <div className="[&_.pill-search]:!h-12 [&_.pill-search]:!text-base">
        <PillSearch value={q} onChange={setQ} placeholder="Name, address or phone" label="Search customers" />
      </div>
      <SegmentedChips options={FILTERS} value={st} onChange={setSt} />
      <RiderVisitList key={`${st}|${q}`} customers={list} />
      {!list.length && <div className="p-5 text-center text-sm text-muted-ink">No customers found.</div>}
    </>
  );
}
