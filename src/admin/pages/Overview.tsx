import { useEffect, useState } from "react";
import { Users, Phone, DollarSign, MessageSquare, PhoneCall } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { A, Card, StatCard, Badge, Table, Td, PageHeader, money } from "../ui";
import { KPIS, MESSAGES_7D, REVENUE_6M, TXNS } from "../mock";
import { telnyx } from "../../app/services/telnyx";

export function Overview() {
  const [balance, setBalance] = useState<string>("…");
  useEffect(() => { telnyx.getBalance().then((b) => setBalance(`$${b.balance}`)).catch(() => setBalance("—")); }, []);

  return (
    <div>
      <PageHeader title="Overview" subtitle="Platform health at a glance" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 18 }}>
        <StatCard label="Total users" value={KPIS.totalUsers.toLocaleString()} delta="+4.2%" accent={A.blue} icon={<Users size={20} color={A.blue} />} />
        <StatCard label="Active numbers" value={KPIS.activeNumbers.toLocaleString()} delta="+1.8%" accent={A.purple} icon={<Phone size={20} color={A.purple} />} />
        <StatCard label="MRR" value={money(KPIS.mrr)} delta="+6.5%" accent={A.green} icon={<DollarSign size={20} color={A.green} />} />
        <StatCard label="SMS (7d)" value={`${(KPIS.smsSent / 1000).toFixed(1)}k`} delta="+11%" accent={A.amber} icon={<MessageSquare size={20} color={A.amber} />} />
        <StatCard label="Telnyx balance" value={balance} accent={A.green} icon={<PhoneCall size={20} color={A.green} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 18 }}>
        <Card>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Messages — last 7 days</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MESSAGES_7D} margin={{ left: -18, right: 6 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A.blue} stopOpacity={0.5} /><stop offset="100%" stopColor={A.blue} stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A.purple} stopOpacity={0.5} /><stop offset="100%" stopColor={A.purple} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={A.lineSoft} vertical={false} />
              <XAxis dataKey="d" stroke={A.faint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={A.faint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: A.panelAlt, border: `1px solid ${A.line}`, borderRadius: 10, color: A.text, fontSize: 12 }} />
              <Area type="monotone" dataKey="sms" stroke={A.blue} fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="mms" stroke={A.purple} fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Revenue — 6 months</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={REVENUE_6M} margin={{ left: -10, right: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={A.lineSoft} vertical={false} />
              <XAxis dataKey="m" stroke={A.faint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={A.faint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: A.panelAlt, border: `1px solid ${A.line}`, borderRadius: 10, color: A.text, fontSize: 12 }} formatter={(v: number) => money(v)} />
              <Bar dataKey="rev" fill={A.green} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card pad={0}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${A.line}` }}>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700 }}>Recent transactions</p>
        </div>
        <Table head={["ID", "User", "Type", "Amount", "Status"]}>
          {TXNS.slice(0, 5).map((t) => (
            <tr key={t.id}>
              <Td style={{ fontFamily: "monospace", color: A.muted }}>{t.id}</Td>
              <Td>{t.user}</Td>
              <Td style={{ textTransform: "capitalize", color: A.muted }}>{t.type}</Td>
              <Td style={{ fontWeight: 700, color: t.amount < 0 ? A.text : A.green }}>{money(t.amount)}</Td>
              <Td><Badge tone={t.status === "completed" ? "green" : t.status === "pending" ? "amber" : "red"}>{t.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
