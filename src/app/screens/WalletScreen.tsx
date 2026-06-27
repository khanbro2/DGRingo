import { useState, useRef, useEffect, type CSSProperties, type MutableRefObject } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Plus, X, ShieldAlert } from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import { useApp } from "../store/AppStore";
import { paypalConfigured, loadPayPalSdk, createOrder, captureOrder } from "../services/paypal";

interface Props { onBack?: () => void; onOpenTrust: () => void; }

const PRESETS = [10, 20, 50, 100];

/**
 * Wallet — balance + top-up. Top-ups are paid via PayPal (real money): the
 * PayPal button creates + captures an order through the backend, and only on a
 * confirmed capture is the wallet credited.
 */
export function WalletScreen({ onBack, onOpenTrust }: Props) {
  const { state, addBalance, showToast } = useApp();
  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState(20);
  const amountRef = useRef(amount);
  amountRef.current = amount;
  const unverified = state.numbers.filter((n) => n.verification !== "verified").length;

  // Fallback used only when PayPal isn't configured (lets you test wallet logic).
  const topUpSimulated = () => { addBalance(amount); setSheet(false); showToast(`$${amount}.00 added (test)`); };
  const onPaid = (paid: number) => { addBalance(paid); setSheet(false); showToast(`$${paid.toFixed(2)} added to wallet`); };

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 24, position: "relative" }}>
      <div style={{ padding: "16px 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {onBack && <button onClick={onBack} style={iconBtn}><ArrowLeft size={17} color={C.text} /></button>}
        <h1 style={{ color: C.text, fontSize: 23, fontWeight: 800 }}>Wallet</h1>
      </div>

      {/* Balance card */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ borderRadius: 22, padding: "28px 24px", background: "linear-gradient(135deg,#112358 0%,#1e1047 55%,#0f2040 100%)", border: "1px solid rgba(79,142,247,0.18)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(79,142,247,0.08)" }} />
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>Available Balance</p>
          <p style={{ color: "#fff", fontSize: 46, fontWeight: 800, marginTop: 8, lineHeight: 1, letterSpacing: -1 }}>
            ${Math.floor(state.wallet.balance)}<span style={{ fontSize: 28, fontWeight: 600 }}>.{(state.wallet.balance % 1).toFixed(2).slice(2)}</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 8, fontFamily: font.mono }}>DGRINGO Wallet • {state.user?.name}</p>
          <button onClick={() => setSheet(true)} style={{ marginTop: 22, padding: "10px 22px", borderRadius: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Top Up
          </button>
        </div>
      </div>

      {/* Verification gating note */}
      {unverified > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <button onClick={onOpenTrust} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: radius.md, padding: 13, display: "flex", alignItems: "center", gap: 10, fontFamily: font.sans }}>
            <ShieldAlert size={17} color={C.amber} />
            <span style={{ color: C.amber, fontSize: 12, fontWeight: 600, flex: 1 }}>Balance added, but {unverified} number{unverified > 1 ? "s" : ""} must be registered to send SMS</span>
          </button>
        </div>
      )}

      {/* Transactions */}
      <div style={{ padding: "0 20px" }}>
        <p style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Transaction History</p>
        <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
          {state.wallet.txns.map((tx, i) => {
            const credit = tx.amount > 0;
            return (
              <div key={tx.id} style={{ padding: "13px 16px", borderBottom: i < state.wallet.txns.length - 1 ? `1px solid ${C.lineSoft}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, fontSize: 19, background: credit ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{credit ? "💳" : "📱"}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{tx.label}</p>
                  <p style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{tx.time}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {credit ? <ArrowDownLeft size={13} color={C.green} /> : <ArrowUpRight size={13} color={C.red} />}
                  <span style={{ color: credit ? C.green : C.red, fontSize: 14, fontWeight: 800 }}>{credit ? "+" : ""}{tx.amount.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-up sheet */}
      {sheet && (
        <div onClick={(e) => e.target === e.currentTarget && setSheet(false)} style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: "#111829", borderRadius: "26px 26px 0 0", border: `1px solid ${C.line}`, padding: "8px 20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 14px" }}><div style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} /></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ color: C.text, fontSize: 19, fontWeight: 800 }}>Top Up Wallet</h2>
              <button onClick={() => setSheet(false)} style={{ width: 34, height: 34, borderRadius: 11, background: C.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color={C.muted} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setAmount(p)} style={{
                  padding: "16px", borderRadius: radius.md, cursor: "pointer", fontFamily: font.sans,
                  background: amount === p ? "rgba(79,142,247,0.12)" : C.input,
                  border: `1.5px solid ${amount === p ? C.blue : C.line}`,
                  color: amount === p ? C.blue : C.text, fontSize: 18, fontWeight: 800,
                }}>${p}</button>
              ))}
            </div>
            {paypalConfigured() ? (
              <>
                <p style={{ color: C.muted, fontSize: 12, marginBottom: 12, textAlign: "center" }}>Pay <b style={{ color: C.text }}>${amount}.00</b> securely with PayPal to top up your wallet.</p>
                <PayPalButton amountRef={amountRef} onSuccess={onPaid} onError={(m) => showToast(m, "error")} />
              </>
            ) : (
              <button onClick={topUpSimulated} style={{ width: "100%", padding: "15px", borderRadius: radius.md, background: gradients.green, border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: font.sans }}>Add ${amount}.00 (test)</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn: CSSProperties = { width: 36, height: 36, borderRadius: 11, background: C.input, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };

/**
 * Renders the PayPal Buttons. createOrder/onApprove call the backend so the
 * secret stays server-side; the wallet is credited only after a confirmed
 * capture. Reads the latest amount from a ref so the button needn't re-render.
 */
function PayPalButton({ amountRef, onSuccess, onError }: {
  amountRef: MutableRefObject<number>;
  onSuccess: (amount: number) => void;
  onError: (msg: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Keep latest callbacks in refs so the buttons render exactly once.
  const successRef = useRef(onSuccess); successRef.current = onSuccess;
  const errorRef = useRef(onError); errorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    loadPayPalSdk()
      .then((paypal: unknown) => {
        if (cancelled || !containerRef.current) return;
        const pp = paypal as { Buttons: (o: unknown) => { render: (el: HTMLElement) => void } };
        setStatus("ready");
        pp.Buttons({
          style: { color: "gold", shape: "pill", height: 46, label: "paypal" },
          createOrder: () => createOrder(amountRef.current),
          onApprove: async (data: { orderID: string }) => {
            try { successRef.current(await captureOrder(data.orderID)); }
            catch (e) { errorRef.current(e instanceof Error ? e.message : "Payment failed"); }
          },
          onError: () => errorRef.current("PayPal error — try again"),
        }).render(containerRef.current);
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [amountRef]);

  return (
    <div>
      <div ref={containerRef} />
      {status === "loading" && <p style={{ color: C.muted, fontSize: 12.5, textAlign: "center" }}>Loading PayPal…</p>}
      {status === "error" && <p style={{ color: C.red, fontSize: 12.5, textAlign: "center" }}>Couldn't load PayPal. Check your connection / client id.</p>}
    </div>
  );
}
