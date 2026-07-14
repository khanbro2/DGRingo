import { useState } from "react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { LinkButton, SectionIntro } from "../components/ui";
import { Link } from "../router";
import { PRICING, FAQS, COUNTRIES, NUMBER_RENTAL, USAGE_RATES } from "../data";

export function PricingPage() {
  const [yearly, setYearly] = useState(false);
  return (
    <>
      {/* hero */}
      <section className="dg-section" style={{ paddingTop: "calc(var(--nav-h) + clamp(40px,8vw,90px))", paddingBottom: 30 }}>
        <div className="dg-wrap dg-center">
          <Reveal>
            <span className="dg-eyebrow">Pricing</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="dg-h1" style={{ marginTop: 22, fontSize: "clamp(36px,6vw,72px)" }}>
              Simple plans. <span className="dg-grad-text">No surprises.</span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="dg-lead" style={{ marginTop: 22, maxWidth: 560, margin: "22px auto 0" }}>
              Every number comes with a plan — one number <b>free</b>, plus minutes &amp; SMS.
              Add more numbers, and keep going pay-as-you-go when you need to. Wallet or card.
            </p>
          </Reveal>
        </div>
      </section>

      {/* tiers */}
      <section className="dg-section" style={{ paddingTop: 10 }}>
        <div className="dg-wrap">
          {/* monthly / yearly toggle */}
          <Reveal>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 42 }}>
              <div style={{ display: "inline-flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: 4, gap: 4 }}>
                {([["monthly", "Monthly"], ["yearly", "Yearly"]] as const).map(([k, label]) => {
                  const active = (k === "yearly") === yearly;
                  return (
                    <button key={k} onClick={() => setYearly(k === "yearly")} style={{
                      border: "none", cursor: "pointer", padding: "9px 20px", borderRadius: 999,
                      fontSize: 14, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
                      background: active ? "var(--grad)" : "transparent", color: active ? "#fff" : "var(--muted)",
                      display: "inline-flex", alignItems: "center", gap: 8,
                    }}>
                      {label}
                      {k === "yearly" && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: active ? "rgba(255,255,255,0.22)" : "rgba(34,197,94,0.15)", color: active ? "#fff" : "var(--green)" }}>2 months free</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <div className="dg-grid dg-grid-3" style={{ alignItems: "stretch" }}>
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 90}>
                <div className={`dg-card dg-price-card ${p.featured ? "feat" : ""}`} style={{ height: "100%" }}>
                  {p.featured && <span className="dg-badge-pop">Most popular</span>}
                  <h3 className="dg-h3" style={{ fontSize: 20 }}>{p.name}</h3>
                  <p className="dg-muted" style={{ fontSize: 14, marginTop: 6 }}>{p.tagline}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 22 }}>
                    <span className="dg-price-amt">${yearly ? p.yearly : p.monthly}</span>
                    <span className="dg-muted" style={{ fontSize: 16 }}>{p.unit}</span>
                  </div>
                  <p className="dg-muted" style={{ fontSize: 12.5, marginTop: 6, minHeight: 17 }}>
                    {yearly ? `billed annually — $${p.yearlyTotal}/yr` : "billed monthly"}
                  </p>
                  <div style={{ height: 1, background: "var(--line)", margin: "20px 0" }} />
                  <div style={{ flex: 1 }}>
                    {p.features.map((f) => (
                      <div className="dg-feat-li" key={f}>
                        <Check size={17} /> <span style={{ color: "var(--text)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 26 }}>
                    <LinkButton to="/signup" variant={p.featured ? "primary" : "ghost"} size="lg">
                      {p.cta}
                    </LinkButton>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="dg-center dg-muted" style={{ fontSize: 13.5, marginTop: 28, maxWidth: 640, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
              Annual plans are billed as a single upfront charge and renew yearly. Usage beyond your
              bundle bills at the pay-as-you-go rates below. Pay from your wallet or by card.
            </p>
          </Reveal>
        </div>
      </section>

      {/* pay-as-you-go */}
      <section className="dg-section" style={{ paddingTop: 20 }}>
        <div className="dg-wrap">
          <Reveal>
            <SectionIntro
              eyebrow="Extra numbers & overflow"
              title="Add more numbers. Never get cut off."
              lead="Your first number is free with any plan. Add extra numbers at a flat monthly fee, and if you go past your plan's minutes or SMS you keep going pay-as-you-go — all pooled across your account, drawn from your wallet."
            />
          </Reveal>
          <div className="dg-grid dg-grid-2" style={{ marginTop: 40, alignItems: "start", gap: 22 }}>
            <Reveal>
              <div className="dg-card" style={{ padding: 28 }}>
                <h3 className="dg-h3" style={{ fontSize: 18 }}>Extra numbers</h3>
                <p className="dg-muted" style={{ fontSize: 13.5, marginTop: 6 }}>First is free — extras per month.</p>
                <div style={{ marginTop: 18 }}>
                  {NUMBER_RENTAL.map((r) => (
                    <PriceRow key={r.type} label={r.type} price={r.price} unit={r.unit} />
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="dg-card" style={{ padding: 28 }}>
                <h3 className="dg-h3" style={{ fontSize: 18 }}>Usage rates</h3>
                <p className="dg-muted" style={{ fontSize: 13.5, marginTop: 6 }}>Charged from your wallet as you go.</p>
                <div style={{ marginTop: 18 }}>
                  {USAGE_RATES.map((r) => (
                    <PriceRow key={r.item} label={r.item} price={r.price} unit={r.unit} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <p className="dg-center dg-muted" style={{ fontSize: 13, marginTop: 26, maxWidth: 640, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
              We alert you in the app and web app as you near your plan's limit, so you can upgrade before
              overflow kicks in. Extra numbers share your plan's pooled minutes &amp; SMS.
            </p>
          </Reveal>
        </div>
      </section>

      {/* countries / coverage */}
      <section className="dg-section">
        <div className="dg-wrap">
          <Reveal>
            <SectionIntro eyebrow="Coverage" title="Numbers in 8+ countries" lead="Local and mobile numbers, with more regions added all the time." />
          </Reveal>
          <Reveal>
            <div className="dg-chips" style={{ justifyContent: "center", marginTop: 36, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
              {COUNTRIES.map((c) => (
                <span className="dg-chip" key={c.name}>
                  <span style={{ fontSize: 18 }}>{c.flag}</span> {c.name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* faq */}
      <section className="dg-section" style={{ paddingTop: 20 }}>
        <div className="dg-wrap" style={{ maxWidth: 800 }}>
          <Reveal>
            <SectionIntro eyebrow="FAQ" title="Questions, answered" />
          </Reveal>
          <div style={{ marginTop: 44 }}>
            {FAQS.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="dg-section" style={{ paddingTop: 0 }}>
        <div className="dg-wrap">
          <Reveal>
            <div className="dg-cta-band">
              <h2 className="dg-h2" style={{ maxWidth: 640, margin: "0 auto" }}>
                Your number, live in 60 seconds.
              </h2>
              <p className="dg-lead" style={{ margin: "18px auto 0", maxWidth: 500 }}>
                Bundle or pay-as-you-go, wallet or card — start on your terms and change any time.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
                <LinkButton to="/signup" variant="primary" size="lg">
                  Get started <ArrowRight size={17} />
                </LinkButton>
                <Link to="/contact" className="dg-btn dg-btn-ghost dg-btn-lg">Contact sales</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function PriceRow({ label, price, unit }: { label: string; price: string; unit: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ color: "var(--text)", fontSize: 14.5 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <b style={{ color: "var(--text)", fontSize: 16 }}>{price}</b>
        <span className="dg-muted" style={{ fontSize: 12.5 }}>{unit}</span>
      </span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dg-faq-item ${open ? "open" : ""}`}>
      <button className="dg-faq-q" onClick={() => setOpen((o) => !o)}>
        {q}
        <ChevronDown size={20} className="chev" />
      </button>
      <div className="dg-faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
}
