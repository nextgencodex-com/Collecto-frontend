import { beforeEach, describe, expect, it } from "vitest";
import * as calc from "@/lib/calc";
import type { Item, Payment } from "@/lib/types";

const item = (o: Partial<Item> = {}): Item => ({
  id: "IT1",
  customerId: "C1",
  riderId: "R1",
  code: "KT",
  name: "Kettle",
  price: 1600,
  freq: "weekly",
  amount: 100,
  period: 16,
  start: "2026-09-22",
  ...o,
});
const pay = (amount: number, date: string, itemId = "IT1"): Payment => ({
  id: "P" + amount + date,
  txn: "",
  itemId,
  customerId: "C1",
  riderId: "R1",
  amount,
  date,
  time: "10:00",
  status: "completed",
});

beforeEach(() => calc.setToday("2026-10-13"));

describe("money", () => {
  it("r2 and sum never drift", () => {
    expect(calc.r2(0.1 + 0.2)).toBe(0.3);
    expect(calc.sum([0.1, 0.2, 0.3])).toBe(0.6);
  });
  it("fmt shows whole rupees plainly and paise with two decimals", () => {
    expect(calc.fmt(1000)).toBe("Rs. 1,000");
    expect(calc.fmt(1234.5)).toBe("Rs. 1,234.50");
    expect(calc.fmt(null)).toBe("Rs. 0");
    expect(calc.signed(-1000)).toBe("−Rs. 1,000");
  });
});

describe("schedule", () => {
  it("weekly and monthly dates, with month-end clamping", () => {
    expect(calc.sched(item({ price: 400, amount: 100 }))).toEqual(["2026-09-22", "2026-09-29", "2026-10-06", "2026-10-13"]);
    expect(calc.sched(item({ price: 300, amount: 100, freq: "monthly", start: "2026-01-31" }))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });
  it("cumF caps the last instalment at the price (paise safe)", () => {
    const cum = calc.cumF({ price: 100.1, amount: 30 });
    expect(cum(0)).toBe(30);
    expect(cum(3)).toBe(100.1);
  });
});

describe("calcItem", () => {
  it("is overdue when instalments before today are unpaid", () => {
    expect(calc.calcItem(item(), [])).toMatchObject({
      status: "OVERDUE",
      overdue: 300,
      dueNow: 400,
      dueToday: 100,
      missed: 3,
      oldest: "2026-09-22",
    });
  });
  it("is DUE when only today's instalment is unpaid, PAID when covered", () => {
    expect(calc.calcItem(item(), [pay(300, "2026-10-01")]).status).toBe("DUE");
    expect(calc.calcItem(item(), [pay(400, "2026-10-13")]).status).toBe("PAID");
  });
  it("is DONE when fully paid, UPCOMING before the start", () => {
    expect(calc.calcItem(item({ price: 200 }), [pay(200, "2026-10-01")]).status).toBe("DONE");
    expect(calc.calcItem(item({ start: "2026-12-01" }), []).status).toBe("UPCOMING");
  });
  it("counts priorPaid (payments older than the bootstrap window) as paid before today", () => {
    expect(calc.calcItem(item({ priorPaid: 300 }), [pay(100, "2026-10-13")])).toMatchObject({
      paid: 400,
      status: "PAID",
      overdue: 0,
    });
    expect(calc.calcItem(item({ priorPaid: 300 }), []).overdue).toBe(0);
  });
  it("handles paise", () => {
    expect(calc.calcItem(item(), [pay(250.5, "2026-10-01")]).balance).toBe(1349.5);
  });
  it("follows setToday (live binding)", () => {
    calc.setToday("2026-09-22");
    expect(calc.TODAY).toBe("2026-09-22");
    expect(calc.calcItem(item(), []).status).toBe("DUE");
  });
});

describe("expectedOn", () => {
  it("is what was due by a date minus what was paid before it", () => {
    const p = [pay(100, "2026-09-22")];
    const c = calc.calcItem(item(), p);
    expect(calc.expectedOn(c, "2026-09-29", p)).toBe(100);
    expect(calc.expectedOn(c, "2026-09-22", p)).toBe(100);
  });
});
