"use client";
import { Avatar, Btn, PageHeader, TargetTrack } from "@/components/ui-collecto/primitives";
import { TODAY, fmt, pct, sum } from "@/lib/calc";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function RidersPage() {
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const tp = D.pays.filter((p) => p.date === TODAY);

  return (
    <>
      <PageHeader
        title="Riders"
        subtitle="Collectors, areas and today's performance"
        actions={
          <Btn variant="primary" onClick={() => open({ type: "rider", rider: null })}>
            Add rider
          </Btn>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
        {data.riders.map((r) => {
          const e = sum(D.items.filter((i) => i.riderId === r.id).map((i) => i.expectedToday));
          const c = sum(tp.filter((p) => p.riderId === r.id).map((p) => p.amount));
          const clo = data.closings.find((x) => x.riderId === r.id && x.date === TODAY);
          const month = sum(D.pays.filter((p) => p.riderId === r.id && p.date.startsWith(TODAY.slice(0, 7))).map((p) => p.amount));
          return (
            <div key={r.id} className="card flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar id={r.id} name={r.name} photo={r.photo} size={44} className="!text-sm" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-semibold text-ink">{r.name}</span>
                  <span className="text-13 text-muted-ink">
                    {r.phone} · @{r.username}
                  </span>
                </div>
                <span
                  className="inline-flex h-6 items-center gap-1.5 rounded-md pr-[9px] pl-2 text-xs font-medium whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(24,24,27,.05)]"
                  style={r.active ? { background: "#EAF7EE", color: "#15803D" } : { background: "#F4F4F5", color: "#52525B" }}
                >
                  <span className="size-[7px] flex-none rounded-full bg-current" />
                  {r.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-13">
                <span className="text-muted-ink">Area</span>
                <span className="text-right text-ink">{r.area}</span>
                <span className="text-muted-ink">Customers</span>
                <span className="text-right text-ink">{D.custs.filter((x) => x.riderId === r.id).length}</span>
                <span className="text-muted-ink">This month</span>
                <span className="text-right text-ink">{fmt(month)}</span>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-dashed border-line-card pt-3">
                <div className="flex justify-between text-13">
                  <span className="text-muted-ink">Today</span>
                  <span className="font-semibold text-ink">
                    {fmt(c)} <span className="font-normal text-muted-ink">of {fmt(e)}</span>
                  </span>
                </div>
                <TargetTrack pct={pct(c, e)} />
                <span className="text-meta text-muted-ink">{clo ? `Closed at ${clo.time} · cash ${fmt(clo.cash)}` : "Not closed yet"}</span>
              </div>
              <button onClick={() => open({ type: "rider", rider: r })} className="h-[38px] rounded-lg border border-line-input bg-white text-sm font-medium text-ink hover:bg-hover">
                Edit rider
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
