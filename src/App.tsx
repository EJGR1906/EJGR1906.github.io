import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Diagnostic from "./pages/Diagnostic";
import { useCallback, useEffect, useState } from "react";
import { CurrencyCalculator } from "./components/calculator/CurrencyCalculator";
import BalanceDetails from "./pages/BalanceDetails";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import MenuPage from "./pages/Menu";
import AppShell from "./components/layout/AppShell";
import Recurring from "./pages/Recurring";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ResetPassword from "./pages/Auth/ResetPassword";
import UpdatePassword from "./pages/Auth/UpdatePassword";
import CompleteProfile from "./pages/Auth/CompleteProfile";
function App() {
  const { configured, loading, profileComplete, user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [recoveringPassword, setRecoveringPassword] = useState(() => window.location.hash.includes("type=recovery"));

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-primary">Cargando tu espacio financiero...</main>;
  }

  if (configured && recoveringPassword && user) {
    return <UpdatePassword onDone={() => { window.history.replaceState({}, document.title, window.location.pathname); setRecoveringPassword(false); }} />;
  }

  if (configured && user && !profileComplete) {
    return <CompleteProfile />;
  }

  if (configured && !user) {
    if (authMode === "register") return <Register onLogin={() => setAuthMode("login")} />;
    if (authMode === "reset") return <ResetPassword onLogin={() => setAuthMode("login")} />;
    return <Login onRegister={() => setAuthMode("register")} onForgotPassword={() => setAuthMode("reset")} />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [page, setPage] = useState("Inicio");

  const navigate = useCallback((nextPage: string) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      navigate((event as CustomEvent<string>).detail);
    };
    window.addEventListener("finanzas:navigate", handleNavigation);
    return () => window.removeEventListener("finanzas:navigate", handleNavigation);
  }, [navigate]);

  if (page === "Movimientos") {
    return <Transactions onNavigate={navigate} />;
  }
  if (page === "Presupuestos") {
    return <Budgets />;
  }
  if (page === "Metas") {
    return <Goals />;
  }
  if (page === "Diagnóstico") {
    return <Diagnostic onNavigate={navigate} />;
  }
  if (page === "Menú") {
    return <MenuPage onNavigate={navigate} />;
  }
  if (page === "Calculadora") {
    return <CurrencyCalculatorPage onNavigate={navigate} />;
  }
  if (page === "Recurrentes") {
    return <Recurring onNavigate={navigate} />;
  }
  if (page === "Configuración") {
    return <Settings onNavigate={navigate} />;
  }
  if (page === "Cuentas") {
    return <Accounts onNavigate={navigate} />;
  }
  if (page === "Categorías") {
    return <Categories onNavigate={navigate} />;
  }
  if (page.startsWith("Balances:")) {
    return <BalanceDetails currency={page.split(":")[1] as "VES" | "USD" | "USDT"} onNavigate={navigate} />;
  }

  return <Dashboard onNavigate={navigate} />;
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
      <Analytics />
      <SpeedInsights dsn="romeJqQD2OuUq1I5JNsNKXN43O2" />
    </AppShell>

  );
}

export default App;