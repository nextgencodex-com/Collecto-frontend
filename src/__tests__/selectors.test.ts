import { describe, expect, it } from "vitest";
import { activeExtension, derive, matchCustomer, reportToCsv } from "@/lib/selectors";
import { emptyData } from "@/store/app-store";
import type { AppData, Customer, Item, Payment } from "@/lib/types";

const customer = (i: number): Customer => ({
  id: "C" + i,
  name: "Cust " + i,
  nic: "NIC" + i,
  phone: "077000" + i,
  address: "",
  city: "",
  riderId: "R1",
  lat: 0,
  lng: 0,
  notes: "",
  photo: "",
  since: "2026-01-01",
});
const item = (i: number, c: number): Item => ({
  id: "IT" + i,
  customerId: "C" + c,
  riderId: "R1",
  code: "K",
  name: "K",
  price: 1600,
  freq: "weekly",
  amount: 100,
  period: 16,
  start: "2026-09-22",
});
const pay = (i: number, it: number, c: number, amount: number, date: string): Payment => ({
  id: "P" + i,
  txn: "",
  itemId: "IT" + it,
  customerId: "C" + c,
  riderId: "R1",
  amount,
  date,
  time: "10:00",
  status: "completed",
});
const data = (o: Partial<AppData>): AppData => ({ ...emptyData(), ...o });

describe("derive", () => {
  it("rolls item figures up to customers", () => {
    const D = derive(
      data({
        customers: [customer(1)],
        items: [item(1, 1), item(2, 1)],
        payments: [pay(1, 1, 1, 400, "2026-10-13"), pay(2, 2, 1, 50.5, "2026-10-01")],
      }),
    );
    const c = D.cmap.C1!;
    expect(c.paid).toBe(450.5);
    expect(c.paidToday).toBe(400);
    expect(c.total).toBe(3200);
    expect(c.status).toBe("OVERDUE");
    expect(D.imap.IT1!.status).toBe("PAID");
  });

  it("is linear: 3,000 items / 30,000 payments derive in well under 2 s", () => {
    const customers = Array.from({ length: 1000 }, (_, i) => customer(i));
    const items = Array.from({ length: 3000 }, (_, i) => item(i, i % 1000));
    const payments = Array.from({ length: 30000 }, (_, i) => pay(i, i % 3000, i % 1000, 1, "2026-10-01"));
    const t = performance.now();
    derive(data({ customers, items, payments }));
    expect(performance.now() - t).toBeLessThan(2000); // the quadratic version took seconds at this size
  });
});

describe("helpers", () => {
  it("reportToCsv quotes and escapes", () => {
    const csv = reportToCsv({
      title: "",
      summary: [],
      cols: [{ v: "A" }, { v: "B" }],
      rows: [[{ v: 'x "y"' }, { v: "1,5" }]],
    });
    expect(csv).toBe('"A","B"\n"x ""y""","1,5"');
  });
  it("activeExtension returns the latest still-valid one", () => {
    const e = (id: string, until: string) => ({ id, customerId: "C1", until }) as never;
    expect(activeExtension(data({ extensions: [e("a", "2026-10-12"), e("b", "2026-10-20")] }), "C1")).toMatchObject({ id: "b" });
    expect(activeExtension(data({ extensions: [e("a", "2026-10-12")] }), "C1")).toBeNull();
  });
  it("matchCustomer searches name, NIC and digits of the phone", () => {
    const c = { name: "Ann Silva", nic: "199012345V", phone: "077-123 4567" };
    expect(matchCustomer(c, "silva")).toBe(true);
    expect(matchCustomer(c, "1234567")).toBe(true);
    expect(matchCustomer(c, "07")).toBe(false);
    expect(matchCustomer(c, "")).toBe(true);
  });
});
