"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { Btn, Card, CardHead, DataTable, EmptyState, PageHeader, TargetTrack, Td, Th } from "@/components/ui-collecto/primitives";
import { TODAY, fd, fmt, pd } from "@/lib/calc";
import { custName, dashboard, itemLabel, riderName } from "@/lib/selectors";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function DashboardPage() {
  const router = useRouter();
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const v = dashboard(data, D);
  const { rows: overdue, pager } = usePager(v.overdue);
  const todayLabel = pd(TODAY).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={todayLabel}
        actions={
          <>
            <Btn onClick={() => open({ type: "item" })}>Add item</Btn>
            <Btn variant="primary" onClick={() => open({ type: "customer" })}>
              Add customer
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        {v.kpis.map((k) => (
          <div key={k.label} className="card flex flex-col gap-2 p-5">
            <span className="text-13 font-medium text-muted-ink">{k.label}</span>
            <span className="num text-[28px] leading-[1.1] font-semibold tracking-[-.02em]" style={{ color: k.color }}>
              {k.value}
            </span>
            <span className="text-13 text-muted-ink">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap gap-x-6 gap-y-2 px-5 py-3.5">
        {v.strip.map((x) => (
          <div key={x.label} className="flex items-baseline gap-2">
            <span className="num text-lg font-semibold text-ink">{x.value}</span>
            <span className="text-13 text-muted-ink">{x.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Card>
          <CardHead title="Recent collections" action={<Link href="/collections" className="text-13 font-medium">View all</Link>} />
          {v.recent.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-line-row px-5 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <button onClick={() => router.push(`/customers/${p.customerId}`)} className="border-0 bg-transparent p-0 text-left text-sm font-semibold text-ink">
                  {custName(D, p.customerId)}
                </button>
                <span className="text-meta text-muted-ink">
                  {itemLabel(D, p.itemId)} · {riderName(D, p.riderId)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="num text-sm font-semibold text-ink">{fmt(p.amount)}</span>
                <span className="text-meta whitespace-nowrap text-muted-ink">
                  {fd(p.date)} · {p.time}
                </span>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <CardHead title="Rider performance · today" action={<Link href="/riders" className="text-13 font-medium">Riders</Link>} />
          {v.riderPerf.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 border-b border-line-row px-5 py-3.5">
              <div className="flex flex-wrap justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{r.name}</span>
                <span className="num text-13 text-body">
                  {fmt(r.collected)} <span className="text-muted-ink">of {fmt(r.expected)}</span>
                </span>
              </div>
              <TargetTrack pct={r.pct} />
              <Link
                href="/riders"
                className="flex h-[34px] items-center gap-2 rounded-[9px] border border-line bg-subtle pr-2.5 pl-3 text-meta text-nav-ink hover:bg-hover hover:text-nav-ink hover:no-underline"
              >
                <span className="min-w-0 flex-1 truncate">
                  {r.pct}% collected · {r.expected - r.collected > 0 ? `${fmt(r.expected - r.collected)} still to collect` : "Target reached"}
                </span>
                <Icon name="ic-chev" size={15} className="text-faint" />
              </Link>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
        <Card className="min-[680px]:col-span-2">
          <CardHead title="Overdue customers" />
          {v.overdue.length ? (
            <>
              <DataTable
                head={
                  <>
                    <Th first>Customer</Th>
                    <Th>Rider</Th>
                    <Th right>Missed</Th>
                    <Th right last>
                      Overdue
                    </Th>
                  </>
                }
              >
                {overdue.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/customers/${c.id}`)} className="cursor-pointer">
                    <Td first>
                      <div className="font-semibold text-ink">{c.name}</div>
                      <div className="text-meta text-muted-ink">
                        {c.city} · {c.phone}
                      </div>
                    </Td>
                    <Td>{c.riderName}</Td>
                    <Td right>{c.missed}</Td>
                    <Td right last className="num font-semibold !text-danger">
                      {fmt(c.overdue)}
                    </Td>
                  </tr>
                ))}
              </DataTable>
              <Pager {...pager} />
            </>
          ) : (
            <EmptyState>No overdue customers. Everyone is up to date.</EmptyState>
          )}
        </Card>

        <div className="card flex flex-col gap-2.5 p-5">
          <h2 className="m-0 mb-1 text-base font-semibold text-ink">Quick actions</h2>
          {(
            [
              ["Register customer", () => open({ type: "customer" })],
              ["Add item / installment", () => open({ type: "item" })],
              ["Add rider", () => open({ type: "rider", rider: null })],
              ["Today's collection report", () => router.push("/reports")],
            ] as const
          ).map(([l, fn]) => (
            <button key={l} onClick={fn} className="h-11 rounded-lg border border-line-input bg-white px-3.5 text-left text-sm font-medium text-ink hover:bg-hover">
              {l}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
