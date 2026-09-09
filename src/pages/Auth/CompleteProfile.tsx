import { useState, type FormEvent } from "react";
import { UserRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";

function formatBirthDate(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBirthDate(value: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
    return `${year}-${month}-${day}`;
}

function CompleteProfile() {
    const { user, completeProfile, signOut } = useAuth();
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("+58 ");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        const parsedDate = parseBirthDate(birthDate);
        if (!parsedDate) {
            setError("Introduce una fecha válida con el formato dd/mm/yyyy.");
            return;
        }
        if (new Date(`${parsedDate}T00:00:00`) > new Date()) {
            setError("La fecha de cumpleaños no puede estar en el futuro.");
            return;
        }
        const normalizedPhone = phone.trim() === "+58" ? "" : phone.trim();
        if (normalizedPhone && !/^\+58\s?\d{10}$/.test(normalizedPhone.replace(/\s/g, ""))) {
            setError("El teléfono debe comenzar con +58 y contener 10 dígitos.");
            return;
        }
        setSubmitting(true);
        try {
            await completeProfile(parsedDate, normalizedPhone);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo guardar el perfil.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-primary/10 sm:p-8">
                <div className="mb-8"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-sky"><UserRound size={22} /></div><p className="text-sm font-medium text-primary">Completar perfil</p><h1 className="mt-1 text-2xl font-bold text-primary-dark">Un último dato</h1><p className="mt-2 text-sm text-primary-dark/60">Necesitamos tu fecha de cumpleaños antes de mostrar tus finanzas.</p><p className="mt-2 truncate text-xs text-primary-dark/50">{user?.email}</p></div>
                <label className="block text-sm font-medium text-primary-dark">Fecha de cumpleaños<input className="field mt-1" type="text" inputMode="numeric" placeholder="dd/mm/yyyy" maxLength={10} value={birthDate} onChange={(event) => setBirthDate(formatBirthDate(event.target.value))} required /></label>
                <label className="mt-4 block text-sm font-medium text-primary-dark">Teléfono <span className="font-normal text-primary-dark/50">(opcional)</span><input className="field mt-1" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { const value = event.target.value; setPhone(value.startsWith("+58") ? value : `+58 ${value.replace(/^\+?58\s*/, "")}`); }} placeholder="+58 414 5418304" /></label>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Continuar"}</button>
                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={() => void signOut()}>Cerrar sesión</button>
            </form>
        </main>
    );
}

export default CompleteProfile;