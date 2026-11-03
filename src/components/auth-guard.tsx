"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { BootScreen } from "./app-providers";

export const homeFor = (role: Role) => (role === "owner" ? "/dashboard" : "/rider");

/** Client-side route guard (sessions live in browser storage while the API is mocked). */
export function AuthGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);
  const allowed = hydrated && session?.role === role;

  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace("/login");
    else if (session.role !== role) router.replace(homeFor(session.role));
  }, [hydrated, session, role, router]);

  return allowed ? <>{children}</> : <BootScreen />;
}
