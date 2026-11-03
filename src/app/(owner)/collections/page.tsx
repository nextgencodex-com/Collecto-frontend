"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { CardHead, PillSearch } from "@/components/ui-collecto/primitives";
import { TODAY, expectedOn, fd, fmt, pct, signed, sum } from "@/lib/calc";
import { custName, itemLabel, riderName } from "@/lib/selectors";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

const th = "bg-subtle py-2.5 text-meta font-semibold whitespace-nowrap text-muted-ink";
const td = "border-t border-line-row py-3 text-sm text-body";

export default function CollectionsPage() {
  const router = useRouter();
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const [date, setDate] = useState(TODAY);
  const [rider, setRider] = useState("all");
  const [st, setSt] = useState("all");
  const [q, setQ] = useState("");

  const fq = q.trim().toLowerCase();
  const ps = D.pays
    .filter(
      (p) =>
        (!date || p.date === date) &&
        (rider === "all" || p.riderId === rider) &&
        (st === "all" || p.status === st) &&
        (!fq || p.txn.toLowerCase().includes(fq) || custName(D, p.customerId).toLowerCase().includes(fq)),
    )
    .slice()
    .reverse();
  const { rows, pager } = usePager(ps);

  const recon = data.riders.map((r) => {
    const e = date ? sum(D.items.filter((i) => i.riderId === r.id).map((i) => expectedOn(i, date, D.pays))) : 0;
    const c = sum(D.pays.filter((p) => p.riderId === r.id && p.date === date).map((p) => p.amount));
    return { id: r.id, name: r.name, e, c };
  });
  const closings = data.closings.filter((x) => !date || x.date === date).slice().reverse();
  const { rows: closingRows, pager: closingPager } = usePager(closings);

  const label = "flex flex-col gap-1.5 text-meta font-medium text-muted-ink";
  const ctl = "h-10 rounded-lg border border-line-input bg-white px-2 text-sm text-ink";

  return (
    <>
      <div>
        <h1 className="m-0 text-2xl font-bold tracking-[-.025em] text-ink">Collections</h1>
        <div className="mt-1 text-sm text-muted-ink">Payment transactions and expected vs collected</div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className={label}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${ctl} px-2.5`} />
        </label>
        <div className="flex gap-1.5">
          <button onClick={() => setDate(TODAY)} className="h-10 rounded-lg border border-line-input bg-white px-3 text-13 font-medium text-ink hover:bg-hover">
            Today
          </button>
          <button onClick={() => setDate("")} className="h-10 rounded-lg border border-line-input bg-white px-3 text-13 font-medium text-ink hover:bg-hover">
            All dates
          </button>
        </div>
        <label className={label}>
          Rider
          <select value={rider} onChange={(e) => setRider(e.target.value)} className={ctl}>
            <option value="all">All riders</option>
            {data.riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Status
          <select value={st} onChange={(e) => setSt(e.target.value)} className={ctl}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="corrected">Corrected</option>
          </select>
        </label>
        <div className={`${label} flex-[1_1_200px]`}>
          Customer or transaction
          <PillSearch value={q} onChange={setQ} placeholder="Customer name or TXN ID" label="Search collections" size="md" />
        </div>
      </div>

      {date && (
        <div className="card overflow-x-auto">
          <div className="flex flex-wrap justify-between gap-3 border-b border-line-card px-5 py-4">
            <h2 className="m-0 text-base font-semibold text-ink">Expected vs collected · {fd(date)}</h2>
            <span className="text-sm text-body">
              {fmt(sum(recon.map((r) => r.c)))} of {fmt(sum(recon.map((r) => r.e)))}
            </span>
          </div>
          <table className="table-rows w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className={`${th} px-5 text-left`}>Rider</th>
                <th className={`${th} px-4 text-right`}>Expected</th>
                <th className={`${th} px-4 text-right`}>Collected</th>
                <th className={`${th} px-4 text-right`}>Difference</th>
                <th className={`${th} px-5 text-right`}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {recon.map((r) => (
                <tr key={r.id}>
                  <td className={`${td} px-5 font-semibold !text-ink`}>{r.name}</td>
                  <td className={`${td} px-4 text-right`}>{fmt(r.e)}</td>
                  <td className={`${td} px-4 text-right`}>{fmt(r.c)}</td>
                  <td className={`${td} px-4 text-right font-semibold`} style={{ color: r.c - r.e < 0 ? "#C81E3A" : "#15803D" }}>
                    {signed(r.c - r.e)}
                  </td>
                  <td className={`${td} px-5 text-right`}>{pct(r.c, r.e)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap justify-between gap-3 border-b border-line-card px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-ink">Transactions</h2>
          <span className="text-13 text-muted-ink">
            {ps.length} payments · {fmt(sum(ps.map((p) => p.amount)))}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-rows w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <th className={`${th} px-5 text-left`}>Transaction ID</th>
                <th className={`${th} px-4 text-left`}>Date &amp; time</th>
                <th className={`${th} px-4 text-left`}>Customer</th>
                <th className={`${th} px-4 text-left`}>Item</th>
                <th className={`${th} px-4 text-left`}>Rider</th>
                <th className={`${th} px-4 text-right`}>Amount</th>
                <th className={`${th} px-4 text-left`}>Status</th>
                <th className={`${th} px-5`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const cor = p.status === "corrected";
                return (
                  <tr key={p.id}>
                    <td className={`${td} px-5 font-mono !text-13 whitespace-nowrap !text-ink`}>{p.txn}</td>
                    <td className={`${td} px-4 whitespace-nowrap`}>
                      {fd(p.date)} · {p.time}
                    </td>
                    <td className={`${td} px-4 whitespace-nowrap`}>
                      <button onClick={() => router.push(`/customers/${p.customerId}`)} className="border-0 bg-transparent p-0 text-sm font-semibold text-ink hover:text-brand">
                        {custName(D, p.customerId)}
                      </button>
                    </td>
                    <td className={`${td} px-4 whitespace-nowrap`}>{itemLabel(D, p.itemId)}</td>
                    <td className={`${td} px-4 whitespace-nowrap`}>{riderName(D, p.riderId)}</td>
                    <td className={`${td} px-4 text-right font-semibold whitespace-nowrap !text-ink`}>{fmt(p.amount)}</td>
                    <td className={`${td} px-4`}>
                      <span
                        className="inline-flex h-6 items-center gap-1.5 rounded-md pr-[9px] pl-2 text-xs font-medium whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(24,24,27,.05)]"
                        style={cor ? { background: "#FEF5DC", color: "#A16207" } : { background: "#EAF7EE", color: "#15803D" }}
                      >
                        <span className="size-[7px] flex-none rounded-full bg-current" />
                        {cor ? "Corrected" : "Completed"}
                      </span>
                    </td>
                    <td className={`${td} px-5 !py-2 text-right`}>
                      <button
                        onClick={() => open({ type: "correct", payId: p.id })}
                        className="h-[30px] rounded-md border border-line-input bg-white px-2.5 text-meta font-medium text-ink hover:bg-hover"
                      >
                        Correct
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
        {!ps.length && <div className="p-5 text-sm text-muted-ink">No payments match these filters.</div>}
      </div>

      <div className="card overflow-hidden">
        <CardHead title="Rider daily closings" />
        <div className="overflow-x-auto">
          <table className="table-rows w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className={`${th} px-5 text-left`}>Rider</th>
                <th className={`${th} px-4 text-left`}>Submitted</th>
                <th className={`${th} px-4 text-right`}>Expected</th>
                <th className={`${th} px-4 text-right`}>Collected</th>
                <th className={`${th} px-4 text-right`}>Cash submitted</th>
                <th className={`${th} px-4 text-right`}>Difference</th>
                <th className={`${th} px-5 text-left`}>Note</th>
              </tr>
            </thead>
            <tbody>
              {closingRows.map((x) => (
                <tr key={x.id}>
                  <td className={`${td} px-5 font-semibold !text-ink`}>{riderName(D, x.riderId)}</td>
                  <td className={`${td} px-4 whitespace-nowrap`}>
                    {fd(x.date)} · {x.time}
                  </td>
                  <td className={`${td} px-4 text-right`}>{fmt(x.expected)}</td>
                  <td className={`${td} px-4 text-right`}>{fmt(x.collected)}</td>
                  <td className={`${td} px-4 text-right`}>{fmt(x.cash)}</td>
                  <td className={`${td} px-4 text-right font-semibold`} style={{ color: x.cash - x.collected < 0 ? "#C81E3A" : "#15803D" }}>
                    {signed(x.cash - x.collected)}
                  </td>
                  <td className={`${td} px-5 !text-13`}>{x.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager {...closingPager} />
        {!closings.length && <div className="p-5 text-sm text-muted-ink">No closings submitted for this date yet.</div>}
      </div>
    </>
  );
}
