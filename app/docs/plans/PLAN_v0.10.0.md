# Plan de Implementación — Versión `0.10.0`

**Fecha:** 2026-10-19  
**Versión Objetivo:** `0.10.0` (`MINOR` pre-1.0)  
**Estado:** Completado y Desplegado

---

## 1. Objetivo del Cambio

1. **Ampliar la Ruta de Aprendizaje a 6 Cursos Completos**: Agregar 2 nuevos cursos de especialización (**Curso 5: Ingeniería de Código Seguro & Parcheo DevSecOps** y **Curso 6: Caza de Amenazas & Análisis Forense en Vivo**) con manuales teóricos extensos, briefings previos y **2 nuevos motores de videojuego interactivos distintos** (`CodePatcherGame.vue` y `ForensicInvestigatorGame.vue`).
2. **Contador de Rachas Dinámico Consciente del Día Actual (`Racha de Guardia`)**: Corregir el cálculo y visualización de la racha para que tome en cuenta el día real de la semana (`new Date()`), resalte el día de hoy (`Hoy`), ilumine los días activos de la semana según las fechas reales de estudio (`activeDates` y `lastActiveDate` en zona horaria local `YYYY-MM-DD`), y actualice automáticamente la racha al completar una misión hoy.

---

## 2. Nuevos Cursos y Motores de Videojuego

### Curso 5: Ingeniería de Código Seguro & Parcheo DevSecOps (`unit_05`)
- **Manual Teórico (`UnitTheoryModal.vue`)**: OWASP Top 10, prevención de Inyección SQL mediante consultas parametrizadas (`Prepared Statements`), mitigación de Cross-Site Scripting (`XSS`) y Control de Acceso Roto (`IDOR`), y gestión de secretos en entornos `.env` / bóvedas KMS.
- **Nodos del Curso 5**:
  1. `code-patcher-1`: **🎮 Videojuego: DevSecOps Live Patcher I** (Oleadas de SQLi, XSS y Secretos Hardcodeados).
  2. `chest_05`: **Cofre DevSecOps** (`+90 Bits`).
  3. `code-patcher-2`: **🎮 Videojuego: Blindaje de APIs & JWT** (Oleadas de IDOR, Command Injection / RCE y Algoritmo JWT `none`).
- **Motor de Videojuego (`src/components/games/CodePatcherGame.vue`)**:
  - Consola interactiva de auditoría de código en vivo con cronómetro por oleada, barra de integridad del servidor en producción y fragmentos de código vulnerable resaltados en rojo.
  - El jugador selecciona e inyecta el parche seguro en tiempo real antes de que el exploit comprometa el servidor.

### Curso 6: Caza de Amenazas & Análisis Forense en Vivo (`unit_06`)
- **Manual Teórico (`UnitTheoryModal.vue`)**: Metodología de Threat Hunting proactivo, análisis forense de memoria RAM volátil (`Living off the Land` / `LOLBins`, árboles de procesos `PPID -> PID`), inspección de sockets de Comando y Control (`C2`) y atribución de Indicadores de Compromiso (`IoC`).
- **Nodos del Curso 6**:
  1. `forensic-hunt-1`: **🎮 Videojuego: CSI Cyber Forense — Caza de Keylogger en RAM**.
  2. `chest_06`: **Bóveda Forense** (`+120 Bits`).
  3. `forensic-hunt-2`: **🎮 Videojuego: Operación Caza de Persistencia APT & C2**.
- **Motor de Videojuego (`src/components/games/ForensicInvestigatorGame.vue`)**:
  - Laboratorio forense interactivo en 2 fases con telemetría de memoria RAM y conexiones TCP salientes.
  - **Fase 1**: Inspeccionar procesos en ejecución (`PID`, `PPID`, línea de comandos, firma digital y socket remoto) y ejecutar `KILL PID + Cortar Socket C2` sobre los procesos maliciosos sin terminar procesos críticos del kernel.
  - **Fase 2**: Emitir el dictamen forense identificando el vector de persistencia raíz (`IoC`).

---

## 3. Contador de Rachas Dinámico (`Racha de Guardia`)

- **Causa Raíz Corregida (`src/composables/useFirestore.ts` & `src/stores/useGamificationStore.ts`)**:
  - Se añadieron utilidades de fecha en zona horaria local (`getLocalDateString` y `normalizeLocalDateString` en formato `YYYY-MM-DD`).
  - Se eliminó la sobreescritura accidental de `lastActiveDate` durante el inicio de sesión (`ensureUserDocument`) y al reclamar cofres (`claimReward`), que impedía que `streakDays` subiera de `0` a `1` al completar la primera lección del día.
  - Se añadió el arreglo `activeDates: string[]` en el estado de gamificación y perfil en Firestore para registrar cada día calendario en el que el centinela completó misiones, además de reparar automáticamente a `1 Día` la racha de usuarios existentes que ya contaban con lecciones completadas.
- **Widget Semanal Consciente del Día Actual (`src/views/LearnView.vue`)**:
  - Se reemplazó el arreglo estático `weekDays` por un `computed` dinámico que calcula el Lunes a Domingo de la semana en curso a partir de `new Date()`.
  - Muestra la fecha actual en el encabezado (`Hoy: <Día> <Número> <Mes>`), el estado de la guardia de hoy (`✓ Guardia Hoy Lista` o `• Pendiente Hoy`) y resalta visualmente la casilla correspondiente al día actual (`Hoy`) junto con los iconos de fuego en los días activos.
