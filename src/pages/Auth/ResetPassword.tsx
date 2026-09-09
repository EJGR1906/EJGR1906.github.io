import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface ResetPasswordProps {
    onLogin: () => void;
}

function ResetPassword({ onLogin }: ResetPasswordProps) {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");
        setSubmitting(true);
        try {
            await resetPassword(email.trim());
            setMessage("Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "No se pudo enviar el correo.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-primary/10 sm:p-8">
                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-sky"><KeyRound size={22} /></div>
                    <p className="text-sm font-medium text-primary">Cronos Finanzas</p>
                    <h1 className="mt-1 text-2xl font-bold text-primary-dark">Restablecer contraseña</h1>
                    <p className="mt-2 text-sm text-primary-dark/60">Te enviaremos un enlace para crear una contraseña nueva.</p>
                </div>
                <label className="block text-sm font-medium text-primary-dark">Correo electrónico<input className="field mt-1" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
                <button className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar enlace"}</button>
                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={onLogin}>Volver a iniciar sesión</button>
            </form>
        </main>
    );
}

export default ResetPassword;