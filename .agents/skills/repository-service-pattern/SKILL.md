---
name: repository-service-pattern
description: Instrucciones y directrices para mantener la separación de capas (React -> Services -> Repositories -> Dexie) en la aplicación de Finanzas.
---

# Patrón Repositorio y Servicio

En este proyecto, se debe respetar estrictamente la arquitectura en capas para mantener el principio de aplicación local-first y la posibilidad de desacoplar o probar el código.

## Arquitectura de Capas

```text
React (Componentes / Páginas)
  ↓
Services (Lógica de Negocio / Validaciones / Disponibilidad)
  ↓
Repositories (Acceso a Datos CRUD / Dexie)
  ↓
IndexedDB / Dexie
```

## Reglas Obligatorias

1. **Nunca acceder a Dexie directamente desde React**:
   - Los componentes o custom hooks de React NUNCA deben importar `db` de `src/database/db.ts` ni ejecutar métodos como `db.transactions.add()`.
   - Siempre deben llamar a un método de un servicio (ejemplo: `transactionService.createTransaction(...)`).

2. **Responsabilidades de los Repositorios (`src/repositories/`)**:
   - Encapsulan las operaciones CRUD puras con Dexie.
   - Retornan Promesas o Tipos directos de Dexie (`Table<T>`).
   - No contienen lógica de negocio ni cálculos financieros complejos.

3. **Responsabilidades de los Servicios (`src/services/`)**:
   - Contienen las reglas de negocio (ej. verificar si una cuenta tiene saldo disponible antes de gastar).
   - Coordinan llamadas a múltiples repositorios en transacciones Dexie (`db.transaction('rw', ...)`).
   - Retornan datos formateados o procesados para la capa de UI.

4. **Persistencia y Estado Presentacional**:
   - Para la UI se utiliza Zustand o estado local de React (`useState`), alimentado por los datos retornados por los servicios.
