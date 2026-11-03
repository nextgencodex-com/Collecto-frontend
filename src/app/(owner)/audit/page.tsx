"use client";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { PageHeader } from "@/components/ui-collecto/primitives";
import { fd } from "@/lib/calc";
import { useAppStore } from "@/store/app-store";

const th = "bg-subtle py-2.5 text-meta font-semibold whitespace-nowrap text-muted-ink";
const td = "border-t border-line-row py-3 text-sm text-body";

export default function AuditPage() {
  const audit = useAppStore((s) => s.data.audit);
  const { rows, pager } = usePager(audit);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Riders cannot delete or edit completed payments. Every authorised correction is recorded here." />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-rows w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <th className={`${th} px-5 text-left`}>When</th>
                <th className={`${th} px-4 text-left`}>User</th>
                <th className={`${th} px-4 text-left`}>Action</th>
                <th className={`${th} px-4 text-left`}>Transaction</th>
                <th className={`${th} px-4 text-right`}>Old value</th>
                <th className={`${th} px-4 text-right`}>New value</th>
                <th className={`${th} px-5 text-left`}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className={`${td} px-5 whitespace-nowrap`}>
                    {fd(a.date)} · {a.time}
                  </td>
                  <td className={`${td} px-4 whitespace-nowrap`}>{a.user}</td>
                  <td className={`${td} px-4 font-medium whitespace-nowrap !text-ink`}>{a.action}</td>
                  <td className={`${td} px-4 !text-13 whitespace-nowrap`}>
                    <span className="font-mono">{a.txn}</span>
                    <div className="text-meta text-muted-ink">{a.ref}</div>
                  </td>
                  <td className={`${td} px-4 text-right whitespace-nowrap !text-danger line-through`}>{a.old}</td>
                  <td className={`${td} px-4 text-right font-semibold whitespace-nowrap !text-success`}>{a.nw}</td>
                  <td className={`${td} min-w-60 px-5 !text-13 whitespace-normal`}>{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
        {!audit.length && <div className="p-5 text-sm text-muted-ink">No corrections recorded.</div>}
      </div>
    </>
  );
}
