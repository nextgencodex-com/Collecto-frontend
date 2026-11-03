// API facade. Today it is backed by the in-browser mock store (src/store/app-store.ts).
// When the real backend is ready, replace these implementations with fetch() calls —
// the function signatures are what the UI depends on.
import { useAppStore, type CustomerForm, type ItemForm, type ProductForm, type RiderForm } from "@/store/app-store";

const s = () => useAppStore.getState();

export const api = {
  auth: {
    login: (role: "owner" | "rider", user: string, pass: string, remember: boolean) => Promise.resolve(s().login(role, user, pass, remember)),
    logout: () => Promise.resolve(s().logout()),
  },
  customers: {
    create: (f: CustomerForm) => Promise.resolve(s().saveCustomer(f)),
    assignRider: (customerId: string, riderId: string) => Promise.resolve(s().assignRider(customerId, riderId)),
    extendPayment: (customerId: string, until: string, reason: string) => Promise.resolve(s().extendPayment(customerId, until, reason)),
  },
  items: {
    create: (f: ItemForm) => Promise.resolve(s().saveItem(f)),
  },
  products: {
    create: (f: ProductForm) => Promise.resolve(s().saveProduct(f)),
    addStock: (code: string, qty: string) => Promise.resolve(s().addStock(code, qty)),
  },
  riders: {
    save: (f: RiderForm) => Promise.resolve(s().saveRider(f)),
  },
  payments: {
    record: (customerId: string, lines: { itemId: string; amount: number }[]) => Promise.resolve(s().recordPayments(customerId, lines)),
    correct: (payId: string, amount: string, reason: string) => Promise.resolve(s().correctPayment(payId, amount, reason)),
  },
  closings: {
    submit: (input: Parameters<ReturnType<typeof useAppStore.getState>["submitClosing"]>[0]) => Promise.resolve(s().submitClosing(input)),
  },
  notifications: {
    markAllRead: () => Promise.resolve(s().markNotifsRead()),
  },
  settings: {
    updateShop: (k: "name" | "phone" | "address", v: string) => Promise.resolve(s().updateShop(k, v)),
    resetDemo: () => Promise.resolve(s().resetDemo()),
  },
};
