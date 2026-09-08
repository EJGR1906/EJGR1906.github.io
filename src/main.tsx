import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";

import { seedDatabase } from "./database/seed";
import { applyTheme, getTheme } from "./services/settingsService";
import {
  refreshExchangeRates,
} from "./services/exchangeRateService";
async function bootstrap() {
  applyTheme(getTheme());

  // Inicializar la base de datos
  await seedDatabase();

  // Actualizar tasas externas
  try {
    const result =
      await refreshExchangeRates();

    console.log(
      "💱 Tasas actualizadas:",
      result
    );
  } catch (error) {
    console.error(
      "❌ Error actualizando tasas:",
      error
    );
  }

  // Iniciar aplicación
  createRoot(
    document.getElementById("root")!
  ).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();