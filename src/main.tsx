import { createRoot, hydrateRoot } from "react-dom/client";
import Site from "./DesktopSite";
import { LanguageProvider } from "./i18n";
import { localeFromPath } from "./locale-routing";
import "./style.css";
const container = document.getElementById("root")!;
const app = (
  <LanguageProvider initialLocale={localeFromPath(location.pathname)}>
    <Site />
  </LanguageProvider>
);
if (container.dataset.prerendered === "true") hydrateRoot(container, app);
else createRoot(container).render(app);
