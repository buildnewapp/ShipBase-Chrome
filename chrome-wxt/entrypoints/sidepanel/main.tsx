import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/entrypoints/popup/App.tsx";
import "@/assets/tailwind.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App variant="sidepanel" />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
