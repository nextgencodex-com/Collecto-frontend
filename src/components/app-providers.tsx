"use client";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/app-store";
import { useUI } from "@/store/ui-store";

/** Restores the session after mount (storage is client-only) and mounts global toasts. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const closeModal = useUI((s) => s.close);
  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);
  // close any modal when the user signs out
  useEffect(() => useAppStore.subscribe((s, p) => void (p.session && !s.session && closeModal())), [closeModal]);
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#18181B", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 500 },
        }}
      />
    </>
  );
}

/** Full-screen placeholder shown until client storage has been read. */
export function BootScreen() {
  return <div className="grid min-h-screen place-items-center text-sm text-muted-ink">Loading COLLECTO…</div>;
}
