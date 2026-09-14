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

## Protocolo permanente
Toda mejora o corrección futura debe seguir este orden:
1. Registrar la intención/cambio en esta bitácora.
2. Implementar el código.
3. Verificar el resultado.
4. Registrar el resultado de la implementación.
5. Publicar la actualización.
6. Informar al usuario qué cambió y cómo probarlo.
