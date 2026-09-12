import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Check, Pencil, Plus, Trash2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import type { Account, Category, CurrencyCode, Goal, Transaction, TransactionType } from "../database/db";
import { getActiveAccounts } from "../repositories/accountRepository";
import { getAllCategories } from "../repositories/categoryRepository";
import { deleteTransaction, getAllTransactions } from "../repositories/transactionRepository";
import { createExpense, createGoalContribution, createGoalWithdrawal, createIncome, createTransfer, editTransaction } from "../services/transactionService";
import { getGoalsWithProgress } from "../services/goalService";
import { todayLocal } from "../utils/date";

const today = todayLocal();

interface TransactionsProps {
    onNavigate?: (label: string) => void;
}

function Transactions({ onNavigate }: TransactionsProps) {
    const [type, setType] = useState<TransactionType>("expense");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        accountId: "",
        categoryId: "",
        amount: "",
        currency: "USD" as CurrencyCode,
        fromAccountId: "",
        toAccountId: "",
        toAmount: "",
        description: "",
        date: today,
        goalId: "",
    });

    const loadData = useCallback(async () => {
        const [accountData, categoryData, transactionData, goalData] = await Promise.all([
            getActiveAccounts(),
            getAllCategories(),
            getAllTransactions(),
            getGoalsWithProgress(),
        ]);
        setAccounts(accountData);
        setCategories(categoryData);
        setTransactions(transactionData);
        setGoals(goalData.filter((item) => item.goal.active).map((item) => item.goal));
        setForm((current) => ({
            ...current,
            accountId: current.accountId || accountData[0]?.id || "",
            fromAccountId: current.fromAccountId || accountData[0]?.id || "",
            toAccountId: current.toAccountId || accountData[1]?.id || accountData[0]?.id || "",
            categoryId: current.categoryId || categoryData.find((category) => category.type === type)?.id || "",
            goalId: current.goalId || goalData.find((item) => item.goal.active)?.goal.id || "",
        }));
    }, [type]);

    useEffect(() => {
        // IndexedDB must be loaded after the screen mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData();
    }, [loadData]);

    const filteredCategories = useMemo(
        () => categories.filter((category) => category.type === (type === "income" ? "income" : "expense")),
        [categories, type],
    );
    const selectedAccount = accounts.find((account) => account.id === form.accountId);
    const fromAccount = accounts.find((account) => account.id === form.fromAccountId);
    const toAccount = accounts.find((account) => account.id === form.toAccountId);
    const compatibleGoals = goals.filter((goal) => goal.currency === selectedAccount?.currency && goal.backingAccountId === form.accountId);

    const setField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const changeType = (nextType: TransactionType) => {
        setType(nextType);
        setEditingTransaction(null);
        setForm((current) => ({
            ...current,
            categoryId: categories.find((category) => category.type === (nextType === "income" ? "income" : "expense"))?.id || "",
            goalId: (nextType === "goal_contribution" || nextType === "goal_withdrawal")
                ? goals.find((goal) => goal.active)?.id || ""
                : current.goalId,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const amount = Number(form.amount);
        const destinationAmount = Number(form.toAmount || form.amount);
        if (!form.date || amount <= 0) return;
        const date = new Date(`${form.date}T12:00:00`).toISOString();

        if (type === "goal_contribution" || type === "goal_withdrawal") {
            const goal = goals.find((item) => item.id === form.goalId);
            if (!form.accountId || !goal || goal.backingAccountId !== form.accountId) return;
            const input = {
                goalId: goal.id,
                accountId: form.accountId,
                amount,
                currency: selectedAccount?.currency || form.currency,
                description: form.description,
                date,
            };
            if (type === "goal_contribution") await createGoalContribution(input);
            else await createGoalWithdrawal(input);
        } else if (type === "transfer") {
            if (!form.fromAccountId || !form.toAccountId || form.fromAccountId === form.toAccountId || destinationAmount <= 0) return;
            const input = {
                fromAccountId: form.fromAccountId,
                toAccountId: form.toAccountId,
                fromAmount: amount,
                fromCurrency: fromAccount?.currency || "USD",
                toAmount: destinationAmount,
                toCurrency: toAccount?.currency || "USD",
                exchangeRate: destinationAmount / amount,
                description: form.description,
                date,
            };
            if (editingTransaction) await editTransaction(editingTransaction.id, { type: "transfer", ...input });
            else await createTransfer(input);
        } else {
            if (!form.accountId || !form.categoryId) return;
            const input = {
                accountId: form.accountId,
                categoryId: form.categoryId,
                amount,
                currency: selectedAccount?.currency || form.currency,
                description: form.description,
                date,
            };
            if (type === "income") {
                if (editingTransaction) await editTransaction(editingTransaction.id, { type: "income", ...input });
                else await createIncome(input);
            } else if (editingTransaction) {
                await editTransaction(editingTransaction.id, { type: "expense", ...input });
            } else {
                await createExpense(input);
            }
        }

        setForm((current) => ({ ...current, amount: "", toAmount: "", description: "" }));
        setEditingTransaction(null);
        setSaved(true);
        await loadData();
        window.setTimeout(() => setSaved(false), 2400);
    };

    const removeTransaction = async (id: string) => {
        const transaction = transactions.find((item) => item.id === id);
        if (!transaction) return;

        const transactionLabel = transaction.type === "income"
            ? "ingreso"
            : transaction.type === "expense"
                ? "gasto"
                : transaction.type === "transfer"
                    ? "transferencia"
                    : "movimiento de meta";
        const confirmed = window.confirm(
            `¿Eliminar este ${transactionLabel}? Esta acción modificará los saldos derivados y no se puede deshacer.`,
        );
        if (!confirmed) return;

        await deleteTransaction(id);
        if (editingTransaction?.id === id) setEditingTransaction(null);
        await loadData();
    };

    const startEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setType(transaction.type);
        setForm((current) => ({
            ...current,
            accountId: transaction.accountId || current.accountId,
            categoryId: transaction.categoryId || current.categoryId,
            amount: String(transaction.amount ?? transaction.fromAmount ?? ""),
            currency: transaction.currency || transaction.fromCurrency || current.currency,
            fromAccountId: transaction.fromAccountId || current.fromAccountId,
            toAccountId: transaction.toAccountId || current.toAccountId,
            toAmount: String(transaction.toAmount ?? ""),
            description: transaction.description || "",
            date: transaction.date.slice(0, 10),
            goalId: transaction.goalId || current.goalId,
        }));
    };

    const cancelEdit = () => {
        setEditingTransaction(null);
        setForm((current) => ({ ...current, amount: "", toAmount: "", description: "" }));
    };

    const formatAmount = (transaction: Transaction) => {
        const amount = transaction.type === "transfer" ? transaction.fromAmount : transaction.amount;
        const currency = transaction.type === "transfer" ? transaction.fromCurrency : transaction.currency;
        return `${(amount || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || "USD"}`;
    };

    return (
        <AppShell activeItem="Movimientos" onNavigate={onNavigate}>
            <div className="p-3 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-primary">Registro financiero</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl">Movimientos</h1>
                            <p className="mt-1 text-sm text-primary-dark/60">Registra cada entrada, salida o transferencia para mantener tus saldos al día.</p>
                        </div>
                        {saved && <div className="flex items-center gap-2 self-start rounded-full bg-success/10 px-3 py-2 text-sm font-semibold text-success"><Check size={16} /> Movimiento guardado</div>}
                    </header>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                        <section className="min-w-0 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="mb-5 flex items-center gap-2"><Plus size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">{editingTransaction ? "Editar movimiento" : "Nuevo movimiento"}</h2></div>
                            <div className="mb-5 flex gap-1 rounded-2xl bg-primary-dark/5 p-1">
                                {(["expense", "income", "transfer"] as TransactionType[]).map((item) => <button key={item} type="button" onClick={() => changeType(item)} className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition sm:text-sm ${type === item || (item === "transfer" && (type === "goal_contribution" || type === "goal_withdrawal")) ? "bg-white text-primary shadow-sm" : "text-primary-dark/55 hover:text-primary-dark"}`}>{item === "expense" ? "Gasto" : item === "income" ? "Ingreso" : "Transferencia"}</button>)}
                            </div>
                            {(type === "transfer" || type === "goal_contribution" || type === "goal_withdrawal") && <div className="mb-5 space-y-2 rounded-2xl bg-background p-3 text-sm text-primary-dark">
                                <label className="flex items-center gap-2 font-medium"><input type="radio" name="transferKind" checked={type === "transfer"} onChange={() => changeType("transfer")} /> Transferencia entre cuentas</label>
                                <label className="flex items-center gap-2 font-medium"><input type="radio" name="transferKind" checked={type === "goal_contribution"} onChange={() => changeType("goal_contribution")} /> Aporte a meta</label>
                                <label className="flex items-center gap-2 font-medium"><input type="radio" name="transferKind" checked={type === "goal_withdrawal"} onChange={() => changeType("goal_withdrawal")} /> Retiro de meta</label>
                            </div>}
                            {accounts.length === 0 && (
                                <p className="mb-4 rounded-xl bg-background px-3 py-3 text-sm text-primary-dark/70">
                                    No hay cuentas activas. Crea una en Cuentas para registrar movimientos.{" "}
                                    <button type="button" onClick={() => onNavigate?.("Cuentas")} className="font-semibold text-primary hover:text-primary-dark">Ir a Cuentas</button>
                                </p>
                            )}
                            <form className="min-w-0 space-y-4" onSubmit={handleSubmit}>
                                {type === "transfer" ? <>
                                    <label className="block text-sm font-medium text-primary-dark">Cuenta origen<select value={form.fromAccountId} onChange={(event) => setField("fromAccountId", event.target.value)} className="field mt-1">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
                                    <label className="block text-sm font-medium text-primary-dark">Cuenta destino<select value={form.toAccountId} onChange={(event) => setField("toAccountId", event.target.value)} className="field mt-1">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
                                    <div className="grid min-w-0 grid-cols-2 gap-3"><label className="min-w-0 block text-sm font-medium text-primary-dark">Sale<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setField("amount", event.target.value)} className="field mt-1" placeholder="0,00" /></label><label className="min-w-0 block text-sm font-medium text-primary-dark">Llega<input required min="0.01" step="0.01" type="number" value={form.toAmount} onChange={(event) => setField("toAmount", event.target.value)} className="field mt-1" placeholder="0,00" /></label></div>
                                    <p className="rounded-xl bg-background px-3 py-2 text-xs text-primary-dark/60">{fromAccount?.currency || "USD"} → {toAccount?.currency || "USD"}. La tasa se calcula automáticamente.</p>
                                </> : type === "goal_contribution" || type === "goal_withdrawal" ? <>
                                    <label className="block text-sm font-medium text-primary-dark">{type === "goal_contribution" ? "Cuenta origen" : "Cuenta destino"}<select value={form.accountId} onChange={(event) => setField("accountId", event.target.value)} className="field mt-1">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
                                    <label className="block text-sm font-medium text-primary-dark">Meta<select value={form.goalId} onChange={(event) => setField("goalId", event.target.value)} className="field mt-1">{compatibleGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name} · {goal.currency}</option>)}</select></label>
                                    <label className="block text-sm font-medium text-primary-dark">Monto<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setField("amount", event.target.value)} className="field mt-1" placeholder="0,00" /></label>
                                    <p className="rounded-xl bg-background px-3 py-2 text-xs text-primary-dark/60">El dinero permanece en la cuenta, pero queda comprometido en la meta.</p>
                                </> : <>
                                    <label className="block text-sm font-medium text-primary-dark">Cuenta<select value={form.accountId} onChange={(event) => setField("accountId", event.target.value)} className="field mt-1">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
                                    <div className="grid min-w-0 grid-cols-2 gap-3"><label className="min-w-0 block text-sm font-medium text-primary-dark">Monto<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setField("amount", event.target.value)} className="field mt-1" placeholder="0,00" /></label><div className="min-w-0"><span className="block text-sm font-medium text-primary-dark">Moneda</span><div className="field mt-1 flex items-center bg-primary-dark/5 text-primary-dark">{selectedAccount?.currency || form.currency}</div></div></div>
                                    <label className="block text-sm font-medium text-primary-dark">Categoría<select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} className="field mt-1">{filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                                </>}
                                <label className="block min-w-0 text-sm font-medium text-primary-dark">Fecha<input required type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} className="field mt-1" /></label>
                                <label className="block text-sm font-medium text-primary-dark">Descripción <span className="font-normal text-primary-dark/40">(opcional)</span><input type="text" value={form.description} onChange={(event) => setField("description", event.target.value)} className="field mt-1" placeholder="Ej. Compra del supermercado" /></label>
                                <button type="submit" disabled={accounts.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-sky shadow-sm transition hover:bg-primary-dark disabled:opacity-50"><Check size={18} /> Guardar movimiento</button>
                                {editingTransaction && <button type="button" onClick={cancelEdit} className="w-full text-sm font-semibold text-primary-dark/60">Cancelar edición</button>}
                            </form>
                        </section>

                        <section className="min-w-0 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Historial</p><h2 className="mt-1 text-lg font-bold text-primary-dark">Todos tus movimientos</h2></div><span className="shrink-0 rounded-full bg-sky/35 px-3 py-1 text-xs font-semibold text-primary">{transactions.length} registros</span></div>
                            {transactions.length === 0 ? <div className="mt-8 rounded-2xl bg-background px-5 py-10 text-center text-sm text-primary-dark/55">Todavía no hay movimientos registrados.</div> : <div className="mt-5 divide-y divide-primary-dark/5">{transactions.map((transaction) => { const income = transaction.type === "income"; const transfer = transaction.type === "transfer"; const goalMovement = transaction.type === "goal_contribution" || transaction.type === "goal_withdrawal"; const negativeMovement = goalMovement || transaction.type === "expense"; return <div key={transaction.id} className="flex items-start gap-3 py-4 first:pt-0">
                                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${income ? "text-success" : transfer ? "text-primary" : negativeMovement ? "movement-negative" : "text-primary"}`}>{income ? <ArrowDownLeft size={17} /> : transfer ? <ArrowLeftRight size={17} /> : <ArrowUpRight size={17} />}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                        <p className="truncate text-sm font-semibold text-primary-dark">{transaction.description || (income ? "Ingreso" : transfer ? "Transferencia" : transaction.type === "goal_contribution" ? "Aporte a meta" : transaction.type === "goal_withdrawal" ? "Retiro de meta" : "Gasto")}</p>
                                        <p className={`shrink-0 text-sm font-bold ${income ? "text-success" : goalMovement || transaction.type === "expense" ? "movement-negative" : "text-primary-dark"}`}>{income ? "+" : transfer ? "↔" : transaction.type === "goal_withdrawal" ? "+" : "-"} {formatAmount(transaction)}</p>
                                    </div>
                                    <p className="mt-0.5 text-xs text-primary-dark/50">{new Date(transaction.date).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                    <div className="mt-1.5 flex gap-3">{!goalMovement && <button type="button" onClick={() => startEdit(transaction)} className="inline-flex items-center gap-1 text-xs text-primary-dark/40 hover:text-primary"><Pencil size={13} /> Editar</button>}<button type="button" onClick={() => void removeTransaction(transaction.id)} className="inline-flex items-center gap-1 text-xs text-primary-dark/40 hover:text-red-600"><Trash2 size={13} /> Eliminar</button></div>
                                </div>
                            </div>; })}</div>}
                        </section>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default Transactions;
