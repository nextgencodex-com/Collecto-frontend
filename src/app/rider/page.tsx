"use client";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { RiderVisitList } from "@/components/rider/customer-row";
import { Avatar } from "@/components/ui-collecto/primitives";
import { TODAY, fmt, pd } from "@/lib/calc";
import { greeting, useRider } from "@/hooks/use-rider";

export default function RiderHomePage() {
  const r = useRider();
  if (!r) return null;
  const { me, expected, collected, pending, todays, closing, overdueCount } = r;
  const todayLabel = pd(TODAY).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const kpis = [
    { label: "Expected", value: fmt(expected), color: "#18181B" },
    { label: "Collected", value: fmt(collected), color: "#15803D" },
    { label: "Pending", value: fmt(pending), color: pending > 0 ? "#A16207" : "#18181B" },
  ];

  return (
    <>
      <div className="-mx-4 -mt-4 flex flex-col gap-2.5 rounded-b-[26px] bg-[linear-gradient(180deg,#D6E8FF_0%,#E6F0FF_100%)] px-5 pt-5 pb-[88px] text-[#0B2545]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#1E3A5F]">
            <Icon name="ic-map" size={17} />
            <span className="truncate">{me.area}</span>
          </span>
          <Avatar id={me.id} name={me.name} photo={me.photo} size={38} bg="#1E3A5F" className="border-2 border-white !text-13 shadow-[0_2px_6px_rgba(11,37,69,.15)]" />
        </div>
        <h1 className="m-0 mt-1.5 text-[28px] leading-[1.15] font-bold tracking-[-.02em]">
          {greeting(me.name.split(" ")[0])}!
          <br />
          <span className="text-[#2F5B8C]">Ready for today&apos;s rounds?</span>
        </h1>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/75 px-2.5 py-1 text-meta font-semibold text-[#1E3A5F]">
          <Icon name="ic-cal" size={13} />
          {todayLabel}
        </span>
      </div>

      <div className="relative -mt-[72px] flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0_12px_32px_rgba(11,37,69,.12)]">
        <h2 className="m-0 mb-0.5 text-[17px] font-bold text-[#0B2545]">Today&apos;s collection</h2>
        <div className="grid grid-cols-3 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="flex min-w-0 flex-col gap-1 rounded-xl bg-[#F3F7FD] px-2.5 py-3">
              <span className="text-meta font-medium text-[#5B6B80]">{k.label}</span>
              <span className="num truncate text-[15.5px] font-bold" style={{ color: k.color }}>
                {k.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-1 items-baseline gap-1.5 rounded-xl bg-[#F3F7FD] p-3">
            <span className="text-xl font-bold text-[#0B2545]">{todays.length}</span>
            <span className="text-13 text-[#5B6B80]">customers today</span>
          </div>
          <div className="flex flex-1 items-baseline gap-1.5 rounded-xl bg-[#FFF1F2] p-3">
            <span className="text-xl font-bold text-danger">{overdueCount}</span>
            <span className="text-13 text-[#9F3A4B]">overdue</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/rider/map"
            className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(124,92,250,.28)] hover:bg-brand-hover hover:text-white hover:no-underline"
          >
            <Icon name="ic-map" size={17} />
            View map
          </Link>
          <Link href="/rider/customers" className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[#F3F7FD] text-[15px] font-semibold text-[#0B2545] hover:text-[#0B2545] hover:no-underline">
            <Icon name="ic-users" size={17} />
            Customers
          </Link>
        </div>
        {closing ? (
          <Link href="/rider/closing" className="grid h-12 place-items-center rounded-[10px] bg-success-soft text-sm font-semibold text-success hover:text-success hover:no-underline">
            ✓ Day closed at {closing.time}
          </Link>
        ) : (
          <Link href="/rider/closing" className="grid h-12 place-items-center rounded-[10px] border border-dashed border-faint bg-white text-sm font-semibold text-ink hover:text-ink hover:no-underline">
            Daily closing
          </Link>
        )}
      </div>

      <h2 className="m-0 mt-1 text-base font-semibold text-ink">Today&apos;s visits</h2>
      <RiderVisitList customers={todays} />
      {!todays.length && <div className="rounded-xl border border-dashed border-line-input bg-white p-5 text-center text-sm text-muted-ink">No collections scheduled today.</div>}
    </>
  );
}
