# Bitácora de IPZStream

## 2026-09-14 — Etapa 1 — Base visual + instalador inicial

**Motivo:** iniciar la plataforma tomando como referencia visual aprobada el dashboard mostrado por el usuario.

**Objetivo:**
- Crear la primera base navegable del panel IPZStream.
- Reproducir el lenguaje visual: sidebar oscuro, barra superior, tarjetas KPI, gráficos, nodos, conexiones y tablas administrativas.
- Preparar una base responsive para futuras pantallas.
- Crear un instalador inicial para desplegar la base en un único contenedor Linux.

**Archivos implementados:**
- `package.json` — base React/Vite.
- `index.html` — entrada web.
- `src/main.jsx` — shell del dashboard y componentes visuales iniciales.
- `src/styles.css` — design system visual y responsive.
- `install.sh` — instalador inicial para contenedor.
- `INSTALL.md` — instrucciones y verificación.
- `README.md` — descripción del proyecto.

**Resultado:** base visual inicial implementada en el repositorio y preparada para pruebas en un contenedor Linux. Los datos del dashboard son demostrativos en esta etapa.

**Nota:** el instalador actual es de desarrollo/pruebas. El instalador comercial y el sistema de releases firmados se construirán posteriormente.

---

## 2026-09-14 — Corrección 1 — Instalador ejecutado desde `/opt/ipztream`

**Motivo:** durante la primera prueba real en el contenedor Debian 13, `install.sh` intentó copiar `/opt/ipztream` sobre sí mismo y se detuvo con `cp: '/opt/ipztream/.' and '/opt/ipztream/.' are the same file`.

**Causa:** el instalador asumía que el código fuente estaría en una ubicación diferente a `APP_DIR` (`/opt/ipztream`). Al ejecutarlo desde el clon del repositorio en esa misma ruta, la operación de copia era innecesaria y fallaba.

**Corrección:** hacer que el instalador detecte cuando `SOURCE_DIR` y `APP_DIR` son la misma ubicación. En ese caso, no debe borrar ni copiar el proyecto; debe trabajar directamente sobre el directorio existente. Cuando la fuente sea externa, conserva el comportamiento de copiar el proyecto a `APP_DIR`.

**Resultado:** la corrección fue publicada y posteriormente el contenedor recuperó el repositorio desde GitHub para continuar la prueba.

---

## 2026-09-14 — Mejora 1 — Botón de actualización del panel

**Motivo:** agregar al panel IPZStream un botón de actualización visible, siguiendo la referencia funcional del proyecto Z-Hub del usuario.

**Objetivo:**
- Incorporar un botón `Actualizar` en la barra superior.
- Mantener el lenguaje visual actual del dashboard.
- Preparar la interfaz para que posteriormente el botón pueda conectarse al sistema real de actualización/release de IPZStream.
- En esta etapa, el botón actualizará la vista/panel; el mecanismo de actualización de la aplicación se implementará posteriormente mediante el updater controlado y releases firmados.

**Archivos a modificar:**
- `src/main.jsx`
- `src/styles.css`

**Regla:** la intención de esta mejora queda registrada antes de modificar el código.

---

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Registrar la intención/cambio en esta bitácora.
2. Implementar el código.
3. Verificar el resultado.
4. Registrar el resultado de la implementación.
5. Publicar la actualización.
6. Informar al usuario qué cambió y cómo probarlo.
