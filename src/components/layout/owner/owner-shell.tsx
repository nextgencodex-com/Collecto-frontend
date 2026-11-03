"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useNarrow } from "@/hooks/use-media";
import { Modals } from "@/components/modals/modals";
import { MobileNav, Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const narrow = useNarrow(960);
  const pathname = usePathname();
  // the drawer remembers the route it was opened on, so navigating closes it
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawer = narrow && drawerAt === pathname;

  return (
    <div className="flex min-h-screen bg-white">
      {narrow ? <MobileNav open={drawer} onOpenChange={(o) => setDrawerAt(o ? pathname : null)} /> : <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar narrow={narrow} onMenu={() => setDrawerAt(pathname)} />
        <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-[clamp(16px,2.2vw,28px)] pt-6 pb-8">{children}</main>
      </div>
      <Modals />
    </div>
  );
}
