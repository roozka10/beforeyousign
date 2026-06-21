import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadAffiliateScripts } from "./lib/load-affiliate-scripts.ts";

loadAffiliateScripts();

createRoot(document.getElementById("root")!).render(<App />);
