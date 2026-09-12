import { Check, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import type { Category } from "../database/db";
import { getAllCategories } from "../repositories/categoryRepository";
import { addCategory, editCategory, removeCategory } from "../services/categoryService";

interface CategoriesProps { onNavigate: (label: string) => void; }
type CategoryForm = { name: string; type: Category["type"] };
const emptyForm: CategoryForm = { name: "", type: "expense" };
const typeLabels: Record<Category["type"], string> = { expense: "Gasto", income: "Ingreso" };

function Categories({ onNavigate }: CategoriesProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm);
    const [message, setMessage] = useState("");

    const load = useCallback(async () => setCategories(await getAllCategories()), []);
    useEffect(() => {
        // IndexedDB must be loaded after the screen mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const update = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };
    const reset = () => { setEditing(null); setForm(emptyForm); };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editing) await editCategory(editing.id, form);
            else await addCategory(form);
            await load();
            reset();
            setMessage("Categoría guardada.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No se pudo guardar la categoría.");
        }
    };

    const startEdit = (category: Category) => {
        setEditing(category);
        setForm({ name: category.name, type: category.type });
        setMessage("");
    };

    const remove = async (category: Category) => {
        try {
            await removeCategory(category.id);
            await load();
            setMessage("Categoría eliminada.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No se pudo eliminar la categoría.");
        }
    };

    const grouped = (type: Category["type"]) => categories.filter((category) => category.type === type);

    return (
        <AppShell activeItem="Configuración" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-6">
                        <p className="text-sm font-medium text-primary">Configuración</p>
                        <h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Categorías</h1>
                        <p className="mt-1 text-sm text-primary-dark/60">Organiza tus ingresos y gastos con categorías propias.</p>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="mb-5 flex items-center gap-2">
                                <Plus size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
                            </div>
                            <form onSubmit={(event) => void submit(event)} className="space-y-4">
                                <label className="block text-sm font-medium text-primary-dark">
                                    Nombre
                                    <input required maxLength={50} value={form.name} onChange={(event) => update("name", event.target.value)} className="field mt-1" placeholder="Ej. Alimentación" />
                                </label>
                                <label className="block text-sm font-medium text-primary-dark">
                                    Tipo
                                    <select value={form.type} onChange={(event) => update("type", event.target.value as Category["type"])} className="field mt-1">
                                        <option value="expense">Gasto</option>
                                        <option value="income">Ingreso</option>
                                    </select>
                                </label>
                                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-sky hover:bg-primary-dark">
                                    <Check size={17} /> Guardar categoría
                                </button>
                                {editing && <button type="button" onClick={reset} className="w-full text-sm font-semibold text-primary-dark/60">Cancelar</button>}
                            </form>
                            {message && <p className="mt-4 rounded-xl bg-background p-3 text-sm text-primary-dark/70">{message}</p>}
                        </section>

                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2"><Tags size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">Categorías registradas</h2></div>
                            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                {(["expense", "income"] as Category["type"][]).map((type) => (
                                    <div key={type}>
                                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary-dark/60">{typeLabels[type]}s</h3>
                                        <div className="space-y-2">
                                            {grouped(type).map((category) => (
                                                <div key={category.id} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5">
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary-dark">{category.name}</span>
                                                    <button type="button" onClick={() => startEdit(category)} title="Editar categoría" aria-label={`Editar categoría ${category.name}`} className="rounded-lg p-1.5 text-primary hover:bg-sky/30"><Pencil size={15} /></button>
                                                    <button type="button" onClick={() => void remove(category)} title="Eliminar categoría" aria-label={`Eliminar categoría ${category.name}`} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                                                </div>
                                            ))}
                                            {grouped(type).length === 0 && <p className="text-sm text-primary-dark/50">No hay categorías.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default Categories;
