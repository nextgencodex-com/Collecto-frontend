"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { homeFor } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useAppStore } from "@/store/app-store";

type Role = "owner" | "rider";
/** Demo accounts are pre-filled and advertised in development builds only. */
const SHOW_DEMO = process.env.NODE_ENV !== "production";
const DEMO: Record<Role, { user: string; pass: string }> = {
  owner: { user: "owner@collecto.lk", pass: "owner123" },
  rider: { user: "kasun", pass: "1234" },
};

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);
  const [role, setRole] = useState<Role>("owner");
  const [user, setUser] = useState(SHOW_DEMO ? DEMO.owner.user : "");
  const [pass, setPass] = useState(SHOW_DEMO ? DEMO.owner.pass : "");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (hydrated && session) router.replace(homeFor(session.role));
  }, [hydrated, session, router]);

  const pick = (r: Role) => {
    setRole(r);
    setUser(SHOW_DEMO ? DEMO[r].user : "");
    setPass(SHOW_DEMO ? DEMO[r].pass : "");
    setErr("");
    setInfo("");
  };

  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await api.auth.login(role, user, pass, remember);
    setBusy(false);
    if (!res.ok) {
      setInfo("");
      setErr(res.error);
    }
  };

  const forgot = () => {
    setErr("");
    setInfo(
      role === "rider"
        ? "Riders: ask the shop owner to reset your password from the Riders screen."
        : "Password reset is not available yet. Please contact the system administrator.",
    );
  };

  const input = "h-11 w-full rounded-lg border border-line-input bg-white px-3 text-[15px] text-ink";
  const label = "flex flex-col gap-1.5 text-13 font-medium text-body";

  return (
    <div className="grid min-h-screen place-items-center bg-app px-4 py-6">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[28px] font-bold tracking-[-.02em] text-ink">COLLECTO</div>
          <div className="text-sm text-muted-ink">Smart Installment &amp; Collection Management</div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-line-card bg-white p-6">
          <div role="tablist" aria-label="Sign in as" className="grid grid-cols-2 gap-1 rounded-[10px] bg-[#F0F0F2] p-1">
            {(
              [
                ["owner", "Owner / Admin"],
                ["rider", "Rider"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={role === k}
                onClick={() => pick(k)}
                className={cn("h-10 rounded-lg border-0 text-sm font-semibold", role === k ? "bg-white text-ink" : "bg-transparent text-muted-ink")}
              >
                {l}
              </button>
            ))}
          </div>

          <label className={label}>
            {role === "rider" ? "Username or phone" : "Email or username"}
            <input
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                setErr("");
              }}
              autoComplete="username"
              className={input}
            />
          </label>
          <label className={label}>
            Password
            <input
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setErr("");
              }}
              autoComplete="current-password"
              className={input}
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-13 whitespace-nowrap text-body">
              <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} className="size-4 accent-brand" />
              Remember me
            </label>
            <button type="button" onClick={forgot} className="border-0 bg-transparent p-0 text-13 font-medium text-brand">
              Forgot password?
            </button>
          </div>

          {err && (
            <div role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-13 text-danger">
              {err}
            </div>
          )}
          {info && <div className="rounded-lg bg-brand-soft px-3 py-2.5 text-13 text-brand-ink">{info}</div>}

          <button type="submit" disabled={busy} className="h-12 rounded-[10px] border-0 bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {SHOW_DEMO && (
          <div className="text-center text-meta leading-[1.6] text-muted-ink">
            Demo accounts — Owner: owner@collecto.lk / owner123
            <br />
            Riders: kasun, nimal or tharindu / 1234
          </div>
        )}
      </div>
    </div>
  );
}
