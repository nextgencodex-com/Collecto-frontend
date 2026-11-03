import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type IconName =
  | "ic-archive" | "ic-bell" | "ic-bike" | "ic-cal" | "ic-calclock" | "ic-chart" | "ic-check" | "ic-chev"
  | "ic-filter" | "ic-folder" | "ic-grid" | "ic-history" | "ic-home" | "ic-kanban" | "ic-list" | "ic-logout"
  | "ic-map" | "ic-menu" | "ic-more" | "ic-msg" | "ic-package" | "ic-plus" | "ic-search" | "ic-sliders"
  | "ic-sparkles" | "ic-st-done" | "ic-st-due" | "ic-st-over" | "ic-st-paid" | "ic-st-up" | "ic-store"
  | "ic-sub" | "ic-upload" | "ic-user" | "ic-users" | "ic-wallet" | "ic-x";

/** Mask-based icon (same technique as the prototype): takes the current text colour. */
export function Icon({ name, size = 16, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={cn("ic", className)}
      style={{ width: size, height: size, ["--i" as string]: `url(/icons/${name}.svg)`, ...style }}
    />
  );
}
