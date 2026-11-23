# Plan de Desarrollo `v0.14.0` — Paleta SuriLearn en Juegos Previos, Mejoras Jugables y 4 Nuevos Juegos Clásicos (`Curso 8`)

- **Versión Objetivo**: `v0.14.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance
Homologar todos los videojuegos previos con la **paleta oficial de SuriLearn** (tokens adaptables + **Carbón Tierra / Arena Ocre / Café Ceniza**), mejorar la jugabilidad en tiempo real y añadir **4 nuevos juegos clásicos** en un nuevo **Curso 8: Zona Arcade Pro — Acción & Ingenio**, alcanzando **8 cursos (`29` lecciones) y `19` motores interactivos**:

1. **Remodelación Visual (Paleta SuriLearn) y Mejora Jugable de Juegos Anteriores**:
   - **`FirewallDefenseGame.vue` ("Piano Tiles" de 3 carriles)**: paleta SuriLearn cálida, motor a `60fps` con `requestAnimationFrame` (`dt <= 0.05s`), overlay de inicio y botón real de **Pausa/Reanudar**, bonus **`+50` PTS de Puntería** al pre-alinear a Suri en el carril, línea perimetral roja al acercarse a la zona de peligro (`≥65%`), popup flotante por carril, sacudida ante impacto y `<SuriMascotAnimated>` reactivo.
   - **`NetworkMazeGame.vue` (Laberinto Táctico 2.5D)**: estética *Madriguera Digital 2.5D* (`#231D19` / `#44352C` / `#E1A653`), rastro de celdas visitadas (ámbar o cian cifrado con VPN), celdas adyacentes alcanzables resaltadas, neutralización visual de `sniffer_trap` al activar VPN, contador de pasos, volteo direccional + `<SuriMascotAnimated>` y soporte de gestos *swipe* táctiles.
   - **Homologación en Cursos 4, 5, 6 y 7 (`IncidentCommandGame.vue`, `CodePatcherGame.vue`, `ForensicInvestigatorGame.vue`, `CyberSnakeGame.vue`)**: eliminación total de clases `slate-*`/`indigo-*` y hexadecimales fríos ajenos a la marca, reemplazo de `<img>` por `<SuriMascotAnimated>`, overlays de inicio + controles Pausa/Reanudar en SOC/DevSecOps/Forense, y soporte de *swipe* táctil sobre la arena `#161311` de la Culebrita Firewall.

2. **Suite de 4 Nuevos Juegos Clásicos Arcade (`Curso 8` — Zona Arcade Pro)**:
   - `CyberWordSearchGame.vue` (`cyber_wordsearch`): **Sopa de Letras Centinela** (`8×8`, selección horizontal/vertical por toque o arrastre, hasta `2` pistas de Suri y explicación educativa al hallar cada término).
   - `CyberMinesweeperGame.vue` (`cyber_minesweeper`): **Buscaminas de Malware** (`6×6`, `5` amenazas ocultas, primer clic seguro garantizado, flood-fill automático, alternador **🔍 Auditar / 🚩 Marcar** + clic derecho y `2` escudos de cuarentena).
   - `CyberBreakoutGame.vue` (`cyber_breakout`): **Rompe-Malware Arcade** (canvas `420×300` a `60fps` con `requestAnimationFrame`, paleta de Arena Ocre controlada por mouse/dedo/teclado/botones táctiles, bola de pulso cian `#00E5FF`, bloques multi-HP `RANSOM`/`SPYWARE`/`PHISH` y `3` escudos).
   - `CyberInvadersGame.vue` (`cyber_invaders`): **Invasores del Spam** (canvas `420×320` a `60fps` con formación `3×4` de `RANSOM`/`BOTNET`/`PHISH`, 2 barreras Firewall cálidas destructibles, disparo de pulsos cian y `3` escudos).

3. **Integración Curricular y Pruebas Automatizadas**:
   - Expansión de `src/types/exercises.ts`, `src/data/curriculum.ts` (**`8` cursos**, **`29` lecciones**, `UNIT_8_NODES`, `UNIT_THEORY_GUIDES.unit_08`, `chest_08`), `src/views/LessonView.vue`, `src/views/LearnView.vue` (rejilla balanceada `4×2` en desktop con insignias `¡Clásicos!` y `¡Nuevos!`) y `src/__tests__/curriculum.spec.ts` (validación geométrica de sopa de letras, buscaminas, breakout e invasores).

---

## 2. Verificación Ejecutada
- Auditoría de paleta en los 10 componentes de juegos (`Select-String`) → **`0`** tokens fuera de paleta (`PALETTE_HITS=0`)
- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`3` suites, **`16/16` pruebas aprobadas**)
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`167` módulos transformados, chunk de entrada `71.96 kB`)
- Escaneo de secretos en `dist/assets/*.js` → `0` coincidencias (`SECRET_HITS=0`)
