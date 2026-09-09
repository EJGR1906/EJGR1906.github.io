import { useState } from "react";
import {
    Home,
    ArrowLeftRight,
    WalletCards,
    Target,
    Activity,
    Menu,
    X,
    Settings,
    Calculator,
    Tags,
    Wallet,
} from "lucide-react";

interface AppShellProps {
    children: React.ReactNode;
    activeItem?: string;
    onNavigate?: (label: string) => void;
}

const navigation = [
    {
        label: "Inicio",
        icon: Home,
    },
    {
        label: "Movimientos",
        icon: ArrowLeftRight,
    },
    {
        label: "Presupuestos",
        icon: WalletCards,
    },
    {
        label: "Metas",
        icon: Target,
    },
    {
        label: "Diagnóstico",
        icon: Activity,
    },
    {
        label: "Calculadora",
        icon: Calculator,
    },
];

const mobileNavigation = [
    { label: "Inicio", icon: Home },
    { label: "Diagnóstico", icon: Activity },
    { label: "Menú", icon: Menu },
];

function AppShell({ children, activeItem = "Inicio", onNavigate }: AppShellProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = (label: string) => {
        onNavigate?.(label);
        window.dispatchEvent(new CustomEvent("finanzas:navigate", { detail: label }));
    };

    return (
        <div className="page-transition min-h-screen bg-background text-primary-dark">
            {/* Sidebar desktop */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-primary/10 bg-white lg:flex lg:flex-col">
                <div className="flex h-20 items-center px-6">
                    <div>
                        <p className="text-xl font-bold text-primary-dark">
                            Finanzas
                        </p>

                        <p className="text-xs text-primary-dark/50">
                            Control financiero
                        </p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4">
                    <div className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = item.label === activeItem;

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => navigate(item.label)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active
                                        ? "bg-primary/10 text-primary"
                                        : "text-primary-dark/60 hover:bg-primary/5 hover:text-primary-dark"
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="border-t border-primary/10 p-4">
                    <button onClick={() => navigate("Configuración")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary-dark/60 hover:bg-primary/5">
                        <Settings size={20} />
                        Configuración
                    </button>
                </div>
            </aside>

            {/* Desktop quick actions */}
            <div className="fixed right-8 top-4 z-40 hidden items-center gap-2 lg:flex">
                <button
                    type="button"
                    onClick={() => navigate("Cuentas")}
                    className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm font-medium text-primary-dark shadow-sm transition hover:border-primary/20 hover:bg-primary/5"
                    title="Cuentas"
                    aria-label="Cuentas"
                >
                    <Wallet size={17} />
                    Cuentas
                </button>
                {activeItem === "Movimientos" && (
                    <button
                        type="button"
                        onClick={() => navigate("Categorías")}
                        className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm font-medium text-primary-dark shadow-sm transition hover:border-primary/20 hover:bg-primary/5"
                        title="Categorías"
                        aria-label="Categorías"
                    >
                        <Tags size={17} />
                        Categorías
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => navigate("Configuración")}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary-dark shadow-sm transition hover:border-primary/20 hover:bg-primary/5"
                    title="Configuración"
                    aria-label="Configuración"
                >
                    <Settings size={18} />
                </button>
            </div>

            {/* Mobile header */}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-primary/10 bg-white/95 px-4 backdrop-blur lg:hidden">
                <div>
                    <p className="font-bold text-primary-dark">
                        Finanzas
                    </p>

                    <p className="text-[11px] text-primary-dark/50">
                        Control financiero
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => navigate("Cuentas")} className="rounded-xl p-2 text-primary-dark hover:bg-primary/5" title="Cuentas" aria-label="Cuentas">
                        <Wallet size={19} />
                    </button>
                    {activeItem === "Movimientos" && (
                        <button onClick={() => navigate("Categorías")} className="rounded-xl p-2 text-primary-dark hover:bg-primary/5" title="Categorías" aria-label="Categorías">
                            <Tags size={19} />
                        </button>
                    )}
                    <button onClick={() => navigate("Configuración")} className="rounded-xl p-2 text-primary-dark hover:bg-primary/5" title="Configuración" aria-label="Configuración">
                        <Settings size={19} />
                    </button>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="rounded-xl p-2 text-primary-dark hover:bg-primary/5"
                        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="fixed inset-x-0 top-16 z-30 border-b border-primary/10 bg-white p-4 shadow-lg lg:hidden">
                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = item.label === activeItem;

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate(item.label);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active
                                        ? "bg-primary/10 text-primary"
                                        : "text-primary-dark/70"
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                navigate("Configuración");
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary-dark/70"
                        >
                            <Settings size={20} />
                            Configuración
                        </button>
                    </nav>
                </div>
            )}

            {/* Main content */}
            <main className="pb-24 lg:ml-64 lg:pb-8">
                {children}
            </main>

            {/* Mobile bottom navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white lg:hidden">
                <div className="grid grid-cols-3">
                    {mobileNavigation.map((item) => {
                        const Icon = item.icon;
                        const active = item.label === activeItem;

                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.label)}
                                className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium ${active
                                    ? "text-primary"
                                    : "text-primary-dark/45"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default AppShell;