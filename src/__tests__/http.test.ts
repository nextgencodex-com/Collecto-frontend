import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onSessionLost, refreshAccessToken, request, setAccessToken } from "@/services/http";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const auth = (t: string) => json(200, { success: true, data: { accessToken: t, expiresIn: 900, session: { role: "owner" } } });
let fetchMock: ReturnType<typeof vi.fn>;
const calls = () =>
  fetchMock.mock.calls.map((c) => `${(c[1] as RequestInit).method} ${String(c[0]).replace("http://api.test/api/v1", "")}`);
const errorOf = (r: unknown) => (r as { error: string }).error;

beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 5)); // let the previous shared refresh promise reset
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setAccessToken("old");
  onSessionLost(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe("request", () => {
  it("sends the bearer token and credentials, and unwraps data", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { a: 1 } }));
    expect(await request("GET", "/x")).toEqual({ ok: true, value: { a: 1 } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer old");
    expect(init.credentials).toBe("include");
  });
  it("shows the first field error, else the server message, else a generic one", async () => {
    fetchMock.mockResolvedValueOnce(
      json(422, { success: false, message: "Validation failed", errors: [{ message: "Amount must be positive" }] }),
    );
    expect(errorOf(await request("POST", "/x"))).toBe("Amount must be positive");
    fetchMock.mockResolvedValueOnce(json(409, { success: false, message: "Out of stock" }));
    expect(errorOf(await request("POST", "/x"))).toBe("Out of stock");
    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 502 }));
    expect(errorOf(await request("GET", "/x"))).toMatch(/went wrong/);
  });
  it("reports a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("fail"));
    expect(errorOf(await request("GET", "/x"))).toMatch(/Cannot reach the server/);
  });
  it("on 401 refreshes once and retries with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { success: false, message: "expired" }))
      .mockResolvedValueOnce(auth("new"))
      .mockResolvedValueOnce(json(200, { success: true, data: 7 }));
    expect(await request("GET", "/x")).toEqual({ ok: true, value: 7 });
    expect(calls()).toEqual(["GET /x", "POST /auth/refresh", "GET /x"]);
    const retry = fetchMock.mock.calls[2]![1] as RequestInit;
    expect((retry.headers as Record<string, string>).Authorization).toBe("Bearer new");
  });
  it("signs out when the refresh fails", async () => {
    const lost = vi.fn();
    onSessionLost(lost);
    fetchMock.mockResolvedValue(json(401, { success: false, message: "no" }));
    expect(errorOf(await request("GET", "/x"))).toMatch(/session has expired/);
    expect(lost).toHaveBeenCalledOnce();
  });
  it("retry:false skips the refresh (a wrong password is not session expiry)", async () => {
    fetchMock.mockResolvedValue(json(401, { success: false, message: "Invalid credentials" }));
    expect(await request("POST", "/auth/login", { retry: false })).toEqual({ ok: false, error: "Invalid credentials" });
    expect(calls()).toEqual(["POST /auth/login"]);
  });
});

describe("refreshAccessToken", () => {
  it("shares one request between concurrent callers", async () => {
    fetchMock.mockResolvedValue(auth("t"));
    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("retries once after 300 ms when another tab just rotated the cookie (refresh_race)", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { success: false, errors: [{ code: "refresh_race", message: "race" }] }))
      .mockResolvedValueOnce(auth("fresh"));
    const started = Date.now();
    const result = await refreshAccessToken();
    expect(result?.accessToken).toBe("fresh");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Date.now() - started).toBeGreaterThanOrEqual(280);
  });
  it("does not retry an ordinary 401", async () => {
    fetchMock.mockResolvedValue(json(401, { success: false, message: "bad" }));
    expect(await refreshAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
