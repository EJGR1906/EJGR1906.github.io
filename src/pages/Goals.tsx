import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { type Account, type Goal } from "../database/db";
import {
    createGoal as createGoalEntity,
    getActiveGoalAccounts,
    deleteGoalWithTransactions,
    getGoalsWithProgress,
    migrateLegacyGoals,
} from "../services/goalService";
import {
    createGoalContribution,
    createGoalWithdrawal,
} from "../services/transactionService";
import { todayLocal } from "../utils/date";

type GoalWithProgress = Goal & {
    savedAmount: number;
    progress: number;
    monthsRemaining: number | null;
    suggestedMonthlyContribution: number | null;
};

function Goals() {
    const [goals, setGoals] = useState<GoalWithProgress[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState({
        name: "",
        target: "",
        currency: "USD" as Goal["currency"],
        backingAccountId: "",
        category: "purchase" as Goal["category"],
        deadline: "",
    });
    const [message, setMessage] = useState("");
    const [contributionAmount, setContributionAmount] = useState<Record<string, string>>({});

    const loadGoals = useCallback(async () => {
        await migrateLegacyGoals();
        const [goalProgress, activeAccounts] = await Promise.all([
            getGoalsWithProgress(),
            getActiveGoalAccounts(),
        ]);
        setAccounts(activeAccounts);
        setGoals(goalProgress.map((item) => ({
            ...item.goal,
            savedAmount: item.savedAmount,
            progress: item.progressPercent,
            monthsRemaining: item.monthsRemaining,
            suggestedMonthlyContribution: item.suggestedMonthlyContribution,
        })));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadGoals();
    }, [loadGoals]);

    const availableAccounts = useMemo(
        () => accounts.filter((account) => account.currency === form.currency && account.active),
        [accounts, form.currency]
    );

    const createGoal = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!form.name.trim() || Number(form.target) <= 0) {
            setMessage("Necesitas un nombre y un objetivo mayor que cero.");
            return;
        }

        const selectedAccountId = form.backingAccountId || availableAccounts[0]?.id || "";

        if (!selectedAccountId) {
            setMessage("Primero crea una cuenta activa con la misma moneda para vincular la meta.");
            return;
        }

        await createGoalEntity({
            name: form.name,
            targetAmount: Number(form.target),
            currency: form.currency,
            backingAccountId: selectedAccountId,
            category: form.category,
            deadline: form.deadline || undefined,
            active: true,
        });
        setForm({ name: "", target: "", currency: "USD", backingAccountId: "", category: "purchase", deadline: "" });
        setMessage("Meta creada correctamente.");
        await loadGoals();
    };

    const addContribution = async (goal: GoalWithProgress, direction: "goal_contribution" | "goal_withdrawal") => {
        const rawValue = contributionAmount[goal.id] ?? "";
        const amount = Number(rawValue);

        if (!Number.isFinite(amount) || amount <= 0) {
            setMessage("El monto debe ser mayor que cero.");
            return;
        }

        const input = {
            goalId: goal.id,
            accountId: goal.backingAccountId,
            amount,
            currency: goal.currency,
            description:
                direction === "goal_contribution"
                    ? `Aporte a meta: ${goal.name}`
                    : `Retiro de meta: ${goal.name}`,
            date: new Date().toISOString(),
        };

        if (direction === "goal_contribution") {
            await createGoalContribution(input);
        } else {
            await createGoalWithdrawal(input);
        }

        setContributionAmount((current) => ({ ...current, [goal.id]: "" }));
        setMessage(
            direction === "goal_contribution" ? "Aporte registrado en la meta." : "Retiro registrado en la meta."
        );
        await loadGoals();
    };

    const removeGoal = async (goal: GoalWithProgress) => {
        const confirmed = window.confirm(
            `¿Eliminar la meta "${goal.name}" y todos sus aportes y retiros? Esta acción no se puede deshacer.`,
        );
        if (!confirmed) return;

        try {
            await deleteGoalWithTransactions(goal.id);
            setMessage("Meta y movimientos eliminados correctamente.");
            await loadGoals();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No se pudo eliminar la meta.");
        }
    };

    return (
        <AppShell activeItem="Metas">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-6">
                        <p className="text-sm font-medium text-primary">Ahorro con intención</p>
                        <h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Metas</h1>
                        <p className="mt-1 text-sm text-primary-dark/60">
                            Una meta vive como planificación y compromiso, sin crear una cuenta física nueva.
                        </p>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="mb-5 flex items-center gap-2">
                                <Plus size={18} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Nueva meta</h2>
                            </div>

                            <form onSubmit={(event) => void createGoal(event)} className="space-y-4">
                                <label className="block text-sm font-medium text-primary-dark">
                                    Nombre
                                    <input
                                        className="field mt-1"
                                        value={form.name}
                                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                                        placeholder="Comprar laptop"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-primary-dark">
                                    Objetivo
                                    <input
                                        className="field mt-1"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={form.target}
                                        onChange={(event) => setForm({ ...form, target: event.target.value })}
                                        placeholder="1500"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-primary-dark">
                                    Moneda
                                    <select
                                        value={form.currency}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                currency: event.target.value as Goal["currency"],
                                                backingAccountId: "",
                                            })
                                        }
                                        className="field mt-1"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="VES">VES</option>
                                        <option value="USDT">USDT</option>
                                    </select>
                                </label>

                                <label className="block text-sm font-medium text-primary-dark">
                                    Tipo de meta
                                    <select
                                        value={form.category}
                                        onChange={(event) => setForm({ ...form, category: event.target.value as Goal["category"] })}
                                        className="field mt-1"
                                    >
                                        <option value="emergency">Fondo de emergencia / Reserva</option>
                                        <option value="purchase">Compra / Consumo</option>
                                        <option value="investment">Inversión / Retiro</option>
                                    </select>
                                </label>

                                <label className="block text-sm font-medium text-primary-dark">
                                    Fecha límite <span className="font-normal text-primary-dark/40">(opcional)</span>
                                    <input
                                        className="field mt-1"
                                        type="date"
                                        min={todayLocal()}
                                        value={form.deadline}
                                        onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                                    />
                                </label>

                                <label className="block text-sm font-medium text-primary-dark">
                                    Cuenta de respaldo
                                    <select
                                        value={form.backingAccountId}
                                        onChange={(event) => setForm({ ...form, backingAccountId: event.target.value })}
                                        className="field mt-1"
                                    >
                                        {availableAccounts.length === 0 ? (
                                            <option value="">No hay cuentas activas compatibles</option>
                                        ) : (
                                            availableAccounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </label>

                                {message && <p className="text-sm text-primary-dark/70">{message}</p>}

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-sky hover:bg-primary-dark"
                                >
                                    Guardar meta
                                </button>
                            </form>
                        </section>

                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <Target size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Tus metas</h2>
                            </div>

                            {goals.length === 0 ? (
                                <div className="mt-6 rounded-2xl bg-background p-8 text-center text-sm text-primary-dark/55">
                                    Todavía no tienes metas. Define una para empezar a ahorrar con claridad.
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    {goals.map((goal) => {
                                        const account = accounts.find((item) => item.id === goal.backingAccountId);

                                        return (
                                            <div key={goal.id} className="rounded-2xl bg-background p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-bold text-primary-dark">{goal.name}</p>
                                                        <p className="text-xs text-primary-dark/55">
                                                            {goal.savedAmount.toLocaleString("es-VE", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })} / {goal.targetAmount.toLocaleString("es-VE", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })} {goal.currency}
                                                        </p>
                                                        <p className="mt-1 text-xs text-primary-dark/55">
                                                            {goal.category === "emergency" ? "Fondo de emergencia / Reserva" : goal.category === "investment" ? "Inversión / Retiro" : "Compra / Consumo"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-semibold text-primary">
                                                            {goal.progress.toFixed(0)}%
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => void removeGoal(goal)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                                                            title="Eliminar meta y movimientos"
                                                        >
                                                            <Trash2 size={15} />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-dark/5">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                                    />
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-xs text-primary-dark/55">
                                                    <span>
                                                        {account ? `Cuenta: ${account.name}` : "Sin cuenta de respaldo"}
                                                    </span>
                                                    <span>{goal.currency}</span>
                                                </div>

                                                {goal.deadline && (
                                                    <p className="mt-2 text-xs text-primary-dark/55">
                                                        Fecha límite: {goal.deadline}
                                                        {goal.suggestedMonthlyContribution !== null && ` · Aporte mensual sugerido: ${goal.suggestedMonthlyContribution.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${goal.currency}`}
                                                    </p>
                                                )}

                                                <div className="mt-4 flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={contributionAmount[goal.id] ?? ""}
                                                        onChange={(event) =>
                                                            setContributionAmount((current) => ({
                                                                ...current,
                                                                [goal.id]: event.target.value,
                                                            }))
                                                        }
                                                        className="field flex-1"
                                                        placeholder="Monto"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => void addContribution(goal, "goal_contribution")}
                                                        className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark"
                                                    >
                                                        Aportar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void addContribution(goal, "goal_withdrawal")}
                                                        className="rounded-xl bg-primary-dark/10 px-3 py-2 text-xs font-bold text-primary-dark hover:bg-primary-dark/15"
                                                    >
                                                        Retirar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default Goals;
