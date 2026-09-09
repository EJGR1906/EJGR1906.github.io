import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import { getRecurringTransactions } from "../repositories/recurringRepository";
import { generatePendingRecurring, removeRecurring, setRecurringActive } from "../services/recurringService";
import type { RecurringTransaction } from "../database/db";

function Recurring({ onNavigate }: { onNavigate?: (label: string) => void }) {
    const [items, setItems] = useState<RecurringTransaction[]>([]);
    const [message, setMessage] = useState("");
    const load = async () => setItems(await getRecurringTransactions());
    useEffect(() => {
        // La lista se sincroniza con IndexedDB al montar la pantalla.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, []);
    const generate = async () => { const count = await generatePendingRecurring(); await load(); setMessage(`${count} movimiento${count === 1 ? " generado" : "s generados"}.`); };
    return <AppShell activeItem="Recurrentes" onNavigate={onNavigate}><div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-4xl"><header className="mb-6"><p className="text-sm font-medium text-primary">Automatización local</p><h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Movimientos recurrentes</h1><p className="mt-1 text-sm text-primary-dark/60">Las plantillas generan movimientos normales una sola vez por fecha programada.</p></header><button type="button" onClick={() => void generate()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Generar pendientes</button>{message && <p className="mt-3 text-sm text-primary-dark/70">{message}</p>}<div className="mt-6 space-y-3">{items.length === 0 ? <div className="rounded-2xl bg-white p-5 text-sm text-primary-dark/60 shadow-sm">No hay plantillas recurrentes.</div> : items.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm"><div><p className="font-semibold text-primary-dark">{item.description || item.type}</p><p className="text-sm text-primary-dark/60">Próximo: {item.nextDate} · {item.frequency}</p></div><div className="flex gap-2"><button type="button" onClick={() => void setRecurringActive(item.id, !item.active).then(load)} className="rounded-lg border border-primary/15 px-3 py-2 text-sm">{item.active ? "Pausar" : "Activar"}</button><button type="button" onClick={() => void removeRecurring(item.id).then(load)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Eliminar</button></div></article>)}</div><button type="button" onClick={() => onNavigate?.("Menú")} className="mt-6 text-sm font-semibold text-primary">Volver al menú</button></div></div></AppShell>;
}

export default Recurring;