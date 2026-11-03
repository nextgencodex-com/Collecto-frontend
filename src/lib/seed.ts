// Port of buildSeed() from the prototype (reference/logic-core.js). Photos are served from /public.
import { AREAS, TODAY, addD, cumF, fmt, pad, sched, txnId } from "./calc";
import type { AppData, AuditEntry, Customer, Item, Notification, Payment, Product, Rider } from "./types";

const av = (f: string) => `/images/avatars/${f}.jpg`;

export function buildSeed(): AppData {
  const RPHOTOS = [av("rider-1"), av("rider-2"), ""];
  const riders: Rider[] = (
    [
      ["R1", "Kasun Perera", "077 245 8812", "Maharagama, Nugegoda", "kasun"],
      ["R2", "Nimal Silva", "071 903 4471", "Kottawa, Homagama", "nimal"],
      ["R3", "Tharindu Jayasinghe", "076 118 2290", "Piliyandala", "tharindu"],
    ] as const
  ).map(([id, name, phone, area, username], i) => ({ id, name, phone, area, username, password: "1234", active: true, photo: RPHOTOS[i] }));

  const products: Product[] = (
    [
      ["IR-101", "Steam Iron", 3900, 5200, 6400, "weekly", 400, 4, 14],
      ["FN-160", "Pedestal Fan", 5800, 7900, 9600, "weekly", 600, 4, 9],
      ["BL-300", "Blender 3-Jar", 4700, 6500, 8000, "weekly", 500, 4, 11],
      ["RC-220", "Rice Cooker 2.2L", 7200, 9800, 12000, "weekly", 500, 6, 8],
      ["GC-200", "Gas Cooker 2-Burner", 14500, 19500, 24000, "weekly", 1000, 6, 6],
      ["PH-A15", "Smartphone A15", 31000, 39500, 48000, "monthly", 4000, 12, 5],
      ["TV-320", '32" LED TV', 46000, 59000, 72000, "monthly", 6000, 12, 4],
      ["WM-700", "Washing Machine 7kg", 62000, 79000, 96000, "monthly", 8000, 12, 3],
      ["FR-250", "Refrigerator 250L", 78000, 99000, 120000, "monthly", 10000, 12, 2],
    ] as const
  ).map(([code, name, purchase, cash, price, freq, amount, period, stock]) => ({ code, name, purchase, cash, price, freq, amount, period, stock, sold: 0 }));

  // customers C108 and C110 intentionally have no photo (initials avatar)
  const NO_PHOTO = new Set([7, 9]);
  const customers: Customer[] = (
    [
      ["Saman Kumara", "198812304567", "077 512 3344", "No. 14, Temple Road", "Maharagama", "R1", 0.004, -0.003],
      ["Dilani Fernando", "917654321V", "071 667 2108", "22/3, Old Kesbewa Road", "Maharagama", "R1", -0.005, 0.004],
      ["Ruwan Bandara", "199203118842", "075 334 9021", "8, Stanley Thilakaratne Mw", "Nugegoda", "R1", 0.003, 0.005],
      ["Chamari Wijesinghe", "886540127V", "072 880 4513", "41, Pagoda Road", "Nugegoda", "R1", -0.004, -0.004],
      ["Pradeep Rathnayake", "199507602231", "078 221 6650", "5A, High Level Road", "Maharagama", "R1", 0.001, 0.009],
      ["Sunil Abeywickrama", "197011209876", "070 455 1902", "17, Jambugasmulla Road", "Nugegoda", "R1", 0.008, 0.001],
      ["Nadeesha Gunawardena", "199661903345", "077 908 2231", "63, Hokandara Road", "Kottawa", "R2", 0.003, -0.002],
      ["Asanka Herath", "893120558V", "071 225 7789", "12, Makumbura Road", "Kottawa", "R2", -0.004, 0.004],
      ["Malini Senanayake", "197562004413", "076 340 5512", "9, Godagama Road", "Homagama", "R2", 0.004, 0.002],
      ["Kumudu Dissanayake", "199870112906", "075 667 0981", "28, Pitipana Road", "Homagama", "R2", -0.003, -0.005],
      ["Lahiru Madushanka", "200012503378", "078 773 4410", "3, Kesbewa Road", "Piliyandala", "R3", 0.003, 0.003],
      ["Ishara Peris", "945230776V", "072 119 6684", "51, Moratuwa Road", "Piliyandala", "R3", -0.004, -0.002],
    ] as const
  ).map(([name, nic, phone, address, city, riderId, dl, dg], i) => {
    const id = "C" + (101 + i);
    return {
      id, name, nic, phone, address, city, riderId,
      lat: +(AREAS[city][0] + dl).toFixed(5),
      lng: +(AREAS[city][1] + dg).toFixed(5),
      notes: "",
      photo: NO_PHOTO.has(i) ? "" : av(`customer-${101 + i}`),
      since: TODAY,
    };
  });

  // [customerIndex, productCode, start, unpaidBeforeToday, paidToday]
  const spec: [number, string, string, number, number][] = [
    [0, "IR-101", "2026-08-18", 0, 0], [1, "TV-320", "2026-05-13", 0, 0], [1, "FN-160", "2026-09-01", 1, 0],
    [2, "GC-200", "2026-07-07", 0, 1], [3, "PH-A15", "2026-03-05", 2, 0], [4, "BL-300", "2026-08-20", 0, 0],
    [5, "RC-220", "2026-09-29", 1, 0], [6, "FR-250", "2026-02-13", 0, 1], [7, "IR-101", "2026-07-14", 3, 0],
    [8, "WM-700", "2026-04-20", 0, 0], [9, "RC-220", "2026-09-15", 0, 0], [10, "FN-160", "2026-06-02", 0, 0],
    [10, "TV-320", "2026-10-20", 0, 0], [11, "GC-200", "2026-08-11", 0, 1], [4, "IR-101", "2026-01-06", 0, 0],
  ];
  const items: Item[] = spec.map(([ci, code, start], k) => {
    const p = products.find((x) => x.code === code)!;
    const c = customers[ci];
    p.sold++;
    return { id: "IT" + (k + 1), customerId: c.id, riderId: c.riderId, code, name: p.name, price: p.price, freq: p.freq, amount: p.amount, period: p.period, start };
  });

  const pays: Omit<Payment, "id" | "txn" | "status">[] = [];
  items.forEach((it, k) => {
    const ds = sched(it);
    const cum = cumF(it);
    const amt = (i: number) => cum(i) - (i ? cum(i - 1) : 0);
    const before = ds.filter((x) => x < TODAY);
    const n = before.length - spec[k][3];
    for (let i = 0; i < n; i++)
      pays.push({ itemId: it.id, customerId: it.customerId, riderId: it.riderId, amount: amt(i), date: before[i], time: pad(9 + ((i * 3 + k) % 8)) + ":" + pad((i * 17 + k * 11) % 60) });
    if (spec[k][4]) {
      const i = ds.indexOf(TODAY);
      pays.push({ itemId: it.id, customerId: it.customerId, riderId: it.riderId, amount: amt(i), date: TODAY, time: "09:" + pad(12 + k * 2) });
    }
  });
  pays.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const payments: Payment[] = pays.map((p, i) => ({ ...p, id: "P" + (i + 1), txn: txnId(p.date, i + 1), status: "completed" }));

  customers.forEach((c) => {
    const st = items.filter((i) => i.customerId === c.id).map((i) => i.start).sort()[0];
    if (st) c.since = addD(st, -1);
  });

  const audit: AuditEntry[] = [];
  const cp = payments.find((p) => p.itemId === "IT9" && p.date === "2026-09-15");
  if (cp) {
    cp.status = "corrected";
    audit.push({ id: "A1", date: "2026-09-15", time: "18:40", user: "Shop Owner", action: "Payment amount corrected", txn: cp.txn, ref: customers[7].name, old: fmt(4000), nw: fmt(cp.amount), reason: "Rider entered an extra zero. Verified against the customer receipt." });
  }

  const notifs: Notification[] = payments
    .filter((p) => p.date === TODAY)
    .map((p, i): Notification => ({
      id: "N" + (i + 1),
      type: "payment",
      title: "Payment received",
      text: fmt(p.amount) + " from " + customers.find((c) => c.id === p.customerId)!.name + " · " + riders.find((r) => r.id === p.riderId)!.name,
      date: TODAY,
      time: p.time,
      read: false,
    }))
    .reverse();
  notifs.push({ id: "N0", type: "overdue", title: "Overdue alert", text: "4 customers have overdue installments.", date: TODAY, time: "08:00", read: false });

  return {
    v: 1,
    seq: payments.length,
    shop: { name: "COLLECTO Demo Shop", phone: "011 285 4410", address: "112, High Level Road, Maharagama" },
    owner: { name: "Shop Owner", email: "owner@collecto.lk", username: "owner", password: "owner123", photo: av("owner") },
    riders,
    products,
    customers,
    items,
    payments,
    audit,
    notifs,
    closings: [],
    extensions: [],
  };
}
