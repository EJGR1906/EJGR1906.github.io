import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface RegisterProps {
    onLogin: () => void;
}

function Register({ onLogin }: RegisterProps) {
    const { signUp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");
        if (password !== confirmation) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setSubmitting(true);
        try {
            const result = await signUp(email.trim(), password);
            setMessage(result.needsConfirmation ? "Revisa tu correo para confirmar la cuenta." : "Cuenta creada correctamente.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-primary/10 sm:p-8">
                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-sky"><UserPlus size={22} /></div>
                    <p className="text-sm font-medium text-primary">Cronos Finanzas</p>
                    <h1 className="mt-1 text-2xl font-bold text-primary-dark">Crear cuenta</h1>
                    <p className="mt-2 text-sm text-primary-dark/60">Empieza con tus datos locales y sincronízalos con la nube.</p>
                </div>
                <label className="block text-sm font-medium text-primary-dark">Correo electrónico<input className="field mt-1" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                <label className="mt-4 block text-sm font-medium text-primary-dark">Contraseña<input className="field mt-1" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>
                <label className="mt-4 block text-sm font-medium text-primary-dark">Repetir contraseña<input className="field mt-1" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={6} /></label>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
                <button className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={submitting}>{submitting ? "Creando..." : "Registrarme"}</button>
                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={onLogin}>Ya tengo una cuenta</button>
            </form>
        </main>
    );
}

export default Register;
