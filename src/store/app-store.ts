"use client";
// Mock backend: all app data lives here and is persisted to localStorage.
// Mutations + validation are ported from the prototype (reference/app-class.js).
// Swap src/services/api.ts to a real API later; components only talk to that facade + selectors.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useMemo } from "react";
import { AREAS, TODAY, addD, fd, fmt, nowT, sum, txnId } from "@/lib/calc";
import { buildSeed } from "@/lib/seed";
import { derive } from "@/lib/selectors";
import type { AppData, Freq, LastTx, Session } from "@/lib/types";

const SESSION_KEY = "collecto-session-v1";
const DATA_KEY = "collecto-data-v1";

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): Result<never> => ({ ok: false, error });

const fmtPhone = (digits: string) => digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export interface CustomerForm {
  name: string; nic: string; phone: string; address: string; city: string; riderId: string;
  notes: string; photo: string; lat: number | null; lng: number | null;
}
export interface ItemForm {
  customerId: string; code: string; price: string; freq: Freq; period: string; amount: string; start: string; riderId: string;
}
export interface ProductForm {
  code: string; pname: string; purchase: string; cash: string; price: string; freq: Freq; amount: string; period: string; stock: string;
}
export interface RiderForm {
  id: string; name: string; phone: string; area: string; username: string; password: string; active: boolean;
}

interface AppState {
  data: AppData;
  session: Session | null;
  hydrated: boolean;
  lastTx: LastTx | null;

  hydrateSession: () => void;
  login: (role: "owner" | "rider", user: string, pass: string, remember: boolean) => Result<Session>;
  logout: () => void;

  saveCustomer: (f: CustomerForm) => Result<string>;
  saveItem: (f: ItemForm) => Result<string>;
  saveProduct: (f: ProductForm) => Result;
  addStock: (code: string, qty: string) => Result<number>;
  saveRider: (f: RiderForm) => Result;
  correctPayment: (payId: string, amount: string, reason: string) => Result;
  assignRider: (customerId: string, riderId: string) => void;
  markNotifsRead: () => void;
  updateShop: (k: "name" | "phone" | "address", v: string) => void;
  recordPayments: (customerId: string, lines: { itemId: string; amount: number }[]) => LastTx;
  submitClosing: (input: { cash: string; note: string; expected: number; collected: number; pending: number; count: number }) => Result;
  extendPayment: (customerId: string, until: string, reason: string) => Result;
  resetDemo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const mut = (fn: (d: AppData) => void) => {
        const d = clone(get().data);
        fn(d);
        set({ data: d });
      };
      return {
        data: buildSeed(),
        session: null,
        hydrated: false,
        lastTx: null,

        hydrateSession: () => {
          let ss: Session | null = null;
          try {
            ss = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
          } catch {}
          if (ss?.role === "rider" && !get().data.riders.find((r) => r.id === ss!.riderId)) ss = null;
          set({ session: ss, hydrated: true });
        },

        login: (role, user, pass, remember) => {
          const { data } = get();
          const u = user.trim().toLowerCase();
          if (!u || !pass) return fail("Enter your username and password.");
          let ss: Session | null = null;
          if (role === "owner") {
            const o = data.owner;
            if ((u === o.email || u === o.username) && pass === o.password) ss = { role: "owner" };
          } else {
            const ud = u.replace(/\D/g, "");
            const r = data.riders.find(
              (r) => (r.username === u || (ud.length >= 9 && r.phone.replace(/\D/g, "") === ud)) && r.password === pass,
            );
            if (r && !r.active) return fail("This rider account is inactive. Please contact the owner.");
            if (r) ss = { role: "rider", riderId: r.id };
          }
          if (!ss) return fail("Incorrect username or password.");
          try {
            (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(ss));
          } catch {}
          set({ session: ss });
          return ok(ss);
        },

        logout: () => {
          try {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
          } catch {}
          set({ session: null, lastTx: null });
        },

        saveCustomer: (f) => {
          const d = get().data;
          const nic = (f.nic || "").trim().toUpperCase();
          const ph = (f.phone || "").replace(/\D/g, "");
          if (!f.name || f.name.trim().length < 3) return fail("Enter the customer's full name.");
          if (!/^(\d{9}[VX]|\d{12})$/.test(nic)) return fail("NIC must be 9 digits followed by V/X, or 12 digits.");
          if (d.customers.some((c) => c.nic.toUpperCase() === nic)) return fail("A customer with this NIC is already registered.");
          if (ph.length !== 10) return fail("Phone number must have 10 digits.");
          if (!f.address.trim() || !f.city.trim()) return fail("Enter the address and city/area.");
          if (f.lat == null || f.lng == null) return fail("Set the customer location on the map.");
          if (!f.riderId) return fail("Assign a rider.");
          const id = "C" + (Math.max(...d.customers.map((c) => +c.id.slice(1))) + 1);
          const { lat, lng } = f;
          mut((x) =>
            x.customers.push({
              id, name: f.name.trim(), nic, phone: fmtPhone(ph), address: f.address.trim(), city: f.city.trim(), riderId: f.riderId,
              lat: +lat.toFixed(5), lng: +lng.toFixed(5), notes: (f.notes || "").trim(), photo: f.photo || "", since: TODAY,
            }),
          );
          return ok(id);
        },

        saveItem: (f) => {
          const d = get().data;
          const p = d.products.find((x) => x.code === f.code);
          const price = +f.price, amount = +f.amount, period = +f.period;
          if (!f.customerId) return fail("Select a customer.");
          if (!p) return fail("Select a product.");
          if (p.stock < 1) return fail("This product is out of stock. Add stock in Inventory first.");
          if (!(price > 0)) return fail("Enter a valid price.");
          if (!(period > 0)) return fail("Enter the payment period in months.");
          if (!(amount > 0) || amount > price) return fail("Amount per payment must be more than 0 and not more than the price.");
          if (!f.start) return fail("Choose a start date.");
          if (!f.riderId) return fail("Assign a rider.");
          const id = "IT" + (Math.max(0, ...d.items.map((i) => +i.id.slice(2))) + 1);
          mut((x) => {
            x.items.push({ id, customerId: f.customerId, riderId: f.riderId, code: p.code, name: p.name, price, freq: f.freq, amount, period, start: f.start });
            const pp = x.products.find((y) => y.code === p.code)!;
            pp.stock -= 1;
            pp.sold += 1;
          });
          return ok(f.customerId);
        },

        saveProduct: (f) => {
          const d = get().data;
          const code = (f.code || "").trim().toUpperCase();
          const n = (k: keyof ProductForm) => +f[k];
          if (!code) return fail("Enter an item code.");
          if (d.products.some((p) => p.code === code)) return fail("This item code already exists.");
          if (!(f.pname || "").trim()) return fail("Enter the item name.");
          if (!(n("purchase") > 0 && n("cash") > 0 && n("price") > 0)) return fail("Enter purchase, cash and installment prices.");
          if (!(n("period") > 0) || !(n("amount") > 0)) return fail("Enter the default plan (period and amount per payment).");
          if (!(f.stock !== "" && Number.isInteger(n("stock")) && n("stock") >= 0)) return fail("Stock must be a whole number.");
          mut((x) =>
            x.products.push({ code, name: f.pname.trim(), purchase: n("purchase"), cash: n("cash"), price: n("price"), freq: f.freq, amount: n("amount"), period: n("period"), stock: n("stock"), sold: 0 }),
          );
          return ok(undefined);
        },

        addStock: (code, qty) => {
          const q = +qty;
          if (!(Number.isInteger(q) && q > 0)) return fail("Enter a whole number greater than 0.");
          mut((x) => {
            x.products.find((p) => p.code === code)!.stock += q;
          });
          return ok(q);
        },

        saveRider: (f) => {
          const d = get().data;
          const u = (f.username || "").trim().toLowerCase();
          const ph = (f.phone || "").replace(/\D/g, "");
          if (!f.name.trim()) return fail("Enter the rider name.");
          if (ph.length !== 10) return fail("Phone number must have 10 digits.");
          if (!f.area.trim()) return fail("Enter the assigned area.");
          if (!/^[a-z0-9._-]{3,}$/.test(u)) return fail("Username must be at least 3 characters (letters, numbers, . _ -).");
          if (d.riders.some((r) => r.username === u && r.id !== f.id)) return fail("This username is already taken.");
          if (!f.id && (f.password || "").length < 4) return fail("Password must be at least 4 characters.");
          const phone = fmtPhone(ph);
          mut((x) => {
            if (f.id) {
              const r = x.riders.find((r) => r.id === f.id)!;
              Object.assign(r, { name: f.name.trim(), phone, area: f.area.trim(), username: u, active: !!f.active });
              if (f.password) r.password = f.password;
            } else {
              x.riders.push({ id: "R" + (Math.max(...x.riders.map((r) => +r.id.slice(1))) + 1), name: f.name.trim(), phone, area: f.area.trim(), username: u, password: f.password, active: !!f.active, photo: "" });
            }
          });
          return ok(undefined);
        },

        correctPayment: (payId, amount, reason) => {
          const d = get().data;
          const a = +amount;
          const p = d.payments.find((x) => x.id === payId);
          if (!p) return fail("Payment not found.");
          if (!(a > 0)) return fail("Enter a valid amount.");
          if (a === p.amount) return fail("The new amount is the same as the current amount.");
          if ((reason || "").trim().length < 5) return fail("A reason is required for every correction.");
          const t = nowT();
          const cust = d.customers.find((c) => c.id === p.customerId)?.name ?? "";
          mut((x) => {
            const q = x.payments.find((y) => y.id === p.id)!;
            const old = q.amount;
            q.amount = a;
            q.status = "corrected";
            x.audit.unshift({ id: "A" + (x.audit.length + 1) + "-" + Date.now(), date: TODAY, time: t, user: x.owner.name, action: "Payment amount corrected", txn: q.txn, ref: cust, old: fmt(old), nw: fmt(a), reason: reason.trim() });
          });
          return ok(undefined);
        },

        assignRider: (customerId, riderId) =>
          mut((x) => {
            x.customers.find((c) => c.id === customerId)!.riderId = riderId;
            x.items.forEach((i) => {
              if (i.customerId === customerId) i.riderId = riderId;
            });
          }),

        markNotifsRead: () => mut((x) => x.notifs.forEach((n) => (n.read = true))),

        updateShop: (k, v) => mut((x) => void (x.shop[k] = v)),

        recordPayments: (customerId, lines) => {
          const { data, session } = get();
          const D = derive(data);
          const c = D.cmap[customerId];
          const me = D.rmap[session!.riderId!];
          let seq = data.seq;
          const t = nowT();
          const np = lines.map((l) => {
            seq++;
            return { id: "P" + seq, txn: txnId(TODAY, seq), itemId: l.itemId, customerId: c.id, riderId: me.id, amount: Math.round(l.amount), date: TODAY, time: t, status: "completed" as const };
          });
          const total = sum(np.map((p) => p.amount));
          mut((x) => {
            x.payments.push(...np);
            x.seq = seq;
            x.notifs.unshift({ id: "N" + Date.now(), type: "payment", title: "Payment received", text: fmt(total) + " from " + c.name + " · " + me.name, date: TODAY, time: t, read: false });
          });
          const lastTx: LastTx = {
            cust: c.name, custId: c.id, phone: c.phone, total, time: t, date: TODAY, rider: me.name,
            lines: np.map((p) => ({ txn: p.txn, item: D.imap[p.itemId].code + " · " + D.imap[p.itemId].name, amount: p.amount })),
          };
          set({ lastTx });
          return lastTx;
        },

        submitClosing: ({ cash: cashStr, note, expected, collected, pending, count }) => {
          const { session, data } = get();
          const me = data.riders.find((r) => r.id === session?.riderId);
          if (!me) return fail("Not signed in as a rider.");
          if (cashStr === "") return fail("Enter the cash amount you are submitting.");
          const cash = +cashStr;
          const t = nowT();
          const diff = cash - collected;
          if (diff !== 0 && !note.trim()) return fail("Cash differs from collected amount. Add a note explaining the difference.");
          mut((x) => {
            x.closings.push({ id: "CL" + Date.now(), riderId: me.id, date: TODAY, time: t, expected, collected, pending, cash, count, note: note.trim() });
            x.notifs.unshift({ id: "N" + Date.now(), type: "closing", title: "Daily closing submitted", text: me.name + " · collected " + fmt(collected) + ", cash submitted " + fmt(cash) + (diff ? " (difference " + fmt(diff) + ")" : ""), date: TODAY, time: t, read: false });
          });
          return ok(undefined);
        },

        extendPayment: (customerId, until, reason) => {
          const { session, data } = get();
          const me = data.riders.find((r) => r.id === session?.riderId);
          const c = data.customers.find((x) => x.id === customerId);
          if (!me || !c) return fail("Customer not found.");
          if (!until || until <= TODAY) return fail("Choose a date after today.");
          if (until > addD(TODAY, 30)) return fail("An extension can be at most 30 days.");
          if (reason.trim().length < 3) return fail("Add a short reason for the extension.");
          const t = nowT();
          mut((x) => {
            (x.extensions ??= []).push({ id: "E" + Date.now(), customerId, riderId: me.id, date: TODAY, time: t, until, reason: reason.trim() });
            x.notifs.unshift({ id: "N" + Date.now(), type: "system", title: "Payment extended", text: `${c.name} promised to pay on ${fd(until)} · ${me.name}: ${reason.trim()}`, date: TODAY, time: t, read: false });
          });
          return ok(undefined);
        },

        resetDemo: () => set({ data: buildSeed() }),
      };
    },
    {
      name: DATA_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data }),
    },
  ),
);

/** Memoised derived view of the data (items/customers with balances, statuses, lookups). */
export function useDerived() {
  const data = useAppStore((s) => s.data);
  return useMemo(() => ({ data, D: derive(data) }), [data]);
}

/** Default lat/lng for a known area name, used when the customer form's city changes. */
export const areaCoords = (city: string) => AREAS[city.trim()] ?? null;
