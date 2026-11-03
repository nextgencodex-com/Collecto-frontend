"use client";
import { useMemo } from "react";
import { RANK, TODAY, sum } from "@/lib/calc";
import { useAppStore, useDerived } from "@/store/app-store";

/** Everything the rider app needs about the signed-in rider (port of CLV.rider()). */
export function useRider() {
  const { data, D } = useDerived();
  const riderId = useAppStore((s) => s.session?.riderId);
  return useMemo(() => {
    const me = riderId ? D.rmap[riderId] : undefined;
    if (!me) return null;
    const mine = D.custs.filter((c) => c.riderId === me.id);
    const tp = D.pays.filter((p) => p.date === TODAY && p.riderId === me.id);
    const expected = sum(mine.map((c) => c.expectedToday));
    const collected = sum(tp.map((p) => p.amount));
    const pending = sum(mine.map((c) => c.dueNow));
    const todays = mine.filter((c) => c.expectedToday > 0 || c.dueNow > 0).sort((a, b) => RANK[a.status] - RANK[b.status]);
    const closing = data.closings.find((x) => x.riderId === me.id && x.date === TODAY) ?? null;
    return { data, D, me, mine, tp, expected, collected, pending, todays, closing, overdueCount: mine.filter((c) => c.status === "OVERDUE").length };
  }, [data, D, riderId]);
}

export function greeting(firstName: string) {
  const h = new Date().getHours();
  return `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}, ${firstName}`;
}
