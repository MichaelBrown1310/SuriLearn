# Plan de Desarrollo `v0.13.0` — Zona Arcade Clásica (Curso 7) y Animaciones Vivas de Suri

- **Versión Objetivo**: `v0.13.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance
Responder a la retroalimentación docente incorporando **juegos clásicos genuinamente entretenidos** aplicados a ciberseguridad junto con **animaciones reactivas de la mascota Suri** en toda la interfaz, manteniendo intacta la línea base `v0.12.0` (`6 cursos` + `21 lecciones` + seguridad Zero Trust P0 + B2B P1 + PWA P2):

1. **Mascota Suri Animada (`SuriMascotAnimated.vue`) y 11 Poses Activas**:
   - Extensión de `SuriPose` en `src/types/exercises.ts` agregando `'wink'`, `'surprised'` y `'ok'`.
   - Mapeo de las poses previamente sin usar en `Suri/` (`Suri_pose_guiñandoOjo.png`, `Suri_pose_ParadoAsombrado.png`, `Suri_pose_ParadoSeñaDeOK.png`) dentro de `src/utils/suriAssets.ts`.
   - Componente reutilizable `src/components/common/SuriMascotAnimated.vue` con animación CSS continua según estado (respiración idle, rebote alegre con destellos, sacudida de alerta, trote continuo, sueño con `Zzz`), parpadeo/guiño periódico automático, reacción al toque y sombra sincronizada en piso.
   - Integración en `WelcomeView.vue`, `LearnView.vue`, `LessonView.vue`, `SuriFeedbackModal.vue` y `LessonVictoryModal.vue`.

2. **Suite de 4 Nuevos Juegos Clásicos Arcade (`src/components/games/`)**:
   - `CyberHangmanGame.vue` (`cyber_hangman`): **Ahorcado Ciberdefensor** multi-ronda con teclado físico `A–Z`, teclado en pantalla, pista por ronda, horca SVG progresiva y aprendizaje de vocabulario técnico (`PHISHING`, `FIREWALL`, `MALWARE`, `ENTROPIA`, `TOKEN`, etc.).
   - `CyberSnakeGame.vue` (`cyber_snake`): **Culebrita Firewall** en tablero `12×12` con overlay Inicio/Pausa, cruceta táctil + flechas/`WASD`, `3` escudos de tolerancia (reubica al centro sin pérdida injusta inmediata), paquetes seguros verdes y trampas malware rojas.
   - `CyberMemoryGame.vue` (`cyber_memory`): **Memorama Amenaza ↔ Defensa** de `12` cartas (`6` parejas aleatorizadas) con contador de turnos, rachas/combos y explicación pedagógica en vivo al emparejar.
   - `ThreatWhackGame.vue` (`threat_whack`): **Atrapa al Hacker** en `9` puertos (`3×3`) con temporizador de `35s`, meta de `8` bloqueos y `3` escudos para evitar falsos positivos contra tráfico legítimo (`HTTPS`, `DNS`, `Backup`).

3. **Curso 7 — Zona Arcade Centinela (`unit_07`)**:
   - Expansión de `src/data/curriculum.ts` de `6` cursos (`21` lecciones) a **`7` cursos (`25` lecciones) y `15` motores de juego**, añadiendo `UNIT_7_NODES`, `UNIT_THEORY_GUIDES.unit_07` y los ejercicios de `arcade-hangman-1`, `arcade-snake-1`, `arcade-memory-1` y `arcade-whack-1`.
   - Integración en `LessonView.vue` (con `:key="currentExercise.id"`) y selector rápido `"Zona Arcade 🎮"` (`¡Clásicos!`) en `LearnView.vue`.

---

## 2. Verificación Ejecutada
- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`3` archivos, `16/16` pruebas aprobadas, incluyendo validación estructural de los 4 nuevos juegos y las 11 poses de `SURI_IMAGES`)
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`157` módulos transformados, chunk de entrada `71.96 kB`)
- Escaneo de secretos en `dist/assets/*.js` → `0` coincidencias (`SECRET_HITS=0`)
