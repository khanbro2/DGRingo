import { RouterProvider, useRouter } from "./router";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { PricingPage } from "./pages/PricingPage";
import { ContactPage } from "./pages/ContactPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

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
  const isAuth = AUTH_ROUTES.has(route);

  if (isAuth) return <Pages />;

  return (
    <div className="dg-shell">
      <Nav />
      <main>
        <Pages />
      </main>
      <Footer />
    </div>
  );
}

export function SiteApp() {
  return (
    <RouterProvider>
      <Frame />
    </RouterProvider>
  );
}
