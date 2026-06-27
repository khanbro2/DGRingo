import { createRoot } from "react-dom/client";
import { SiteApp } from "./site/SiteApp";
import "./site/styles.css";

createRoot(document.getElementById("root")!).render(<SiteApp />);
