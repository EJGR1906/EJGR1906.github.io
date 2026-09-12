import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import Dashboard from "./pages/Dashboard";
import { readStoredAppPage, writeStoredAppPage } from "./navigation/appPage";
import AppShell from "./components/layout/AppShell";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useAuth } from "./context/useAuth";

const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Goals = lazy(() => import("./pages/Goals"));
const Diagnostic = lazy(() => import("./pages/Diagnostic"));
const BalanceDetails = lazy(() => import("./pages/BalanceDetails"));
const Settings = lazy(() => import("./pages/Settings"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Categories = lazy(() => import("./pages/Categories"));
const MenuPage = lazy(() => import("./pages/Menu"));
const Recurring = lazy(() => import("./pages/Recurring"));
const CurrencyCalculator = lazy(() =>
  import("./components/calculator/CurrencyCalculator").then((m) => ({
    default: m.CurrencyCalculator,
  }))
);
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/Auth/UpdatePassword"));
const CompleteProfile = lazy(() => import("./pages/Auth/CompleteProfile"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function App() {
  const { configured, loading, profileComplete, user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [recoveringPassword, setRecoveringPassword] = useState(() => window.location.hash.includes("type=recovery"));

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-primary">
        Cargando tu espacio financiero...
      </main>
    );
  }

  if (configured && recoveringPassword && user) {
    return (
      <Suspense fallback={<PageFallback />}>
        <UpdatePassword
          onDone={() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            setRecoveringPassword(false);
          }}
        />
        <Analytics />
        <SpeedInsights dsn="romeJqQD2OuUq1I5JNsNKXN43O2" />
      </Suspense>
    );
  }

  if (configured && !user) {
    return (
      <Suspense fallback={<PageFallback />}>
        {authMode === "register" && <Register onLogin={() => setAuthMode("login")} />}
        {authMode === "reset" && <ResetPassword onLogin={() => setAuthMode("login")} />}
        {authMode === "login" && (
          <Login onRegister={() => setAuthMode("register")} onForgotPassword={() => setAuthMode("reset")} />
        )}
        <Analytics />
        <SpeedInsights dsn="romeJqQD2OuUq1I5JNsNKXN43O2" />
      </Suspense>
    );
  }

  const showProfileGate = Boolean(configured && user && !profileComplete);

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        {showProfileGate && (
          <div className="fixed inset-0 z-50">
            <CompleteProfile />
          </div>
        )}
        <div className={showProfileGate ? "hidden" : undefined} aria-hidden={showProfileGate || undefined}>
          <AuthenticatedApp key={user?.id ?? "local"} />
        </div>
      </Suspense>
      <Analytics />
      <SpeedInsights dsn="romeJqQD2OuUq1I5JNsNKXN43O2" />
    </>
  );
}

function AuthenticatedApp() {
  const [page, setPage] = useState(readStoredAppPage);

  const navigate = useCallback((nextPage: string) => {
    setPage(nextPage);
    writeStoredAppPage(nextPage);
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
    return (
      <Suspense fallback={<PageFallback />}>
        <Transactions onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Presupuestos") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Budgets />
      </Suspense>
    );
  }
  if (page === "Metas") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Goals />
      </Suspense>
    );
  }
  if (page === "Diagnóstico") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Diagnostic onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Menú") {
    return (
      <Suspense fallback={<PageFallback />}>
        <MenuPage onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Calculadora") {
    return <CurrencyCalculatorPage onNavigate={navigate} />;
  }
  if (page === "Recurrentes") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Recurring onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Configuración") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Settings onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Cuentas") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Accounts onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page === "Categorías") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Categories onNavigate={navigate} />
      </Suspense>
    );
  }
  if (page.startsWith("Balances:")) {
    return (
      <Suspense fallback={<PageFallback />}>
        <BalanceDetails currency={page.split(":")[1] as "VES" | "USD" | "USDT"} onNavigate={navigate} />
      </Suspense>
    );
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
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white" />}>
            <CurrencyCalculator />
          </Suspense>
          <button
            type="button"
            onClick={() => onNavigate("Inicio")}
            className="mt-4 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default App;