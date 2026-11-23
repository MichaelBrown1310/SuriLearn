# Plan de Desarrollo `v0.15.0` — Ruta Continua Estilo Duolingo con Todos los Cursos y Camino Curvo SVG

- **Versión Objetivo**: `v0.15.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance
Transformar la vista principal de aprendizaje (`LearnView.vue`) para mostrar **los 8 cursos (`29` lecciones + `8` cofres) de manera continua en una sola página**, separados por encabezados de curso y conectados por un **camino curvo orgánico tipo Duolingo** cuya línea SVG pasa exactamente por detrás de los círculos de cada lección:

1. **Motor Puro de Geometría Curva (`src/utils/pathGeometry.ts` + `src/__tests__/pathGeometry.spec.ts`)**:
   - `getDuolingoNodeOffsetPercent(unitNumber, nodeIndex, totalNodes)`: distribución lateral determinista acotada a `[26, 74]` con curvas alternantes y simetría espejo entre unidades impares y pares, cerrando cada curso en el cofre centrado (`50%`).
   - `buildCurvySvgPath(points)`: generación de trazos cúbicos Bézier `C ...` tipo S suave pasando exactamente por los centros medidos `(x, y)` de cada círculo, añadiendo arqueo horizontal alternado cuando dos nodos consecutivos comparten eje vertical.
   - Suite unitaria dedicada (`pathGeometry.spec.ts`) con `3` casos de prueba.

2. **Componente Encapsulado `src/components/learn/CourseWindingPath.vue`**:
   - Separador horizontal de curso (`Curso X · Módulo`) y tarjeta de encabezado con progreso, insignia `⭐ Recomendado` / `¡Clásicos!` / `¡Nuevos!` y botón **Manual Teórico** propio del curso.
   - SVG dinámico (`z-0`, detrás de los círculos) recalculado con `ResizeObserver` + `getBoundingClientRect()` exacto sobre cada botón circular/cofre: base continua, guía punteada interior, tramo completado/activo y flujo animado (`.suri-path-flow`).
   - Círculos y cofres opacos (`z-10`) para que la línea curva nunca transparente ni cruce por encima, junto a un compañero `<SuriMascotAnimated>` al costado libre de la curva y el globo `"¡Te toca a ti!"` sobre la lección activa principal.

3. **Flujo Continuo en `src/views/LearnView.vue`**:
   - Reemplazo del renderizado por pestaña única por un recorrido vertical continuo con los 8 cursos (`#course-section-unit_01` ... `unit_08`).
   - Barra superior de **salto rápido (`scrollToUnit`)** sincronizada con **`IntersectionObserver`** al hacer scroll manual o desde el diagnóstico adaptativo, manteniendo fijo en desktop el panel derecho (`Racha de Guardia`, `Ranking Semanal`, `Centro de Errores` y `Consejo Diario de Suri`).

---

## 2. Verificación Ejecutada
- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`4` archivos, **`19/19` pruebas aprobadas**)
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`171` módulos transformados, chunk inicial `71.99 kB`)
- Escaneo de secretos en `dist/assets/*.js` → `0` coincidencias (`SECRET_HITS=0`)
