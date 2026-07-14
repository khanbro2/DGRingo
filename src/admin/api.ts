/** Authed fetch for the Control Hub — attaches the admin/agent bearer token. */
import { getAdminToken } from "./adminAuth";

async function areq<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const r = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || "Request failed");
  return j as T;
}

/* ---- support chat ---- */
export interface AdminThread { userId: number; name: string; email: string; unread: number; lastSender: string; lastBody: string; time: string; }
export interface AdminSupportMessage { id: string; sender: "user" | "agent"; agentName: string | null; body: string; time: string; }

export const adminGetThreads = () => areq<{ threads: AdminThread[] }>("/api/support/threads");
export const adminGetThread = (userId: number) => areq<{ messages: AdminSupportMessage[] }>(`/api/support/thread?userId=${userId}`);
export const adminReply = (userId: number, body: string) =>
  areq<{ ok: boolean; messages: AdminSupportMessage[] }>(`/api/support/thread?userId=${userId}`, { method: "POST", body: JSON.stringify({ body }) });

/* ---- team (agents) ---- */
export interface AdminAgent { id: number; name: string; email: string; active: boolean; time: string; }
export const adminGetAgents = () => areq<{ agents: AdminAgent[] }>("/api/admin/agents");
export const adminCreateAgent = (a: { name: string; email: string; password: string }) =>
  areq<{ ok: boolean; agent: AdminAgent }>("/api/admin/agents", { method: "POST", body: JSON.stringify(a) });
export const adminDeleteAgent = (id: number) =>
  areq<{ ok: boolean }>(`/api/admin/agents?id=${id}`, { method: "DELETE" });
