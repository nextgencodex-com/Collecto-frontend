// Pure data derivations (port of derive()/report()/map helpers in reference/view-models.js).
import { AREAS, BOUNDS, RANK, TODAY, calcItem, cumF, fmt, pct, proj, sum, type Bounds } from "./calc";
import type { AppData, CalcCustomer, CalcItem, Payment, Rider, Status } from "./types";

export interface Derived {
  items: CalcItem[];
  custs: CalcCustomer[];
  cmap: Record<string, CalcCustomer>;
  rmap: Record<string, Rider>;
  imap: Record<string, CalcItem>;
  pays: Payment[];
}

export function derive(d: AppData): Derived {
  const pays = d.payments;
  const rmap: Record<string, Rider> = {};
  const cmap: Record<string, CalcCustomer> = {};
  const imap: Record<string, CalcItem> = {};
  d.riders.forEach((r) => (rmap[r.id] = r));

  // Group once so the work is O(items + payments), not O(items x payments) (hours of CPU on a big shop).
  const paysByItem = new Map<string, Payment[]>();
  const paidTodayByCustomer = new Map<string, Payment[]>();
  for (const p of pays) {
    (paysByItem.get(p.itemId) ?? paysByItem.set(p.itemId, []).get(p.itemId)!).push(p);
    if (p.date === TODAY) (paidTodayByCustomer.get(p.customerId) ?? paidTodayByCustomer.set(p.customerId, []).get(p.customerId)!).push(p);
  }
  const items = d.items.map((it) => calcItem(it, paysByItem.get(it.id) ?? []));
  const itemsByCustomer = new Map<string, CalcItem[]>();
  for (const i of items) {
    imap[i.id] = i;
    (itemsByCustomer.get(i.customerId) ?? itemsByCustomer.set(i.customerId, []).get(i.customerId)!).push(i);
  }
  const custs = d.customers.map((c) => {
    const its = itemsByCustomer.get(c.id) ?? [];
    const act = its.filter((x) => x.status !== "DONE");
    const status: Status = act.length
      ? act.reduce<Status>((a, x) => (RANK[x.status] < RANK[a] ? x.status : a), "UPCOMING")
      : its.length
        ? "DONE"
        : "UPCOMING";
    const o: CalcCustomer = {
      ...c,
      its,
      act,
      status,
      dueNow: sum(act.map((x) => x.dueNow)),
      overdue: sum(act.map((x) => x.overdue)),
      expectedToday: sum(its.map((x) => x.expectedToday)),
      balance: sum(its.map((x) => x.balance)),
      paid: sum(its.map((x) => x.paid)),
      total: sum(its.map((x) => x.price)),
      missed: sum(act.map((x) => x.missed)),
      paidToday: sum((paidTodayByCustomer.get(c.id) ?? []).map((p) => p.amount)),
      riderName: rmap[c.riderId]?.name ?? "Unassigned",
    };
    cmap[c.id] = o;
    return o;
  });
  return { items, custs, cmap, rmap, imap, pays };
}

export const itemLabel = (D: Derived, id: string) => (D.imap[id] ? `${D.imap[id].code} · ${D.imap[id].name}` : "—");
export const custName = (D: Derived, id: string) => D.cmap[id]?.name ?? "—";
export const riderName = (D: Derived, id: string) => D.rmap[id]?.name ?? "—";

/** Rows of an item's repayment schedule. */
export function scheduleRows(x: CalcItem) {
  const cum = cumF(x);
  return x.dates.map((dt, i) => {
    const prev = i ? cum(i - 1) : 0;
    const amt = cum(i) - prev;
    const cov = Math.max(0, Math.min(amt, x.paid - prev));
    const st: Status = cov >= amt ? "PAID" : dt < TODAY ? "OVERDUE" : dt === TODAY ? "DUE" : "UPCOMING";
    return { no: i + 1, date: dt, amount: amt, covered: cov, status: st };
  });
}

export const itemPct = (x: CalcItem) => Math.min(100, Math.round((x.paid / x.price) * 100));

// ---------- dashboard ----------
export function dashboard(d: AppData, D: Derived) {
  const tp = D.pays.filter((p) => p.date === TODAY);
  const expected = sum(D.items.map((i) => i.expectedToday));
  const collected = sum(tp.map((p) => p.amount));
  const activeItems = D.items.filter((i) => i.status !== "DONE");
  const overdueC = D.custs.filter((c) => c.status === "OVERDUE");
  return {
    kpis: [
      { label: "Expected today", value: fmt(expected), sub: "Due today plus overdue arrears", color: "#18181B" },
      { label: "Collected today", value: fmt(collected), sub: `${pct(collected, expected)}% of expected · ${tp.length} payments`, color: "#15803D" },
      { label: "Outstanding", value: fmt(sum(D.items.map((i) => i.balance))), sub: `Across ${activeItems.length} active items`, color: "#18181B" },
      { label: "Overdue customers", value: String(overdueC.length), sub: `${fmt(sum(D.items.map((i) => i.overdue)))} in arrears`, color: "#C81E3A" },
    ],
    strip: [
      { label: "Active customers", value: D.custs.filter((c) => c.act.length).length },
      { label: "Active installment items", value: activeItems.length },
      { label: "Due today", value: D.custs.filter((c) => c.status === "DUE").length },
      { label: "Overdue", value: overdueC.length },
    ],
    recent: D.pays.slice(-6).reverse(),
    riderPerf: d.riders.map((r) => {
      const e = sum(D.items.filter((i) => i.riderId === r.id).map((i) => i.expectedToday));
      const c = sum(tp.filter((p) => p.riderId === r.id).map((p) => p.amount));
      return { id: r.id, name: r.name, expected: e, collected: c, pct: pct(c, e) };
    }),
    overdue: overdueC.slice().sort((a, b) => b.overdue - a.overdue),
  };
}

// ---------- maps ----------
export function mapAreas(b: Bounds) {
  return Object.entries(AREAS)
    .map(([name, [la, lo]]) => ({ name, ...proj(la - 0.0025, lo, b) }))
    .filter((a) => a.x > 3 && a.x < 97 && a.y > 3 && a.y < 97);
}

export function boundsFor(pts: { lat: number; lng: number }[]): Bounds {
  if (!pts.length) return BOUNDS;
  const la = pts.map((p) => p.lat);
  const lo = pts.map((p) => p.lng);
  const a0 = Math.min(...la), a1 = Math.max(...la), o0 = Math.min(...lo), o1 = Math.max(...lo);
  const pa = Math.max((a1 - a0) * 0.18, 0.006), po = Math.max((o1 - o0) * 0.14, 0.008);
  return { lat0: a0 - pa, lat1: a1 + pa * 1.6, lng0: o0 - po, lng1: o1 + po };
}

// ---------- reports ----------
export type ReportKey = "daily" | "monthly" | "person" | "item" | "rider" | "overdue";
export const REPORTS: [ReportKey, string][] = [
  ["daily", "Daily"],
  ["monthly", "Monthly"],
  ["person", "Person-wise outstanding"],
  ["item", "Item-wise balance"],
  ["rider", "Rider performance"],
  ["overdue", "Overdue"],
];
export interface Cell {
  v: string;
  right?: boolean;
}
export interface Report {
  title: string;
  cols: Cell[];
  rows: Cell[][];
  summary: { label: string; value: string }[];
}

export function reportToCsv(r: Report) {
  const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
  return [r.cols.map((c) => esc(c.v)).join(","), ...r.rows.map((x) => x.map((c) => esc(c.v)).join(","))].join("\n");
}

/** The latest extension for a customer that is still in force (promised date today or later). */
export function activeExtension(d: AppData, customerId: string) {
  return (d.extensions ?? []).filter((e) => e.customerId === customerId && e.until >= TODAY).at(-1) ?? null;
}

/** Customer search used by the global search and the Customers screen. */
export function matchCustomer(c: { name: string; nic: string; phone: string }, query: string) {
  const q = query.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  return !q || c.name.toLowerCase().includes(q) || c.nic.toLowerCase().includes(q) || (qd.length > 2 && c.phone.replace(/\D/g, "").includes(qd));
}
