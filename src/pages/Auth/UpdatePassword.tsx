import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface UpdatePasswordProps {
    onDone: () => void;
}

function UpdatePassword({ onDone }: UpdatePasswordProps) {
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (password !== confirmation) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setSubmitting(true);
        try {
            await updatePassword(password);
            onDone();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo actualizar la contraseña.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-primary/10 sm:p-8">
                <div className="mb-8"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-sky"><KeyRound size={22} /></div><h1 className="text-2xl font-bold text-primary-dark">Nueva contraseña</h1><p className="mt-2 text-sm text-primary-dark/60">Elige una contraseña de al menos 6 caracteres.</p></div>
                <label className="block text-sm font-medium text-primary-dark">Nueva contraseña<input className="field mt-1" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
                <label className="mt-4 block text-sm font-medium text-primary-dark">Repetir contraseña<input className="field mt-1" type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar contraseña"}</button>
            </form>
        </main>
    );
}

export default UpdatePassword;