/**
 * Admin (Control Hub) auth. A single shared admin password gates the dashboard;
 * the server returns a short-lived token stored in localStorage and verified on
 * load. Keeps the Control Hub off the public internet.
 */
const KEY = "dg-admin-token";

export const getAdminToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const saveAdminToken = (t: string) => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } };
export const clearAdminToken = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

export type Role = "admin" | "agent";
export interface Session { role: Role; name: string; }

export async function adminLogin(password: string): Promise<void> {
  const r = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const j = await r.json().catch(() => ({} as { token?: string; error?: string }));
  if (!r.ok || !j.token) throw new Error(j.error || "Sign-in failed");
  saveAdminToken(j.token);
}

/** Team-member (agent) sign-in — email + password. Stores the same token key. */
export async function agentLogin(email: string, password: string): Promise<void> {
  const r = await fetch("/api/agent/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({} as { token?: string; error?: string }));
  if (!r.ok || !j.token) throw new Error(j.error || "Sign-in failed");
  saveAdminToken(j.token);
}

/** Verify the stored token and resolve the session role (owner-admin or agent). */
export async function verifySession(): Promise<Session | null> {
  const token = getAdminToken();
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const a = await fetch("/api/admin/verify", { headers }).then((r) => r.json()).catch(() => ({}));
    if (a?.ok) return { role: "admin", name: "Admin" };
  } catch { /* try agent */ }
  try {
    const g = await fetch("/api/agent/verify", { headers }).then((r) => r.json()).catch(() => ({}));
    if (g?.ok) return { role: "agent", name: g.name || "Agent" };
  } catch { /* not signed in */ }
  return null;
}
