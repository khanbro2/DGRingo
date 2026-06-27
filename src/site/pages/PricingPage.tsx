import { useState } from "react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { LinkButton, SectionIntro } from "../components/ui";
import { Link } from "../router";
import { PRICING, FAQS, COUNTRIES } from "../data";

export function PricingPage() {
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
              Start free and pay only for the numbers you buy. Upgrade when you grow — cancel any
              time, no lock-in.
            </p>
          </Reveal>
        </div>
      </section>

      {/* tiers */}
      <section className="dg-section" style={{ paddingTop: 10 }}>
        <div className="dg-wrap">
          <div className="dg-grid dg-grid-3" style={{ alignItems: "stretch" }}>
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 90}>
                <div className={`dg-card dg-price-card ${p.featured ? "feat" : ""}`} style={{ height: "100%" }}>
                  {p.featured && <span className="dg-badge-pop">Most popular</span>}
                  <h3 className="dg-h3" style={{ fontSize: 20 }}>{p.name}</h3>
                  <p className="dg-muted" style={{ fontSize: 14, marginTop: 6 }}>{p.tagline}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 22 }}>
                    <span className="dg-price-amt">${p.price}</span>
                    <span className="dg-muted" style={{ fontSize: 16 }}>{p.suffix}</span>
                  </div>
                  <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
                  <div style={{ flex: 1 }}>
                    {p.features.map((f) => (
                      <div className="dg-feat-li" key={f}>
                        <Check size={17} /> <span style={{ color: "var(--text)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 26 }}>
                    <LinkButton to={p.name === "Business" ? "/contact" : "/signup"} variant={p.featured ? "primary" : "ghost"} size="lg">
                      {p.cta}
                    </LinkButton>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="dg-center dg-muted" style={{ fontSize: 13.5, marginTop: 28 }}>
              Plus pay-as-you-go usage: local numbers from <b style={{ color: "var(--text)" }}>$1/mo</b>, charged from your wallet.
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
                Start free today.
              </h2>
              <p className="dg-lead" style={{ margin: "18px auto 0", maxWidth: 500 }}>
                No card required to create your account. Pay only when you buy a number.
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
