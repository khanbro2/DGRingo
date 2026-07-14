import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { RouterProvider, useRouter } from "./router";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { PricingPage } from "./pages/PricingPage";
import { ContactPage } from "./pages/ContactPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TermsPage, PrivacyPage } from "./pages/LegalPages";
import { ResetPage } from "./pages/ResetPage";
import { VerifyPage } from "./pages/VerifyPage";

/** Routes that render the bare auth layout (no marketing nav/footer chrome). */
const AUTH_ROUTES = new Set(["/login", "/signup"]);

function Pages() {
  const { route } = useRouter();

  switch (route) {
    case "/features":
      return <FeaturesPage />;
    case "/pricing":
      return <PricingPage />;
    case "/contact":
      return <ContactPage />;
    case "/terms":
      return <TermsPage />;
    case "/privacy":
      return <PrivacyPage />;
    case "/login":
      return <LoginPage />;
    case "/signup":
      return <SignupPage />;
    default:
      return <HomePage />;
  }
}

function Frame() {
  const { route } = useRouter();
  // Password-reset email links land here (digiringo.com/?reset=TOKEN) — render the
  // reset screen bare, regardless of the hash route.
  const params = (() => { try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); } })();
  if (params.has("reset")) return <ResetPage />;
  if (params.has("verify")) return <VerifyPage />;
  const isAuth = AUTH_ROUTES.has(route);

  if (isAuth) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={route}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Pages />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="dg-shell">
      <Nav />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Pages />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export function SiteApp() {
  return (
    <RouterProvider>
      <MotionConfig reducedMotion="user">
        <Frame />
      </MotionConfig>
    </RouterProvider>
  );
}
