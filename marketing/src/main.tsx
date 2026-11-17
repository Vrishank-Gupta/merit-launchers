import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

// Prerendered markup (scripts/prerender.mjs) exists for crawlers that don't run
// JavaScript. Visitors get a normal client render, exactly as before prerendering.
if (container.hasAttribute("data-prerendered")) {
  container.innerHTML = "";
  container.removeAttribute("data-prerendered");
}

createRoot(container).render(<App />);
