import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Tiny hash-based router. The marketing site ships as a static Vite entry
 * (site.html), so hash routing works regardless of the deploy sub-path — no
 * server rewrites needed. Routes: "/", "/features", "/pricing", "/contact",
 * "/login", "/signup".
 */
export type Route = string;

const RouteCtx = createContext<{ route: Route; navigate: (to: Route) => void }>({
  route: "/",
  navigate: () => {},
});

function currentPath(): Route {
  const h = window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(currentPath());

  useEffect(() => {
    const onHash = () => {
      setRoute(currentPath());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.replace("#/");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (to: Route) => {
    window.location.hash = to;
  };

  return <RouteCtx.Provider value={{ route, navigate }}>{children}</RouteCtx.Provider>;
}

export const useRouter = () => useContext(RouteCtx);

/** Anchor that drives the hash router and supports an active state. */
export function Link({
  to,
  className,
  children,
  onClick,
}: {
  to: Route;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={() => onClick?.()}
    >
      {children}
    </a>
  );
}
