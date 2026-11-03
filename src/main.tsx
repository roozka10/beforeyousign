import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadAffiliateScripts } from "./lib/load-affiliate-scripts.ts";
import { applyOrbColor } from "./hooks/use-orb-color.ts";

applyOrbColor();

loadAffiliateScripts();

createRoot(document.getElementById("root")!).render(<App />);
