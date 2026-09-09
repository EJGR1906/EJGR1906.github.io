import Decimal from "decimal.js";
import type { CurrencyCode } from "../database/db";
import { getActiveAccounts } from "../repositories/accountRepository";
import { getAllTransactions } from "../repositories/transactionRepository";
import { getAllCategories } from "../repositories/categoryRepository";
import { getGoalsWithProgress } from "./goalService";
import { getAccountBalance } from "./financialService";
import { convertCurrency } from "./currencyService";
import { getUserAge } from "./settingsService";
import { startOfMonth, subMonths } from "date-fns";

export interface PillarMetric {
  label: string;
  score: number;
  maxScore: number;
  valueFormatted: string;
  description: string;
  recommendation: string;
  sourceInfo: string;
}

export interface PillarScore {
  name: string;
  score: number;
  maxScore: number;
  metrics: PillarMetric[];
}

export interface DiagnosticUnlockStatus {
  isUnlocked: boolean;
  minTransactionsRequired: number;
  currentTransactions: number;
  hasMinAccounts: boolean;
  currentActiveAccounts: number;
  hasPositiveLiquidWorth: boolean;
  totalLiquidBalance: number;
}

export interface ComprehensiveDiagnosticResult {
  totalScore: number;
  baseCurrency: CurrencyCode;
  healthLevel: "Excelente" | "Bueno" | "Regular" | "Crítico";
  healthColor: string;
  summaryText: string;
  pillars: {
    savings: PillarScore;
    debt: PillarScore;
    investment: PillarScore;
    budget: PillarScore;
  };
  unlockStatus: DiagnosticUnlockStatus;
  calculatedValues: {
    userAge: number;
    totalLiquidBalance: number;
    monthlyEssentialExpenses: number;
    monthsEmergencyCoverage: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRatePercent: number;
    monthlyDebtPayment: number;
    dtiPercent: number;
    targetNetWorth: number;
    actualNetWorth: number;
    recentTransactionCount: number;
    insuranceExpensesMonth: number;
    detectedAssetTypes: string[];
    detectedCurrencies: string[];
    detectedDebtStatus: string;
  };
}

export async function calculateComprehensiveDiagnostic(
  baseCurrency: CurrencyCode
): Promise<ComprehensiveDiagnosticResult> {
  const userAge = getUserAge();
  const accounts = await getActiveAccounts();
  const transactions = await getAllTransactions();
  const categories = await getAllCategories();
  const goalsWithProgress = await getGoalsWithProgress();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // -------------------------------------------------------------
  // 1. ANÁLISIS AUTOMÁTICO DE CUENTAS Y SALDOS LÍQUIDOS
  // -------------------------------------------------------------
  let totalLiquidBalance = new Decimal(0);
  let totalLiabilities = new Decimal(0);

  const activeCurrencies = new Set<string>();
  const activeTypes = new Set<string>();
  let hasLiabilityAccount = false;
  let hasCreditCardDebt = false;

  for (const account of accounts) {
    const balance = await getAccountBalance(account);
    const converted = await convertCurrency(balance, account.currency, baseCurrency);
    const convertedAmount = converted ? new Decimal(converted.amount) : new Decimal(0);

    if (balance > 0) {
      activeCurrencies.add(account.currency);
      activeTypes.add(account.type);
    }

    if (account.nature === "liability" || (account.type === "other" && balance < 0)) {
      hasLiabilityAccount = true;
      totalLiabilities = totalLiabilities.plus(convertedAmount.abs());
      if (account.creditLimit && account.creditLimit > 0) {
        hasCreditCardDebt = true;
      }
    } else {
      totalLiquidBalance = totalLiquidBalance.plus(convertedAmount);
    }
  }

  const actualNetWorth = totalLiquidBalance.minus(totalLiabilities).toNumber();

  // Unlock Status Requirements
  const minTransactionsRequired = 15;
  const currentTransactions = transactions.length;
  const currentActiveAccounts = accounts.length;
  const hasMinAccounts = currentActiveAccounts >= 1;
  const hasPositiveLiquidWorth = totalLiquidBalance.gt(0);
  const isUnlocked = currentTransactions >= minTransactionsRequired && hasMinAccounts && hasPositiveLiquidWorth;

  const unlockStatus: DiagnosticUnlockStatus = {
    isUnlocked,
    minTransactionsRequired,
    currentTransactions,
    hasMinAccounts,
    currentActiveAccounts,
    hasPositiveLiquidWorth,
    totalLiquidBalance: totalLiquidBalance.toNumber(),
  };

  // -------------------------------------------------------------
  // 2. ANÁLISIS AUTOMÁTICO DE MOVIMIENTOS
  // -------------------------------------------------------------
  let monthlyIncome = new Decimal(0);
  let monthlyExpenses = new Decimal(0);
  let monthlyDebtPayment = new Decimal(0);
  let insuranceExpensesMonth = new Decimal(0);
  let hasLifeInsuranceDetected = false;
  let hasHealthInsuranceDetected = false;
  let recentTransactionCount = 0;

  // Categories matching debt
  const debtCategories = categories.filter((c) =>
    /deuda|crédito|credito|tarjeta|préstamo|prestamo|hipoteca|cuota|interés|interes/i.test(c.name)
  );
  const debtCategoryIds = new Set(debtCategories.map((c) => c.id));

  // Categories matching insurance/health
  const insuranceCategories = categories.filter((c) =>
    /seguro|salud|póliza|poliza|médico|medico|hcm|vida/i.test(c.name)
  );
  const insuranceCategoryIds = new Set(insuranceCategories.map((c) => c.id));

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    if (txDate >= last30Days) {
      recentTransactionCount++;
    }

    if (txDate >= currentMonthStart) {
      if (tx.amount === undefined || !tx.currency) continue;
      const converted = await convertCurrency(tx.amount, tx.currency, baseCurrency);
      if (!converted) continue;

      if (tx.type === "income") {
        monthlyIncome = monthlyIncome.plus(converted.amount);
      } else if (tx.type === "expense") {
        monthlyExpenses = monthlyExpenses.plus(converted.amount);

        // Debt payments
        if (tx.categoryId && debtCategoryIds.has(tx.categoryId)) {
          monthlyDebtPayment = monthlyDebtPayment.plus(converted.amount);
        }

        // Insurance payments detection
        const isInsuranceCategory = tx.categoryId && insuranceCategoryIds.has(tx.categoryId);
        const desc = (tx.description || "").toLowerCase();
        const isInsuranceDesc = /seguro|poliza|póliza|hcm|salud|vida|medico|médico/i.test(desc);

        if (isInsuranceCategory || isInsuranceDesc) {
          insuranceExpensesMonth = insuranceExpensesMonth.plus(converted.amount);
          if (/vida/i.test(desc) || /vida/i.test(categories.find((c) => c.id === tx.categoryId)?.name || "")) {
            hasLifeInsuranceDetected = true;
          }
          if (/salud|hcm|medico|médico/i.test(desc) || /salud|hcm/i.test(categories.find((c) => c.id === tx.categoryId)?.name || "")) {
            hasHealthInsuranceDetected = true;
          }
        }
      }
    }
  }

  // Fallback to previous month if current month has no data
  if (monthlyIncome.isZero() && monthlyExpenses.isZero()) {
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate >= prevMonthStart && txDate < currentMonthStart) {
        if (tx.amount === undefined || !tx.currency) continue;
        const converted = await convertCurrency(tx.amount, tx.currency, baseCurrency);
        if (!converted) continue;

        if (tx.type === "income") monthlyIncome = monthlyIncome.plus(converted.amount);
        if (tx.type === "expense") {
          monthlyExpenses = monthlyExpenses.plus(converted.amount);
          if (tx.categoryId && debtCategoryIds.has(tx.categoryId)) {
            monthlyDebtPayment = monthlyDebtPayment.plus(converted.amount);
          }
          if (tx.categoryId && insuranceCategoryIds.has(tx.categoryId)) {
            insuranceExpensesMonth = insuranceExpensesMonth.plus(converted.amount);
          }
        }
      }
    }
  }

  const incomeNum = monthlyIncome.toNumber();
  const expenseNum = monthlyExpenses.toNumber();
  const debtPaymentNum = monthlyDebtPayment.toNumber();
  const insuranceExpensesNum = insuranceExpensesMonth.toNumber();

  // -------------------------------------------------------------
  // PILAR 1: AHORRO Y LIQUIDEZ (Máx 25 Pts)
  // -------------------------------------------------------------
  const essentialExpenses = expenseNum > 0 ? expenseNum : 1;
  const monthsEmergencyCoverage = totalLiquidBalance.toNumber() / essentialExpenses;

  const emergencyScore = monthsEmergencyCoverage >= 6
    ? 15
    : monthsEmergencyCoverage >= 3
      ? 10
      : monthsEmergencyCoverage >= 1
        ? 5
        : 0;

  const monthlySavings = Math.max(0, incomeNum - expenseNum);
  const savingsRatePercent = incomeNum > 0 ? (monthlySavings / incomeNum) * 100 : 0;

  const savingsRateScore = savingsRatePercent >= 20 ? 10 : savingsRatePercent >= 10 ? 6 : 2;

  const pilar1Score = emergencyScore + savingsRateScore;

  const pilar1: PillarScore = {
    name: "Ahorro y Liquidez",
    score: pilar1Score,
    maxScore: 25,
    metrics: [
      {
        label: "Fondo de Emergencia",
        score: emergencyScore,
        maxScore: 15,
        valueFormatted: `${monthsEmergencyCoverage.toFixed(1)} meses de cobertura`,
        description: `Saldo en Cuentas (${baseCurrency} ${totalLiquidBalance.toNumber().toLocaleString("es-VE", { minimumFractionDigits: 2 })}) entre tus Gastos Mensuales (${baseCurrency} ${essentialExpenses.toLocaleString("es-VE", { minimumFractionDigits: 2 })}).`,
        recommendation: monthsEmergencyCoverage >= 6
          ? "Excelente fondo de reserva. Mantén esta liquidez protegida en monedas estables (USD/USDT)."
          : "Tus cuentas actuales cubren menos de 6 meses de gastos. Incrementa tu ahorro líquido para contingencias.",
        sourceInfo: "Obtenido automáticamente del saldo activo de tus Cuentas y Movimientos.",
      },
      {
        label: "Tasa de Ahorro e Inversión",
        score: savingsRateScore,
        maxScore: 10,
        valueFormatted: `${savingsRatePercent.toFixed(1)}% de tus ingresos`,
        description: `Ingresos registrados: ${baseCurrency} ${incomeNum.toLocaleString("es-VE")} · Gastos: ${baseCurrency} ${expenseNum.toLocaleString("es-VE")}.`,
        recommendation: savingsRatePercent >= 20
          ? "Excelente capacidad de retención. Continúa destinando tu excedente a metas de ahorro e inversión."
          : "Busca reservar al menos el 10%-20% de tus ingresos netos mensuales al recibir ingresos.",
        sourceInfo: "Calculado del balance mensual de Ingresos vs Gastos registrados.",
      },
    ],
  };

  // -------------------------------------------------------------
  // PILAR 2: GESTIÓN DE DEUDAS Y SOLVENCIA (Máx 25 Pts)
  // -------------------------------------------------------------
  const dtiPercent = incomeNum > 0 ? (debtPaymentNum / incomeNum) * 100 : (debtPaymentNum > 0 ? 100 : 0);

  const dtiScore = dtiPercent < 20 ? 15 : dtiPercent <= 35 ? 10 : dtiPercent <= 50 ? 4 : 0;

  const debtProfile = hasCreditCardDebt || (hasLiabilityAccount && debtPaymentNum > 0)
    ? { status: "Cuentas de pasivo / TDC activas", score: 0 }
    : hasLiabilityAccount || debtPaymentNum > 0
      ? { status: "Deudas a tasa fija / controladas", score: 7 }
      : { status: "Libre de pasivos tóxicos", score: 10 };
  const detectedDebtStatus = debtProfile.status;
  const debtProfileScore = debtProfile.score;

  const pilar2Score = dtiScore + debtProfileScore;

  const pilar2: PillarScore = {
    name: "Gestión de Deudas y Solvencia",
    score: pilar2Score,
    maxScore: 25,
    metrics: [
      {
        label: "Relación Deuda / Ingreso (DTI)",
        score: dtiScore,
        maxScore: 15,
        valueFormatted: `${dtiPercent.toFixed(1)}%`,
        description: `Movimientos registrados en categorías de deudas y cuotas (${baseCurrency} ${debtPaymentNum.toLocaleString("es-VE")}).`,
        recommendation: dtiPercent < 20
          ? "Excelente. Menos del 20% de tus ingresos está comprometido en pagos de deudas."
          : "Atención: reducir las cuotas de tus compromisos aliviará tu flujo de caja mensual.",
        sourceInfo: "Detectado automáticamente de tus transacciones clasificadas como deuda o pasivos.",
      },
      {
        label: "Costo y Perfil del Pasivo",
        score: debtProfileScore,
        maxScore: 10,
        valueFormatted: detectedDebtStatus,
        description: `Estructura de tus Cuentas creadas (Pasivos/Activos) y movimientos.`,
        recommendation: debtProfileScore === 10
          ? "No registras deudas de alto riesgo. Tu capital no sufre mermas por cargos financieros."
          : "Acelera el pago de tus pasivos o tarjetas de crédito para liberar liquidez.",
        sourceInfo: "Evaluado automáticamente según tus Cuentas activas.",
      },
    ],
  };

  // -------------------------------------------------------------
  // PILAR 3: INVERSIÓN Y PATRIMONIO NETO (Máx 25 Pts)
  // -------------------------------------------------------------
  const annualGrossIncome = incomeNum * 12;
  const targetNetWorth = (userAge * (annualGrossIncome > 0 ? annualGrossIncome : 12000)) / 10;
  const netWorthRatio = targetNetWorth > 0 ? actualNetWorth / targetNetWorth : 1;

  const netWorthScore = netWorthRatio >= 1 ? 15 : netWorthRatio >= 0.5 ? 10 : 3;

  const numCurrencies = activeCurrencies.size;
  const numTypes = activeTypes.size;
  const hasInvestmentGoal = goalsWithProgress.some((g) => g.goal.category === "investment");

  const assetDiversification = numCurrencies >= 2 || (numTypes >= 2 && hasInvestmentGoal)
    ? { score: 10, status: `Portafolio Diversificado (${Array.from(activeCurrencies).join(", ")})` }
    : numCurrencies === 2 || numTypes >= 2
      ? { score: 5, status: `Concentración Media (${Array.from(activeCurrencies).join(", ") || "1 divisa"})` }
      : { score: 0, status: "Efectivo / Banco único" };
  const assetDivScore = assetDiversification.score;
  const assetDivStatus = assetDiversification.status;

  const pilar3Score = netWorthScore + assetDivScore;

  const pilar3: PillarScore = {
    name: "Inversión y Patrimonio Neto",
    score: pilar3Score,
    maxScore: 25,
    metrics: [
      {
        label: "Multiplicador de Patrimonio (Stanley-Danko)",
        score: netWorthScore,
        maxScore: 15,
        valueFormatted: `${actualNetWorth >= targetNetWorth ? "Supera el objetivo" : `${(netWorthRatio * 100).toFixed(0)}% alcanzado`}`,
        description: `Patrimonio acumulado en Cuentas (${baseCurrency} ${actualNetWorth.toLocaleString("es-VE", { minimumFractionDigits: 2 })}) vs Objetivo Stanley-Danko (${baseCurrency} ${targetNetWorth.toLocaleString("es-VE", { maximumFractionDigits: 0 })}).`,
        recommendation: netWorthRatio >= 1
          ? "Tu acumulación neta supera la referencia estándar para tu edad e ingresos."
          : "Amplía tu patrimonio líquido y metas de inversión para acercarte al objetivo de tu edad.",
        sourceInfo: `Saldos netos en Cuentas; Edad calculada (${userAge} años) desde tu Fecha de Nacimiento en Configuración.`,
      },
      {
        label: "Diversificación de Activos",
        score: assetDivScore,
        maxScore: 10,
        valueFormatted: assetDivStatus,
        description: `Monedas activas (${Array.from(activeCurrencies).join(", ") || "N/A"}) e instrumentos en tus Cuentas.`,
        recommendation: assetDivScore === 10
          ? "Excelente diversificación multimoneda y de instrumentos."
          : "Considera abrir cuentas en otras monedas (USD/USDT/VES) o definir metas de inversión.",
        sourceInfo: "Detectado automáticamente de tus Cuentas y Metas registradas.",
      },
    ],
  };

  // -------------------------------------------------------------
  // PILAR 4: CONTROL PRESUPUESTARIO Y PROTECCIÓN (Máx 25 Pts)
  // -------------------------------------------------------------
  const budgetControlScore = recentTransactionCount >= 5 ? 15 : recentTransactionCount >= 1 ? 8 : 0;

  // Automatic insurance score based on registered insurance/health expenses
  const insurance = hasHealthInsuranceDetected && hasLifeInsuranceDetected
    ? { score: 10, status: `Salud + Vida registrados (${baseCurrency} ${insuranceExpensesNum.toLocaleString("es-VE", { minimumFractionDigits: 2 })})` }
    : insuranceExpensesNum > 0 || hasHealthInsuranceDetected || hasLifeInsuranceDetected
      ? { score: insuranceExpensesNum > 20 ? 10 : 5, status: `Gastos de seguro/salud registrados (${baseCurrency} ${insuranceExpensesNum.toLocaleString("es-VE", { minimumFractionDigits: 2 })})` }
      : { score: 0, status: "Sin gastos de seguro registrados" };
  const insuranceScore = insurance.score;
  const insuranceStatusText = insurance.status;

  const pilar4Score = budgetControlScore + insuranceScore;

  const pilar4: PillarScore = {
    name: "Control Presupuestario y Protección",
    score: pilar4Score,
    maxScore: 25,
    metrics: [
      {
        label: "Registro y Control Presupuestario",
        score: budgetControlScore,
        maxScore: 15,
        valueFormatted: `${recentTransactionCount} movimientos registrados`,
        description: `Transacciones ingresadas en la aplicación en los últimos 30 días.`,
        recommendation: recentTransactionCount >= 5
          ? "Excelente ritmo de registro de operaciones."
          : "Registra continuamente tus movimientos para mantener el control completo de tu presupuesto.",
        sourceInfo: "Medido directamente de tu historial de Movimientos.",
      },
      {
        label: "Cobertura de Seguros",
        score: insuranceScore,
        maxScore: 10,
        valueFormatted: insuranceStatusText,
        description: `Evaluado automáticamente desde tus gastos de movimientos en categorías o conceptos de seguros/médicos.`,
        recommendation: insuranceScore >= 5
          ? "Se detectaron gastos de póliza/salud en tus movimientos del mes."
          : "Para sumar este puntaje, registra los pagos de tus pólizas de salud o seguros bajo una categoría como 'Servicios', 'Salud' o 'Seguro'.",
        sourceInfo: "Extraído automáticamente de tus Movimientos de gasto registrados.",
      },
    ],
  };

  // -------------------------------------------------------------
  // SCORE TOTAL
  // -------------------------------------------------------------
  const totalScore = pilar1Score + pilar2Score + pilar3Score + pilar4Score;

  let healthLevel: "Excelente" | "Bueno" | "Regular" | "Crítico" = "Regular";
  let healthColor = "var(--color-warning)";
  let summaryText = "Tu salud financiera se obtiene 100% de tus cuentas y movimientos reales.";

  if (totalScore >= 85) {
    healthLevel = "Excelente";
    healthColor = "var(--color-success)";
    summaryText = "¡Excelente salud financiera! Tus gastos, cuentas y movimientos reflejan alta solvencia y liquidez.";
  } else if (totalScore >= 70) {
    healthLevel = "Bueno";
    healthColor = "var(--color-primary)";
    summaryText = "Buen nivel de control y liquidez detectado automáticamente en tus transacciones.";
  } else if (totalScore < 50) {
    healthLevel = "Crítico";
    healthColor = "var(--color-danger)";
    summaryText = "Tus registros de movimientos muestran oportunidades de mejora en liquidez y fondo de reserva.";
  }

  return {
    totalScore,
    baseCurrency,
    healthLevel,
    healthColor,
    summaryText,
    pillars: {
      savings: pilar1,
      debt: pilar2,
      investment: pilar3,
      budget: pilar4,
    },
    unlockStatus,
    calculatedValues: {
      userAge,
      totalLiquidBalance: totalLiquidBalance.toNumber(),
      monthlyEssentialExpenses: essentialExpenses,
      monthsEmergencyCoverage,
      monthlyIncome: incomeNum,
      monthlyExpenses: expenseNum,
      savingsRatePercent,
      monthlyDebtPayment: debtPaymentNum,
      dtiPercent,
      targetNetWorth,
      actualNetWorth,
      recentTransactionCount,
      insuranceExpensesMonth: insuranceExpensesNum,
      detectedAssetTypes: Array.from(activeTypes),
      detectedCurrencies: Array.from(activeCurrencies),
      detectedDebtStatus,
    },
  };
}
