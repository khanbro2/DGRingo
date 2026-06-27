import { useState, type ReactNode } from "react";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import { useApp } from "../store/AppStore";

/** Sign up / Log in. Gates the whole app — nothing is reachable until logged in. */
export function AuthScreen() {
  const { login, showToast } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const submit = () => {
    if (!email.trim() || !pw.trim() || (mode === "signup" && !name.trim())) {
      showToast("Please fill in all fields", "error");
      return;
    }
    login(email.trim(), mode === "signup" ? name.trim() : undefined);
    showToast(mode === "signup" ? "Account created 🎉" : "Welcome back!");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", display: "flex", flexDirection: "column", padding: "0 24px" }}>
      {/* Brand */}
      <div style={{ paddingTop: 64, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: "0 auto 18px",
          background: gradients.brand, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 30, boxShadow: "0 12px 36px rgba(79,142,247,0.4)",
        }}>📦</div>
        <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800 }}>DGRINGO</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
          {mode === "signup" ? "Create your workspace" : "Log in to your workspace"}
        </p>
      </div>

      {/* Mode switch */}
      <div style={{
        marginTop: 32, background: C.input, borderRadius: radius.md, padding: 4,
        display: "flex", border: `1px solid ${C.line}`,
      }}>
        {(["signup", "login"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer",
            background: mode === m ? gradients.brand : "transparent",
            color: mode === m ? "#fff" : C.muted, fontSize: 13, fontWeight: 700,
            fontFamily: font.sans, transition: "background 0.2s",
          }}>{m === "signup" ? "Sign Up" : "Log In"}</button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "signup" && (
          <Field icon={<UserIcon size={16} color={C.muted} />} placeholder="Full name" value={name} onChange={setName} />
        )}
        <Field icon={<Mail size={16} color={C.muted} />} placeholder="Email address" value={email} onChange={setEmail} type="email" />
        <Field icon={<Lock size={16} color={C.muted} />} placeholder="Password" value={pw} onChange={setPw} type="password" />
      </div>

      <button onClick={submit} style={{
        marginTop: 24, padding: "15px", border: "none", borderRadius: radius.md,
        background: gradients.brand, color: "#fff", fontSize: 15, fontWeight: 800,
        cursor: "pointer", fontFamily: font.sans, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 8px 24px rgba(79,142,247,0.35)",
      }}>
        {mode === "signup" ? "Create account" : "Log in"} <ArrowRight size={17} />
      </button>

      <p style={{ color: C.faint, fontSize: 11, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
        By continuing you agree to DGRINGO's<br />Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function Field({ icon, placeholder, value, onChange, type = "text" }: {
  icon: ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>{icon}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} type={type}
        style={{
          width: "100%", padding: "14px 14px 14px 42px",
          background: C.input, border: `1px solid ${C.line}`, borderRadius: radius.md,
          color: C.text, fontSize: 14, outline: "none", fontFamily: font.sans,
        }}
      />
    </div>
  );
}
