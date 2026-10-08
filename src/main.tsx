import "@fontsource/anta/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "@/components/ui/provider";
import { App } from "./app";

// Statische Vorschau-Tags aus index.html (für Crawler ohne JavaScript) entfernen —
// ab hier setzt react-helmet sie pro Seite, sonst gäbe es sie doppelt.
document.querySelectorAll("[data-prerender]").forEach((element) => element.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <Provider>
        <App />
      </Provider>
    </HelmetProvider>
  </StrictMode>,
);
