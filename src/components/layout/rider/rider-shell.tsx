"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { Modals } from "@/components/modals/modals";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/rider", label: "Home", icon: "ic-home" },
  { href: "/rider/map", label: "Map", icon: "ic-map" },
  { href: "/rider/customers", label: "Customers", icon: "ic-users" },
  { href: "/rider/history", label: "History", icon: "ic-history" },
  { href: "/rider/profile", label: "Profile", icon: "ic-user" },
];

/** Title + back behaviour for each rider route (mirrors the prototype's rTitle / rShowBack). */
function routeInfo(path: string): { title: string; back: string | null; tab: string } {
  const parts = path.split("/").filter(Boolean); // ["rider", ...]
  const [, a, b, c] = parts;
  if (!a) return { title: "", back: null, tab: "/rider" };
  if (a === "map") return { title: "Map", back: null, tab: "/rider/map" };
  if (a === "history") return { title: "History", back: null, tab: "/rider/history" };
  if (a === "profile") return { title: "Profile", back: null, tab: "/rider/profile" };
  if (a === "closing") return { title: "Daily closing", back: "/rider", tab: "" };
  if (a === "success") return { title: "Payment recorded", back: null, tab: "" };
  if (a === "customers" && b && c === "collect") return { title: "Collect payment", back: `/rider/customers/${b}`, tab: "" };
  if (a === "customers" && b) return { title: "Customer", back: "back", tab: "" };
  return { title: "My customers", back: null, tab: "/rider/customers" };
}

export function RiderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, back, tab } = routeInfo(pathname);
  const isHome = pathname === "/rider";
  const isMap = pathname === "/rider/map";

  return (
    <div className="flex min-h-screen justify-center bg-[#EBEBED]">
      <div className="flex min-h-screen w-full max-w-[480px] flex-col bg-white shadow-[0_0_0_1px_#E4E4E7]">
        {!isHome && (
          <header className="sticky top-0 z-20 flex flex-col gap-1 border-b border-line-card bg-white p-4 text-ink">
            <div className="flex min-h-10 items-center gap-2">
              {back && (
                <button
                  onClick={() => (back === "back" ? router.back() : router.push(back))}
                  aria-label="Back"
                  className="-ml-2.5 size-11 border-0 bg-transparent text-[22px] text-ink"
                >
                  ←
                </button>
              )}
              <h1 className="m-0 text-lg font-semibold tracking-normal">{title}</h1>
            </div>
          </header>
        )}
        <main className={cn("flex flex-1 flex-col gap-4", isMap ? "pb-[72px]" : "px-4 pt-4 pb-[100px]")}>{children}</main>
        <nav
          aria-label="Rider navigation"
          className="fixed bottom-0 left-1/2 z-30 grid h-[72px] w-full max-w-[480px] -translate-x-1/2 grid-cols-5 border-t border-line-card bg-white pb-[env(safe-area-inset-bottom)]"
        >
          {TABS.map((t) => {
            const on = t.href === tab;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn("flex flex-col items-center justify-center gap-1 text-xs hover:no-underline", on ? "font-semibold text-brand hover:text-brand" : "font-medium text-muted-ink hover:text-ink")}
              >
                <Icon name={t.icon} size={22} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Modals />
    </div>
  );
}
