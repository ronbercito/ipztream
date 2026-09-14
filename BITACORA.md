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

**Corrección prevista:** hacer que el instalador detecte cuando `SOURCE_DIR` y `APP_DIR` son la misma ubicación. En ese caso, no debe borrar ni copiar el proyecto; debe trabajar directamente sobre el directorio existente. Cuando la fuente sea externa, debe conservar el comportamiento de copiar el proyecto a `APP_DIR`.

**Objetivo de seguridad:** evitar que una instalación válida destruya accidentalmente su propia fuente de instalación y permitir tanto pruebas desde un clon como futuras instalaciones desde un paquete/directorio externo.

**Regla:** esta corrección queda registrada antes de modificar `install.sh`.

---

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Registrar la intención/cambio en esta bitácora.
2. Implementar el código.
3. Verificar el resultado.
4. Registrar el resultado de la implementación.
5. Publicar la actualización.
6. Informar al usuario qué cambió y cómo probarlo.
