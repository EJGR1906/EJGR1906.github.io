import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Diagnostic from "./pages/Diagnostic";
import { useEffect, useState } from "react";
import { CurrencyCalculator } from "./components/calculator/CurrencyCalculator";
import BalanceDetails from "./pages/BalanceDetails";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import MenuPage from "./pages/Menu";
import AppShell from "./components/layout/AppShell";


function App() {
  const [page, setPage] = useState("Inicio");

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      setPage((event as CustomEvent<string>).detail);
    };
    window.addEventListener("finanzas:navigate", handleNavigation);
    return () => window.removeEventListener("finanzas:navigate", handleNavigation);
  }, []);

  if (page === "Movimientos") {
    return <Transactions onNavigate={setPage} />;
  }
  if (page === "Presupuestos") {
    return <Budgets />;
  }
  if (page === "Metas") {
    return <Goals />;
  }
  if (page === "Diagnóstico") {
    return <Diagnostic />;
  }
  if (page === "Menú") {
    return <MenuPage onNavigate={setPage} />;
  }
  if (page === "Calculadora") {
    return <CurrencyCalculatorPage onNavigate={setPage} />;
  }
  if (page === "Configuración") {
    return <Settings onNavigate={setPage} />;
  }
  if (page === "Cuentas") {
    return <Accounts onNavigate={setPage} />;
  }
  if (page === "Categorías") {
    return <Categories onNavigate={setPage} />;
  }
  if (page.startsWith("Balances:")) {
    return <BalanceDetails currency={page.split(":")[1] as "VES" | "USD" | "USDT"} onNavigate={setPage} />;
  }

  return <Dashboard onNavigate={setPage} />;
}

function CurrencyCalculatorPage({ onNavigate }: { onNavigate: (label: string) => void }) {
  return (
    <AppShell activeItem="Calculadora" onNavigate={onNavigate}>
      <div className="bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <p className="text-sm font-medium text-primary">Herramienta financiera</p>
            <h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Calculadora</h1>
            <p className="mt-1 text-sm text-primary-dark/60">Convierte entre VES, USD y USDT con la tasa disponible.</p>
          </div>
          <CurrencyCalculator />
          <button type="button" onClick={() => onNavigate("Inicio")} className="mt-4 text-sm font-semibold text-primary hover:text-primary-dark">Volver al inicio</button>
        </div>
      </div>
    </AppShell>
  );
}

export default App;