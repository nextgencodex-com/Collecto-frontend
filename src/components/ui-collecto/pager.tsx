"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

const PG = 10;

/** Client-side pagination: 10 rows per page, 5-page window (as in the prototype). */
export function usePager<T>(list: T[], perPage = PG) {
  const [page, setPage] = useState(1);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const cur = Math.min(page, pages);
  return {
    rows: list.slice((cur - 1) * perPage, cur * perPage),
    pager: { cur, pages, total, perPage, setPage },
  };
}

export function Pager({ cur, pages, total, perPage, setPage }: ReturnType<typeof usePager>["pager"]) {
  if (total <= perPage) return null;
  const a = Math.max(1, Math.min(cur - 2, pages - 4));
  const b = Math.min(pages, a + 4);
  const nums = Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const nav = "grid size-8 place-items-center rounded-lg border border-line-input bg-white text-body hover:bg-hover";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-row px-5 py-3">
      <span className="text-13 text-muted-ink">
        Showing {(cur - 1) * perPage + 1}–{Math.min(total, cur * perPage)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button aria-label="Previous page" className={cn(nav, cur <= 1 && "opacity-40")} disabled={cur <= 1} onClick={() => setPage(cur - 1)}>
          <Icon name="ic-chev" size={15} style={{ transform: "rotate(180deg)" }} />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            aria-current={n === cur ? "page" : undefined}
            className={cn(
              "num h-8 min-w-8 rounded-lg border px-2 text-13 font-medium",
              n === cur ? "border-brand bg-brand text-white" : "border-line-input bg-white text-body",
            )}
          >
            {n}
          </button>
        ))}
        <button aria-label="Next page" className={cn(nav, cur >= pages && "opacity-40")} disabled={cur >= pages} onClick={() => setPage(cur + 1)}>
          <Icon name="ic-chev" size={15} />
        </button>
      </div>
    </div>
  );
}
