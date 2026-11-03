"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { homeFor } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useAppStore } from "@/store/app-store";

type Role = "owner" | "rider";
const DEMO: Record<Role, { user: string; pass: string }> = {
  owner: { user: "owner@collecto.lk", pass: "owner123" },
  rider: { user: "kasun", pass: "1234" },
};

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);
  const [role, setRole] = useState<Role>("owner");
  const [user, setUser] = useState(DEMO.owner.user);
  const [pass, setPass] = useState(DEMO.owner.pass);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (hydrated && session) router.replace(homeFor(session.role));
  }, [hydrated, session, router]);

  const pick = (r: Role) => {
    setRole(r);
    setUser(DEMO[r].user);
    setPass(DEMO[r].pass);
    setErr("");
    setInfo("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.auth.login(role, user, pass, remember);
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
        : "A password reset link would be sent to the registered owner email. (Not connected in this demo.)",
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

          <button type="submit" className="h-12 rounded-[10px] border-0 bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover">
            Sign in
          </button>
        </form>

        <div className="text-center text-meta leading-[1.6] text-muted-ink">
          Demo accounts — Owner: owner@collecto.lk / owner123
          <br />
          Riders: kasun, nimal or tharindu / 1234
        </div>
      </div>
    </div>
  );
}
