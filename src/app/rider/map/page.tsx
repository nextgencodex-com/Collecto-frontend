"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar, StatusChip } from "@/components/ui-collecto/primitives";
import { fmt, proj } from "@/lib/calc";
import { boundsFor } from "@/lib/selectors";
import { ST } from "@/lib/status";
import type { Status } from "@/lib/types";
import { useRider } from "@/hooks/use-rider";

const LEGEND: Status[] = ["PAID", "DUE", "OVERDUE", "UPCOMING"];

export default function RiderMapPage() {
  const r = useRider();
  const [sel, setSel] = useState<string | null>(null);
  if (!r) return null;

  const pts = r.mine.filter((c) => c.act.length);
  const b = boundsFor(pts);
  // keep tags inside the map (tag ≈ 30% wide) and below the legend bar
  const markers = pts.map((c) => {
    const p = proj(c.lat, c.lng, b);
    return { c, x: Math.min(74, Math.max(6, p.x)), y: Math.min(97, Math.max(20, p.y)) };
  });
  // nudge overlapping tags apart vertically (tag ≈ 6% tall)
  const placed: typeof markers = [];
  markers
    .slice()
    .sort((p, q) => p.y - q.y)
    .forEach((m) => {
      for (let k = 0; k < markers.length; k++) {
        const hit = placed.find((o) => Math.abs(o.x - m.x) < 32 && Math.abs(o.y - m.y) < 6.5);
        if (!hit) break;
        m.y = hit.y + 6.5 <= 97 ? hit.y + 6.5 : hit.y - 6.5;
      }
      placed.push(m);
    });
  const ms = sel ? r.D.cmap[sel] : null;

  return (
    <div className="map-img relative min-h-[420px] flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-6 flex flex-wrap gap-1.5 border-b border-[rgba(24,24,27,0.06)] bg-white/55 px-2.5 py-2 backdrop-blur-[6px]">
        {LEGEND.map((k) => (
          <span key={k} className="inline-flex items-stretch overflow-hidden rounded-[4px] bg-white text-xs font-semibold text-ink shadow-[0_2px_6px_rgba(24,24,27,0.18)]">
            <span className="grid w-[26px] place-items-center text-white" style={{ background: ST[k].dot }}>
              <Icon name={ST[k].ico} size={13} />
            </span>
            <span className="px-[9px] py-[5px]">
              {ST[k].label} · {pts.filter((c) => c.status === k).length}
            </span>
          </span>
        ))}
      </div>

      {markers.map(({ c, x, y }) => {
        const st = ST[c.status];
        const on = sel === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setSel(c.id)}
            aria-label={c.name}
            className="absolute border-0 bg-transparent p-0 text-left"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-18px, calc(-100% - 7px))", zIndex: on ? 5 : 2 }}
          >
            <span
              className="flex items-stretch overflow-hidden rounded-[5px] border-[1.5px] border-ink bg-white"
              style={{ boxShadow: `${on ? "0 0 0 3px rgba(124,92,250,0.5)," : ""}0 3px 10px rgba(24,24,27,0.22)` }}
            >
              <span className="grid w-[33px] flex-none place-items-center text-white" style={{ background: st.dot }}>
                <Icon name={st.ico} size={16} />
              </span>
              <span className="px-2.5 py-[5px] text-meta leading-[1.25] font-bold whitespace-nowrap text-ink">{c.name.split(" ")[0]}</span>
            </span>
            <span className="absolute -bottom-[5px] left-3 size-2.5 rotate-45 border-r-[1.5px] border-b-[1.5px] border-ink" style={{ background: st.dot }} />
          </button>
        );
      })}

      {ms && (
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(24,24,27,0.138)]">
          <div className="flex items-center gap-3">
            <Avatar id={ms.id} name={ms.name} photo={ms.photo} size={48} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-ink">{ms.name}</span>
              <a href={`tel:${ms.phone.replace(/\D/g, "")}`} className="text-13">
                {ms.phone}
              </a>
            </div>
            <button onClick={() => setSel(null)} aria-label="Close" className="size-9 rounded-lg border-0 bg-app text-base text-body">
              ✕
            </button>
          </div>
          <div className="text-13 text-body">
            {ms.address}, {ms.city}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-meta text-muted-ink">Today&apos;s total</span>
              <span className="num text-xl font-bold text-ink">{fmt(ms.dueNow)}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusChip status={ms.status} />
              <span className="text-meta text-muted-ink">
                {ms.missed} overdue installment{ms.missed === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${ms.lat},${ms.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center rounded-[10px] border border-line-input bg-white text-[15px] font-semibold text-ink hover:text-ink hover:no-underline"
            >
              Navigate
            </a>
            <Link href={`/rider/customers/${ms.id}`} className="flex h-12 items-center justify-center rounded-[10px] bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover hover:text-white hover:no-underline">
              Open
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
