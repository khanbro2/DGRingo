import { useState } from "react";
import { A, Card, Button, PageHeader } from "../ui";

export function SettingsPage({ toast }: { toast: (m: string) => void }) {
  const [name, setName] = useState("Admin");
  const [email, setEmail] = useState("admin@dgringo.app");
  const [alerts, setAlerts] = useState({ newUsers: true, failedPayments: true, lowBalance: true });

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ color: A.muted, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7 }}>{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "11px 14px", background: A.panelAlt, border: `1px solid ${A.line}`, borderRadius: 11, color: A.text, fontSize: 14, outline: "none" }} />
    </div>
  );
  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", background: on ? A.blue : "rgba(255,255,255,0.12)" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </button>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Control Hub preferences" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Admin profile</p>
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} />
          <Button onClick={() => toast("Profile saved")}>Save</Button>
        </Card>
        <Card>
          <p style={{ color: A.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Admin alerts</p>
          {([["newUsers", "New user signups"], ["failedPayments", "Failed payments"], ["lowBalance", "Telnyx low balance"]] as const).map(([k, label]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${A.lineSoft}` }}>
              <span style={{ color: A.text, fontSize: 14 }}>{label}</span>
              <Toggle on={alerts[k]} onClick={() => setAlerts((p) => ({ ...p, [k]: !p[k] }))} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
