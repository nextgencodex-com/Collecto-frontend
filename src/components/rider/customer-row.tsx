"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar, StatusChip } from "@/components/ui-collecto/primitives";
import type { CalcCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExtendDialog } from "./extend-dialog";

const collectible = (c: CalcCustomer) => c.dueNow > 0;

/**
 * Rider customer list (Figma 24 "Today's visits" / 27 "My customers").
 * Rows with something to collect get a chevron that expands Extend / Collect actions;
 * the first collectible row starts expanded, as in the design.
 */
export function RiderVisitList({ customers }: { customers: CalcCustomer[] }) {
  const [openId, setOpenId] = useState<string | null>(() => customers.find(collectible)?.id ?? null);
  const [extending, setExtending] = useState<CalcCustomer | null>(null);

  return (
    <div className="flex flex-col">
      {customers.map((c) => (
        <RiderVisitRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId((o) => (o === c.id ? null : c.id))} onExtend={() => setExtending(c)} />
      ))}
      {extending && <ExtendDialog c={extending} onClose={() => setExtending(null)} />}
    </div>
  );
}

function RiderVisitRow({ c, open, onToggle, onExtend }: { c: CalcCustomer; open: boolean; onToggle: () => void; onExtend: () => void }) {
  const canCollect = collectible(c);
  const panelId = `visit-${c.id}`;
  return (
    <div className="border-b border-line">
      <div className="flex items-center gap-3 py-3.5">
        <Link href={`/rider/customers/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 text-left hover:no-underline">
          <Avatar id={c.id} name={c.name} photo={c.photo} size={44} className="!text-[15px]" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold text-ink">{c.name}</span>
            <span className="truncate text-13 text-muted-ink">
              {c.city} · {c.phone}
            </span>
          </span>
        </Link>
        <div className="flex flex-col items-end gap-1">
          <StatusChip status={c.status} />
          {canCollect && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? "Hide" : "Show"} actions for ${c.name}`}
              className="grid h-7 w-9 place-items-center rounded-md border-0 bg-transparent text-muted-ink hover:bg-hover hover:text-ink"
            >
              <Icon name="ic-chev" size={20} className="transition-transform duration-150" style={{ transform: `rotate(${open ? -90 : 90}deg)` }} />
            </button>
          )}
        </div>
      </div>
      {canCollect && open && (
        <div id={panelId} className="grid grid-cols-2 gap-2 pb-3.5">
          <button type="button" onClick={onExtend} className="h-12 rounded-[10px] border border-line-input bg-white text-[15px] font-semibold text-ink hover:bg-hover">
            Extend
          </button>
          <Link
            href={`/rider/customers/${c.id}/collect`}
            className={cn("grid h-12 place-items-center rounded-[10px] bg-brand text-[15px] font-semibold text-white", "hover:bg-brand-hover hover:text-white hover:no-underline")}
          >
            Collect
          </Link>
        </div>
      )}
    </div>
  );
}
