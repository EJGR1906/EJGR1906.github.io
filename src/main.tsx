import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { registerSW } from "virtual:pwa-register";

import { seedDatabase } from "./database/seed";
import { applyTheme, getTheme } from "./services/settingsService";
import {
  refreshExchangeRates,
} from "./services/exchangeRateService";

// Aplicar tema inmediatamente para evitar FOUC
applyTheme(getTheme());

// Iniciar aplicación inmediatamente
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// Tareas en segundo plano diferidas tras el render inicial
const initBackgroundTasks = () => {
  // Inicializar base de datos
  seedDatabase().catch((error) => {
    console.error("❌ Error inicializando base de datos:", error);
  });

  // Actualizar tasas externas
  refreshExchangeRates()
    .then((result) => {
      console.log("💱 Tasas actualizadas:", result);
    })
    .catch((error) => {
      console.error("❌ Error actualizando tasas:", error);
    });

  // Registrar Service Worker sin competir con la carga crítica
  registerSW({ immediate: false });
};

if (typeof window !== "undefined") {
  if (document.readyState === "complete") {
    setTimeout(initBackgroundTasks, 100);
  } else {
    window.addEventListener("load", () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => initBackgroundTasks(), { timeout: 3000 });
      } else {
        setTimeout(initBackgroundTasks, 300);
      }
    });
  }
}