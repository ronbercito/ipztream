# Bitácora de IPZStream

## Regla permanente
Toda mejora o corrección debe registrarse primero en `BITACORA.md`, después implementarse, verificarse, publicarse y reportarse. Antes de cada nueva etapa también se actualiza `CONTINUITY.md`. Los cambios estructurales requieren respaldo.

## Etapas 1–11
Completadas y validadas.

## Etapa 12 — Motor de streaming real + integración de fuentes — EN IMPLEMENTACIÓN

### Mejora 12.3.10 — Persistencia del estado
Implementado en 0.3.11.

### Mejora 12.3.11 — Remux/Copy de bajo consumo
Implementado en 0.3.12.

### Mejora 12.3.12 — Acciones visuales + reproductor emergente
Implementado en 0.3.13.

### Corrección 12.3.13 — Recuperación de contraseña administrativa
Implementado en 0.3.14.

### Corrección 12.3.14 — Preview H.264/AAC bajo demanda
Implementado en 0.3.15.

### Corrección 12.3.15 — HLS.js + entrega autenticada del preview
FFmpeg temporal y token efímero implementados para 0.3.16.

### Corrección 12.3.16 — Query del token HLS mal formada
Corregida construcción de URL mediante `URL`/`URLSearchParams`, conservando `token` y agregando `t` como parámetro separado.

### Corrección 12.3.17 — Build Vite bloquea actualización desde panel
**Diagnóstico real del servidor:** el repositorio privado no es el problema. El updater completó `comprobación`, `descarga Git` y `dependencias npm`. Vite falló con `Expected } but found Identifier` en `src/modules/channels/components/ChannelTable.jsx`, y el rollback automático restauró correctamente `d0b485bd8106` / 0.3.15.

**Causa:** botón `history-close` con JSX inválido: faltaba cerrar la expresión `onClick` antes del atributo `title`.

**Corrección:** `onClick={()=>setHistoryId(null)} title="Cerrar historial"`.

**Respaldo:** `backup/pre-channel-table-build-fix-2026-09-17`.

**Versión objetivo:** 0.3.16.

**Estado:** EN IMPLEMENTACIÓN — pendiente instalar desde el panel y validar preview real.
