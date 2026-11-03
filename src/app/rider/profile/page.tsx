"use client";
import Link from "next/link";
import { Avatar } from "@/components/ui-collecto/primitives";
import { TODAY, fmt, sum } from "@/lib/calc";
import { useAppStore } from "@/store/app-store";
import { useRider } from "@/hooks/use-rider";

export default function RiderProfilePage() {
  const r = useRider();
  const logout = useAppStore((s) => s.logout);
  if (!r) return null;
  const { me, mine, D } = r;
  const month = sum(D.pays.filter((p) => p.riderId === me.id && p.date.startsWith(TODAY.slice(0, 7))).map((p) => p.amount));
  const info: [string, string][] = [
    ["Phone", me.phone],
    ["Username", me.username],
    ["Assigned area", me.area],
  ];
  const stats: [string, string][] = [
    ["Assigned customers", String(mine.length)],
    ["Collected this month", fmt(month)],
  ];
  // `inRow` headings sit beside an action button and may wrap; flex-basis only applies there
  const head = (title: string, sub: string, inRow = false) => (
    <div className={`flex min-w-0 flex-col gap-0.5 ${inRow ? "flex-[1_1_200px]" : ""}`}>
      <h2 className="m-0 text-[15px] font-semibold tracking-normal text-ink">{title}</h2>
      <span className="text-13 text-muted-ink">{sub}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-9 px-1 pt-2">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} photo={me.photo} size={64} bg="#18181B" className="!text-[22px]" />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-xl font-bold tracking-[-.01em] text-ink">{me.name}</span>
          <span className="text-13 text-muted-ink">Rider / Collector</span>
        </div>
      </div>

      <section className="flex flex-col gap-[18px]">
        {head("Account details", "Ask the shop owner to change these.")}
        {info.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <span className="text-13 font-medium text-body">{label}</span>
            <div className="min-h-11 rounded-[10px] bg-app px-3.5 py-3 text-[14.5px] text-ink">{value}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3.5">
        {head("Overview", "Your customers and collections this month.")}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 rounded-[10px] bg-app p-3.5">
              <span className="text-meta text-muted-ink">{label}</span>
              <span className="num text-[19px] font-bold text-ink">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {head("Daily closing", "Submit today's collected cash to the shop.", true)}
          <Link href="/rider/closing" className="grid h-[38px] place-items-center rounded-lg px-3.5 text-sm font-semibold text-brand hover:bg-brand-soft hover:no-underline">
            Open
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {head("Sign out", "Log out of COLLECTO on this device.", true)}
          <button onClick={logout} className="h-[38px] rounded-lg border-0 bg-danger-soft px-3.5 text-sm font-semibold text-danger hover:bg-[#FFE0E5]">
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
