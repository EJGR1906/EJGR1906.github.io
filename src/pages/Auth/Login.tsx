import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface LoginProps {
    onRegister: () => void;
    onForgotPassword: () => void;
}

function Login({ onRegister, onForgotPassword }: LoginProps) {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await signIn(email.trim(), password);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "";
            setError(message.toLowerCase().includes("rate limit") ? "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." : message || "No se pudo iniciar sesión.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-primary/10 sm:p-8">
                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-sky"><LogIn size={22} /></div>
                    <p className="text-sm font-medium text-primary">Cronos Finanzas</p>
                    <h1 className="mt-1 text-2xl font-bold text-primary-dark">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-primary-dark/60">Tus datos se sincronizarán de forma segura entre tus dispositivos.</p>
                </div>
                <label className="block text-sm font-medium text-primary-dark">Correo electrónico<input className="field mt-1" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                <label className="mt-4 block text-sm font-medium text-primary-dark">Contraseña<input className="field mt-1" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</button>
                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={onForgotPassword}>¿Olvidaste tu contraseña?</button>
                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={onRegister}>Crear una cuenta</button>
            </form>
        </main>
    );
}

export default Login;
