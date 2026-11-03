import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyOrbColor } from "./hooks/use-orb-color.ts";

applyOrbColor();


createRoot(document.getElementById("root")!).render(<App />);
