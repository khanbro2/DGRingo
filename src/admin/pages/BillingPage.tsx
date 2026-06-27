import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { A, Card, Badge, Button, Table, Td, PageHeader, money } from "../ui";
import { PLANS, INVOICES, KPIS } from "../mock";
import { telnyx } from "../../app/services/telnyx";

export function BillingPage({ toast }: { toast: (m: string) => void }) {
  const [balance, setBalance] = useState("…");
  const [credit, setCredit] = useState("…");
  useEffect(() => {
    telnyx.getBalance().then((b) => { setBalance(`$${b.balance}`); setCredit(`$${b.available_credit}`); }).catch(() => { setBalance("—"); setCredit("—"); });
  }, []);

  return (
    <div>
      <PageHeader title="Billing" subtitle="Plans, revenue and Telnyx account funding" />

      {/* Money summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18 }}>
        <Card><p style={{ color: A.muted, fontSize: 12.5 }}>Monthly recurring revenue</p><p style={{ color: A.text, fontSize: 26, fontWeight: 800, marginTop: 8 }}>{money(KPIS.mrr)}</p></Card>
        <Card><p style={{ color: A.muted, fontSize: 12.5 }}>Telnyx balance</p><p style={{ color: A.green, fontSize: 26, fontWeight: 800, marginTop: 8 }}>{balance}</p></Card>
        <Card><p style={{ color: A.muted, fontSize: 12.5 }}>Available credit</p><p style={{ color: A.text, fontSize: 26, fontWeight: 800, marginTop: 8 }}>{credit}</p></Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Button onClick={() => toast("Opening Telnyx funding…")}>Add Telnyx funds</Button>
        </Card>
      </div>

      {/* Plans */}
      <p style={{ color: A.text, fontSize: 16, fontWeight: 700, margin: "4px 0 12px" }}>Plans</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 22 }}>
        {PLANS.map((p) => (
          <Card key={p.name} style={p.name === "Pro" ? { border: `1px solid ${A.blue}` } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: A.text, fontSize: 16, fontWeight: 800 }}>{p.name}</p>
              {p.name === "Pro" && <Badge tone="blue">Popular</Badge>}
            </div>
            <p style={{ color: A.text, fontSize: 28, fontWeight: 800, marginTop: 10 }}>${p.price}<span style={{ color: A.muted, fontSize: 13, fontWeight: 500 }}>/mo</span></p>
            <p style={{ color: A.muted, fontSize: 12.5, marginTop: 4 }}>{p.users} active subscribers</p>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {p.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={15} color={A.green} /><span style={{ color: A.muted, fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Invoices */}
      <Card pad={0}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${A.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700 }}>Recent invoices</p>
          <Button variant="ghost" size="sm" onClick={() => toast("Exporting invoices…")}>Export</Button>
        </div>
        <Table head={["Invoice", "User", "Period", "Amount", "Status", ""]}>
          {INVOICES.map((iv) => (
            <tr key={iv.id}>
              <Td style={{ fontFamily: "monospace", color: A.muted }}>{iv.id}</Td>
              <Td>{iv.user}</Td>
              <Td style={{ color: A.muted }}>{iv.period}</Td>
              <Td style={{ fontWeight: 700 }}>{money(iv.amount)}</Td>
              <Td><Badge tone={iv.status === "paid" ? "green" : iv.status === "due" ? "amber" : "red"}>{iv.status}</Badge></Td>
              <Td><Button size="sm" variant="ghost" onClick={() => toast(`Invoice ${iv.id}`)}>View</Button></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
