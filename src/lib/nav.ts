import type { IconName } from "@/components/icon";

export type OwnerPage = "dashboard" | "customers" | "installments" | "collections" | "products" | "inventory" | "riders" | "reports" | "audit" | "settings";

export const NAV: Record<OwnerPage, { label: string; icon: IconName; href: string }> = {
  dashboard: { label: "Dashboard", icon: "ic-grid", href: "/dashboard" },
  customers: { label: "Customers", icon: "ic-users", href: "/customers" },
  installments: { label: "Installments", icon: "ic-calclock", href: "/installments" },
  collections: { label: "Collections", icon: "ic-wallet", href: "/collections" },
  products: { label: "Products", icon: "ic-package", href: "/products" },
  inventory: { label: "Inventory", icon: "ic-archive", href: "/inventory" },
  riders: { label: "Riders", icon: "ic-bike", href: "/riders" },
  reports: { label: "Reports", icon: "ic-chart", href: "/reports" },
  audit: { label: "Audit Log", icon: "ic-history", href: "/audit" },
  settings: { label: "Settings", icon: "ic-sliders", href: "/settings" },
};

export const NAV_GROUPS: { key: "main" | "manage" | "work"; label: string; pages: OwnerPage[] }[] = [
  { key: "main", label: "Main menu", pages: ["dashboard", "customers", "installments", "collections"] },
  { key: "manage", label: "Manage", pages: ["products", "inventory", "riders"] },
  { key: "work", label: "Workspace", pages: ["reports", "audit", "settings"] },
];

/** Resolve the active nav page + breadcrumb from a pathname. */
export function navFromPath(pathname: string) {
  const seg = pathname.split("/")[1] as OwnerPage;
  const page: OwnerPage = seg in NAV ? seg : "dashboard";
  const isProfile = page === "customers" && pathname.split("/").length > 2;
  const group = NAV_GROUPS.find((g) => g.pages.includes(page))!;
  return { page, group: group.label, crumb: isProfile ? "Customer profile" : NAV[page].label, icon: NAV[page].icon };
}
