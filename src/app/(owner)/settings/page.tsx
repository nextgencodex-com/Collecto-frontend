"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { api } from "@/services/api";
import { useAppStore } from "@/store/app-store";

export default function SettingsPage() {
  const router = useRouter();
  const shop = useAppStore((s) => s.data.shop);
  const owner = useAppStore((s) => s.data.owner);

  const reset = async () => {
    if (!window.confirm("Reset all data to the demo dataset? This cannot be undone.")) return;
    const res = await api.settings.resetDemo();
    if (!res.ok) return void toast(res.error);
    // the reset also ends every session on the server, so sign in again
    await api.auth.logout();
    toast("Demo data restored · please sign in again");
    router.push("/login");
  };

  const field = (k: "name" | "phone" | "address", label: string, hint?: string) => (
    <label className="flex flex-col gap-1.5 text-13 font-medium text-body">
      {label}
      <input className="set-in" value={shop[k]} onChange={(e) => api.settings.updateShop(k, e.target.value)} />
      {hint && <span className="-mt-px text-meta font-normal text-muted-ink">{hint}</span>}
    </label>
  );

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-10 pt-1">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-bold tracking-[-.025em] text-ink">Settings</h1>
        <span className="text-sm text-muted-ink">Manage your shop profile and app data.</span>
      </div>

      <section className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-[15px] font-semibold text-ink">Shop details</h2>
          <span className="text-13 text-muted-ink">Changes save automatically.</span>
        </div>
        {field("name", "Shop name")}
        {field("phone", "Phone")}
        {field("address", "Address", "Shown on receipts")}
        <div className="flex items-center gap-2 text-13 text-muted-ink">
          <Icon name="ic-users" size={15} />
          Owner account · <span className="font-medium text-body">{owner.email}</span>
        </div>
      </section>

      {process.env.NODE_ENV !== "production" && (
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
            <h2 className="m-0 text-[15px] font-semibold text-ink">Demo data</h2>
            <span className="text-13 text-muted-ink">Development only. Replaces everything in the database with the sample dataset.</span>
          </div>
          <button onClick={reset} className="h-[38px] rounded-lg border-0 bg-transparent px-3.5 text-sm font-semibold text-danger hover:bg-danger-soft">
            Reset demo data
          </button>
        </section>
      )}
    </div>
  );
}
