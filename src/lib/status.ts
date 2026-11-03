import type { Status } from "./types";

export interface StatusStyle {
  label: string;
  /** chip background / foreground */
  bg: string;
  fg: string;
  /** small dot / map-marker colour */
  dot: string;
  /** schedule "pill" fill and border */
  pd: string;
  pb: string;
  /** icon name in src/assets/icons */
  ico: "ic-st-paid" | "ic-st-due" | "ic-st-over" | "ic-st-up" | "ic-st-done";
}

export const ST: Record<Status, StatusStyle> = {
  PAID: { label: "Paid", bg: "#DCFCE7", fg: "#15803D", dot: "#22C55E", pd: "#22C55E", pb: "none", ico: "ic-st-paid" },
  DUE: { label: "Due today", bg: "#FEF3C7", fg: "#A16207", dot: "#EAB308", pd: "transparent", pb: "1.5px dashed #CA8A04", ico: "ic-st-due" },
  OVERDUE: { label: "Overdue", bg: "#FFE4E6", fg: "#BE123C", dot: "#F43F5E", pd: "#F43F5E", pb: "none", ico: "ic-st-over" },
  UPCOMING: { label: "Upcoming", bg: "#EFF6FF", fg: "#1D4ED8", dot: "#A1A1AA", pd: "transparent", pb: "1.5px dashed #3B82F6", ico: "ic-st-up" },
  DONE: { label: "Completed", bg: "#F4F4F5", fg: "#3F3F46", dot: "#22C55E", pd: "#71717A", pb: "none", ico: "ic-st-done" },
};

/** Filter chip sets used on the Customers / Installments / rider Customers screens. */
export const STATUS_FILTERS: [Status | "all", string][] = [
  ["all", "All"],
  ["OVERDUE", "Overdue"],
  ["DUE", "Due today"],
  ["PAID", "Up to date"],
  ["UPCOMING", "Upcoming"],
  ["DONE", "Completed"],
];
