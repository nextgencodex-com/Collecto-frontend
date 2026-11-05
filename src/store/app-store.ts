"use client";
// Client cache of the server's data. All writes go through src/services/api.ts, which calls the backend
// and then `reload()`s this store; components keep reading `data` / `useDerived()` exactly as before.
import { create } from "zustand";
import { useMemo } from "react";
import { AREAS } from "@/lib/calc";
import { derive } from "@/lib/selectors";
import type { AppData, Freq, LastTx, Session } from "@/lib/types";
import { type AuthPayload, type Result, fail, ok, onSessionLost, refreshAccessToken, request, setAccessToken } from "@/services/http";

export type { Result } from "@/services/http";

export interface CustomerForm {
  name: string; nic: string; phone: string; address: string; city: string; riderId: string;
  notes: string; photo: string; lat: number | null; lng: number | null;
  /** The cropped photo to upload after the customer is created (`photo` is only the preview). */
  photoBlob?: Blob | null;
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

export const emptyData = (): AppData => ({
  shop: { name: "", phone: "", address: "" },
  owner: { name: "", email: "", username: "", photo: "" },
  riders: [],
  products: [],
  customers: [],
  items: [],
  payments: [],
  audit: [],
  notifs: [],
  closings: [],
  extensions: [],
});

interface AppState {
  data: AppData;
  session: Session | null;
  /** true once the initial session restore has finished (signed in or not) */
  hydrated: boolean;
  lastTx: LastTx | null;

  hydrateSession: () => Promise<void>;
  login: (role: "owner" | "rider", user: string, pass: string, remember: boolean) => Promise<Result<Session>>;
  logout: () => Promise<void>;
  /** Re-fetches everything from GET /bootstrap. */
  reload: () => Promise<Result>;
  markNotifsRead: () => void;
  /** Local-only update, used for instant feedback while the debounced save is pending. */
  setShopField: (k: "name" | "phone" | "address", v: string) => void;
  setLastTx: (tx: LastTx | null) => void;
}

const signedOut = { session: null, data: emptyData(), lastTx: null } as const;

export const useAppStore = create<AppState>()((set, get) => {
  let hydrating: Promise<void> | null = null;

  /** Loads the dataset for an authenticated session; only then is the session exposed to the UI. */
  const enter = async (auth: AuthPayload): Promise<Result<Session>> => {
    const res = await request<AppData>("GET", "/bootstrap");
    if (!res.ok) return fail(res.error);
    set({ data: res.value, session: auth.session });
    return ok(auth.session);
  };

  onSessionLost(() => {
    setAccessToken(null);
    set({ ...signedOut, data: emptyData() });
  });

  return {
    data: emptyData(),
    session: null,
    hydrated: false,
    lastTx: null,

    // Restores the session from the refresh cookie. Shared promise: React strict mode runs effects twice.
    hydrateSession: () =>
      (hydrating ??= (async () => {
        const auth = await refreshAccessToken();
        if (auth) {
          const r = await enter(auth);
          if (!r.ok) setAccessToken(null);
        }
        set({ hydrated: true });
      })()),

    login: async (role, user, pass, remember) => {
      const res = await request<AuthPayload>("POST", "/auth/login", { body: { role, username: user, password: pass, remember }, retry: false });
      if (!res.ok) return fail(res.error);
      setAccessToken(res.value.accessToken);
      const entered = await enter(res.value);
      if (!entered.ok) setAccessToken(null);
      return entered;
    },

    logout: async () => {
      await request("POST", "/auth/logout", { retry: false });
      setAccessToken(null);
      set({ ...signedOut, data: emptyData() });
    },

    reload: async () => {
      const res = await request<AppData>("GET", "/bootstrap");
      if (res.ok) set({ data: res.value });
      return res.ok ? ok(undefined) : fail(res.error);
    },

    markNotifsRead: () => {
      set((s) => ({ data: { ...s.data, notifs: s.data.notifs.map((n) => ({ ...n, read: true })) } }));
      void request("POST", "/notifications/read-all").then((r) => !r.ok && void get().reload());
    },

    setShopField: (k, v) => set((s) => ({ data: { ...s.data, shop: { ...s.data.shop, [k]: v } } })),
    setLastTx: (lastTx) => set({ lastTx }),
  };
});

/** Memoised derived view of the data (items/customers with balances, statuses, lookups). */
export function useDerived() {
  const data = useAppStore((s) => s.data);
  return useMemo(() => ({ data, D: derive(data) }), [data]);
}

/** Default lat/lng for a known area name, used when the customer form's city changes. */
export const areaCoords = (city: string) => AREAS[city.trim()] ?? null;
