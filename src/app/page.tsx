"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BootScreen } from "@/components/app-providers";
import { homeFor } from "@/components/auth-guard";
import { useAppStore } from "@/store/app-store";

export default function Home() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);
  useEffect(() => {
    if (hydrated) router.replace(session ? homeFor(session.role) : "/login");
  }, [hydrated, session, router]);
  return <BootScreen />;
}
