"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/ui-collecto/primitives";
import { TODAY, fd } from "@/lib/calc";
import { navFromPath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

const NOTIF_DOT: Record<string, string> = { payment: "#22C55E", overdue: "#F43F5E", closing: "#7C5CFA", system: "#A1A1AA" };

export function Topbar({ narrow, onMenu }: { narrow: boolean; onMenu: () => void }) {
  const pathname = usePathname();
  const { group, crumb, icon } = navFromPath(pathname);
  const data = useAppStore((s) => s.data);
  const openModal = useUI((s) => s.open);
  // popovers remember the route they were opened on, so navigating closes them
  const [open, setOpen] = useState<{ which: "notif" | "user"; at: string } | null>(null);
  const menu = open && open.at === pathname ? open.which : null;
  const setMenu = (fn: (m: typeof menu) => typeof menu) => {
    const which = fn(menu);
    setOpen(which ? { which, at: pathname } : null);
  };

  // close popovers on Escape
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-line bg-white/92 px-[clamp(12px,2.2vw,24px)] backdrop-blur-[8px]">
      {narrow && (
        <button onClick={onMenu} aria-label="Open menu" className="grid size-9 flex-none place-items-center rounded-lg border border-line-input bg-white text-ink">
          <Icon name="ic-menu" size={18} />
        </button>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-13 whitespace-nowrap text-muted-ink">
        {!narrow && (
          <>
            <span className="inline-flex items-center gap-[7px] px-1.5 py-1">
              <span className="grid size-5 place-items-center rounded-md bg-success-soft">
                <Icon name="ic-store" size={12} className="text-success" />
              </span>
              {data.shop.name}
            </span>
            <Icon name="ic-chev" size={14} className="text-[#D4D4D8]" />
            <span className="inline-flex items-center gap-1.5 px-1.5 py-1">
              <Icon name="ic-folder" size={15} />
              {group}
            </span>
            <Icon name="ic-chev" size={14} className="text-[#D4D4D8]" />
          </>
        )}
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate px-1.5 py-1 font-medium text-ink">
          <Icon name={icon} size={15} />
          {crumb}
        </span>
      </div>

      {!narrow && (
        <>
          <div className="flex items-center">
            <button
              onClick={() => openModal({ type: "rider", rider: null })}
              aria-label="Add rider"
              className="mr-1.5 grid size-[30px] place-items-center rounded-full border border-dashed border-[#D4D4D8] bg-white text-muted-ink hover:border-faint hover:text-ink"
            >
              <Icon name="ic-plus" size={14} />
            </button>
            <Link href="/riders" aria-label="Riders" className="flex">
              {data.riders.map((r) => (
                <Avatar key={r.id} id={r.id} name={r.name} photo={r.photo} size={30} className="-ml-2 border-2 border-white !text-[10.5px]" />
              ))}
            </Link>
          </div>
          <span className="mx-1 h-5 w-px bg-line" />
        </>
      )}

      <NotificationsButton open={menu === "notif"} onToggle={() => setMenu((m) => (m === "notif" ? null : "notif"))} />
      <AccountMenu narrow={narrow} open={menu === "user"} onToggle={() => setMenu((m) => (m === "user" ? null : "user"))} onClose={() => setOpen(null)} />
    </header>
  );
}

function NotificationsButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const notifs = useAppStore((s) => s.data.notifs);
  const markRead = useAppStore((s) => s.markNotifsRead);
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full border-0 bg-transparent text-body hover:bg-hover"
      >
        {/* badge is anchored to the icon's top-right corner so it never hides the bell */}
        <span className="relative block size-5">
          <Icon name="ic-bell" size={20} className="block" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-[7px] -right-[9px] grid h-4 min-w-4 place-items-center rounded-full bg-[#F43F5E] px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className="sr-only">{unread > 0 ? `${unread} unread` : "No unread notifications"}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-55" onClick={onToggle} />
          <div role="dialog" aria-label="Notifications" className="absolute top-[46px] right-0 z-60 max-h-[70vh] w-[min(380px,calc(100vw-24px))] overflow-auto rounded-xl border border-line-card bg-white shadow-[0_16px_40px_rgba(24,24,27,.12)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3.5">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              <button onClick={markRead} className="border-0 bg-transparent text-13 font-medium text-brand">
                Mark all read
              </button>
            </div>
            {notifs.slice(0, 30).map((n) => (
              <div key={n.id} className="flex gap-2.5 border-b border-line-row px-4 py-3" style={{ background: n.read ? "#fff" : "#F8F6FF" }}>
                <span className="mt-1.5 size-2 flex-none rounded-full" style={{ background: NOTIF_DOT[n.type] ?? "#A1A1AA" }} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-13 font-semibold text-ink">{n.title}</span>
                  <span className="text-13 text-body">{n.text}</span>
                  <span className="text-meta text-muted-ink">
                    {n.date === TODAY ? "Today" : fd(n.date)} · {n.time}
                  </span>
                </div>
              </div>
            ))}
            {!notifs.length && <div className="p-4 text-13 text-muted-ink">No notifications yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}

function AccountMenu({ narrow, open, onToggle, onClose }: { narrow: boolean; open: boolean; onToggle: () => void; onClose: () => void }) {
  const router = useRouter();
  const owner = useAppStore((s) => s.data.owner);
  const logout = useAppStore((s) => s.logout);
  const item = "flex h-[38px] w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-left text-sm font-medium";
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "ml-1 flex h-10 items-center gap-2 rounded-full border py-0 pr-2.5 pl-1 hover:bg-hover",
          open ? "border-[#D4D4D8] bg-hover" : "border-transparent bg-white",
        )}
      >
        <Avatar name={owner.name} photo={owner.photo} size={32} bg="#18181B" className="!text-xs" />
        {!narrow && <span className="text-13_5 font-medium text-ink">{owner.name}</span>}
        <Icon name="ic-chev" size={14} className="text-muted-ink transition-transform duration-150" style={{ transform: `rotate(${open ? -90 : 90}deg)` }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-55" onClick={onClose} />
          <div role="menu" aria-label="Account" className="absolute top-12 right-0 z-60 w-[min(264px,calc(100vw-24px))] rounded-xl border border-line-card bg-white p-1.5 shadow-[0_16px_40px_rgba(24,24,27,.14)]">
            <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
              <Avatar name={owner.name} photo={owner.photo} size={40} bg="#18181B" className="!text-sm" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {owner.name}
                  <span className="rounded-full bg-[#F1EDFF] px-[7px] py-px text-[11px] font-semibold text-[#6D4AE8]">Owner</span>
                </span>
                <span className="truncate text-meta text-muted-ink">{owner.email}</span>
              </div>
            </div>
            <div className="-mx-1.5 my-1.5 h-px bg-line" />
            <button role="menuitem" onClick={() => go("/settings")} className={cn(item, "text-body hover:bg-hover hover:text-ink")}>
              <Icon name="ic-sliders" size={17} />
              Shop settings
            </button>
            <button role="menuitem" onClick={() => go("/reports")} className={cn(item, "text-body hover:bg-hover hover:text-ink")}>
              <Icon name="ic-chart" size={17} />
              Reports
            </button>
            <button role="menuitem" onClick={() => go("/audit")} className={cn(item, "text-body hover:bg-hover hover:text-ink")}>
              <Icon name="ic-list" size={17} />
              Audit log
            </button>
            <div className="-mx-1.5 my-1.5 h-px bg-line" />
            <button
              role="menuitem"
              onClick={() => {
                onClose();
                logout();
              }}
              className={cn(item, "text-danger hover:bg-[#FFF1F2] hover:text-[#BE123C]")}
            >
              <Icon name="ic-logout" size={17} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
