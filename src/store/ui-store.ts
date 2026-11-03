"use client";
import { create } from "zustand";
import type { Rider } from "@/lib/types";

export type ModalState =
  | { type: "customer" }
  | { type: "item"; customerId?: string; code?: string; lockCustomer?: boolean }
  | { type: "product" }
  | { type: "stock"; code: string; pname: string }
  | { type: "rider"; rider: Rider | null }
  | { type: "correct"; payId: string }
  | { type: "receipt" }
  | null;

interface UIState {
  modal: ModalState;
  open: (m: Exclude<ModalState, null>) => void;
  close: () => void;
}

export const useUI = create<UIState>((set) => ({
  modal: null,
  open: (modal) => set({ modal }),
  close: () => set({ modal: null }),
}));
