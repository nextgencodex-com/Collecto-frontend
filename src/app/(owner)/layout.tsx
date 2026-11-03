import { AuthGuard } from "@/components/auth-guard";
import { OwnerShell } from "@/components/layout/owner/owner-shell";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="owner">
      <OwnerShell>{children}</OwnerShell>
    </AuthGuard>
  );
}
