import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Link, useRouter } from "../router";
import { Logo, LinkButton } from "./ui";
import { NAV } from "../data";
import { useTheme } from "../theme";

/** Frosted, Apple-style top bar that gains a blur background once you scroll. */
export function Nav() {
  const { route } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const ThemeToggle = (
    <button
      className="dg-icon-btn"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

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
      <motion.nav
        className={`dg-nav ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
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
            {ThemeToggle}
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
      </motion.nav>

      <div className={`dg-drawer ${open ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {ThemeToggle}
            <button className="dg-burger" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
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
