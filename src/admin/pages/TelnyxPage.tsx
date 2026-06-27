import { useEffect, useState } from "react";
import { Activity, KeyRound, Webhook, CheckCircle2, XCircle } from "lucide-react";
import { A, Card, Badge, Button, Table, Td, PageHeader } from "../ui";
import { telnyx } from "../../app/services/telnyx";
import { API_BASE, DEFAULT_MESSAGING_PROFILE_ID, DEFAULT_CONNECTION_ID } from "../../app/services/telnyx/config";
import type { MessagingProfile, Brand } from "../../app/services/telnyx/types";

export function TelnyxPage({ toast }: { toast: (m: string) => void }) {
  const [balance, setBalance] = useState("…");
  const [profiles, setProfiles] = useState<MessagingProfile[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  const load = () => {
    telnyx.getBalance().then((b) => { setBalance(`$${b.balance} ${b.currency}`); setOk(true); }).catch(() => { setBalance("—"); setOk(false); });
    telnyx.listMessagingProfiles().then(setProfiles).catch(() => {});
    telnyx.getBrand().then(setBrand).catch(() => {});
  };
  useEffect(load, []);

  const live = telnyx.mode === "live";
  const ConfigRow = ({ k, v }: { k: string; v: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${A.lineSoft}`, gap: 12 }}>
      <span style={{ color: A.muted, fontSize: 13 }}>{k}</span>
      <span style={{ color: A.text, fontSize: 13, fontFamily: "monospace", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );

  return (
    <div>
      <PageHeader title="Telnyx" subtitle="API connection, messaging & 10DLC configuration"
        action={<Button variant="ghost" onClick={() => { load(); toast("Re-checked Telnyx connection"); }}>Test connection</Button>} />

      {/* Connection status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 18 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {ok ? <CheckCircle2 size={20} color={A.green} /> : ok === false ? <XCircle size={20} color={A.red} /> : <Activity size={20} color={A.muted} />}
            <p style={{ color: A.text, fontWeight: 700 }}>Connection</p>
          </div>
          <div style={{ marginTop: 12 }}><Badge tone={live ? "green" : "amber"}>{live ? "LIVE" : "MOCK MODE"}</Badge></div>
          <p style={{ color: A.muted, fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
            {live ? "Proxying to api.telnyx.com via your backend." : "Using built-in mock data. Set VITE_TELNYX_MODE=live + run the proxy to go live."}
          </p>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><KeyRound size={20} color={A.blue} /><p style={{ color: A.text, fontWeight: 700 }}>Account balance</p></div>
          <p style={{ color: A.green, fontSize: 24, fontWeight: 800, marginTop: 12 }}>{balance}</p>
          <p style={{ color: A.muted, fontSize: 12, marginTop: 6 }}>Account-level (Telnyx has no per-number balance)</p>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Webhook size={20} color={A.purple} /><p style={{ color: A.text, fontWeight: 700 }}>Webhooks</p></div>
          <p style={{ color: A.text, fontSize: 13, fontFamily: "monospace", marginTop: 12, wordBreak: "break-all" }}>{API_BASE}/webhooks/messaging</p>
          <p style={{ color: A.muted, fontSize: 12, marginTop: 6 }}>Inbound SMS (message.received) + DLRs</p>
        </Card>
      </div>

      {/* 10DLC brand */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700 }}>10DLC Brand</p>
          <Badge tone={brand?.status === "VERIFIED" ? "green" : brand ? "amber" : "muted"}>{brand?.status ?? "Not registered"}</Badge>
        </div>
        <p style={{ color: A.muted, fontSize: 13 }}>{brand ? `${brand.displayName} · ${brand.entityType}` : "No brand registered yet. Users register via the app's Trust center."}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Messaging profiles */}
        <Card pad={0}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${A.line}` }}><p style={{ color: A.text, fontSize: 15, fontWeight: 700 }}>Messaging profiles</p></div>
          <Table head={["Name", "ID", "Enabled"]}>
            {profiles.length === 0 ? (
              <tr><Td style={{ color: A.muted }}>No profiles</Td><Td>—</Td><Td>—</Td></tr>
            ) : profiles.map((p) => (
              <tr key={p.id}>
                <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                <Td style={{ fontFamily: "monospace", color: A.muted }}>{p.id}</Td>
                <Td><Badge tone={p.enabled ? "green" : "muted"}>{p.enabled ? "on" : "off"}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>

        {/* Config */}
        <Card>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Configuration</p>
          <ConfigRow k="Mode" v={telnyx.mode} />
          <ConfigRow k="API base" v={API_BASE} />
          <ConfigRow k="Messaging profile" v={DEFAULT_MESSAGING_PROFILE_ID} />
          <ConfigRow k="Connection" v={DEFAULT_CONNECTION_ID} />
          <p style={{ color: A.faint, fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>
            The secret API key lives only in your backend proxy (server/telnyx-proxy.mjs) — never in this dashboard or the app.
          </p>
        </Card>
      </div>
    </div>
  );
}
