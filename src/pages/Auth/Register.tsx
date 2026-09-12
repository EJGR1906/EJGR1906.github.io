import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface RegisterProps {
    onLogin: () => void;
}

function parseBirthDate(value: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
    return `${year}-${month}-${day}`;
}

function formatBirthDate(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function Register({ onLogin }: RegisterProps) {
    // 1. Desestructuramos signInWithGoogle (asegúrate de exponerlo en tu useAuth)
    const { signUp, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("+58 ");
    const [step, setStep] = useState<1 | 2>(1);
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
        if (step === 1) {
            setStep(2);
            return;
        }
        const parsedBirthDate = parseBirthDate(birthDate);
        if (!parsedBirthDate) {
            setError("Introduce una fecha válida con el formato dd/mm/yyyy.");
            return;
        }
        if (new Date(`${parsedBirthDate}T00:00:00`) > new Date()) {
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
            const result = await signUp(email.trim(), password, { birthDate: parsedBirthDate, phone: normalizedPhone || undefined });
            setMessage(result.needsConfirmation ? "Revisa tu correo para confirmar la cuenta." : "Cuenta creada correctamente.");
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "";
            setError(message.toLowerCase().includes("rate limit") ? "Hay un problema temporal al registrar nuevas cuentas. Espera unos minutos antes de volver a registrarte." : message || "No se pudo crear la cuenta.");
        } finally {
            setSubmitting(false);
        }
    }

    // 2. Manejador para el clic en Google
    async function handleGoogleSignIn() {
        try {
            setError("");
            if (signInWithGoogle) {
                await signInWithGoogle();
            }
        } catch (cause) {
            const errMessage = cause instanceof Error ? cause.message : "Error al iniciar sesión con Google.";
            setError(errMessage);
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
                {step === 1 ? <>
                    <label className="block text-sm font-medium text-primary-dark">Correo electrónico<input className="field mt-1" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                    <label className="mt-4 block text-sm font-medium text-primary-dark">Contraseña<input className="field mt-1" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>
                    <label className="mt-4 block text-sm font-medium text-primary-dark">Repetir contraseña<input className="field mt-1" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={6} /></label>
                </> : <>
                    <p className="mb-4 rounded-xl bg-primary/5 p-3 text-sm text-primary-dark/70">Paso 2 de 2: completa tus datos personales.</p>
                    <label className="block text-sm font-medium text-primary-dark">Fecha de cumpleaños<input className="field mt-1" type="text" inputMode="numeric" placeholder="dd/mm/yyyy" maxLength={10} value={birthDate} onChange={(event) => setBirthDate(formatBirthDate(event.target.value))} required /></label>
                    <label className="mt-4 block text-sm font-medium text-primary-dark">Teléfono <span className="font-normal text-primary-dark/50">(opcional)</span><input className="field mt-1" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { const value = event.target.value; setPhone(value.startsWith("+58") ? value : `+58 ${value.replace(/^\+?58\s*/, "")}`); }} placeholder="+58 414 5418304" /></label>
                </>}
                {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
                {message && <p role="status" className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm font-medium text-green-700 dark:text-green-400">{message}</p>}

                <button className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-fg shadow-sm transition hover:opacity-95 disabled:opacity-50" type="submit" disabled={submitting}>
                    {submitting ? "Creando..." : step === 1 ? "Continuar" : "Registrarme"}
                </button>

                {step === 2 && <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={() => setStep(1)}>Volver</button>}

                {/* Separador visual */}
                {step === 1 && <>
                    <div className="relative my-6 flex items-center justify-center">
                        <div className="w-full border-t border-primary-dark/15 dark:border-white/15"></div>
                        <span className="absolute bg-white px-3 text-xs font-semibold text-primary-dark/60">O</span>
                    </div>

                    {/* Botón de Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-primary-dark/15 bg-white px-4 py-3 text-sm font-semibold text-primary-dark shadow-sm transition hover:bg-primary-dark/5 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Continuar con Google
                    </button>
                </>}

                <button className="mt-4 w-full text-sm font-semibold text-primary hover:text-primary-dark" type="button" onClick={onLogin}>Ya tengo una cuenta</button>
            </form>
        </main>
    );
}

export default Register;