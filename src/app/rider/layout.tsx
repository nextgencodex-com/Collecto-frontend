import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { RiderShell } from "@/components/layout/rider/rider-shell";

export const metadata: Metadata = { title: "Rider" };

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="rider">
      <RiderShell>{children}</RiderShell>
    </AuthGuard>
  );
}
