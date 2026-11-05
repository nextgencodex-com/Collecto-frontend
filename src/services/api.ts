// API facade: the only place the UI talks to the backend for writes (reads come from the store, which is
// hydrated from GET /bootstrap). Every mutation returns a Result so forms can show the server's message,
// and refreshes the store on success so lists and derived figures update.
import { toast } from "sonner";
import type { LastTx } from "@/lib/types";
import type { Report, ReportKey } from "@/lib/selectors";
import { type CustomerForm, type ItemForm, type ProductForm, type RiderForm, useAppStore } from "@/store/app-store";
import { type Result, fail, ok, request } from "./http";

const store = () => useAppStore.getState();

/** Runs a write; on success re-syncs the store before resolving (so callers can navigate to new data). */
async function write<T>(r: Promise<Result<T>>): Promise<Result<T>> {
  const res = await r;
  if (res.ok) await store().reload();
  return res;
}

let shopTimer: ReturnType<typeof setTimeout> | undefined;

export const api = {
  auth: {
    login: (role: "owner" | "rider", user: string, pass: string, remember: boolean) => store().login(role, user, pass, remember),
    logout: () => store().logout(),
  },
  customers: {
    async create(f: CustomerForm): Promise<Result<string>> {
      const res = await request<{ id: string }>("POST", "/customers", {
        body: { name: f.name, nic: f.nic, phone: f.phone, address: f.address, city: f.city, lat: f.lat, lng: f.lng, riderId: f.riderId, notes: f.notes },
      });
      if (!res.ok) return res;
      const id = res.value.id;
      if (f.photoBlob) {
        const form = new FormData();
        form.append("photo", f.photoBlob, "photo.jpg");
        const up = await request("PUT", `/customers/${id}/photo`, { form });
        if (!up.ok) toast(`Customer saved, but the photo could not be uploaded: ${up.error}`);
      }
      await store().reload();
      return ok(id);
    },
    assignRider: (customerId: string, riderId: string) => write(request("PATCH", `/customers/${customerId}/rider`, { body: { riderId } })),
    extendPayment: (customerId: string, until: string, reason: string) =>
      write(request("POST", `/customers/${customerId}/extensions`, { body: { until, reason } })),
  },
  items: {
    async create(f: ItemForm): Promise<Result<string>> {
      const res = await write(
        request("POST", "/items", {
          body: { customerId: f.customerId, code: f.code, price: f.price, freq: f.freq, period: f.period, amount: f.amount, start: f.start, riderId: f.riderId },
        }),
      );
      return res.ok ? ok(f.customerId) : res;
    },
  },
  products: {
    create: (f: ProductForm) =>
      write(
        request("POST", "/products", {
          body: { code: f.code, name: f.pname, purchase: f.purchase, cash: f.cash, price: f.price, freq: f.freq, amount: f.amount, period: f.period, stock: f.stock },
        }),
      ),
    async addStock(code: string, qty: string): Promise<Result<number>> {
      const res = await write(request("POST", `/products/${encodeURIComponent(code)}/stock`, { body: { qty } }));
      return res.ok ? ok(+qty) : res;
    },
  },
  riders: {
    save(f: RiderForm): Promise<Result> {
      const body = { name: f.name, phone: f.phone, area: f.area, username: f.username, active: f.active, ...(f.password ? { password: f.password } : {}) };
      // creating requires a password; the server's validation message ("at least 4 characters") covers a blank one
      return write(f.id ? request("PATCH", `/riders/${f.id}`, { body }) : request("POST", "/riders", { body: { ...body, password: f.password } }));
    },
  },
  payments: {
    async record(customerId: string, lines: { itemId: string; amount: number }[]): Promise<Result<LastTx>> {
      const res = await request<LastTx>("POST", "/payments", { body: { customerId, lines } });
      if (!res.ok) return res;
      store().setLastTx(res.value);
      await store().reload();
      return res;
    },
    correct: (payId: string, amount: string, reason: string) => write(request("PATCH", `/payments/${payId}`, { body: { amount, reason } })),
  },
  closings: {
    // expected / collected / pending / count are computed by the server
    submit: (input: { cash: string; note: string }) => write(request("POST", "/closings", { body: { cash: input.cash, note: input.note } })),
  },
  notifications: {
    markAllRead: () => Promise.resolve(store().markNotifsRead()),
  },
  reports: {
    get: (type: ReportKey, date: string, month: string) => request<Report>("GET", `/reports/${type}?date=${date}&month=${month}`),
  },
  settings: {
    /** Updates the field on screen immediately and saves after the user pauses typing. */
    updateShop(k: "name" | "phone" | "address", v: string): Promise<void> {
      store().setShopField(k, v);
      clearTimeout(shopTimer);
      shopTimer = setTimeout(async () => {
        const { name, phone, address } = store().data.shop;
        const res = await request("PATCH", "/shop", { body: { name, phone, address } });
        if (!res.ok) {
          toast(res.error);
          void store().reload(); // drop the unsaved value
        }
      }, 600);
      return Promise.resolve();
    },
    resetDemo: async (): Promise<Result> => {
      const res = await request("POST", "/dev/reset");
      return res.ok ? ok(undefined) : fail(res.error);
    },
  },
};
