# Finanzas App - Contexto del proyecto

## Objetivo

Aplicación web privada de finanzas personales para Venezuela, pensada principalmente para móvil y también para escritorio.

El proyecto es local-first y funciona actualmente con React, TypeScript, Vite, IndexedDB y Dexie. La arquitectura mantiene separadas la interfaz, los servicios y los repositorios para que en el futuro pueda añadirse sincronización, pero ese trabajo queda fuera del alcance actual.

No es un SaaS, no tendrá usuarios múltiples, suscripciones ni planes comerciales.

## Resumen ejecutivo

La aplicación sirve como contabilidad personal local para consolidar el patrimonio, controlar movimientos, seguir presupuestos y diagnosticar la salud financiera sin depender de un backend externo.

Principios rectores:

- Mantener el dato local como fuente de verdad.
- Separar capa de presentación, servicios y persistencia.
- Priorizar precisión y claridad sobre complejidad operativa.
- Evitar introducir sincronización, auth o multiusuario mientras no se pida explícitamente.
- Mantener las decisiones financieras visibles para el usuario (fuentes de tasa, moneda base y diferencias entre tasas).

## Alcance actual

La aplicación debe ayudar a controlar:

- Patrimonio consolidado en VES, USD y USDT.
- Cuentas y saldos derivados del saldo inicial y de los movimientos.
- Ingresos, gastos y transferencias.
- Tasas de cambio BCV/DólarAPI, Binance P2P y manuales.
- Presupuestos.
- Metas de ahorro.
- Diagnóstico financiero sencillo basado en datos reales.
- Calculadora de monedas.

El backend/sincronización no se necesitan por ahora. No deben implementarse hasta que se soliciten explícitamente.

## Tecnologías

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Hook Form
- Zod
- Recharts
- Lucide React
- date-fns
- Decimal.js
- IndexedDB + Dexie
- Vitest

## Arquitectura de datos

Base local: `FinanzasDB`.

Tablas actuales:

- `accounts`
- `categories`
- `goals`
- `transactions`
- `exchangeRates`

Flujo previsto:

```text
React
  -> Services
  -> Repositories
  -> IndexedDB / Dexie
```

Más adelante podría existir una implementación alternativa con API y PostgreSQL, pero no se debe trabajar en ella todavía.

## Datos iniciales

### Cuentas

- Banco Venezuela - banco - VES - saldo inicial 18.500
- Binance - crypto - USDT - saldo inicial 420
- Efectivo USD - efectivo - USD - saldo inicial 350

### Categorías

Gastos:

- Alimentos
- Servicios
- Transporte
- Entretenimiento
- Vivienda
- Compras

Ingresos:

- Salario
- Otros ingresos

La base también contiene transacciones de prueba para validar el dashboard.

## Funcionalidades completadas

### Base y persistencia

- Proyecto React + Vite + TypeScript.
- Inicialización de IndexedDB con Dexie.
- Seed de cuentas, categorías y tasas iniciales.
- Servicios y repositorios separados de los componentes visuales.
- Actualización de tasas al iniciar la aplicación con tolerancia a fallos, conservando la última tasa local disponible.

### Conversión y tasas

- Conversión directa USD/VES.
- Conversión inversa VES/USD.
- Conversión USDT/VES y VES/USDT.
- Conversiones indirectas pasando por VES.
- Uso de Decimal.js para precisión.
- Calculadora funcional para VES, USD y USDT.
- Actualización de USD/VES desde DólarAPI.
- Actualización de USDT/VES desde Binance P2P.

### Dashboard

- Balance consolidado.
- Ingresos, gastos y ahorro.
- Selector de semana, mes, año y todo.
- Resumen de cuentas.
- Flujo de caja con Recharts, agrupado por mes para comparar ingresos y gastos.
- Gastos por categoría.
- Transacciones recientes.
- Calculadora disponible como pantalla independiente desde la navegación.

### Movimientos

- Alta de ingresos.
- Alta de gastos.
- Alta de transferencias entre cuentas.
- Transferencias entre monedas con monto origen, monto destino y tasa calculada.
- Historial de movimientos.
- Eliminación de movimientos.
- El saldo de las cuentas se reconstruye desde saldo inicial y transacciones; la edición del saldo inicial crea un movimiento compensatorio trazable.

### Presupuestos, metas y diagnóstico

- Presupuestos mensuales guardados localmente.
- Progreso de presupuesto contra gastos reales del mes.
- Metas de ahorro persistidas localmente en Dexie, con migración básica desde `localStorage`.
- Progreso visual de metas.
- Diagnóstico financiero basado en ingresos, gastos, ahorro, patrimonio líquido y concentración de gastos.

### Interfaz

- Diseño financiero moderno con azul oscuro, turquesa, verde y fondos claros.
- Navegación responsive para móvil y escritorio.
- Navegación actual: Inicio, Movimientos, Presupuestos, Metas, Diagnóstico y Calculadora.
- Formularios con controles grandes y legibles.
- Build y lint validados.

### Pendientes aplicados en esta entrega

- La calculadora tiene una pantalla propia y conserva la actualización manual de tasas.
- La calculadora refresca BCV/Binance P2P al abrirse, elimina MANUAL al refrescar y la regenera desde el BCV vigente.
- El Dashboard agrupa las cuentas activas por VES, USD y USDT y ofrece detalle por moneda sin convertir los saldos originales.
- La selección de tasas prioriza BCV para USD/VES y Binance P2P para USDT/VES; PARALLEL ya no se toma accidentalmente por el orden de IndexedDB.
- Configuración permite elegir y persistir la moneda base, revisar las tasas guardadas y actualizarlas manualmente.
- Gestión de cuentas permite crear cuentas, editar nombre y tipo, modificar el saldo inicial efectivo mediante un movimiento compensatorio, activar o desactivar cuentas y crear opcionalmente una subcuenta USD vinculada a una cuenta VES.
- Gastos, ingresos y transferencias pasan por validaciones de cuenta, moneda y monto; los gastos y transferencias respetan el saldo disponible.
- Las metas validan cuenta activa, moneda, objetivo, aportes, retiros y saldo disponible; sus operaciones de alta y movimiento usan servicios en lugar de escrituras directas desde la pantalla.
- Los movimientos de ingresos, gastos y transferencias pueden editarse desde el historial, excluyendo el registro original al recalcular disponibilidad.
- El historial de Movimientos renderiza una sola lista; cada registro muestra las acciones Editar y Eliminar.
- La calculadora inicia con el campo editable en USD y la conversión destino en VES.
- Presupuestos persisten la moneda base y la muestran en el formulario y el resumen.
- El historial reciente navega a Movimientos y el menú inferior móvil usa tres columnas para sus seis opciones.
- Se añadió Vitest con `npm test` y una primera prueba automatizada de generación de IDs.

### Estado verificado al 2026-09-08

- La aplicación mantiene el flujo `React -> Services -> Repositories -> IndexedDB/Dexie`; no se introdujeron backend, sincronización ni autenticación.
- La navegación se resuelve mediante estado local en `App.tsx` y eventos `finanzas:navigate`; no existe router ni URL persistente.
- La moneda base se guarda en `localStorage` y ya se usa en Dashboard, presupuestos y diagnóstico para conversiones. Presupuestos y metas todavía muestran etiquetas y valores introducidos como USD, por lo que su modelo de moneda no está completamente alineado con la preferencia global.
- Los balances agrupados usan el saldo original de cada cuenta activa y el detalle muestra cuentas por moneda. Las cuentas sin tasa de conversión permanecen visibles, aunque no suman al patrimonio consolidado convertido.
- La pantalla de configuración actualiza tasas externas, muestra los últimos registros locales y permite cambiar entre tema claro y oscuro. El tema se persiste en `localStorage` y se aplica globalmente.
- La suite automatizada es todavía mínima; `src/services/testCurrency.ts` continúa siendo un script auxiliar y deben añadirse pruebas de saldos, tasas, metas y migraciones.
- La barra inferior móvil usa tres columnas para seis opciones de navegación.

### Resumen actualizado del trabajo realizado en esta iteración

**Qué ya quedó integrado:**

- Calculadora de monedas con flujo `MANUAL` para USD/VES: se crea desde BCV al abrir, se permite editar, guardar y reutilizar, y se borra al refrescar tasas para forzar el rebote a la fuente oficial.
- Flujos de tasas con limpieza de `PARALLEL` y migración Dexie v2/v3: `exchangeRates` elimina registros antiguos y crea `rate_manual_usd_ves` desde BCV si hace falta; además se mantiene `institutionId` para cuentas.
- Dashboard por moneda con resumen por VES/USD/USDT y pantalla de detalle `Balances:*` sin introducir router ni backend.
- Configuración funcional: moneda base persistida, tema global, revisión de tasas locales y actualización manual de fuentes externas.
- Gestión de cuentas mejorada: edición de nombre/tipo, activación/desactivación, y soporte de cuentas USD vinculadas a una VES mediante `institutionId`.
- Metas persistidas en Dexie con historia de aportes/retiros y validación de cuenta compatible, monto y objetivo.
- Estructura de servicios y repositorios establecida según el patrón `React -> Services -> Repositories -> Dexie`.

**Qué sigue pendiente de forma importante:**

- Cubrir la lógica de metas con pruebas automáticas de dominio, migración y disponibilidad real.
- Integrar más casos de edición y validación de movimientos para cuentas, transferencias y metas sin depender del flujo manual.
- Alinear completamente la moneda base de presupuestos, etiquetas y diagnósticos con el modelo real del usuario.
- Revisar UX, confirmaciones y accesibilidad en varias pantallas para evitar errores de operación.
- Reducir el tamaño del bundle final; el build compila, pero Vite advierte de un chunk por encima del umbral recomendado.
- Pasar el boton de categorias a la pagina de movimientos. Asi como esta en inicio ahorita en movimientos agregar los botones cuentas, categorias y svg de configuracion. En Inicio y en todas las demas paginas agregaremos unicamente cuentas y el svg de configuracion. En metas tambien.

**Verificaciones ejecutadas en esta revisión:**

- `npm run test` → 1 archivo, 1 prueba, resultado correcto.
- `npm run build` → compilación correcta; Vite muestra una advertencia de tamaño de bundle (>500 kB) pero no bloquea la build.
- `npm run lint` → última comprobación previa confirmada con salida exitosa en este entorno.

### Solicitud implementada: tasa manual editable en la calculadora

**Solicitud:** eliminar la tasa `PARALLEL`, crear una tasa `MANUAL` para USD/VES y permitir modificarla libremente desde la calculadora. El valor inicial de `MANUAL` debe ser igual al valor USD/VES de BCV.

**Estado:** implementado según la decisión funcional; la tasa MANUAL se elimina al refrescar y debe regenerarse desde BCV al abrir la calculadora.

**Situación actual verificada al 2026-09-08:**

- `ExchangeRate.source` acepta `BCV`, `BINANCE_P2P` y `MANUAL`; `PARALLEL` ya no forma parte del tipo.
- `db.version(2)` elimina registros `PARALLEL` existentes y crea una tasa `MANUAL` desde BCV cuando es necesario; `db.version(3)` añade `institutionId` a cuentas.
- `seed.ts` elimina cualquier `PARALLEL`, garantiza BCV, MANUAL y Binance P2P, y no sobrescribe una tasa manual existente.
- `exchangeRateRepository.getLatestExchangeRate()` prioriza BCV para USD/VES y Binance P2P para USDT/VES; acepta fuente explícita para la calculadora.
- `CurrencyCalculator` permite editar y guardar `MANUAL` para USD/VES y usa esa tasa en ambos sentidos.
- `CurrencyCalculator.handleRefreshRates()` actualiza fuentes externas y luego borra `rate_manual_usd_ves`; este comportamiento es intencional para reiniciar la tasa manual.
- Al abrir la calculadora, el flujo debe actualizar BCV/Binance P2P y crear nuevamente `rate_manual_usd_ves` tomando el valor vigente de BCV como valor inicial.

**Implementación verificada y ajuste pendiente:**

1. Mantener la limpieza de `PARALLEL` y la migración existente sin afectar cuentas ni transacciones.
2. Mantener `MANUAL` con el ID estable `rate_manual_usd_ves`; el refresco explícito puede eliminarla y la apertura de la calculadora debe regenerarla desde BCV.
3. Conservar el campo editable positivo de la calculadora y su persistencia mediante `upsertExchangeRate`.
4. Conservar la llamada que borra la tasa manual en `handleRefreshRates()`.
5. Al montar `CurrencyCalculator`, ejecutar el refresco de BCV/Binance P2P y guardar `rate_manual_usd_ves` con el valor BCV actualizado. La calculadora debe mostrar MANUAL después de esa inicialización.
6. Mantener Dashboard, presupuestos y diagnóstico con BCV como fuente predeterminada; MANUAL sigue siendo una tasa específica de la calculadora.

**Criterios de aceptación:**

- No se crean nuevas tasas `PARALLEL` y las existentes se limpian sin afectar transacciones.
- Al abrir una base nueva existe una tasa `MANUAL` USD/VES igual a BCV.
- La calculadora permite cambiar, guardar y reutilizar una tasa como `20000 VES por USD`.
- Al refrescar desde la calculadora, la tasa MANUAL se elimina y se reconstruye al abrir la calculadora usando el BCV vigente.
- La fuente mostrada en la calculadora es `MANUAL` cuando se usa esa conversión.
- BCV y Binance P2P continúan actualizándose de forma independiente.

**Esfuerzo restante:** bajo. La migración, el seed, la persistencia y la selección explícita ya existen; la calculadora refresca BCV/Binance al abrirse y reconstruye MANUAL desde BCV. Falta una prueba automatizada del flujo.

**Riesgos y decisión abierta:** una tasa manual de la calculadora puede diferir deliberadamente del BCV usado por los reportes. Esa diferencia debe mostrarse claramente y no debe cambiar balances consolidados de forma implícita.

## Pendientes prioritarios

Estos pendientes están ordenados de menor a mayor riesgo técnico y financiero. La estimación de esfuerzo se muestra para facilitar la planificación, pero el criterio principal del orden es el riesgo.

### 1. Calculadora como módulo de navegación

**Esfuerzo:** bajo. **Riesgo:** bajo.

**Estado:** completado.

La calculadora está disponible como pantalla independiente accesible desde la navegación, junto a Movimientos, Presupuestos, Metas y Diagnóstico.

Debe conservar sus capacidades actuales: intercambio de monedas, tasa utilizada, fuente, fecha y actualización manual. El cambio es principalmente de navegación y composición visual; no debe alterar `currencyService` ni la persistencia de tasas.

### 2. Balances agrupados por moneda y detalle

**Esfuerzo:** medio. **Riesgo:** bajo-medio.

**Estado:** completado.

El Dashboard presenta balances agrupados dinámicamente en VES, USD y USDT. Reutiliza `getAccountBalance` y `DashboardSummary.accounts`, usa el `balance` original sin conversiones y ofrece una pantalla de detalle por moneda.

La implementación prevista está documentada en `Solicitud analizada: balances agrupados por moneda`. No requiere cambios en IndexedDB ni en la lógica financiera. La navegación debe adaptarse al estado actual de `App.tsx` sin introducir React Router.

### 3. Configuración

**Esfuerzo:** medio. **Riesgo:** medio.

**Estado:** parcialmente completado.

El botón `Configuración` ahora abre una pantalla para:

- Seleccionar moneda base.
- Revisar el estado y última actualización de las tasas.
- Ejecutar actualización manual de tasas.
- El modo oscuro/claro está implementado con una preferencia global persistida y estilos adaptados para fondos, tarjetas, formularios, navegación y textos.

Debe evitar modificar tasas o preferencias de forma parcial y debe informar claramente si una fuente externa no responde.

### 4. Gestión de cuentas

**Esfuerzo:** medio-alto. **Riesgo:** medio.

**Estado:** parcialmente completado.

La primera entrega ya permite agregar cuentas, editar nombre y tipo, activar o desactivar cuentas y elegir tipo y moneda al crear. Reutiliza `accountRepository` y permite modificar el saldo inicial efectivo mediante un ingreso/gasto compensatorio, manteniendo los saldos derivados de transacciones. El borrado condicionado y las validaciones para cuentas con históricos siguen pendientes.

La primera entrega debe conservar los movimientos de ajuste como parte del historial y aplicar validaciones, confirmaciones y comportamiento consistente para cuentas con transacciones existentes.

### 5. Subcuenta bancaria USD asociada a una cuenta VES

**Esfuerzo:** medio-alto. **Riesgo:** medio-alto.

**Estado:** implementado en el alta; la edición derivada de la relación queda pendiente.

Una cuenta bancaria VES puede tener una cuenta USD dentro de la misma entidad, pero ambas deben seguir siendo cuentas independientes.

#### Modelo de datos recomendado

- La cuenta VES conserva su propio `id`, `currency: "VES"`, `initialBalance` y transacciones.
- La cuenta USD se crea como otro registro con otro `id`, `currency: "USD"`, `initialBalance` y transacciones propias.
- Añadir un identificador opcional compartido, preferiblemente `institutionId` o `accountGroupId`, solo como relación informativa. No debe participar en `getAccountBalance`, conversiones, balances ni selección de transacciones.
- Mantener nombres independientes, por ejemplo `Banco de Venezuela - VES` y `Banco de Venezuela - USD`.
- No reutilizar IDs, no guardar dos saldos en un único registro ni usar la cuenta VES para transacciones USD.

El índice actual de `accounts` puede permanecer igual si el identificador solo es metadato. Si después se consulta por institución en IndexedDB, deberá añadirse una nueva versión Dexie.

#### Flujo de interfaz

1. Si la moneda seleccionada es VES, mostrar el switch `Cuenta en dólares` con la descripción `Activar saldo en dólares para esta cuenta`.
2. Desactivado: mostrar y persistir solo el saldo inicial en bolívares (`Bs`).
3. Activado: mostrar y validar un segundo saldo inicial en dólares (`$`) y crear dos cuentas independientes vinculadas por el mismo `institutionId`.
4. Si se cambia la moneda fuera de VES, ocultar el switch, limpiar el valor USD y no crear una cuenta secundaria.
5. En edición, derivar el estado del switch de la cuenta USD vinculada, sin fusionar saldos. Desactivar o eliminar una cuenta no debe afectar automáticamente a la otra.

La creación doble debe vivir en un servicio de cuentas y ejecutarse dentro de una transacción `rw` de Dexie. El repositorio debe conservar la responsabilidad de persistencia.

#### Historias de usuario

- Como usuario, quiero activar opcionalmente `Cuenta en dólares` al crear una cuenta VES para registrar el saldo USD de la misma entidad.
- Como usuario, quiero que los saldos VES y USD se calculen por separado.
- Como usuario, quiero desactivar el switch y crear únicamente la cuenta VES.
- Como usuario, quiero registrar movimientos contra la cuenta VES o USD correcta.
- Como usuario, quiero editar o desactivar una cuenta sin alterar la otra.

#### Criterios de aceptación

- El switch solo aparece para moneda VES y usa exactamente la etiqueta y descripción solicitadas.
- Activado crea dos registros con IDs, saldos y transacciones independientes.
- Una transacción VES no modifica el saldo USD y viceversa.
- Si falla una de las altas, la transacción revierte ambas.
- Dashboard, detalle por moneda y selectores de movimientos muestran las cuentas separadas.
- Las cuentas existentes sin `institutionId` continúan funcionando sin migración destructiva.

### 6. Edición de transacciones

**Esfuerzo:** alto. **Riesgo:** alto.

**Estado:** pendiente.

Los movimientos pueden agregarse y eliminarse, pero no modificarse. Debe agregarse edición para ingresos, gastos y transferencias, validando origen, destino, montos y monedas coherentes.

La edición debe usar `updateTransaction`, recalcular los balances mediante la lógica existente y nunca modificar saldos manualmente. Deben cubrirse especialmente transferencias entre monedas y cuentas relacionadas VES/USD.

### 7. Corrección de selección de tasa USD/VES

**Esfuerzo:** medio. **Riesgo:** muy alto.

**Estado:** completado en la selección local de tasas.

La conversión USD está usando una tasa `PARALLEL`, aunque la tasa oficial debe provenir de DólarAPI. El servicio obtiene USD/VES desde `https://ve.dolarapi.com/v1/dolares/oficial` y guarda `source: "BCV"` con id `rate_bcv_usd_ves`.

La causa probable está en la búsqueda o priorización de tasas dentro de `currencyService` o `exchangeRateRepository`. Debe investigarse antes de modificar datos o componentes.

Reglas esperadas:

- USD/VES oficial: DólarAPI, guardado como BCV.
- USDT/VES: Binance P2P.
- PARALLEL: fuente de prueba retirada; no debe crearse ni seleccionarse.
- La fuente mostrada debe coincidir con la tasa utilizada.

La selección actual prioriza BCV para USD/VES y Binance P2P para USDT/VES. La calculadora usa `MANUAL` editable como flujo separado y lo regenera desde BCV al abrirse.

## Requisitos de diseño

### Responsive

- Mobile-first.
- Optimizada para teléfonos y computadoras.
- Navegación sencilla y controles táctiles cómodos.
- El contenido no debe desbordarse ni superponerse.

### Claridad

- Lenguaje sencillo.
- Evitar tecnicismos innecesarios.
- Saldos, gastos, ingresos y acciones principales deben tener jerarquía visual clara.
- Los estados vacíos deben explicar el siguiente paso.

### Rendimiento

- Mantener una carga inicial inferior a tres segundos en condiciones normales.
- Evitar dependencias o consultas innecesarias.
- Considerar división de código si el bundle continúa creciendo.

### Visual

- Azul oscuro para confianza y estructura.
- Turquesa para acciones principales.
- Verde para ingresos, ahorro y estados positivos.
- Fondos claros y buen contraste.
- Iconografía lineal con Lucide.
- Interfaz limpia, sobria y centrada en tareas financieras.

## Fuera de alcance por ahora

No implementar todavía:

- Backend.
- PostgreSQL.
- Sincronización entre dispositivos.
- Usuarios múltiples.
- Autenticación.
- Suscripciones o funcionalidades comerciales.

## Solicitud analizada: balances agrupados por moneda

### Objetivo

Reemplazar en el Dashboard la presentación de cuentas individuales por tres balances agrupados dinámicamente por moneda: VES, USD y USDT. Cada grupo debe sumar los saldos actuales de sus cuentas activas, mostrar la moneda original sin conversión y ofrecer una acción `Detalles` hacia una pantalla con todas las cuentas del grupo.

### Análisis y solución recomendada

- `financialService.getAccountBalance(account)` ya reconstruye el saldo real desde el saldo inicial y las transacciones. No debe duplicarse ni modificarse.
- `dashboardService.getDashboardSummary()` ya obtiene las cuentas activas y expone en `DashboardAccount` el saldo en su moneda original (`balance`) y el equivalente convertido (`balanceInBaseCurrency`). Para esta funcionalidad se debe usar únicamente `balance` y `currency`.
- `AccountsOverview` debe agrupar `summary.accounts` por `CurrencyCode` (`VES`, `USD`, `USDT`) en la capa de presentación y sumar los balances del grupo. No se deben agrupar por nombres de cuentas ni persistir nuevos datos.
- El detalle debe recibir la moneda seleccionada, volver a cargar el resumen real y filtrar las cuentas por `currency`, mostrando nombre, tipo, saldo y moneda. El tipo de cuenta requiere ampliar el modelo de vista (`DashboardAccount`) o consultar las cuentas activas por repositorio; la opción preferida es transportar el tipo desde el servicio sin alterar la lógica financiera.
- La aplicación no usa React Router. La navegación actual está centralizada en `App.tsx` mediante estado y eventos `finanzas:navigate` emitidos por `AppShell`. La adaptación menos disruptiva es añadir una página de detalle y un estado de navegación parametrizado para `balances/ves`, `balances/usd` y `balances/usdt`, sin introducir un sistema paralelo de rutas. Si posteriormente se necesitan URLs persistentes o navegación con historial, React Router deberá evaluarse como decisión independiente.

### Componentes y capas afectadas

Implementación realizada:

- `src/components/dashboard/AccountsOverview.tsx`: sustituir tarjetas individuales por tarjetas VES/USD/USDT, con estado vacío y botón `Detalles`.
- `src/pages/BalanceDetails.tsx` (nuevo): mostrar el balance total y las cuentas activas de una moneda, con formato local y diseño responsive.
- `src/App.tsx`: reconocer las tres rutas lógicas de balances y conservar la navegación existente.
- `src/components/layout/AppShell.tsx`: únicamente si hace falta propagar una navegación parametrizada; no requiere añadir una sección principal al menú.
- `src/services/dashboardService.ts`: solo ampliar el DTO de presentación con `type` si la pantalla de detalle no puede resolverlo de forma limpia; no cambiar `getAccountBalance`, conversiones, tasas ni persistencia.

No se prevén cambios en IndexedDB/Dexie, esquemas, repositorios de transacciones, calculadora, tasas de cambio ni creación de nuevas cuentas.

### Plan de implementación y criterios de aceptación

1. Añadir una función de agrupación presentacional que conserve los tres códigos de moneda y sume con precisión los `balance` ya calculados por el servicio.
2. Renderizar tres tarjetas responsive: una columna en móvil y tres columnas desde `md`/`lg`, con iconografía Lucide sobria, etiqueta de moneda, balance formateado y botón accesible `Detalles`.
3. Implementar la pantalla de detalle reutilizando la misma fuente de datos; debe mostrar balance total, nombre, tipo, saldo y moneda de cada cuenta del grupo.
4. Integrar la navegación con el mecanismo actual y permitir volver al Dashboard sin crear un router paralelo.
5. Validar que dos cuentas USD se sumen en USD, que las cuentas de otras monedas no se mezclen, que las cuentas inactivas no aparezcan y que no haya conversión entre monedas en las tarjetas.
6. Ejecutar `npm run lint` y `npm run build`, además de una comprobación manual en móvil, tablet y desktop.

### Estado, esfuerzo y riesgos

- Estado: implementado y validado; la agrupación vive en la presentación y el detalle reutiliza el resumen del dashboard.
- Esfuerzo estimado: medio. La suma es sencilla, pero la navegación actual no tiene rutas URL y el detalle necesita exponer el tipo de cuenta sin romper el contrato existente.
- Riesgo funcional: bajo si se reutiliza `summary.accounts` y `getAccountBalance`; alto si se crea una segunda lectura o cálculo de saldos.
- Riesgo de navegación: medio, porque el estado actual usa etiquetas de página y eventos globales. Debe evitarse perder el estado de Dashboard o romper los destinos existentes.
- Riesgo de datos: bajo; no se requiere migración ni modificación del esquema Dexie.
- Riesgo residual: el Dashboard actual calcula balances convertidos y por cuenta dentro de una carga completa; la agrupación no añade consultas, pero sí debe conservar el manejo de cuentas cuya conversión no esté disponible.

### Alternativas consideradas

- Introducir React Router: descartado para esta solicitud por ser una dependencia y un cambio transversal innecesario frente al mecanismo de navegación existente.
- Crear un servicio nuevo de balances por moneda: descartado porque duplicaría la lógica financiera; la agrupación debe partir de los balances calculados por `dashboardService`.
- Consultar y calcular saldos directamente desde la pantalla de detalle: descartado; el detalle debe reutilizar el servicio para mantener consistencia.

### Verificaciones ejecutadas

- `npm run lint`: correcto.
- `npm run test`: correcto; 1 archivo, 1 prueba aprobada.
- `npm run build`: correcto; Vite evidencia una advertencia de tamaño de bundle superior a 500 kB, pero la compilación termina con éxito.

## Próxima decisión

La calculadora, los balances agrupados, la corrección de selección USD/VES, la configuración básica, el modo oscuro global, la gestión básica de cuentas, la migración de metas, la validación de disponibilidad y la edición de movimientos ya están implementados en código. Permanecen pendientes la edición consistente de cuentas VES/USD, la suite automatizada y mejoras de UX/performance.

## Solicitud implementada parcialmente: metas de ahorro vinculadas a cuentas y aportes explícitos

### Objetivo

Permitir que una meta de ahorro, como `Comprar Laptop`, tenga una cuenta física de respaldo, sin sumar automáticamente todos los ingresos de esa cuenta. El progreso solo debe aumentar mediante un aporte explícito desde Movimientos. El dinero sigue físicamente en la cuenta bancaria, pero queda comprometido y deja de estar disponible para gastos diarios.

### Estado verificado al 2026-09-08

- `db` ya contiene la tabla `goals` y `TransactionType` ya contempla `goal_contribution`, `goal_withdrawal` y `goalId`.
- `goalRepository` y `goalService` existen; `Goals.tsx` migra metas antiguas desde `localStorage`, crea metas vinculadas a cuentas activas y registra aportes/retiros.
- `getAccountBalance()` reconstruye el saldo físico desde ingresos, gastos y transferencias, pero no excluye aportes comprometidos.
- `Transactions.tsx` todavía no ofrece aportes/retiros de metas como tipo de movimiento; la pantalla de metas escribe directamente en Dexie.
- Los aportes y retiros se guardan con `accountId`, pero no hay validación de saldo disponible, moneda, cuenta activa, meta activa ni límite de retiro.
- Los aportes de meta no se consideran en `getAccountBalance()`, por lo que el saldo físico sigue el modelo elegido, pero el gasto posterior no se bloquea contra fondos comprometidos.

### Solución elegida

Una Meta será una entidad de planificación y compromiso, no una cuenta física ni una cuenta Dexie dentro de `accounts`. El modelo tendrá tres valores distintos:

- **Saldo físico:** saldo real de la cuenta, reconstruido desde saldo inicial y movimientos físicos. Un aporte a una meta no lo reduce porque el dinero no salió del banco.
- **Comprometido en metas:** suma de aportes vigentes asociados a esa cuenta y moneda.
- **Disponible para gastar:** `saldo físico - comprometido en metas`.

Así, con una cuenta de 100 VES y un aporte de 30 VES:

- saldo físico: 100 VES;
- meta: 30 VES;
- disponible: 70 VES;
- patrimonio consolidado: 100 VES, no 130 VES.

La cuenta de respaldo sirve para validar el origen y determinar el saldo disponible, pero sus ingresos generales no modifican el progreso de la meta.

### Esquema de datos recomendado

Migrar las metas desde `localStorage` a una tabla Dexie `goals`:

```text
Goal
  id: string
  name: string
  targetAmount: number
  currency: CurrencyCode
  backingAccountId: string
  active: boolean
  createdAt: string
  updatedAt: string
```

Extender `Transaction` con movimientos de compromiso, sin crear una cuenta virtual:

```text
Transaction.type:
  income | expense | transfer | goal_contribution | goal_withdrawal

Transaction.goalId?: string
Transaction.accountId?: string        // cuenta física de respaldo
Transaction.amount?: number
Transaction.currency?: CurrencyCode
```

Para `goal_contribution`, `accountId` es el origen físico, `goalId` es la meta destino y `amount/currency` representan el compromiso. Para `goal_withdrawal`, los mismos campos liberan un aporte anterior. El historial debe guardar el movimiento original; el progreso se calcula agregando contribuciones y restando retiros, no editando `Goal.current` manualmente.

El índice de `transactions` debe incluir `goalId` y `accountId` si se usarán consultas IndexedDB por esos campos. La migración debe crear `goals` y conservar las tablas actuales.

### Invariantes financieros

- Una meta solo puede vincularse a una cuenta física activa y a una moneda compatible.
- Un aporte debe tener monto positivo, fecha válida, `goalId`, `accountId` y moneda coherente.
- La suma de aportes vigentes de una cuenta y moneda nunca puede superar su saldo físico disponible.
- Un ingreso normal en la cuenta de respaldo no aumenta una meta.
- Un aporte no aumenta el saldo físico de la cuenta ni el patrimonio consolidado.
- El disponible se calcula siempre como saldo físico menos compromisos vigentes; no se almacena como saldo editable.
- Transferencias físicas entre cuentas siguen afectando saldos físicos. Un aporte a una meta no debe reutilizar `fromAccountId/toAccountId` porque no representa movimiento físico.
- Para mover un compromiso de una cuenta a otra se requiere un retiro de la meta y un nuevo aporte; no se debe editar silenciosamente el origen histórico.
- No se debe permitir eliminar o desactivar una cuenta con metas o aportes vigentes sin reasignación o liberación explícita.
- Una meta cerrada conserva su historial y deja de aceptar nuevos aportes.

### Servicios y repositorios

Añadir una separación equivalente a la arquitectura vigente:

- `goalRepository`: crear, actualizar, listar metas activas y consultar por cuenta.
- `goalService`: validar metas, vincular cuenta, calcular progreso, comprometido y disponible.
- `transactionService.createGoalContribution(input)`: validar cuenta activa, meta activa, moneda, monto y disponible; crear el movimiento.
- `transactionService.createGoalWithdrawal(input)`: liberar compromiso con validación contra el acumulado de la meta.
- `financialService.getAccountBalance(account)`: conservar el saldo físico actual.
- Nuevo servicio de disponibilidad: calcular `physicalBalance`, `committedAmount` y `availableBalance` por cuenta y moneda usando las transacciones de metas.

Las altas de meta y los aportes deben ejecutarse dentro de transacciones `db.transaction("rw", db.goals, db.transactions, ...)` cuando se modifiquen varias entidades. El repositorio conserva la persistencia; las reglas financieras permanecen en servicios.

### Contrato de API futuro

La aplicación no tiene backend actualmente, por lo que no deben crearse endpoints HTTP ahora. Estos contratos de servicio local definen la frontera futura:

```text
createGoal({ name, targetAmount, currency, backingAccountId }) -> Goal
updateGoal(id, { name, targetAmount, backingAccountId, active }) -> Goal
listGoals() -> GoalWithProgress[]
getAccountAvailability(accountId, currency) -> {
  physicalBalance,
  committedAmount,
  availableBalance
}
createGoalContribution({ goalId, accountId, amount, currency, date, description }) -> Transaction
createGoalWithdrawal({ goalId, accountId, amount, currency, date, description }) -> Transaction
```

Si en el futuro se añade una API remota, los endpoints equivalentes podrían ser `GET/POST/PATCH /goals`, `GET /accounts/:id/availability`, `POST /goals/:id/contributions` y `POST /goals/:id/withdrawals`. No deben implementarse mientras el proyecto siga local-first.

### Componentes de interfaz

**Metas:**

- Formulario de alta/edición con nombre, objetivo, moneda y selector de `Cuenta física de respaldo`.
- Solo mostrar cuentas activas cuya moneda coincida con la moneda de la meta.
- Mostrar progreso derivado, aportado, restante y cuenta vinculada.
- Mostrar disponible de la cuenta de respaldo como información operativa, sin confundirlo con el saldo físico.
- Acciones `Aportar`, `Liberar aporte` y `Editar`; no permitir editar `current` directamente.

**Movimientos:**

- Mantener `Gasto`, `Ingreso` y `Transferencia física`.
- Añadir `Aporte a meta` como operación explícita.
- En esa operación, seleccionar cuenta física, meta compatible, monto, fecha y descripción.
- Mostrar claramente `Cuenta origen -> Meta: nombre` y la leyenda de que el dinero permanece en la cuenta, pero queda comprometido.
- No mostrar metas dentro del selector de cuentas físicas de una transferencia normal.

**Dashboard y cuentas:**

- Mostrar saldo físico y saldo disponible por cuenta cuando existan compromisos.
- Mostrar compromisos por meta como información derivada.
- No sumar metas como cuentas adicionales en patrimonio.
- En el detalle de una cuenta, separar movimientos físicos de aportes y retiros de metas.

### Migración y compatibilidad

1. Crear `db.version(2)` con la tabla `goals` y los índices necesarios.
2. Migrar las metas de `localStorage` una sola vez, asignando moneda y cuenta de respaldo mediante una decisión explícita del usuario si la meta antigua no tiene esos datos.
3. No convertir automáticamente el campo antiguo `current` en saldo comprometido sin trazabilidad. Debe importarse como aporte inicial confirmado por el usuario o quedar pendiente de asignación.
4. Mantener cuentas y transacciones existentes sin cambios destructivos.
5. Antes de permitir gastos, calcular el disponible sobre el saldo físico actual; una cuenta con compromisos históricos debe impedir gastar por encima de ese disponible.

### Criterios de aceptación

- Crear y editar una meta permite seleccionar una cuenta física activa de la misma moneda.
- Los ingresos y depósitos normales de la cuenta no cambian el progreso de la meta.
- Un aporte explícito reduce el disponible de la cuenta y aumenta el progreso de la meta.
- El saldo físico y el patrimonio no se duplican ni disminuyen por un aporte que permanece en el banco.
- Un gasto se rechaza si supera el saldo disponible después de compromisos.
- Los aportes y retiros aparecen en el historial con cuenta, meta, moneda, monto y fecha.
- Las transferencias físicas entre cuentas siguen funcionando sin tratar metas como cuentas reales.
- Una meta no puede recibir aportes de una cuenta de moneda distinta.
- La eliminación o desactivación de una cuenta con compromisos exige resolver esos compromisos.
- Las metas antiguas de `localStorage` se migran sin pérdida silenciosa de información.

### Esfuerzo, riesgos y orden recomendado

**Esfuerzo:** alto. El cambio afecta esquema Dexie, migración, cálculo de saldos disponibles, validación de gastos, movimientos y la pantalla de metas.

**Riesgos principales:** duplicar dinero si se modela la meta como cuenta física; permitir gastos sobre fondos comprometidos; perder el valor antiguo de `current`; mezclar monedas; y permitir cambios parciales entre meta y transacción.

**Orden recomendado:**

1. Crear `Goal`, tabla Dexie v2, repositorio y migración de `localStorage`.
2. Implementar cálculo de progreso y disponibilidad con pruebas de dominio.
3. Añadir servicios atómicos de aporte y liberación.
4. Integrar validación de gastos contra saldo disponible.
5. Actualizar Metas y Movimientos.
6. Actualizar Dashboard, detalle de cuentas y gestión de cuentas.
7. Ejecutar pruebas de regresión para saldos físicos, disponibilidad, transferencias, monedas y migración.

## Revisión integral del proyecto - 2026-09-08

### Resultado

El proyecto está en estado de prototipo funcional avanzado y puede compilarse para uso local. La arquitectura principal se respeta: React consume servicios, los servicios delegan en repositorios y Dexie/IndexedDB conserva los datos. No se detectó backend, autenticación, sincronización remota, multiusuario ni infraestructura fuera del alcance.

No debe considerarse todavía listo para una versión financiera estable. Los riesgos más importantes están en reglas de dominio y consistencia de datos, no en la compilación.

### Funcionalidades verificadas como operativas

- Dashboard con patrimonio convertido, períodos, flujo de caja, gastos por categoría, actividad reciente y balances agrupados por VES/USD/USDT.
- Cuentas con alta, edición de nombre/tipo, activación/desactivación y creación de cuenta USD vinculada a una cuenta VES.
- Movimientos de ingresos, gastos, transferencias entre cuentas y eliminación.
- Tasas BCV y Binance P2P con actualización tolerante a fallos; migración de `PARALLEL`; tasa MANUAL editable para la calculadora.
- Configuración de moneda base, tasas locales y tema claro/oscuro persistidos en `localStorage`.
- Categorías con alta, edición, duplicados controlados y eliminación protegida si tienen movimientos.
- Metas con persistencia Dexie, migración básica desde `localStorage`, selección de cuenta compatible y progreso derivado de aportes/retiros.
- Presupuestos mensuales guardados localmente y diagnóstico financiero basado en el resumen del mes.
- El Dashboard incluye accesos directos a Cuentas, Categorías y Configuración en el encabezado.

### Qué falta antes de declarar el proyecto listo

1. **Verificar la tasa manual:** `CurrencyCalculator` borra MANUAL al refrescar y la regenera desde BCV al abrir; falta prueba automatizada del ciclo.
2. **Completar el dominio de metas:** ya existen validaciones de cuenta, moneda, objetivo, retiros y saldo disponible; falta integrar aportes en la pantalla general de Movimientos y cubrir migraciones con pruebas.
3. **Completar transacciones de metas:** las operaciones ya usan servicios; queda pendiente envolver operaciones multi-entidad en transacciones Dexie cuando se amplíe el flujo.
4. **Validar edición de transacciones:** ingresos, gastos y transferencias ya pueden editarse con validación y recálculo derivado; faltan pruebas de regresión.
5. **Completar edición de cuentas:** el saldo inicial efectivo es modificable y el ajuste mediante ingreso/gasto compensatorio es el mecanismo aceptado porque conserva el historial derivado. La relación VES/USD todavía necesita edición y desactivación consistente.
6. **Alinear moneda base:** presupuestos y algunas etiquetas de diagnóstico siguen mostrando USD fijo aunque el Dashboard usa la moneda base seleccionada. El modelo de presupuesto debe almacenar moneda o declararse explícitamente USD.
7. **Corregir navegación incompleta:** `RecentTransactions` tiene botones `Ver todas` sin acción, y el menú inferior móvil mantiene seis opciones en tres columnas, lo que reduce legibilidad y requiere una decisión responsive.
8. **Ampliar pruebas automatizadas:** ya existe Vitest y una prueba inicial; faltan pruebas de servicios para conversiones, selección de tasas, saldos, transferencias, metas, migraciones y edición.
9. **Mejorar rendimiento del build:** Vite informa un chunk JavaScript minificado de aproximadamente 807 kB. Conviene evaluar carga diferida por pantalla y componentes pesados de Recharts antes de producción.
10. **Revisar UX y accesibilidad:** faltan confirmaciones para eliminar movimientos/categorías, mensajes de error consistentes, estados de carga/error en varias pantallas, navegación por teclado validada y revisión visual real en móvil/tablet/desktop.

### Esfuerzo global

Medio-alto. La base funcional y persistencia existen, pero las tareas restantes afectan saldos derivados, compromisos financieros, migraciones y contratos entre capas. La prioridad debe ser la consistencia financiera y las pruebas antes de ampliar funcionalidades visuales.

### Plan recomendado

**Imprescindible:** corregir MANUAL, cerrar el modelo de disponibilidad de metas, integrar sus servicios, validar edición de cuentas y movimientos, y crear pruebas de dominio.

**Después:** alinear moneda base de presupuestos/diagnóstico, completar navegación y confirmaciones, revisar responsive/accesibilidad y dividir el bundle.

**Fuera de alcance:** backend, PostgreSQL, autenticación, sincronización, multiusuario y cualquier infraestructura remota.

### Decisiones abiertas

- Definir si los presupuestos se expresan siempre en USD o siguen la moneda base; no debe mantenerse una etiqueta que contradiga el valor almacenado.
- Mantener el ajuste compensatorio como el tratamiento histórico de cambios en `initialBalance` y definir únicamente sus validaciones, descripción y comportamiento para cuentas VES/USD vinculadas.
- Definir si una meta permite retiros parciales y si una meta completada permanece activa para nuevos aportes.
- Elegir la estrategia de pruebas local: Vitest u otra herramienta compatible, sin convertir el proyecto en una aplicación remota.

## Solicitud analizada: fecha límite, categoría y aporte mensual sugerido en metas

### Objetivo y resultado del análisis

Se revisó el flujo completo de metas en `src/database/db.ts`, `src/pages/Goals.tsx`, `src/services/goalService.ts`, `src/repositories/goalRepository.ts`, `src/services/transactionService.ts`, `src/pages/Transactions.tsx` y `src/pages/Diagnostic.tsx`, además de los usos de `Goal`, las utilidades de fecha, las pruebas y la configuración del proyecto.

La funcionalidad no está implementada todavía. `Goal` solo contiene nombre, objetivo, moneda, cuenta de respaldo, estado y auditoría; `Goals.tsx` solo captura esos campos; `goalService.ts` valida objetivo, cuenta, moneda, aportes, retiros y disponibilidad; y `Diagnostic.tsx` actualmente consume únicamente `getDashboardSummary()`, sin leer metas.

### Cambios mínimos recomendados

**Modelo en `src/database/db.ts`:**

- Añadir `GoalCategory = "emergency" | "purchase" | "investment"`.
- Añadir `category: GoalCategory` como campo requerido para nuevas metas.
- Añadir `deadline?: string`, usando exclusivamente fecha de calendario `YYYY-MM-DD`, no un `Date` serializado.
- Añadir `suggestedMonthlyContribution?: number`, como importe positivo opcional introducido o confirmado por el usuario. Si se desea una sugerencia automática, debe calcularse desde `remainingAmount` y los meses de calendario hasta `deadline`, sin almacenarla como saldo derivado.

**Migración Dexie:**

- Crear `db.version(4)` conservando las tablas y los índices actuales; añadir índices `category` y `deadline` solo si se van a filtrar u ordenar desde repositorio.
- En `upgrade`, normalizar metas existentes sin reescribir sus fechas de creación, progreso ni transacciones: asignar `category: "purchase"` como valor de compatibilidad explícito cuando no haya información histórica, dejar `deadline` ausente y dejar `suggestedMonthlyContribution` ausente.
- La migración de `localStorage` en `migrateLegacyGoals()` debe aplicar los mismos valores por defecto y conservar el comportamiento idempotente. No se puede inferir de forma fiable la categoría, fecha límite o aporte sugerido de una meta antigua.
- No modificar `Transaction`, porque los movimientos ya referencian `goalId` y el progreso seguirá siendo derivado de aportes/retiros.

**Servicio y UI:**

- En `src/services/goalService.ts`, validar categoría contra el tipo union, fecha con formato estricto y aporte sugerido finito y mayor que cero cuando exista; rechazar una fecha límite inválida. La fecha pasada debe ser una decisión funcional, no una consecuencia accidental del parseo.
- En `src/pages/Goals.tsx`, añadir selector de categoría, fecha opcional y aporte mensual sugerido opcional; mostrar fecha, categoría, restante y aporte recomendado en cada meta.
- Mantener `createGoal()` como frontera de dominio. `goalRepository.ts` debe seguir limitado a persistencia; no trasladar validaciones a la pantalla ni al repositorio.
- En `src/pages/Transactions.tsx`, no se requiere cambio de contrato: los aportes y retiros siguen usando `goalId`. Puede mostrarse la categoría/nombre de la meta en el selector como mejora de identificación, pero no es imprescindible para la primera entrega.

### Conexión con Diagnostic

La conexión actual es inexistente y no debe hacerse importando `db` desde `Diagnostic.tsx`. La opción mínima y coherente es añadir en `goalService.ts` una función de lectura derivada, por ejemplo `getGoalDiagnosticSummary()`, que reutilice `getGoalsWithProgress()` y devuelva metas activas, metas vencidas, metas próximas a vencer, progreso agregado y aportes mensuales sugeridos. `Diagnostic.tsx` consumiría ese DTO junto con `getDashboardSummary()`.

La primera integración visible puede ser una comprobación adicional: metas vencidas sin completar y metas cuyo aporte mensual sugerido supera el ahorro mensual disponible. La comparación debe respetar moneda; no se deben comparar importes de metas con el ahorro del Dashboard convertido sin una tasa y periodo explícitos. Una conexión futura puede desglosar el diagnóstico por `emergency`, `purchase` e `investment`, sin cambiar el cálculo del patrimonio ni tratar metas como cuentas.

### Riesgos de fechas

- `input type="date"` entrega `YYYY-MM-DD`, mientras `new Date("YYYY-MM-DD")` puede interpretarse en UTC y cambiar de día en Venezuela. La validación y los cálculos de plazo deben tratar la fecha límite como fecha civil, no como instante.
- Las fechas de movimientos sí se guardan como ISO con hora (`new Date(`${form.date}T12:00:00`).toISOString()`), por lo que no debe mezclarse ese formato con `Goal.deadline`.
- Debe definirse si se permite una fecha pasada al crear o editar. Recomendación: permitirla para importar datos y marcar la meta como vencida; bloquear solo nuevas fechas con formato inválido. También debe definirse si una meta completada mantiene el estado `active`.
- Para el aporte mensual automático, usar meses de calendario y documentar el redondeo monetario; no calcular con milisegundos ni dividir por una duración aproximada de 30 días.

### Pruebas recomendadas

- Migración Dexie v3 -> v4: conserva metas y transacciones, añade `category: "purchase"` solo cuando falta y no inventa fecha ni aporte.
- Migración de `localStorage`: importa una meta antigua una sola vez, conserva su objetivo y aplica defaults compatibles.
- `createGoal()`: acepta las tres categorías y campos opcionales válidos; rechaza categoría inválida, aporte cero/negativo, fecha mal formada y cuenta incompatible.
- Cálculo de sugerencia mensual: sin fecha no muestra sugerencia automática; con fecha futura calcula meses de calendario; con fecha actual o pasada aplica la regla definida sin división por cero.
- Progreso y disponibilidad: categoría, deadline y aporte sugerido no alteran saldos físicos, compromisos ni patrimonio; aportes/retiros existentes siguen calculando el mismo progreso.
- Diagnóstico: detecta vencimiento y progreso por categoría, respeta metas activas y no mezcla monedas. Añadir pruebas de regresión para metas sin campos nuevos.
- UI: crear meta con y sin fecha, filtrar cuentas por moneda, mostrar estado vencido y conservar aportes/retiros.

### Impacto, esfuerzo y estado

- **Capas afectadas:** modelo/migración Dexie, `goalService`, `Goals.tsx` y, para la conexión de diagnóstico, un DTO de servicio y `Diagnostic.tsx`. `Transactions.tsx` y `transactionService.ts` solo requieren revisión de regresión salvo que se quiera enriquecer la etiqueta de meta.
- **Esfuerzo estimado:** medio. El formulario y contrato son pequeños, pero la migración, semántica de fechas y pruebas financieras requieren cuidado.
- **Riesgos principales:** interpretar fechas en UTC, presentar una sugerencia mensual como obligación, asignar categorías históricas sin trazabilidad, mezclar monedas en el diagnóstico y romper metas antiguas por hacer campos nuevos obligatorios sin migración.
- **Estado:** análisis y recomendación documentados; no se modificó código de producción ni se declaró la funcionalidad completada.

### Verificaciones ejecutadas

- `npm run lint`: correcto.
- `npm test`: correcto; 2 archivos y 3 pruebas aprobadas.
- `npm run build`: correcto; Vite mantiene la advertencia existente de chunk superior a 500 kB (aproximadamente 818 kB minificados).

### Decisiones pendientes

- Confirmar si `suggestedMonthlyContribution` es un importe manual persistido, una sugerencia siempre derivada o ambos mediante un override manual.
- Confirmar si se permiten deadlines pasados y si una meta completada permanece activa.
- Confirmar la semántica del default histórico `purchase`; si no es aceptable, la migración debe usar una categoría explícita `unknown`, lo que contradice el conjunto solicitado y requeriría ampliar el contrato.
- Definir si el diagnóstico inicial solo alerta vencimientos o también calcula capacidad mensual por moneda.

## Solicitud registrada: navegación móvil, dashboard, calculadora y evolución financiera

### Objetivo

Esta solicitud agrupa correcciones de experiencia móvil, ajustes de presentación y una ampliación del modelo financiero para que la aplicación pueda soportar exportación de datos, movimientos recurrentes y un diagnóstico integral de salud financiera de 1 a 100.

El estado de esta sección es **analizado y pendiente de implementación**. No se modificó código de producción durante esta revisión.

### Hechos verificados antes de planificar

- `AppShell` renderiza actualmente seis opciones en el footer móvil y un menú desplegable con las mismas opciones. El header móvil usa `sticky`, mientras que el menú se posiciona respecto al inicio del contenido (`top-16`); esto explica que el menú no permanezca disponible cuando el usuario está al final de una página larga.
- `Transactions` usa el mismo `AppShell` y no tiene una confirmación antes de llamar a `deleteTransaction`.
- `BalanceDetails` muestra `account.type` directamente, por lo que presenta valores internos como `bank`, `cash` o `crypto` en inglés.
- `CurrencyCalculator` construye ambos selectores con las tres monedas, permite seleccionar la misma moneda en ambos lados y formatea VES con hasta seis decimales en la salida.
- `Dashboard` muestra `summary.savings` dentro de `BalanceCard`, `FinancialOverview` y el bloque `Resumen del período`. `summary.savings` se calcula como ingresos menos gastos del período; no es una métrica independiente del patrimonio total.
- El Dashboard ya tiene accesos de encabezado para Cuentas, Categorías y Configuración en escritorio, pero no existe una página `Menú` ni una página de movimientos recurrentes.
- El modelo actual de Dexie contiene `accounts`, `categories`, `goals`, `transactions` y `exchangeRates`. No contiene exportación/importación, recurrencias, clasificación esencial/discrecional, pasivos, APR, activos no líquidos ni seguros.
- La suite ejecutada sigue siendo mínima: existe una prueba de generación de IDs y no hay pruebas de regresión para estas nuevas reglas.

### Modificaciones solicitadas y estado

#### 1. Navegación y responsive móvil

**Pendiente:**

- En móvil, el footer debe conservar únicamente `Inicio`, `Diagnóstico` y `Menú`.
- Crear una página `Menú` que reúna Inicio, Movimientos, Presupuestos, Metas, Diagnóstico, Calculadora, Cuentas, Categorías, Configuración y, cuando exista, Recurrentes.
- En escritorio se conservará la navegación principal y los accesos de apoyo existentes, salvo que una etapa posterior defina otra estructura.
- Convertir el header móvil y el botón de navegación en elementos persistentemente visibles durante el scroll. El contenido deberá reservar espacio para el header y el footer para evitar solapamientos.
- Mantener accesibles los destinos de Cuentas, Categorías y Configuración desde Inicio y desde las demás pantallas según el diseño final, sin duplicar estados de navegación.

**Decisión técnica recomendada:** ampliar el contrato de `AppShell` con una navegación móvil de tres elementos y centralizar el resto en `Menu.tsx`. La solución debe mantener el estado local de `App.tsx` y no introducir React Router solo por esta mejora.

#### 2. Dashboard y presentación

**Pendiente:**

- En el Dashboard, colocar una fila superior de accesos solo con iconos SVG/Lucide para Calculadora, Movimientos, Cuentas y Configuración, con `aria-label` y `title`.
- Presentar Ingresos y Gastos en una misma fila. Ingresos usará una flecha blanca dentro de un círculo verde; Gastos, una flecha blanca dentro de un círculo rojo.
- Eliminar la tarjeta o bloque visual de Ahorro solicitado por el usuario, evitando que desaparezca la información necesaria para el diagnóstico sin decidir antes dónde se mostrará la tasa de ahorro.
- Resolver la duplicación entre Patrimonio financiero y Resumen del período. La opción recomendada es que Patrimonio muestre únicamente saldo patrimonial y que Resumen del período muestre ingresos, gastos y resultado neto del período; ambos deben tener títulos y métricas no redundantes.

La decisión sobre el destino de la tasa de ahorro queda abierta: puede permanecer en Diagnóstico o en el Resumen del período, pero no debe mostrarse como una tercera tarjeta que repita el mismo resultado sin contexto.

#### 3. Movimientos y seguridad operativa

**Pendiente:** añadir confirmación antes de eliminar un movimiento, indicando si se eliminará un gasto, ingreso o transferencia y mostrando una acción explícita de cancelar. La confirmación debe ejecutarse antes de `deleteTransaction`; no debe ser solo un cambio visual.

La confirmación debe cubrir también transferencias y considerar que borrar un movimiento modifica saldos derivados. En una etapa posterior conviene reemplazar `window.confirm` por un diálogo accesible y reutilizable, pero una confirmación nativa puede ser la primera entrega de bajo esfuerzo.

#### 4. Balance por moneda y calculadora

**Pendiente:**

- Traducir los tipos de cuenta en `BalanceDetails` mediante un mapa de presentación (`Banco`, `Efectivo`, `Cripto`, `Billetera`, `Otra`) sin modificar los valores persistidos ni el tipo de dominio.
- Excluir la moneda seleccionada del selector opuesto de `CurrencyCalculator`; por ejemplo, VES no debe aparecer como destino si el origen es VES. Si se cambia el origen y deja inválido el destino, seleccionar automáticamente la primera moneda disponible.
- Para conversiones VES a USD o USDT, limitar la salida a dos decimales. La precisión interna de tasas y conversiones debe mantenerse; el redondeo es únicamente de presentación.
- Mantener una tasa manual editable para USD/VES y no usarla implícitamente en balances ni reportes.

#### 5. Exportación e importación local de datos

**Pendiente:** agregar en Configuración una sección de exportación e importación en JSON y CSV para facilitar pruebas con datasets reales o ficticios.

**Solución recomendada:**

- Implementar un servicio de respaldo local que exporte un JSON versionado con todas las tablas (`accounts`, `categories`, `goals`, `transactions`, `exchangeRates`) y metadatos de formato.
- Permitir CSV por entidad; para la primera entrega, varios CSV descargables son más simples y transparentes que un CSV plano que mezcle tablas relacionadas.
- Validar el archivo importado con Zod antes de escribirlo, comprobar referencias entre cuentas, categorías, metas y movimientos, rechazar duplicados incompatibles y mostrar un resumen de errores.
- Importar mediante una transacción Dexie `rw` y ofrecer modo reemplazo o combinación de forma explícita. El modo reemplazo debe requerir confirmación porque puede eliminar datos locales.
- No incluir credenciales, backend ni sincronización. Los archivos deben generarse y procesarse en el navegador.

**Riesgos:** CSV no conserva de forma natural relaciones ni tipos opcionales; los montos, fechas, monedas y tasas requieren normalización estricta. La importación debe ser reversible mediante una exportación previa y nunca sobrescribir silenciosamente la base.

#### 6. Movimientos recurrentes

**Pendiente:** crear la página `Recurrentes` para administrar gastos, ingresos y transferencias que se repiten con una periodicidad definida.

**Modelo recomendado:** una entidad `RecurringTransaction` separada de `transactions`, con tipo, cuentas, categoría, moneda, montos, descripción, frecuencia, próxima fecha, fecha final opcional, activo y `lastGeneratedAt`. La recurrencia debe ser una plantilla; cada ejecución debe crear un movimiento normal con referencia a la plantilla y no alterar movimientos históricos.

La generación automática requiere una decisión explícita sobre cuándo se ejecuta en una aplicación local-first: al abrir la app, al entrar a Recurrentes o mediante una acción `Generar pendientes`. La primera versión debe evitar duplicados usando una clave de ejecución por plantilla y fecha, registrar errores y permitir pausar una plantilla.

#### 7. Clasificación financiera adicional

**Pendiente y de impacto medio-alto:**

- Añadir a las categorías de gasto una clasificación `essential`/`discretionary` para distinguir gasto esencial de gasto discrecional.
- Diferenciar cuentas de liquidez inmediata, inversión y deuda/tarjeta. No se debe reutilizar `Account.type` sin definir antes el efecto contable de cada clase.
- Clasificar transferencias hacia inversión como movimientos patrimoniales y no como gastos, conservando la trazabilidad entre cuenta origen y destino.
- Para deudas, definir una entidad explícita con saldo pendiente, APR, pago mínimo, fecha de corte/vencimiento y cuenta asociada. Un gasto de pago de deuda no debe confundirse con el saldo total del pasivo.

Estas reglas requieren pruebas de dominio antes de modificar el Dashboard, porque pueden cambiar ahorro, patrimonio, gasto esencial y disponibilidad.

#### 8. Patrimonio neto, salud financiera y deudas

**Propuesta de siguientes módulos:**

- **Patrimonio neto:** registrar activos no representados por cuentas (efectivo, inversiones, inmuebles y vehículos) y pasivos (hipotecas, préstamos y tarjetas). La métrica será `Patrimonio neto = Total activos - Total pasivos`.
- **Multiplicador de Stanley:** calcularlo solo cuando existan edad e ingreso anual bruto válidos: `Patrimonio neto real / ((Edad * Ingreso anual bruto) / 10)`. Debe mostrarse como referencia educativa y no como evaluación normativa.
- **Health Score 1-100:** crear un servicio de dominio con cuatro componentes de 0 a 25: fondo de emergencia, relación deuda/ingreso, tasa de ahorro y adherencia al presupuesto/coberturas.
- **Fondo de emergencia:** `efectivo líquido / promedio mensual de gastos esenciales`.
- **DTI:** `(pagos mensuales de deuda / ingreso neto) * 100`.
- **Tasa de ahorro:** definir claramente si incluye ahorro líquido, aportes a metas y transferencias a inversión, sin duplicar una transferencia como ingreso o gasto.
- **Adherencia y coberturas:** comparar gastos reales contra presupuesto y añadir un checklist persistido de seguros; no presentar un puntaje completo mientras falten datos necesarios.
- **Debt Payoff Planner:** permitir ordenar deudas por tasa o saldo y simular Bola de Nieve y Avalancha. La simulación debe ser informativa y no crear movimientos hasta que el usuario confirme una acción.

El diagnóstico actual solo deriva una señal simple principalmente desde la tasa de ahorro mensual. Por tanto, no debe etiquetarse como el Health Score 1-100 completo hasta contar con datos de esenciales, deudas, liquidez, presupuestos y coberturas.

### Arquitectura y archivos previstos

- `src/components/layout/AppShell.tsx`: header/footer persistentes y navegación móvil de tres elementos.
- `src/pages/Menu.tsx`: índice de páginas para móvil.
- `src/pages/Recurring.tsx`, `src/services/recurringService.ts` y `src/repositories/recurringRepository.ts`: plantillas y generación controlada de movimientos recurrentes.
- `src/services/exportService.ts` y componentes de Configuración: respaldo JSON/CSV validado en el navegador.
- `src/database/db.ts`: nuevas entidades e índices solo mediante una migración Dexie versionada, después de cerrar los contratos.
- `src/services/dashboardService.ts` y componentes del Dashboard: separación entre patrimonio, resumen de período, ahorro y nuevas métricas.
- `src/services/financialService.ts` y nuevos servicios de dominio: patrimonio neto, disponibilidad, deuda y Health Score.
- `src/pages/Diagnostic.tsx` y una futura página de deudas: presentación de métricas con estados de datos insuficientes.

Se mantiene la arquitectura `React -> Services -> Repositories -> IndexedDB/Dexie`. No se propone backend, API remota, autenticación ni sincronización.

### Plan de desarrollo por etapas

#### Etapa 1: correcciones móviles y seguridad de operaciones

**Prioridad:** imprescindible. **Esfuerzo:** medio. **Riesgo:** medio.

1. Corregir header y footer móviles con posición persistente, espacio de contenido y prueba visual en páginas largas.
2. Crear Menú y limitar el footer a Inicio, Diagnóstico y Menú.
3. Añadir confirmación de borrado de movimientos.
4. Traducir tipos de cuenta y ajustar la fila de accesos e indicadores del Dashboard.
5. Eliminar la duplicación visual del resumen del período y definir la ubicación de la tasa de ahorro.

#### Etapa 2: calculadora, navegación y pruebas de regresión

**Prioridad:** alta. **Esfuerzo:** bajo-medio. **Riesgo:** bajo.

1. Filtrar monedas iguales en la calculadora y fijar a dos decimales las salidas VES a USD/USDT.
2. Añadir pruebas para selección de moneda, formato, borrado confirmado y traducción de tipos.
3. Validar responsive y accesibilidad con navegación por teclado y tamaños móvil, tablet y escritorio.

#### Etapa 3: respaldo e importación de datos

**Prioridad:** alta antes de pruebas de estrés. **Esfuerzo:** medio-alto. **Riesgo:** alto por pérdida o corrupción de datos.

1. Definir esquema versionado de respaldo.
2. Implementar exportación JSON completa y CSV por entidad.
3. Validar referencias y ejecutar importaciones dentro de una transacción Dexie.
4. Añadir confirmación, modo reemplazo/combinar, reporte de errores y pruebas con datasets pequeños y grandes.

#### Etapa 4: recurrentes y clasificación de dominio

**Prioridad:** media-alta. **Esfuerzo:** alto. **Riesgo:** alto por duplicación de movimientos y cambios en métricas.

1. Implementar plantillas recurrentes y generación idempotente.
2. Añadir esencial/discrecional en categorías.
3. Definir tipos de cuenta patrimoniales y transferencias a inversión.
4. Modelar deudas y sus pagos sin confundir flujo de caja con pasivo.

#### Etapa 5: diagnóstico integral y planner de deudas

**Prioridad:** media, después de estabilizar el dominio. **Esfuerzo:** alto. **Riesgo:** alto.

1. Implementar activos, pasivos y patrimonio neto.
2. Implementar los cuatro componentes del Health Score con datos faltantes explícitos.
3. Añadir cobertura de seguros y adherencia presupuestaria.
4. Incorporar simulación Bola de Nieve/Avalancha sin escritura automática de movimientos.
5. Cubrir fórmulas, conversiones, periodos, monedas, deuda y migraciones con pruebas de dominio.

### Criterios de aceptación de esta solicitud

- En móvil, el footer muestra solo Inicio, Diagnóstico y Menú; Menú permite abrir todas las páginas disponibles.
- El header móvil y su navegación se pueden abrir desde cualquier posición vertical sin desplazar manualmente al inicio.
- El borrado de cualquier gasto, ingreso o transferencia requiere confirmación explícita.
- El Dashboard muestra los accesos iconográficos solicitados, Ingresos y Gastos en una fila y no duplica el resultado neto entre Patrimonio y Resumen del período.
- Los tipos de cuenta del detalle por moneda aparecen en español.
- La calculadora no permite la misma moneda a ambos lados y muestra solo dos decimales en VES a USD/USDT sin perder precisión interna.
- Una exportación JSON puede restaurar las tablas y relaciones locales; los CSV se importan con validación y reporte de errores.
- Las recurrencias generan movimientos normales como máximo una vez por fecha programada y pueden pausarse.
- El futuro Health Score solo se muestra como 1-100 cuando sus cuatro componentes tienen reglas y datos suficientes.

## Implementacion iniciada - 2026-09-08

### Cambios completados en la primera fase

- La navegacion inferior movil ahora muestra unicamente Inicio, Diagnostico y Menu.
- Se creo `src/pages/Menu.tsx` con acceso a Inicio, Movimientos, Presupuestos, Metas, Diagnostico, Calculadora, Cuentas, Categorias y Configuracion.
- `App.tsx` reconoce la pagina Menu usando el mecanismo existente de estado local y eventos `finanzas:navigate`; no se introdujo router.
- En escritorio, el sidebar conserva solo Configuracion en la zona inferior y AppShell muestra una barra fija arriba a la derecha con Cuentas y Configuracion en todas las paginas; Categorias aparece en esa barra unicamente en Movimientos. En movil se conserva el mismo criterio mediante el encabezado fijo.
- El borrado de gastos, ingresos, transferencias y movimientos de metas pide confirmacion antes de llamar a `deleteTransaction`, indicando que modifica saldos derivados.
- El bloque de Patrimonio del Dashboard ya no muestra ahorro ni tasa de ahorro duplicados.
- Ingresos y Gastos se muestran en una misma fila con iconos de entrada y salida.
- El resumen del periodo usa el concepto Resultado neto en lugar de repetir Ahorro.
- Los tipos de cuenta del detalle por moneda se presentan como Banco, Efectivo, Cripto, Billetera u Otra.

### Verificaciones ejecutadas

- `npm test` -> correcto; 1 archivo y 1 prueba aprobada.
- `npm run lint` -> correcto.
- `npm run build` -> correcto; permanece la advertencia conocida de bundle mayor a 500 kB.

### Pendiente inmediato

- Validar visualmente en movil, tablet y escritorio el nuevo Menu y el footer persistente.
- La calculadora ya excluye la moneda origen, selecciona un destino valido al cambiarla y limita la salida VES hacia USD/USDT a dos decimales sin alterar la precision interna.
- Continuar con pruebas de dominio antes de implementar respaldo, recurrencias, deudas y Health Score.

### Verificacion adicional de calculadora

- `npm test` -> correcto; 2 archivos y 3 pruebas aprobadas.
- `npm run lint` -> correcto.
- La logica pura de seleccion y formato vive en `src/components/calculator/calculatorUtils.ts` y tiene cobertura unitaria.

### Ajustes posteriores

- Los presupuestos se expresan y se guardan exclusivamente en USD, sin depender de la moneda preferida en Configuracion.
- El gasto mensual usado para comparar presupuestos se calcula en USD.
- Los accesos fijos de escritorio permanecen anclados al viewport: la animacion de `.page-transition` ya no aplica `transform`, que creaba un contexto de posicionamiento y hacia que Configuracion se desplazara con el contenido.
- `Configuracion` permanece disponible en la barra fija superior de escritorio y en el sidebar; `Categorias` continua limitada a Movimientos.
- La carga, migracion legacy y progreso de metas se centralizan en `goalService`; `Goals.tsx` ya no lee directamente las tablas de metas ni recalcula aportes.
- Movimientos permite registrar `Aporte a meta` y `Retiro de meta` usando los servicios existentes, mostrando cuenta, meta y el compromiso del dinero; estos registros no se editan como ingresos o gastos.
- La disponibilidad y las validaciones de meta siguen usando saldo fisico menos compromisos, sin sumar metas como cuentas ni reducir el patrimonio.

### Verificaciones de esta continuacion

- `npm test` -> correcto; 2 archivos y 3 pruebas aprobadas.
- `npm run lint` -> correcto.
- `npm run build` -> correcto; permanece la advertencia conocida de bundle mayor a 500 kB.

### Ajustes de UX en movimientos - 2026-09-08

- Los aportes y retiros de metas usan un tratamiento visual neutro azul y no se presentan como ingresos reales.
- En `Aporte a meta`, la cuenta se etiqueta como `Cuenta origen`; en `Retiro de meta`, como `Cuenta destino`.
- La fecha inicial de Movimientos usa el calendario local mediante `todayLocal()`, evitando que la conversión UTC sugiera el día siguiente.
- En modo claro y oscuro, gastos, aportes y retiros usan letras e iconos en rojo neutro, sin fondos de color; no dependen de `text-primary`, que en el tema oscuro representa el color verde lima.
- Un aporte muestra salida de fondos comprometidos y un retiro muestra devolucion al saldo disponible con signo positivo; el color rojo identifica el tipo de movimiento, no el efecto contable.

### Verificaciones de UX en movimientos

- `npm test` -> correcto; 2 archivos y 3 pruebas aprobadas.
- `npm run lint` -> correcto.
- `npm run build` -> correcto; permanece la advertencia conocida de bundle mayor a 500 kB.

### Extensión de metas: plazo y categoría - 2026-09-08

- `Goal` incluye `category` (`emergency`, `purchase`, `investment`) y `deadline` opcional en formato `YYYY-MM-DD`.
- Dexie usa la versión 4 para añadir los campos sin eliminar datos; las metas antiguas reciben `purchase` como categoría provisional y no reciben una fecha inventada.
- La pantalla de Metas permite clasificar Fondo de emergencia / Reserva, Compra / Consumo o Inversión / Retiro.
- La fecha límite se valida como fecha civil y se calcula el aporte mensual sugerido desde el monto restante y los meses calendario faltantes; el valor es derivado y no se almacena como saldo.
- Diagnóstico muestra la distribución de metas por enfoque como información de planificación. El score actual no incorpora todavía esos importes ni se presenta como Health Score completo.

### Verificaciones de plazo y categoría

- `npm test` -> correcto; 2 archivos y 4 pruebas aprobadas.
- `npm run lint` -> correcto.
- `npm run build` -> correcto; permanece la advertencia conocida de bundle mayor a 500 kB.

### Eliminación de metas - 2026-09-08

- La pantalla de Metas permite eliminar una meta con confirmación explícita.
- La operación elimina en cascada todos los movimientos asociados mediante `goalId` y la meta dentro de una transacción Dexie.
- No se eliminan movimientos de otras metas ni movimientos físicos de las cuentas.
- Si el usuario cancela, no se modifica ningún dato.

### Verificación de eliminación de metas

- `npm test` -> correcto; 2 archivos y 4 pruebas aprobadas.
- `npm run lint` -> correcto.
- `npm run build` -> correcto; permanece la advertencia conocida de bundle mayor a 500 kB.

### Riesgos y decisiones abiertas

- Definir si `Menu` sustituye por completo al menú desplegable actual o si este se conserva como acceso rápido; la recomendación es un único patrón para evitar navegación duplicada.
- Definir si la persistencia del header requiere `position: fixed` global o basta con `sticky` dentro de un contenedor sin scroll propio; debe validarse en teléfonos reales.
- Definir el formato CSV por tabla y la política exacta de combinación de registros antes de habilitar importación destructiva.
- Definir el calendario y zona horaria de recurrencias, especialmente para fechas vencidas durante varios días sin abrir la aplicación.
- Definir qué activos y pasivos forman parte del patrimonio convertible y cómo se registran sus monedas y tasas.
- Definir escalas y límites de cada componente del Health Score; las fórmulas propuestas no son suficientes para asignar puntajes sin reglas de normalización.
- Resolver primero la alineación de moneda base de presupuestos y diagnóstico para no construir métricas nuevas con etiquetas contradictorias.

### Verificaciones de esta revisión

- `npm run lint` -> correcto.
- `npm run test` -> correcto; 1 archivo y 1 prueba aprobada.
- `npm run build` -> correcto; Vite transforma 2749 módulos y genera un bundle JavaScript de aproximadamente 814 kB, con la advertencia existente de superar 500 kB.
- No se realizaron cambios de código, migraciones ni pruebas visuales; todas las funcionalidades de esta solicitud permanecen pendientes.
