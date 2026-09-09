import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { getBaseCurrency, getBirthDate } from "../services/settingsService";
import {
  calculateComprehensiveDiagnostic,
  type ComprehensiveDiagnosticResult,
} from "../services/diagnosticService";

interface DiagnosticProps {
  onNavigate?: (label: string) => void;
}

function Diagnostic({ onNavigate }: DiagnosticProps) {
  const [data, setData] = useState<ComprehensiveDiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState<string | null>("savings");

  const birthDateConfigured = Boolean(getBirthDate());

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const result = await calculateComprehensiveDiagnostic(getBaseCurrency());
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return (
      <AppShell activeItem="Diagnóstico" onNavigate={onNavigate}>
        <div className="p-6 text-center text-primary-dark/60">
          <p className="mt-8 text-sm font-medium">Analizando tus Cuentas y Movimientos para generar tu Diagnóstico...</p>
        </div>
      </AppShell>
    );
  }

  const pillarIcons: Record<string, typeof Wallet> = {
    savings: Wallet,
    debt: Activity,
    investment: TrendingUp,
    budget: ShieldCheck,
  };

  const { unlockStatus } = data;

  // -----------------------------------------------------------------
  // PANTALLA DE PERFIL EN FORMACIÓN (SI NO CUMPLE LOS 3 REQUISITOS)
  // -----------------------------------------------------------------
  if (!unlockStatus.isUnlocked) {
    const c1 = unlockStatus.currentTransactions >= unlockStatus.minTransactionsRequired ? 1 : 0;
    const c2 = unlockStatus.hasMinAccounts ? 1 : 0;
    const c3 = unlockStatus.hasPositiveLiquidWorth ? 1 : 0;
    const criteriaMet = c1 + c2 + c3;
    const levelNumber = Math.max(1, criteriaMet);

    return (
      <AppShell activeItem="Diagnóstico" onNavigate={onNavigate}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-2xl text-center">
            {/* Header */}
            <header className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Perfil Financiero
              </p>
            </header>

            {/* Circular / Hexagonal Level Badge */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary-dark/10 bg-primary-dark/5 shadow-inner">
                {/* Hexagon shape badge container */}
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition transform hover:scale-105">
                  <span className="text-4xl font-extrabold">{levelNumber}</span>
                </div>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl">
                Perfil en formación
              </h1>
              <p className="mt-2 text-sm text-primary-dark/65 max-w-md mx-auto">
                Todavía estamos conociendo tus hábitos. Llevas {unlockStatus.currentTransactions} de {unlockStatus.minTransactionsRequired} movimientos ({criteriaMet} de 3 criterios completados).
              </p>
            </div>

            {/* Requirements Checklist Card */}
            <div className="text-left rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-primary-dark sm:text-base">
                  Requisitos para desbloquear tu Diagnóstico
                </h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {criteriaMet} / 3 Criterios
                </span>
              </div>

              <div className="space-y-3">
                {/* Requisito 1: 15 Movimientos */}
                <div
                  className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-semibold sm:text-sm ${c1 === 1
                    ? "bg-success/10 text-success"
                    : "bg-background text-primary-dark/70"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className={c1 === 1 ? "text-success" : "text-primary-dark/30"}
                    />
                    <span>Al menos 15 movimientos registrados</span>
                  </div>
                  <span className="font-bold">
                    Llevas {unlockStatus.currentTransactions} de {unlockStatus.minTransactionsRequired}
                  </span>
                </div>

                {/* Requisito 2: 1 Cuenta Activa */}
                <div
                  className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-semibold sm:text-sm ${c2 === 1
                    ? "bg-success/10 text-success"
                    : "bg-background text-primary-dark/70"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className={c2 === 1 ? "text-success" : "text-primary-dark/30"}
                    />
                    <span>Al menos 1 cuenta activa creada</span>
                  </div>
                  <span className="font-bold">
                    {unlockStatus.currentActiveAccounts} / 1
                  </span>
                </div>

                {/* Requisito 3: Patrimonio Líquido > 0 */}
                <div
                  className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-semibold sm:text-sm ${c3 === 1
                    ? "bg-success/10 text-success"
                    : "bg-background text-primary-dark/70"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className={c3 === 1 ? "text-success" : "text-primary-dark/30"}
                    />
                    <span>Patrimonio líquido mayor a 0</span>
                  </div>
                  <span className="font-bold">
                    {data.baseCurrency} {unlockStatus.totalLiquidBalance.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.("Movimientos")}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-sky shadow-sm transition hover:bg-primary-dark sm:text-sm"
                >
                  <Plus size={16} />
                  Registrar Movimiento
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.("Cuentas")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-white px-4 py-3 text-xs font-bold text-primary-dark transition hover:bg-primary/5 sm:text-sm"
                >
                  <Wallet size={16} />
                  Administrar Cuentas
                </button>
              </div>
            </div>

            {/* Blurred Preview Card */}
            <div className="relative mt-6 overflow-hidden rounded-3xl bg-white p-6 shadow-sm opacity-40 blur-[2px] pointer-events-none select-none text-left">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="h-4 w-32 rounded bg-primary-dark/20" />
                <div className="h-6 w-16 rounded-full bg-primary/20" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-10 w-full rounded-2xl bg-primary-dark/10" />
                <div className="h-10 w-full rounded-2xl bg-primary-dark/10" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                <span className="flex items-center gap-2 rounded-full bg-primary-dark px-4 py-2 text-xs font-bold text-white shadow-md">
                  <Lock size={14} /> Diagnóstico en formación
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // -----------------------------------------------------------------
  // DIAGNÓSTICO COMPLETO (CUANDO CUMPLE TODOS LOS REQUISITOS)
  // -----------------------------------------------------------------
  return (
    <AppShell activeItem="Diagnóstico" onNavigate={onNavigate}>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-primary">Evaluación Cuantitativa</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <Database size={12} /> 100% Extraído de Cuentas y Movimientos
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl">
                Diagnóstico Financiero
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-primary-dark/65 sm:text-sm">
                Escala de 100 puntos obtenida automáticamente de tus registros reales.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.("Configuración")}
              className="flex items-center gap-2 self-start rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-primary shadow-sm ring-1 ring-primary/10 transition hover:bg-primary/5 sm:text-sm"
              title="Configurar fecha de nacimiento en Ajustes"
            >
              <User size={16} />
              Edad: {data.calculatedValues.userAge} años
              {!birthDateConfigured && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  Configurar
                </span>
              )}
            </button>
          </header>

          {/* Main Score Hero Card */}
          <section className="mb-6 rounded-3xl bg-primary-dark p-5 text-white shadow-md sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              {/* Left Score Dial */}
              <div className="flex flex-col items-center justify-center text-center lg:border-r lg:border-white/10 lg:pr-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky">Score Total de Salud</p>
                <div className="relative my-3 flex items-baseline justify-center">
                  <span className="text-6xl font-extrabold tracking-tight sm:text-7xl">
                    {data.totalScore}
                  </span>
                  <span className="ml-1 text-xl font-bold text-sky sm:text-2xl">/100</span>
                </div>

                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold shadow-sm"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${data.healthColor} 15%, var(--color-transparent))`,
                    color: data.healthColor === "var(--color-primary)" ? "var(--color-info)" : data.healthColor,
                    border: `1px solid color-mix(in srgb, ${data.healthColor} 31%, var(--color-transparent))`,
                  }}
                >
                  <Sparkles size={14} />
                  {data.healthLevel}
                </div>
              </div>

              {/* Right Summary & Quick Pillars */}
              <div>
                <p className="text-sm font-medium leading-relaxed text-white/90">
                  {data.summaryText}
                </p>

                {/* 4 Pillars Mini Bar Grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(data.pillars).map(([key, pillar]) => {
                    const Icon = pillarIcons[key] || Target;
                    const pct = (pillar.score / pillar.maxScore) * 100;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setExpandedPillar(expandedPillar === key ? null : key)}
                        className={`flex flex-col justify-between rounded-2xl p-3 text-left transition ${expandedPillar === key
                          ? "bg-white/20 ring-1 ring-white/30"
                          : "bg-white/10 hover:bg-white/15"
                          }`}
                      >
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <Icon size={15} className="text-sky" />
                          <span className="font-bold text-white">
                            {pillar.score}/{pillar.maxScore}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-[11px] font-semibold text-white/90">
                          {pillar.name}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-info)" : "var(--color-danger)",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Real Metrics Bar */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-primary/5 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-primary-dark/55">Ahorro Líquido</p>
                <Database size={13} className="text-primary/40" />
              </div>
              <p className="mt-1 truncate text-sm font-bold text-primary-dark sm:text-base">
                {data.baseCurrency} {data.calculatedValues.totalLiquidBalance.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-0.5 text-[10px] text-primary-dark/45">
                {data.calculatedValues.monthsEmergencyCoverage.toFixed(1)} meses de cobertura
              </p>
            </div>

            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-primary/5 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-primary-dark/55">Tasa de Ahorro</p>
                <Database size={13} className="text-primary/40" />
              </div>
              <p className="mt-1 truncate text-sm font-bold text-primary-dark sm:text-base">
                {data.calculatedValues.savingsRatePercent.toFixed(1)}%
              </p>
              <p className="mt-0.5 text-[10px] text-primary-dark/45">Del ingreso del mes</p>
            </div>

            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-primary/5 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-primary-dark/55">Deuda / Ingreso (DTI)</p>
                <Database size={13} className="text-primary/40" />
              </div>
              <p className="mt-1 truncate text-sm font-bold text-primary-dark sm:text-base">
                {data.calculatedValues.dtiPercent.toFixed(1)}%
              </p>
              <p className="mt-0.5 text-[10px] text-primary-dark/45">
                {data.calculatedValues.dtiPercent < 20 ? "Nivel saludable (<20%)" : "Atención requerida"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-primary/5 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-primary-dark/55">Patrimonio Neto</p>
                <Database size={13} className="text-primary/40" />
              </div>
              <p className="mt-1 truncate text-sm font-bold text-primary-dark sm:text-base">
                {data.baseCurrency} {data.calculatedValues.actualNetWorth.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-0.5 text-[10px] text-primary-dark/45">Saldos netos en Cuentas</p>
            </div>
          </div>

          {/* 4 Pillars Detailed Accordion List */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary-dark sm:text-lg">
              Desglose Cuantitativo por Pilares
            </h2>

            {Object.entries(data.pillars).map(([key, pillar]) => {
              const Icon = pillarIcons[key] || Target;
              const isExpanded = expandedPillar === key;
              const pct = (pillar.score / pillar.maxScore) * 100;

              return (
                <article
                  key={key}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-primary/5 transition"
                >
                  {/* Pillar Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedPillar(isExpanded ? null : key)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-primary-dark sm:text-base">
                          {pillar.name}
                        </h3>
                        <p className="text-xs text-primary-dark/55">
                          {pillar.metrics.length} criterios evaluados automáticamente
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary-dark sm:text-base">
                          {pillar.score} <span className="text-xs text-primary-dark/50">/ 25 pts</span>
                        </p>
                        <p
                          className="text-[10px] font-semibold"
                          style={{
                            color: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-primary)" : "var(--color-danger)",
                          }}
                        >
                          {pct >= 80 ? "Sólido" : pct >= 50 ? "Aceptable" : "Requiere atención"}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-primary-dark/40" />
                      ) : (
                        <ChevronDown size={18} className="text-primary-dark/40" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Pillar Details */}
                  {isExpanded && (
                    <div className="border-t border-primary-dark/5 bg-background/50 p-4 sm:p-6 space-y-4">
                      {pillar.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-primary/5 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-primary-dark sm:text-sm">
                                {metric.label}
                              </p>
                              <p className="text-[11px] font-semibold text-primary">
                                Resultado: {metric.valueFormatted}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                              {metric.score} / {metric.maxScore} pts
                            </span>
                          </div>

                          <p className="text-xs text-primary-dark/65">{metric.description}</p>

                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary-dark/50 bg-primary-dark/5 px-2.5 py-1 rounded-lg">
                            <Database size={12} className="text-primary" />
                            <span>{metric.sourceInfo}</span>
                          </div>

                          <div className="flex items-start gap-2 rounded-xl bg-sky/20 p-2.5 text-xs text-primary-dark/80">
                            <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-[11px] leading-relaxed">{metric.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default Diagnostic;
