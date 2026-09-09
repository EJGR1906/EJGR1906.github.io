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
    CalendarClock,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";

interface MenuProps {
    onNavigate?: (label: string) => void;
}

const menuSections = [
    {
        title: "Gestión financiera",
        items: [
            { label: "Cuentas", icon: Wallet },
            { label: "Movimientos", icon: ArrowLeftRight },
            { label: "Categorías", icon: ListTree },
            { label: "Metas", navLabel: "Metas", displayLabel: "Metas y Ahorro", icon: Target },
            { label: "Recurrentes", icon: CalendarClock },
        ],
    },
    {
        title: "Herramientas",
        items: [
            { label: "Calculadora", icon: Calculator },
            { label: "Diagnóstico", icon: Activity },
            { label: "Presupuestos", icon: WalletCards },
        ],
    },
    {
        title: "Cuenta",
        items: [
            { label: "Configuración", displayLabel: "Preferencias", icon: Settings },
        ],
    },
];

function MenuPage({ onNavigate }: MenuProps) {
    return (
        <AppShell activeItem="Menú" onNavigate={onNavigate}>
            <div className="p-4 pb-8 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-lg lg:max-w-4xl">
                    {menuSections.map((section) => (
                        <section key={section.title} className="mb-6">
                            <h2 className="mb-3 text-base font-bold tracking-tight text-primary-dark sm:text-lg">
                                {section.title}
                            </h2>
                            <nav
                                aria-label={section.title}
                                className="grid grid-cols-4 gap-3 sm:gap-4"
                            >
                                {section.items.map(({ label, displayLabel, navLabel, icon: Icon }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => onNavigate?.(navLabel || label)}
                                        className="menu-grid-item group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition hover:bg-primary/5 active:scale-95 sm:p-4"
                                    >
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark/5 text-primary-dark/70 transition group-hover:bg-primary/10 group-hover:text-primary sm:h-14 sm:w-14">
                                            <Icon size={22} strokeWidth={1.8} />
                                        </span>
                                        <span className="text-[11px] font-medium leading-tight text-primary-dark/70 sm:text-xs">
                                            {displayLabel || label}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </section>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}

export default MenuPage;
