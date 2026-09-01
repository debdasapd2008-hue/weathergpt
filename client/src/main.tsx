import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n";
import { SettingsProvider } from "./stores/settings";
import { WeatherDataProvider } from "./stores/weatherData";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <SettingsProvider>
        <WeatherDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WeatherDataProvider>
      </SettingsProvider>
    </I18nProvider>
  </StrictMode>,
);