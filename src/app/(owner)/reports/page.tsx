"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { Btn, SegmentedChips } from "@/components/ui-collecto/primitives";
import { TODAY } from "@/lib/calc";
import { REPORTS, type ReportKey, buildReport, reportToCsv } from "@/lib/selectors";
import { useDerived } from "@/store/app-store";

export default function ReportsPage() {
  const { data, D } = useDerived();
  const [rep, setRep] = useState<ReportKey>("daily");
  const [date, setDate] = useState(TODAY);
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const r = buildReport(data, D, rep, date, month);
  const { rows, pager } = usePager(r.rows);

  const exportCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([reportToCsv(r)], { type: "text/csv" }));
    a.download = `collecto-${rep}-report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Report exported as CSV");
  };

  const input = "h-10 rounded-lg border border-line-input bg-white px-2.5 text-sm text-ink";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-[-.025em] text-ink">Reports</h1>
          <div className="mt-1 text-sm text-muted-ink">{r.title}</div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {(rep === "daily" || rep === "rider") && (
            <input type="date" aria-label="Report date" value={date} onChange={(e) => setDate(e.target.value || TODAY)} className={input} />
          )}
          {rep === "monthly" && (
            <input type="month" aria-label="Report month" value={month} onChange={(e) => setMonth(e.target.value || TODAY.slice(0, 7))} className={input} />
          )}
          <Btn variant="primary" onClick={exportCsv}>
            Export CSV
          </Btn>
        </div>
      </div>

      <SegmentedChips options={REPORTS} value={rep} onChange={setRep} />

      {r.summary.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
          {r.summary.map((k) => (
            <div key={k.label} className="card flex flex-col gap-1 px-5 py-4">
              <span className="text-13 font-medium text-muted-ink">{k.label}</span>
              <span className="num text-[22px] font-semibold text-ink">{k.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-rows w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                {r.cols.map((c) => (
                  <th key={c.v} className={`bg-subtle px-4 py-2.5 text-meta font-semibold whitespace-nowrap text-muted-ink ${c.right ? "text-right" : "text-left"}`}>
                    {c.v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} className={`num border-t border-line-row px-4 py-[11px] text-sm whitespace-nowrap text-body ${c.right ? "text-right" : "text-left"}`}>
                      {c.v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
        {!r.rows.length && <div className="p-5 text-sm text-muted-ink">No records for this period.</div>}
      </div>
    </>
  );
}
