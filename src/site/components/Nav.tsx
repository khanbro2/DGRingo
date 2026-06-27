import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useRouter } from "../router";
import { Logo, LinkButton } from "./ui";
import { NAV } from "../data";

/** Frosted, Apple-style top bar that gains a blur background once you scroll. */
export function Nav() {
  const { route } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <nav className={`dg-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="dg-nav-inner">
          <Logo />
          <div className="dg-nav-links">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={`dg-nav-link ${route === n.to ? "active" : ""}`}>
                {n.label}
              </Link>
            ))}
          </div>
          <div className="dg-nav-cta">
            <Link to="/login" className="dg-nav-link dg-hide-sm">
              Log in
            </Link>
            <LinkButton to="/signup" variant="primary" size="sm">
              Get started
            </LinkButton>
            <button className="dg-burger" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className={`dg-drawer ${open ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Logo />
          <button className="dg-burger" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
            {n.label}
          </Link>
        ))}
        <Link to="/login" onClick={() => setOpen(false)}>
          Log in
        </Link>
        <div style={{ marginTop: 24 }}>
          <LinkButton to="/signup" variant="primary" size="lg">
            Get started free
          </LinkButton>
        </div>
      </div>
    </>
  );
}
