---
name: dexie-migration-helper
description: Guía y directrices para realizar migraciones de esquemas en Dexie e IndexedDB sin perder datos de los usuarios.
---

# Guía de Migraciones en Dexie

Dado que la aplicación es **local-first**, los datos residen únicamente en el IndexedDB del navegador del usuario. CUALQUIER cambio destructivo o mala migración provocará la pérdida irreversible de los datos financieros del usuario.

## Pasos para modificar el esquema en `src/database/db.ts`

1. **Nunca modificar versiones anteriores**:
   - Conserva las definiciones pasadas `this.version(1).stores(...)`, `this.version(2).stores(...)`, etc.

2. **Incrementar el número de versión**:
   - Agrega un nuevo bloque `this.version(N).stores({...})` incrementando la versión actual.
   - Especifica únicamente las tablas modificadas o agregadas, o reproduce el esquema completo actualizado.

3. **Escribir la función de migración (upgrade)**:
   - Si se agregan o cambian campos existentes, utiliza `.upgrade(tx => ...)` para procesar los registros antiguos.
   - Ejemplo:
     ```typescript
     this.version(4).stores({
       goals: 'id, backingAccountId, active'
     }).upgrade(async tx => {
       return tx.table('goals').toCollection().modify(goal => {
         if (!goal.category) {
           goal.category = 'General';
         }
       });
     });
     ```

4. **Validación obligatoria**:
   - Verifica que el archivo `src/database/seed.ts` siga funcionando con el esquema actualizado.
   - Crea o actualiza una prueba con Vitest para validar que una base de datos con datos de la versión anterior se migra correctamente a la nueva versión.
