// Faithful port of the prototype's calculation core (reference/logic-core.js).
import type { CalcItem, Item, Payment, Status } from "./types";

/** The current date in the shop's time zone according to this device's clock. */
export const localToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Colombo" }).format(new Date());

/**
 * "Today" for every due-date calculation. It starts as the device's date and is replaced by the
 * server's date on every bootstrap (see setToday), so the app always agrees with the backend, even if
 * the backend pins its date (APP_TODAY) or the device clock is wrong. It is a live binding: modules that
 * import it see the new value.
 */
export let TODAY = process.env.NEXT_PUBLIC_DEMO_TODAY || localToday();
export const setToday = (d: string) => {
  TODAY = d;
};

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const pd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addD = (s: string, n: number) => {
  const d = pd(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const addM = (s: string, n: number) => {
  const d = pd(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return iso(d);
};
/** Rounds to paise. Every money sum/difference goes through this so floats never drift (0.1 + 0.2). */
export const r2 = (n: number) => Math.round(n * 100) / 100;
/** "Rs. 1,000" for whole amounts, "Rs. 1,234.50" otherwise (same as the backend). */
export const fmt = (n: number | null | undefined) => {
  const v = r2(n || 0);
  return "Rs. " + v.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
export const fd = (s: string | null | undefined) =>
  s ? pd(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const fds = (s: string) =>
  pd(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const sum = (a: number[]) => r2(a.reduce((x, y) => x + y, 0));
export const nowT = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : a > 0 ? 100 : 0);
/** Percentage label shown inside a bar only when the bar is wide enough to hold it. */
export const pctInside = (p: number) => (p >= 14 ? `${p}%` : "");
/** Signed money difference, e.g. "+Rs. 200" / "−Rs. 1,000". */
export const signed = (n: number) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

export const RANK: Record<Status, number> = { OVERDUE: 0, DUE: 1, PAID: 2, UPCOMING: 3, DONE: 4 };
export const AV = ["#7C5CFA", "#0EA5E9", "#EC4899", "#F59E0B", "#64748B"];
export const avatarColor = (id: string) => AV[parseInt(id.slice(1), 10) % AV.length];

export const AREAS: Record<string, [number, number]> = {
  Maharagama: [6.848, 79.9265],
  Nugegoda: [6.872, 79.889],
  Kottawa: [6.841, 79.965],
  Homagama: [6.844, 80.003],
  Piliyandala: [6.801, 79.922],
};
export interface Bounds {
  lat0: number;
  lat1: number;
  lng0: number;
  lng1: number;
}
export const BOUNDS: Bounds = { lat0: 6.785, lat1: 6.89, lng0: 79.87, lng1: 80.02 };
export const proj = (lat: number, lng: number, b: Bounds) => ({
  x: +(((lng - b.lng0) / (b.lng1 - b.lng0)) * 100).toFixed(2),
  y: +(((b.lat1 - lat) / (b.lat1 - b.lat0)) * 100).toFixed(2),
});

type SchedInput = Pick<Item, "price" | "amount" | "freq" | "start">;
export const sched = (it: SchedInput) => {
  const n = Math.ceil(Math.round(it.price * 100) / Math.round(it.amount * 100));
  return Array.from({ length: n }, (_, i) => (it.freq === "weekly" ? addD(it.start, 7 * i) : addM(it.start, i)));
};
export const cumF = (it: Pick<Item, "price" | "amount">) => {
  const price = Math.round(it.price * 100);
  const amount = Math.round(it.amount * 100);
  return (i: number) => Math.min(price, (i + 1) * amount) / 100;
};
export const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const txnId = (date: string, seq: number) => "TX" + date.replace(/-/g, "").slice(2) + "-" + String(seq).padStart(4, "0");

export function calcItem(it: Item, pays: Payment[]): CalcItem {
  const dates = sched(it);
  const cum = cumF(it);
  const ps = pays.filter((p) => p.itemId === it.id);
  // payments older than the bootstrap window arrive as one number per item (all of them predate today)
  const prior = it.priorPaid ?? 0;
  const paid = r2(sum(ps.map((p) => p.amount)) + prior);
  const paidBefore = r2(sum(ps.filter((p) => p.date < TODAY).map((p) => p.amount)) + prior);
  const cT = dates.filter((d) => d <= TODAY).length;
  const cB = dates.filter((d) => d < TODAY).length;
  const expT = cT ? cum(cT - 1) : 0;
  const expB = cB ? cum(cB - 1) : 0;
  const balance = r2(Math.max(0, it.price - paid));
  const overdue = r2(Math.max(0, expB - paid));
  const dueNow = r2(Math.min(balance, Math.max(0, expT - paid)));
  const dueToday = r2(Math.max(0, dueNow - overdue));
  const ni = dates.findIndex((_, i) => cum(i) > paid);
  const status: Status =
    balance <= 0 ? "DONE" : overdue > 0 ? "OVERDUE" : dueToday > 0 ? "DUE" : cT === 0 ? "UPCOMING" : "PAID";
  return {
    ...it,
    dates,
    paid,
    balance,
    overdue,
    dueNow,
    dueToday,
    expectedToday: r2(Math.max(0, expT - paidBefore)),
    next: ni >= 0 ? dates[ni] : null,
    status,
    missed: dates.filter((d, i) => d < TODAY && cum(i) > paid).length,
    oldest: dates.find((d, i) => d < TODAY && cum(i) > paid) ?? null,
    n: dates.length,
    last: dates[dates.length - 1],
  };
}

/** Amount expected from an item on a given date (installments due by then minus what was paid before it). */
export function expectedOn(it: CalcItem, date: string, pays: Payment[]) {
  const cum = cumF(it);
  const c = it.dates.filter((d) => d <= date).length;
  const e = c ? cum(c - 1) : 0;
  // exact for dates on or after the bootstrap window start (everything earlier is in priorPaid)
  const pb = r2(sum(pays.filter((p) => p.itemId === it.id && p.date < date).map((p) => p.amount)) + (it.priorPaid ?? 0));
  return r2(Math.max(0, e - pb));
}
