import { Banknote, Bitcoin, Check, CreditCard, Pencil, Plus, Power, Wallet, WalletCards } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import type { Account, CurrencyCode } from "../database/db";
import { getAllAccounts } from "../repositories/accountRepository";
import { getAccountBalance, getAccountPortfolioSummary, type AccountPortfolioSummary } from "../services/financialService";
import { adjustAccountBalance } from "../services/transactionService";
import { addAccount, editAccount, setAccountActive, setLinkedUsdAccount } from "../services/accountService";

interface AccountsProps { onNavigate: (label: string) => void; }
type AccountForm = { name: string; type: Account["type"]; currency: CurrencyCode; initialBalance: string; createSecondaryUsdAccount: boolean; secondaryUsdBalance: string; nature: NonNullable<Account["nature"]>; creditLimit: string; };
const accountTypes: Account["type"][] = ["bank", "cash", "crypto", "wallet", "other"];
const typeLabels: Record<Account["type"], string> = { bank: "Banco", cash: "Efectivo", crypto: "Cripto", wallet: "Billetera", other: "Otra" };
const natureLabels: Record<string, string> = { asset: "Activo - patrimonio positivo", liability: "Pasivo - deuda o compromiso" };
const emptyForm: AccountForm = { name: "", type: "bank", currency: "USD", initialBalance: "", createSecondaryUsdAccount: false, secondaryUsdBalance: "", nature: "asset", creditLimit: "" };

function Accounts({ onNavigate }: AccountsProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [editing, setEditing] = useState<Account | null>(null);
    const [editingBalance, setEditingBalance] = useState<number | null>(null);
    const [editingSecondaryBalance, setEditingSecondaryBalance] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState<AccountForm>(emptyForm);
    const [portfolio, setPortfolio] = useState<AccountPortfolioSummary | null>(null);
    const load = useCallback(async () => {
        const accountData = await getAllAccounts();
        const accountBalances = await Promise.all(accountData.map(async (account) => [account.id, await getAccountBalance(account)] as const));
        setAccounts(accountData);
        setBalances(Object.fromEntries(accountBalances));
        setPortfolio(await getAccountPortfolioSummary("USD"));
    }, []);

    useEffect(() => {
        // IndexedDB must be loaded after the screen mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const update = <K extends keyof AccountForm>(field: K, value: AccountForm[K]) => setForm((current) => ({ ...current, [field]: value }));
    const reset = () => { setEditing(null); setEditingBalance(null); setEditingSecondaryBalance(null); setForm(emptyForm); };
    const startEdit = async (account: Account) => {
        const linkedUsd = account.institutionId ? accounts.find((candidate) => candidate.institutionId === account.institutionId && candidate.currency === "USD" && candidate.id !== account.id) : undefined;
        const currentBalance = await getAccountBalance(account);
        const secondaryBalance = linkedUsd ? await getAccountBalance(linkedUsd) : null;
        setEditing(account);
        setEditingBalance(currentBalance);
        setEditingSecondaryBalance(secondaryBalance);
        setForm({ name: account.name, type: account.type, currency: account.currency, initialBalance: String(currentBalance), createSecondaryUsdAccount: Boolean(linkedUsd?.active), secondaryUsdBalance: secondaryBalance === null ? "" : String(secondaryBalance), nature: account.nature ?? "asset", creditLimit: account.creditLimit === undefined ? "" : String(account.creditLimit) });
    };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editing) {
                await editAccount(editing.id, { name: form.name, type: form.type, nature: form.nature, creditLimit: form.nature === "liability" && form.creditLimit ? Number(form.creditLimit) : undefined });
                const nextBalance = Number(form.initialBalance);
                if (editingBalance === null || Math.abs(nextBalance - editingBalance) >= 0.00000001) {
                    await adjustAccountBalance(editing.id, nextBalance, new Date().toISOString().slice(0, 10));
                }
                if (editing.currency === "VES") {
                    const secondary = await setLinkedUsdAccount(editing.id, form.createSecondaryUsdAccount, Number(form.secondaryUsdBalance || 0));
                    const nextSecondaryBalance = Number(form.secondaryUsdBalance);
                    if (secondary && form.createSecondaryUsdAccount && (editingSecondaryBalance === null || Math.abs(nextSecondaryBalance - editingSecondaryBalance) >= 0.00000001)) {
                        await adjustAccountBalance(secondary.id, nextSecondaryBalance, new Date().toISOString().slice(0, 10));
                    }
                }
                setMessage("Cuenta actualizada.");
            } else {
                await addAccount({ name: form.name, type: form.type, currency: form.currency, initialBalance: Number(form.initialBalance), nature: form.nature, creditLimit: form.nature === "liability" && form.creditLimit ? Number(form.creditLimit) : undefined, linkedUsdAccount: form.currency === "VES" && form.createSecondaryUsdAccount, secondaryUsdBalance: Number(form.secondaryUsdBalance || 0) });
                setMessage("Cuenta guardada.");
            }
            await load();
            reset();
        } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la cuenta."); }
    };
    const toggleActive = async (account: Account) => { await setAccountActive(account.id, !account.active); await load(); };
    const accountIcon = (account: Account) => account.nature === "liability" ? CreditCard : account.type === "crypto" ? Bitcoin : account.type === "cash" ? Banknote : account.type === "wallet" ? Wallet : WalletCards;
    const formatMoney = (amount: number, currency: CurrencyCode) => `${amount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

    return (
        <AppShell activeItem="Configuración" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl">
                <header className="mb-6"><p className="text-sm font-medium text-primary">Patrimonio</p><h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Cuentas</h1><p className="mt-1 text-sm text-primary-dark/60">Administra saldos, deudas y límites. Los ajustes quedan registrados como movimientos.</p></header>
                {portfolio && <section className="mb-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-primary-dark/55">Total de activos</p><p className="mt-1 text-xl font-bold text-success">${formatMoney(portfolio.totalAssets, "USD")}</p></div><div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-primary-dark/55">Total de deudas</p><p className="mt-1 text-xl font-bold text-red-600">${formatMoney(portfolio.totalLiabilities, "USD")}</p></div><div className="rounded-2xl bg-primary-dark p-4 text-white shadow-sm"><p className="text-xs text-white/65">Patrimonio neto consolidado</p><p className="mt-1 text-xl font-bold">${formatMoney(portfolio.netWorth, "USD")}</p></div></section>}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Plus size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">{editing ? "Editar cuenta" : "Nueva cuenta"}</h2></div><form onSubmit={(event) => void submit(event)} className="space-y-4"><label className="block text-sm font-medium text-primary-dark">Nombre<input required value={form.name} onChange={(event) => update("name", event.target.value)} className="field mt-1" placeholder="Ej. Banco principal" /></label><label className="block text-sm font-medium text-primary-dark">Tipo<select value={form.type} onChange={(event) => update("type", event.target.value as Account["type"])} className="field mt-1">{accountTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label><label className="block text-sm font-medium text-primary-dark">Clasificación<select value={form.nature} onChange={(event) => update("nature", event.target.value as AccountForm["nature"])} className="field mt-1">{Object.entries(natureLabels).map(([nature, label]) => <option key={nature} value={nature}>{label}</option>)}</select></label>{form.nature === "liability" && <label className="block text-sm font-medium text-primary-dark">Límite de crédito<input min="0" step="0.01" type="number" value={form.creditLimit} onChange={(event) => update("creditLimit", event.target.value)} className="field mt-1" placeholder="Opcional" /></label>}{!editing && <><label className="block text-sm font-medium text-primary-dark">Moneda<select value={form.currency} onChange={(event) => update("currency", event.target.value as CurrencyCode)} className="field mt-1"><option value="VES">VES</option><option value="USD">USD</option><option value="USDT">USDT</option></select></label>{form.currency === "VES" && <label className="flex items-center justify-between gap-3 rounded-2xl bg-background p-3 text-sm font-medium text-primary-dark"><span><span className="block">Cuenta en dólares</span><span className="block text-xs text-primary-dark/60">Activar saldo en dólares para esta cuenta</span></span><input type="checkbox" checked={form.createSecondaryUsdAccount} onChange={(event) => update("createSecondaryUsdAccount", event.target.checked)} /></label>}{form.currency === "VES" && form.createSecondaryUsdAccount && <label className="block text-sm font-medium text-primary-dark">Saldo inicial USD<input required min="0" step="0.01" type="number" value={form.secondaryUsdBalance} onChange={(event) => update("secondaryUsdBalance", event.target.value)} className="field mt-1" /></label>}<label className="block text-sm font-medium text-primary-dark">Saldo inicial<input required min="0" step="0.01" type="number" value={form.initialBalance} onChange={(event) => update("initialBalance", event.target.value)} className="field mt-1" /></label></>}{editing && <label className="block text-sm font-medium text-primary-dark">Saldo actual<input required min="0" step="0.01" type="number" value={form.initialBalance} onChange={(event) => update("initialBalance", event.target.value)} className="field mt-1" /></label>}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-sky hover:bg-primary-dark"><Check size={17} /> Guardar cuenta</button>{editing && <button type="button" onClick={reset} className="w-full text-sm font-semibold text-primary-dark/60">Cancelar</button>}</form>{message && <p className="mt-4 rounded-xl bg-background p-3 text-sm text-primary-dark/70">{message}</p>}</section>
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6"><div className="flex items-center gap-2"><WalletCards size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">Cuentas registradas</h2></div><div className="mt-4 divide-y divide-primary-dark/5">{accounts.map((account) => { const Icon = accountIcon(account); const balance = balances[account.id] ?? 0; const isLiability = account.nature === "liability"; const availableCredit = isLiability && account.creditLimit !== undefined ? Math.max(account.creditLimit - balance, 0) : null; return <div key={account.id} className="flex items-center gap-3 py-4 first:pt-0"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isLiability ? "text-red-600" : "text-primary"}`}><Icon size={19} /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-primary-dark">{account.name}</p><p className="mt-1 text-xs text-primary-dark/50">{typeLabels[account.type]} · {account.currency} · {isLiability ? "Pasivo" : "Activo"} · {account.active ? "Activa" : "Inactiva"}</p><p className={`mt-1 text-sm font-bold ${isLiability ? "text-red-600" : "text-primary-dark"}`}>{isLiability ? "Deuda: " : "Saldo: "}{formatMoney(Math.abs(balance), account.currency)}</p>{availableCredit !== null && <p className="text-xs text-primary-dark/55">Crédito disponible: {formatMoney(availableCredit, account.currency)} / {formatMoney(account.creditLimit ?? 0, account.currency)}</p>}</div><button type="button" onClick={() => void startEdit(account)} title="Editar cuenta" className="rounded-lg p-2 text-primary hover:bg-sky/30"><Pencil size={16} /></button><button type="button" onClick={() => void toggleActive(account)} title={account.active ? "Desactivar cuenta" : "Activar cuenta"} className="rounded-lg p-2 text-primary-dark/50 hover:bg-primary-dark/5"><Power size={16} /></button></div>; })}</div></section>
                </div>
            </div></div>
        </AppShell>
    );
}

export default Accounts;
