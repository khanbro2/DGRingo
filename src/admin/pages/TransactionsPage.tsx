import { useState } from "react";
import { A, Card, Badge, Button, Table, Td, PageHeader, money } from "../ui";
import { TXNS, type TxnType } from "../mock";

const FILTERS: Array<TxnType | "all"> = ["all", "top-up", "subscription", "sms", "call", "number", "refund"];

export function TransactionsPage({ toast }: { toast: (m: string) => void }) {
  const [filter, setFilter] = useState<TxnType | "all">("all");
  const rows = TXNS.filter((t) => filter === "all" || t.type === filter);
  const net = rows.reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Full platform ledger"
        action={<Button variant="ghost" onClick={() => toast("Exporting CSV…")}>Export CSV</Button>} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
            textTransform: "capitalize", border: `1px solid ${filter === f ? A.blue : A.line}`,
            background: filter === f ? "rgba(79,142,247,0.14)" : A.panel, color: filter === f ? A.blue : A.muted,
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: "auto", alignSelf: "center", color: A.muted, fontSize: 13 }}>
          Net: <span style={{ color: net < 0 ? A.red : A.green, fontWeight: 800 }}>{money(net)}</span>
        </div>
      </div>

      <Card pad={0}>
        <Table head={["ID", "Date", "User", "Type", "Amount", "Status"]}>
          {rows.map((t) => (
            <tr key={t.id}>
              <Td style={{ fontFamily: "monospace", color: A.muted }}>{t.id}</Td>
              <Td style={{ color: A.muted }}>{t.date}</Td>
              <Td>{t.user}</Td>
              <Td style={{ textTransform: "capitalize" }}>{t.type}</Td>
              <Td style={{ fontWeight: 700, color: t.amount < 0 ? A.text : A.green }}>{money(t.amount)}</Td>
              <Td><Badge tone={t.status === "completed" ? "green" : t.status === "pending" ? "amber" : "red"}>{t.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
