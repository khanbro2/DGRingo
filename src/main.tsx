
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initNative } from "./app/native.ts";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  // Native (Capacitor) setup — no-ops on the web build.
  initNative();
