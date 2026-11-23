# Plan de Desarrollo: `v0.9.2` — Diseño 100% Responsive para Consola SOC en Tiempo Real y Contenedores de Videojuego

- **Versión Asociada**: `v0.9.2`
- **Etapa**: Pre-Release (`0.x.y` — antes de `1.0.0`)
- **Estado**: Completado ✅
- **Objetivo**: Corregir el desbordamiento de texto al redimensionar la pantalla en el videojuego **Consola SOC en Tiempo Real** (`IncidentCommandGame.vue`), así como optimizar los contenedores responsivos en `LessonView.vue` y `FirewallDefenseGame.vue`.

---

## 1. Diagnóstico del Problema

1. **Tarjetas de Nodos en `IncidentCommandGame.vue`**:
   - La píldora de estado (`🔑 SESIÓN ROBADA (Revocar IAM)`, `🔥 INFECTADO (Aislar 1°)`) tenía `shrink-0` en la misma fila horizontal (`flex items-start justify-between`) que el ícono, título y rol del servidor sin `min-w-0` ni `flex-wrap`. Al pasar a 2 columnas en resoluciones intermedias (`sm:grid-cols-2` dentro de `max-w-2xl`), el ancho disponible por tarjeta (~260px) provocaba que el texto o la etiqueta se salieran del cuadro.
2. **Barra de Progreso de Ransomware y Consola de Telemetría**:
   - En pantallas móviles estrechas, el texto fijo `"Avance de Cifrado Ransomware:"` competía en la misma línea horizontal con la barra de progreso y el porcentaje.
3. **Botones de Comandos SOC y Contenedor de `LessonView.vue`**:
   - Los 4 botones de comando (`grid-cols-4`) se comprimían demasiado en pantallas de `640px`.

---

## 2. Solución Implementada

- **[`src/components/games/IncidentCommandGame.vue`](file:///C:/Emprendimiento%20en%20TICS%202026B/stitch_surilearn_gamified_app/src/components/games/IncidentCommandGame.vue)**:
  - Reestructuración interna de cada tarjeta de servidor en 3 filas apiladas con `min-w-0`, `overflow-hidden` y `break-words`:
    1. Fila superior dedicada a la insignia de estado (`truncate max-w-full`) e indicador de selección.
    2. Fila central con ícono (`shrink-0`) y bloque de nombre/rol (`min-w-0 flex-1 break-words`).
    3. Fila inferior con el diagnóstico técnico (`font-mono break-words whitespace-normal`).
  - Cambio del grid de topología de `sm:grid-cols-2` a `md:grid-cols-2` para que en pantallas pequeñas/medianas las tarjetas tengan ancho completo y en escritorio se distribuyan en 2 columnas holgadas.
  - Barra de avance de Ransomware apilada verticalmente (etiqueta + porcentaje arriba, barra 100% ancho abajo) e inclusión del avatar de Suri en el encabezado SOC.
  - Botonera de comandos SOC con `grid-cols-2 md:grid-cols-4`, `min-w-0`, `overflow-hidden` y `break-words`.
- **[`src/views/LessonView.vue`](file:///C:/Emprendimiento%20en%20TICS%202026B/stitch_surilearn_gamified_app/src/views/LessonView.vue)**:
  - Ampliación del contenedor principal a `max-w-3xl` con `overflow-x-hidden` y truncado responsivo (`min-w-0 truncate`) en la barra superior de progreso.
- **[`src/components/games/FirewallDefenseGame.vue`](file:///C:/Emprendimiento%20en%20TICS%202026B/stitch_surilearn_gamified_app/src/components/games/FirewallDefenseGame.vue)**:
  - Ajuste responsivo (`flex-col sm:flex-row`, `overflow-hidden`, `break-words`) en las cajas de paquetes de cada carril.
