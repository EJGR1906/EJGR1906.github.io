import {
    Activity,
    ArrowLeftRight,
    Calculator,
    Home,
    ListTree,
    Settings,
    Target,
    WalletCards,
    Wallet,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";

interface MenuProps {
    onNavigate?: (label: string) => void;
}

const menuItems = [
    { label: "Inicio", icon: Home },
    { label: "Movimientos", icon: ArrowLeftRight },
    { label: "Presupuestos", icon: WalletCards },
    { label: "Metas", icon: Target },
    { label: "Diagnóstico", icon: Activity },
    { label: "Calculadora", icon: Calculator },
    { label: "Cuentas", icon: Wallet },
    { label: "Categorías", icon: ListTree },
    { label: "Configuración", icon: Settings },
];

function MenuPage({ onNavigate }: MenuProps) {
    return (
        <AppShell activeItem="Menú" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl">
                    <header className="mb-6">
                        <p className="text-sm font-medium text-primary">Navegación</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl">Menú</h1>
                    </header>

                    <nav aria-label="Páginas de Finanzas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {menuItems.map(({ label, icon: Icon }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => onNavigate?.(label)}
                                className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left text-sm font-semibold text-primary-dark shadow-sm ring-1 ring-primary/5 transition hover:bg-primary/5"
                            >
                                <Icon size={20} className="shrink-0 text-primary" />
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </AppShell>
    );
}

export default MenuPage;
