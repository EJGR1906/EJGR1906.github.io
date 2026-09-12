const STORAGE_KEY = "finanzas:activePage";
export const DEFAULT_APP_PAGE = "Inicio";

const KNOWN_PAGES = new Set([
  "Inicio",
  "Movimientos",
  "Presupuestos",
  "Metas",
  "Diagnóstico",
  "Menú",
  "Calculadora",
  "Recurrentes",
  "Configuración",
  "Cuentas",
  "Categorías",
]);

export function isValidAppPage(page: string): boolean {
  return KNOWN_PAGES.has(page) || page.startsWith("Balances:");
}

export function readStoredAppPage(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && isValidAppPage(stored)) return stored;
  } catch {
    // sessionStorage can throw in restricted browser contexts.
  }
  return DEFAULT_APP_PAGE;
}

export function writeStoredAppPage(page: string): void {
  if (!isValidAppPage(page)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, page);
  } catch {
    // Ignore quota / privacy mode failures; in-memory state still works.
  }
}

export function clearStoredAppPage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
