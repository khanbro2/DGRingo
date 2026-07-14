import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { A, Card, Badge, Button, Table, Td, PageHeader, Modal, Input } from "../ui";
import { adminGetAgents, adminCreateAgent, adminDeleteAgent, type AdminAgent } from "../api";

/** Team management — create / remove support team members (agents) who can sign
 *  into the Control Hub and answer customer chats. */
export function AdminTeam({ toast }: { toast: (m: string) => void }) {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { adminGetAgents().then((r) => setAgents(r.agents)).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (busy) return;
    if (!email.trim() || password.length < 6) { toast("Email and a 6+ char password are required"); return; }
    setBusy(true);
    try {
      await adminCreateAgent({ name: name.trim(), email: email.trim(), password });
      toast("Team member added");
      setAdding(false); setName(""); setEmail(""); setPassword("");
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Could not add"); }
    finally { setBusy(false); }
  };

  const remove = async (a: AdminAgent) => {
    try { await adminDeleteAgent(a.id); toast(`Removed ${a.name || a.email}`); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not remove"); }
  };

  return (
    <div>
      <PageHeader title="Team" subtitle={`${agents.length} support member${agents.length === 1 ? "" : "s"}`}
        action={<Button onClick={() => setAdding(true)}><UserPlus size={15} /> Add team member</Button>} />

      <Card pad={0}>
        <Table head={["Name", "Email", "Status", "Added", ""]}>
          {agents.length === 0 ? (
            <tr><td colSpan={5} style={{ color: A.muted, textAlign: "center", padding: "34px 0", fontSize: 13.5 }}>No team members yet — add one so they can answer support chats.</td></tr>
          ) : agents.map((a) => (
            <tr key={a.id}>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: A.panelAlt, display: "flex", alignItems: "center", justifyContent: "center", color: A.text, fontWeight: 800, fontSize: 13 }}>{(a.name || a.email).charAt(0).toUpperCase()}</div>
                  <p style={{ fontWeight: 700 }}>{a.name || "—"}</p>
                </div>
              </Td>
              <Td style={{ color: A.muted }}>{a.email}</Td>
              <Td><Badge tone={a.active ? "green" : "muted"}>{a.active ? "Active" : "Disabled"}</Badge></Td>
              <Td style={{ color: A.muted }}>{a.time}</Td>
              <Td><Button size="sm" variant="danger" onClick={() => remove(a)}><Trash2 size={13} /> Remove</Button></Td>
            </tr>
          ))}
        </Table>
      </Card>

      {adding && (
        <Modal title="Add team member" onClose={() => setAdding(false)}>
          <Input label="Name" value={name} onChange={setName} placeholder="Jane Doe" />
          <Input label="Email" value={email} onChange={setEmail} placeholder="jane@yourteam.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />
          <p style={{ color: A.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
            They sign in at this Control Hub with these details (choose “Team member” on the login screen) and can answer customer chats.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={create}>{busy ? "Adding…" : "Add member"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
