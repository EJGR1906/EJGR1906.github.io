---
name: financial-math-and-currency
description: Reglas y directrices para realizar cálculos de moneda (VES, USD, USDT), conversiones y matemáticas financieras con decimal.js.
---

# Matemáticas Financieras y Manejo de Monedas

En aplicaciones financieras, utilizar los tipos `number` de JavaScript/TypeScript directamente causa errores de redondeo por representación en punto flotante IEEE 754 (ej. `0.1 + 0.2 = 0.30000000000000004`).

## Reglas Obligatorias de Cálculo

1. **Uso estricto de `decimal.js`**:
   - En todos los servicios (`src/services/`), cualquier suma, resta, multiplicación o división de montos y tasas DEBE hacerse utilizando `Decimal` de la librería `decimal.js`.
   - Ejemplo:
     ```typescript
     import Decimal from 'decimal.js';
     const total = new Decimal(amount).times(rate).toNumber();
     ```

2. **Tipos de Moneda Soportados**:
   - `VES`: Bolívares.
   - `USD`: Dólar estadounidense.
   - `USDT`: Tether (cripto estable).

3. **Jerarquía y Fuentes de Tasas de Cambio**:
   - **USD/VES**: Fuente oficial `BCV` (obtenida mediante API `DólarAPI`).
   - **USDT/VES**: Fuente `BINANCE_P2P`.
   - **MANUAL**: Tasa temporal configurable por el usuario únicamente dentro de la Calculadora, que parte del valor de `BCV`.

4. **Prohibición de Suma Directa Multimoneda**:
   - NUNCA se deben sumar saldos en distintas monedas directamente (`100 VES + 50 USD != 150`).
   - Para consolidar patrimonio o balances, se debe convertir cada cuenta a la **moneda base** seleccionada por el usuario usando la tasa oficial correspondiente antes de sumar.
