import { beforeEach, describe, expect, it, vi } from "vitest";
import * as calc from "@/lib/calc";
import { emptyData, useAppStore } from "@/store/app-store";
import { setAccessToken } from "@/services/http";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const session = { role: "owner", name: "Owner", id: "U0" };
const login = () => json(200, { success: true, data: { accessToken: "tok", expiresIn: 900, session } });
const boot = (today = "2026-10-14") =>
  json(200, { success: true, data: { ...emptyData(), today, notifs: [{ id: "N1", read: false }] } });
let f: ReturnType<typeof vi.fn>;
const urls = () =>
  f.mock.calls.map((c) => `${(c[1] as RequestInit).method} ${String(c[0]).replace("http://api.test/api/v1", "")}`);

beforeEach(() => {
  f = vi.fn();
  vi.stubGlobal("fetch", f);
  setAccessToken(null);
  useAppStore.setState({ session: null, data: emptyData(), hydrated: false });
});

describe("store", () => {
  it("login loads the bootstrap, adopts the server's today and exposes the session", async () => {
    f.mockResolvedValueOnce(login()).mockResolvedValueOnce(boot());
    const r = await useAppStore.getState().login("owner", "owner", "pw", true);
    expect(r.ok).toBe(true);
    expect(useAppStore.getState().session).toEqual(session);
    expect(calc.TODAY).toBe("2026-10-14");
    expect(urls()).toEqual(["POST /auth/login", "GET /bootstrap"]);
  });
  it("a failed login leaves the store signed out and returns the message", async () => {
    f.mockResolvedValueOnce(json(401, { success: false, message: "Invalid username or password" }));
    expect(await useAppStore.getState().login("owner", "x", "y", false)).toEqual({
      ok: false,
      error: "Invalid username or password",
    });
    expect(useAppStore.getState().session).toBeNull();
  });
  it("logout clears the session and data", async () => {
    f.mockResolvedValueOnce(login()).mockResolvedValueOnce(boot()).mockResolvedValueOnce(json(200, { success: true }));
    await useAppStore.getState().login("owner", "o", "p", false);
    await useAppStore.getState().logout();
    expect(useAppStore.getState().session).toBeNull();
    expect(useAppStore.getState().data.notifs).toEqual([]);
  });
  it("reload replaces the data and keeps it on failure", async () => {
    f.mockResolvedValueOnce(boot("2026-10-15"));
    expect((await useAppStore.getState().reload()).ok).toBe(true);
    expect(calc.TODAY).toBe("2026-10-15");
    f.mockResolvedValueOnce(json(500, { success: false, message: "boom" }));
    expect((await useAppStore.getState().reload()).ok).toBe(false);
    expect(useAppStore.getState().data.notifs).toHaveLength(1);
  });
  it("markNotifsRead updates at once and reloads if the server call fails", async () => {
    f.mockResolvedValueOnce(boot());
    await useAppStore.getState().reload();
    f.mockResolvedValueOnce(json(500, { success: false, message: "x" })).mockResolvedValueOnce(boot());
    useAppStore.getState().markNotifsRead();
    expect(useAppStore.getState().data.notifs[0]!.read).toBe(true);
    await vi.waitFor(() => expect(urls()).toContain("POST /notifications/read-all"));
    await vi.waitFor(() => expect(useAppStore.getState().data.notifs[0]!.read).toBe(false));
  });
});
