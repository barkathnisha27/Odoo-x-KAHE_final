import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/instrument-serif/400.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

// ── One-time migration: remove old store keys that may contain duplicates ──
// The new store uses "dineflow-store-v4". Remove any older versions on load.
const OLD_STORE_KEYS = ["dineflow-store", "dineflow-store-v2", "dineflow-store-v3"];
OLD_STORE_KEYS.forEach(k => localStorage.removeItem(k));

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
