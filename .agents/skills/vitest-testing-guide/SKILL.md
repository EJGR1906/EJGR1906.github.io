---
name: vitest-testing-guide
description: Guía para escribir e integrar pruebas unitarias y de integración utilizando Vitest en los servicios y repositorios del proyecto.
---

# Guía de Pruebas con Vitest

Para garantizar la estabilidad financiera de la aplicación y prevenir regresiones, se utiliza **Vitest**.

## Estructura de Pruebas

- Las pruebas deben ubicarse en `src/tests/` o junto al archivo probado con sufijo `.test.ts` / `.spec.ts`.
- Comando para ejecutar pruebas: `npm test` o `npx vitest run`.

## Qué Probar Prioritariamente

1. **Cálculos de Servicios Financieros**:
   - Conversión de monedas con distintas tasas.
   - Reconstrucción de saldos derivados a partir de saldo inicial y transacciones.
   - Cálculo de disponible vs comprometido en metas de ahorro.

2. **Validaciones de Reglas de Negocio**:
   - Rechazo de gastos cuando el monto supera el saldo disponible.
   - Validación de moneda compatible entre metas y cuentas de respaldo.

3. **Migraciones de Dexie**:
   - Pruebas que simulen datos en esquemas antiguos y verifiquen que `.upgrade()` los convierte correctamente.

## Mocks y Aislamiento

- Para probar servicios, simula (`vi.mock`) los repositorios correspondientes o utiliza una instancia en memoria de Dexie / `fake-indexeddb` si se prueban consultas reales.
