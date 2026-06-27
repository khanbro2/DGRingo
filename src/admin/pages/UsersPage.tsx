import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { A, Card, Badge, Button, Table, Td, PageHeader, money } from "../ui";
import { USERS, type AdminUser } from "../mock";

export function UsersPage({ toast }: { toast: (m: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>(USERS);
  const [q, setQ] = useState("");

  const filtered = users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => setUsers((prev) => prev.map((u) =>
    u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u));

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} accounts`}
        action={<Button onClick={() => toast("Invite user — coming soon")}><UserPlus size={15} /> Invite user</Button>} />

      <Card pad={0}>
        <div style={{ padding: 16, borderBottom: `1px solid ${A.line}`, position: "relative" }}>
          <Search size={15} color={A.muted} style={{ position: "absolute", left: 30, top: 27 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…"
            style={{ width: "100%", maxWidth: 340, padding: "10px 14px 10px 38px", background: A.panelAlt, border: `1px solid ${A.line}`, borderRadius: 11, color: A.text, fontSize: 13.5, outline: "none" }} />
        </div>
        <Table head={["User", "Plan", "Numbers", "Balance", "Status", "Joined", ""]}>
          {filtered.map((u) => (
            <tr key={u.id}>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: A.panelAlt, display: "flex", alignItems: "center", justifyContent: "center", color: A.text, fontWeight: 800, fontSize: 13 }}>{u.name.charAt(0)}</div>
                  <div>
                    <p style={{ fontWeight: 700 }}>{u.name}</p>
                    <p style={{ color: A.muted, fontSize: 12 }}>{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td><Badge tone={u.plan === "Business" ? "purple" : u.plan === "Pro" ? "blue" : "muted"}>{u.plan}</Badge></Td>
              <Td>{u.numbers}</Td>
              <Td style={{ fontWeight: 700 }}>{money(u.balance)}</Td>
              <Td><Badge tone={u.status === "active" ? "green" : u.status === "trial" ? "amber" : "red"}>{u.status}</Badge></Td>
              <Td style={{ color: A.muted }}>{u.joined}</Td>
              <Td><Button size="sm" variant={u.status === "suspended" ? "primary" : "danger"} onClick={() => toggle(u.id)}>{u.status === "suspended" ? "Reactivate" : "Suspend"}</Button></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
