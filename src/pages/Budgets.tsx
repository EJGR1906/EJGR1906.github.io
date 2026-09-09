import { useEffect, useState } from "react";
import { Plus, WalletCards } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { db, type Category } from "../database/db";
import { getDashboardSummary } from "../services/dashboardService";

const storageKey = "finanzas.budgets";

type Budget = { categoryId: string; amount: number; currency: "USD" };

function Budgets() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [spent, setSpent] = useState<Record<string, number>>({});
    const [budgets, setBudgets] = useState<Budget[]>(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as Array<Partial<Budget>>;
        return stored
            .filter((budget) => budget.categoryId && Number(budget.amount) > 0)
            .map((budget) => ({
                categoryId: budget.categoryId as string,
                amount: Number(budget.amount),
                currency: "USD",
            }));
    });
    const [categoryId, setCategoryId] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        const load = async () => {
            const [categoryData, summary] = await Promise.all([
                db.categories.where("type").equals("expense").toArray(),
                getDashboardSummary("USD", "month"),
            ]);
            setCategories(categoryData);
            setSpent(Object.fromEntries(summary.expensesByCategory.map((item) => [item.categoryId, item.amountInBaseCurrency])));
            setCategoryId((current) => current || categoryData[0]?.id || "");
        };
        void load();
    }, []);

    const saveBudget = (event: React.FormEvent) => {
        event.preventDefault();
        const value = Number(amount);
        if (!categoryId || value <= 0) return;
        const next = [...budgets.filter((budget) => budget.categoryId !== categoryId), { categoryId, amount: value, currency: "USD" as const }];
        setBudgets(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setAmount("");
    };

    return (
        <AppShell activeItem="Presupuestos">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-6">
                        <p className="text-sm font-medium text-primary">Plan mensual</p>
                        <h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Presupuestos</h1>
                        <p className="mt-1 text-sm text-primary-dark/60">Define límites simples y revisa cuánto llevas gastado este mes.</p>
                    </header>
                    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="mb-5 flex items-center gap-2"><Plus size={18} className="text-primary" /><h2 className="font-bold text-primary-dark">Nuevo límite</h2></div>
                            <form onSubmit={saveBudget} className="space-y-4">
                                <label className="block text-sm font-medium text-primary-dark">Categoría<select className="field mt-1" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                                <label className="block text-sm font-medium text-primary-dark">Límite mensual en USD<input className="field mt-1" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="300" /></label>
                                <button type="submit" className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-sky hover:bg-primary-dark">Guardar presupuesto</button>
                            </form>
                        </section>
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2"><WalletCards size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">Este mes · USD</h2></div>
                            {budgets.length === 0 ? <div className="mt-6 rounded-2xl bg-background p-8 text-center text-sm text-primary-dark/55">Aún no tienes límites definidos. Comienza con tu categoría de mayor gasto.</div> : <div className="mt-5 space-y-5">{budgets.map((budget) => { const category = categories.find((item) => item.id === budget.categoryId); const currentSpent = spent[budget.categoryId] || 0; const percentage = budget.amount > 0 ? Math.min((currentSpent / budget.amount) * 100, 100) : 0; return <div key={budget.categoryId} className="rounded-2xl bg-background p-4"><div className="flex items-center justify-between gap-4"><p className="font-bold text-primary-dark">{category?.name || "Categoría"}</p><p className="text-sm font-semibold text-primary-dark">{currentSpent.toLocaleString("es-VE", { maximumFractionDigits: 2 })} / {budget.amount.toLocaleString("es-VE", { maximumFractionDigits: 2 })} {budget.currency}</p></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-dark/5"><div className={`h-full rounded-full ${percentage >= 100 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${percentage}%` }} /></div><p className="mt-2 text-xs text-primary-dark/55">{percentage.toFixed(0)}% utilizado</p></div>; })}</div>}
                        </section>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default Budgets;
