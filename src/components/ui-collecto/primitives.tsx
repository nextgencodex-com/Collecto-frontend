"use client";
import { type ButtonHTMLAttributes, type ReactNode, useState } from "react";
import { avatarColor, initials } from "@/lib/calc";
import { ST } from "@/lib/status";
import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

// ---------- buttons ----------
type BtnVariant = "primary" | "secondary" | "ghost-link" | "danger";
export function Btn({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "md" | "lg" | "sm" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm disabled:opacity-50",
        size === "md" && "h-10 px-4",
        size === "lg" && "h-11 px-[18px]",
        size === "sm" && "h-8 px-3 text-13",
        variant === "primary" && "border-0 bg-brand font-semibold text-white hover:bg-brand-hover",
        variant === "secondary" && "border border-line-input bg-white font-medium text-ink hover:bg-hover",
        variant === "danger" && "border border-[#FBD5DB] bg-white font-medium text-danger hover:bg-danger-soft",
        variant === "ghost-link" && "h-auto border-0 bg-transparent p-0 text-13 font-medium text-brand hover:text-brand-hover",
        className,
      )}
      {...props}
    />
  );
}

// ---------- layout ----------
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-2xl font-bold tracking-[-.025em] text-ink">{title}</h1>
        {subtitle != null && <div className="mt-1 text-sm text-muted-ink">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card flex min-w-0 flex-col", className)}>{children}</div>;
}

export function CardHead({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-line-card px-5 py-4", className)}>
      <h2 className="m-0 text-base font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="p-5 text-sm text-muted-ink">{children}</div>;
}

// ---------- data display ----------
export function StatusChip({ status, label }: { status: Status; label?: string }) {
  const s = ST[status];
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md pr-[9px] pl-2 text-xs font-medium shadow-[inset_0_0_0_1px_rgba(24,24,27,.05)]"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="box-border size-2 flex-none rounded-full" style={{ background: s.pd, border: s.pb }} />
      {label ?? s.label}
    </span>
  );
}

export function Pill({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

export function Avatar({
  id,
  name,
  photo,
  size = 44,
  className,
  bg,
}: {
  id?: string;
  name: string;
  photo?: string;
  size?: number;
  className?: string;
  bg?: string;
}) {
  const [broken, setBroken] = useState(false);
  const show = !!photo && !broken;
  return (
    <span
      className={cn("grid flex-none place-items-center overflow-hidden rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: bg ?? (id ? avatarColor(id) : "#18181B"), fontSize: Math.round(size * 0.34) }}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars may be uploaded data URLs
        <img src={photo} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-meta text-muted-ink">{label}</span>
      <span className="num text-base font-semibold text-ink">{value}</span>
    </div>
  );
}

/** Progress bar: violet fill + percentage label inside when it fits. */
export function ProgressBar({ pct, height = 8 }: { pct: number; height?: number }) {
  return (
    <div className="overflow-hidden rounded-full bg-[#EEEEF0]" style={{ height }}>
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Striped rider target track with a marker (dashboard & riders screen). */
const TRACK = {
  violet: { fill: "linear-gradient(90deg,#C4B5FD,#7C5CFA)", mark: "#7C5CFA" },
  green: { fill: "linear-gradient(90deg,#86EFAC,#22C55E)", mark: "#16A34A" },
};
export function TargetTrack({ pct, tone = "violet" }: { pct: number; tone?: keyof typeof TRACK }) {
  const t = TRACK[tone];
  return (
    <div className="track-striped relative mt-1.5 mb-0.5 h-[26px] rounded-[7px]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="absolute inset-y-0 left-0 overflow-hidden rounded-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]" style={{ width: `${pct}%`, background: t.fill }}>
        <span className="absolute top-1/2 right-2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-white">{pct >= 14 ? `${pct}%` : ""}</span>
      </div>
      <div className="absolute -top-[5px] -bottom-[3px] w-[3px] rounded-[3px]" style={{ background: t.mark, left: `min(calc(${pct}% + 3px), calc(100% - 3px))` }}>
        <span className="absolute -top-[3px] left-1/2 -ml-1 size-2 rounded-full shadow-[0_0_0_2px_#fff]" style={{ background: t.mark }} />
      </div>
    </div>
  );
}

// ---------- inputs ----------
export function SegmentedChips<K extends string>({
  options,
  value,
  onChange,
  counts,
  className,
}: {
  options: [K, string][];
  value: K;
  onChange: (k: K) => void;
  counts?: Partial<Record<K, number>>;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full flex-wrap gap-0.5 self-start rounded-xl bg-app p-1", className)}>
      {options.map(([k, label]) => {
        const on = k === value;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(k)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[9px] border-0 px-3 text-13 font-medium hover:text-ink",
              on ? "bg-white text-ink shadow-chip" : "bg-transparent text-muted-ink",
            )}
          >
            {label}
            {counts && counts[k] != null && (
              <>
                <span className="text-faint">·</span>
                <span className={cn("num font-semibold", on ? "text-brand" : "text-faint")}>{counts[k]}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PillSearch({
  value,
  onChange,
  placeholder,
  label,
  size = "lg",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  size?: "lg" | "md";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <input
        className="pill-search"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={lg ? { height: 44, padding: "0 44px 0 42px", fontSize: 15 } : { height: 40, padding: "0 40px 0 38px", fontSize: 14 }}
      />
      <Icon name="ic-search" size={lg ? 18 : 16} className="search-ic" style={{ left: lg ? 14 : 13 }} />
      {value && (
        <button type="button" className="search-x" onClick={() => onChange("")} aria-label="Clear search" style={{ right: 10, width: 26, height: 26 }}>
          <Icon name="ic-x" size={12} />
        </button>
      )}
    </div>
  );
}

export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("h-11 rounded-lg border border-line-input bg-white px-2.5 text-sm text-ink", className)} {...props}>
      {children}
    </select>
  );
}

// ---------- table ----------
export function Th({ children, right, first, last }: { children: ReactNode; right?: boolean; first?: boolean; last?: boolean }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line-card bg-subtle py-2.5 text-meta font-semibold text-muted-ink",
        right ? "text-right" : "text-left",
        first ? "pl-5" : "pl-4",
        last ? "pr-5" : "pr-4",
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, right, first, last, className }: { children: ReactNode; right?: boolean; first?: boolean; last?: boolean; className?: string }) {
  return (
    <td className={cn("border-b border-line-row py-3 text-sm text-body", right && "text-right", first ? "pl-5" : "pl-4", last ? "pr-5" : "pr-4", className)}>
      {children}
    </td>
  );
}

export function DataTable({ head, children, minWidth = 560 }: { head: ReactNode; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-rows w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
