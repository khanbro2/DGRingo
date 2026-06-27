import { useState } from "react";
import { Search } from "lucide-react";
import { A, Card, Badge, Table, Td, PageHeader, money } from "../ui";
import { NUMBERS } from "../mock";

export function NumbersPage() {
  const [q, setQ] = useState("");
  const filtered = NUMBERS.filter((n) => (n.number + n.owner).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Numbers" subtitle={`${NUMBERS.length} provisioned across all users (via Telnyx)`} />
      <Card pad={0}>
        <div style={{ padding: 16, borderBottom: `1px solid ${A.line}`, position: "relative" }}>
          <Search size={15} color={A.muted} style={{ position: "absolute", left: 30, top: 27 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search numbers or owners…"
            style={{ width: "100%", maxWidth: 340, padding: "10px 14px 10px 38px", background: A.panelAlt, border: `1px solid ${A.line}`, borderRadius: 11, color: A.text, fontSize: 13.5, outline: "none" }} />
        </div>
        <Table head={["Number", "Owner", "Type", "Status", "10DLC", "Monthly"]}>
          {filtered.map((n) => (
            <tr key={n.number}>
              <Td style={{ fontFamily: "monospace", fontWeight: 700 }}>{n.flag} {n.number}</Td>
              <Td>{n.owner}</Td>
              <Td style={{ color: A.muted }}>{n.type}</Td>
              <Td><Badge tone={n.status === "active" ? "green" : "amber"}>{n.status}</Badge></Td>
              <Td><Badge tone={n.tenDlc === "verified" ? "green" : n.tenDlc === "pending" ? "amber" : "red"}>{n.tenDlc}</Badge></Td>
              <Td style={{ fontWeight: 700 }}>{money(n.monthly)}<span style={{ color: A.muted, fontWeight: 400 }}>/mo</span></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
