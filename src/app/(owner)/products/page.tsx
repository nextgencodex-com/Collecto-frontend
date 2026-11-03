"use client";
import { Btn, PageHeader } from "@/components/ui-collecto/primitives";
import { fmt } from "@/lib/calc";
import { stockStyle } from "@/lib/stock";
import { useAppStore } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function ProductsPage() {
  const products = useAppStore((s) => s.data.products);
  const open = useUI((s) => s.open);
  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Catalogue with default installment plans"
        actions={
          <Btn variant="primary" onClick={() => open({ type: "product" })}>
            Add product
          </Btn>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
        {products.map((p) => {
          const s = stockStyle(p);
          return (
            <div key={p.code} className="card flex flex-col gap-3 p-[18px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-meta text-muted-ink">{p.code}</span>
                  <span className="text-base font-semibold text-ink">{p.name}</span>
                </div>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-md pr-[9px] pl-2 text-xs font-medium whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(24,24,27,.05)]" style={{ background: s.bg, color: s.fg }}>
                  <span className="size-[7px] flex-none rounded-full bg-current" />
                  {s.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="num text-[22px] font-semibold text-ink">{fmt(p.price)}</span>
                <span className="text-13 text-muted-ink">
                  {fmt(p.amount)} {p.freq} · {p.period} months
                </span>
              </div>
              <div className="text-13 text-muted-ink">
                Cash price {fmt(p.cash)} · {p.sold} sold
              </div>
              <button
                onClick={() => open({ type: "item", code: p.code })}
                className="mt-auto h-[38px] rounded-lg border border-line-input bg-white text-sm font-medium text-ink hover:bg-hover"
              >
                Sell on installment
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
