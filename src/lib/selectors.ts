// Pure data derivations (port of derive()/report()/map helpers in reference/view-models.js).
import { AREAS, BOUNDS, RANK, TODAY, calcItem, cumF, expectedOn, fd, fmt, pct, proj, sum, type Bounds } from "./calc";
import { ST } from "./status";
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
  const items = d.items.map((it) => calcItem(it, pays));
  items.forEach((i) => (imap[i.id] = i));
  const custs = d.customers.map((c) => {
    const its = items.filter((x) => x.customerId === c.id);
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
      paidToday: sum(pays.filter((p) => p.customerId === c.id && p.date === TODAY).map((p) => p.amount)),
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

export function buildReport(d: AppData, D: Derived, rep: ReportKey, repDate: string, repMonth: string): Report {
  const pays = D.pays;
  const L = (v: string | number): Cell => ({ v: String(v) });
  const R = (v: string | number): Cell => ({ v: String(v), right: true });
  const cn = (id: string) => custName(D, id);
  const rn = (id: string) => riderName(D, id);
  const iname = (id: string) => itemLabel(D, id);
  let title = "";
  let cols: Cell[] = [];
  let rows: Cell[][] = [];
  let summary: [string, string | number][] = [];

  if (rep === "daily") {
    const ps = pays.filter((p) => p.date === repDate);
    title = "Daily collection report · " + fd(repDate);
    cols = [L("Transaction"), L("Time"), L("Customer"), L("Item"), L("Rider"), R("Amount")];
    rows = ps.map((p) => [L(p.txn), L(p.time), L(cn(p.customerId)), L(iname(p.itemId)), L(rn(p.riderId)), R(fmt(p.amount))]);
    const exp = sum(D.items.map((i) => expectedOn(i, repDate, pays)));
    const col = sum(ps.map((p) => p.amount));
    summary = [["Expected", fmt(exp)], ["Collected", fmt(col)], ["Difference", fmt(col - exp)], ["Payments", ps.length]];
  } else if (rep === "monthly") {
    const m = repMonth;
    const ps = pays.filter((p) => p.date.startsWith(m));
    const by: Record<string, Payment[]> = {};
    ps.forEach((p) => (by[p.date] = by[p.date] || []).push(p));
    title = "Monthly collection report · " + new Date(m + "-01T00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    cols = [L("Date"), R("Payments"), R("Collected")];
    rows = Object.keys(by).sort().map((k) => [L(fd(k)), R(by[k].length), R(fmt(sum(by[k].map((p) => p.amount))))]);
    let due = 0, done = 0, over = 0;
    D.items.forEach((it) => {
      const cum = cumF(it);
      it.dates.forEach((dt, i) => {
        if (!dt.startsWith(m)) return;
        due++;
        if (cum(i) <= it.paid) done++;
        else if (dt < TODAY) over++;
      });
    });
    summary = [["Collected", fmt(sum(ps.map((p) => p.amount)))], ["Installments due", due], ["Completed", done], ["Overdue", over]];
  } else if (rep === "person") {
    title = "Person-wise outstanding report";
    cols = [L("Customer"), L("NIC"), L("Rider"), R("Active items"), R("Total"), R("Paid"), R("Balance"), R("Overdue")];
    rows = D.custs
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .map((c) => [L(c.name), L(c.nic), L(c.riderName), R(c.act.length), R(fmt(c.total)), R(fmt(c.paid)), R(fmt(c.balance)), R(fmt(c.overdue))]);
    summary = [["Customers with balance", rows.length], ["Total outstanding", fmt(sum(D.custs.map((c) => c.balance)))], ["Total overdue", fmt(sum(D.custs.map((c) => c.overdue)))]];
  } else if (rep === "item") {
    title = "Item-wise balance report";
    cols = [L("Item"), L("Customer"), R("Price"), R("Paid"), R("Balance"), L("Next due"), L("Status")];
    rows = D.items.map((i) => [L(i.code + " · " + i.name), L(cn(i.customerId)), R(fmt(i.price)), R(fmt(i.paid)), R(fmt(i.balance)), L(i.next ? fd(i.next) : "—"), L(ST[i.status].label)]);
    summary = [["Items", D.items.length], ["Completed", D.items.filter((i) => i.status === "DONE").length], ["Outstanding value", fmt(sum(D.items.map((i) => i.balance)))]];
  } else if (rep === "rider") {
    const m = repDate.slice(0, 7);
    title = "Rider performance · " + fd(repDate);
    cols = [L("Rider"), L("Area"), R("Customers"), R("Expected"), R("Collected"), R("Rate"), R("Month to date")];
    rows = d.riders.map((r) => {
      const e = sum(D.items.filter((i) => i.riderId === r.id).map((i) => expectedOn(i, repDate, pays)));
      const c = sum(pays.filter((p) => p.riderId === r.id && p.date === repDate).map((p) => p.amount));
      const mtd = sum(pays.filter((p) => p.riderId === r.id && p.date.startsWith(m) && p.date <= repDate).map((p) => p.amount));
      return [L(r.name), L(r.area), R(D.custs.filter((x) => x.riderId === r.id).length), R(fmt(e)), R(fmt(c)), R(pct(c, e) + "%"), R(fmt(mtd))];
    });
  } else {
    title = "Overdue installments report";
    cols = [L("Customer"), L("Phone"), L("Item"), L("Rider"), R("Missed"), R("Overdue amount"), L("Oldest due")];
    rows = D.items
      .filter((i) => i.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .map((i) => {
        const c = D.cmap[i.customerId];
        return [L(c.name), L(c.phone), L(i.code + " · " + i.name), L(c.riderName), R(i.missed), R(fmt(i.overdue)), L(fd(i.oldest))];
      });
    summary = [["Overdue items", rows.length], ["Overdue amount", fmt(sum(D.items.map((i) => i.overdue)))]];
  }
  return { title, cols, rows, summary: summary.map(([label, value]) => ({ label, value: String(value) })) };
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
