"use client";
import { Pager, usePager } from "@/components/ui-collecto/pager";
import { DataTable, PageHeader, Td, Th } from "@/components/ui-collecto/primitives";
import { fmt, sum } from "@/lib/calc";
import { stockStyle } from "@/lib/stock";
import { useDerived } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

export default function InventoryPage() {
  const { data, D } = useDerived();
  const open = useUI((s) => s.open);
  const { rows, pager } = usePager(data.products);
  const stats: [string, string][] = [
    ["Units in stock", String(sum(data.products.map((p) => p.stock)))],
    ["Stock value at cost", fmt(sum(data.products.map((p) => p.stock * p.purchase)))],
    ["Expected profit on sold items", fmt(sum(data.products.map((p) => (p.price - p.purchase) * p.sold)))],
    ["Outstanding installment value", fmt(sum(D.items.map((i) => i.balance)))],
  ];

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock, pricing and expected profit" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card flex flex-col gap-1 px-5 py-4">
            <span className="text-13 font-medium text-muted-ink">{label}</span>
            <span className="num text-[22px] font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <DataTable
          minWidth={1040}
          head={
            <>
              <Th>Product</Th>
              <Th right>In stock</Th>
              <Th right>Sold</Th>
              <Th right>Purchase</Th>
              <Th right>Cash price</Th>
              <Th right>Installment price</Th>
              <Th right>Profit / unit</Th>
              <Th right>Outstanding</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </>
          }
        >
          {rows.map((p) => {
            const s = stockStyle(p);
            const out = sum(D.items.filter((i) => i.code === p.code).map((i) => i.balance));
            return (
              <tr key={p.code}>
                <Td className="whitespace-nowrap !text-ink">
                  <span className="font-mono text-meta text-muted-ink">{p.code}</span> <span className="font-semibold">{p.name}</span>
                </Td>
                <Td right>
                  <span className="rounded-full px-2 py-[3px] text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>
                    {p.stock}
                  </span>
                </Td>
                <Td right>{p.sold}</Td>
                <Td right className="whitespace-nowrap">{fmt(p.purchase)}</Td>
                <Td right className="whitespace-nowrap">{fmt(p.cash)}</Td>
                <Td right className="whitespace-nowrap">{fmt(p.price)}</Td>
                <Td right className="font-semibold whitespace-nowrap !text-success">{fmt(p.price - p.purchase)}</Td>
                <Td right className="whitespace-nowrap">{fmt(out)}</Td>
                <Td right className="!py-2">
                  <button
                    onClick={() => open({ type: "stock", code: p.code, pname: p.name })}
                    className="h-8 rounded-lg border border-line-input bg-white px-3 text-13 font-medium whitespace-nowrap text-ink hover:bg-hover"
                  >
                    Add stock
                  </button>
                </Td>
              </tr>
            );
          })}
        </DataTable>
        <Pager {...pager} />
      </div>
    </>
  );
}
