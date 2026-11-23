# Plan de Desarrollo `v0.16.0` — 15 Cursos Secuenciales (75 Lecciones), Diagnóstico de 10 Preguntas, Mapa Limpio y Podios en Firestore

- **Versión Objetivo**: `v0.16.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance

Consolidar una progresión pedagógica real de principio a fin y poblar la competencia social por ligas:

1. **Eliminación del Selector Superior de Cursos (`src/views/LearnView.vue`)**:
   - Se removió la barra superior de salto rápido (`Barra de Salto Rápido a los 8 Cursos / Módulos`) para dejar únicamente el **mapa vertical continuo tipo Duolingo** con separadores y encabezados por curso, banner de diagnóstico y meta diaria.
   - Se enlazó el CTA inferior `"Comenzar"` (`bottomActionLesson`) a la lección activa secuencial global (`globalActiveLesson` + `globalActiveUnit`), evitando sugerir nodos bloqueados al hacer scroll.

2. **Expansión Curricular a 15 Cursos Secuenciales × 5 Lecciones = 75 Lecciones (`src/data/curriculumExpansion.ts` + `src/data/curriculum.ts` + `src/types/gamification.ts`)**:
   - Escalera ordenada estrictamente de fácil a difícil (`Nivel 1 · Principiante` → `Nivel 2 · Explorador` → `Nivel 3 · Intermedio` → `Nivel 4 · Avanzado` → `Nivel 5 · Maestro`):
     - **Cursos 1–3 (`Principiante`)**: Fundamentos Digitales y Vocabulario Base, Phishing e Ingeniería Social, Contraseñas/MFA/Permisos Móviles.
     - **Cursos 4–6 (`Explorador`)**: Reflejos Arcade contra Malware, Defensa Perimetral y Bastión Firewall, Redes Seguras y Laberinto VPN.
     - **Cursos 7–9 (`Intermedio`)**: Fraude BEC y Deepfakes IA, Respuesta SOC y Ransomware, Seguridad Cloud/SaaS/DLP.
     - **Cursos 10–12 (`Avanzado`)**: OWASP Top 10 (Inyecciones/XSS), Zero Trust y Blindaje de APIs, Forense Digital y Threat Hunting RAM.
     - **Cursos 13–15 (`Maestro`)**: Defensa APT y Cadena de Suministro, Gobierno CISO / ISO 27001, Desafío Maestro Centinela.
   - Cada curso incluye exactamente **`5` lecciones interactivas + `1` cofre final (`90` nodos totales)** y su **Manual Teórico** propio (`EXTRA_THEORY_GUIDES` + `UNIT_THEORY_GUIDES`).

3. **Progresión Estrictamente Secuencial y Ubicación Diagnóstica (`src/data/curriculum.ts` + `src/stores/*` + `src/composables/useFirestore.ts`)**:
   - Se eliminó el desbloqueo libre del primer nodo de cada unidad y de nodos `isVideoGame`. Ningún usuario puede avanzar al siguiente curso o lección sin completar el anterior.
   - `buildAllLearningUnits(..., placementCourseIndex)` acredita como completados (`3` estrellas por defecto para repaso) los cursos anteriores al curso asignado tras completar el diagnóstico.
   - `CourseWindingPath.vue` muestra la insignia de dificultad (`difficultyTier`) y el indicador `🔒 Bloqueado · Completa el Curso X` cuando un módulo aún está cerrado.

4. **Diagnóstico Inicial de 10 Preguntas Progresivas (`src/components/common/DiagnosticModal.vue` + `src/utils/gamificationEngine.ts` + `src/views/RegisterOnboardingView.vue`)**:
   - Cuestionario ampliado a `10` preguntas progresivas (`dq_1` a `dq_10`: de dominios phishing hasta IoCs forenses en RAM).
   - Ubicación calibrada por puntaje (`<30%` → Curso 1, `30–49%` → Curso 4, `50–69%` → Curso 7, `70–89%` → Curso 10, `90–100%` → Curso 13; si falla Q1 y Q2 se limita a Curso ≤ 2).
   - Al terminar el registro (`RegisterOnboardingView.vue`), redirige automáticamente a `/tabs/learn?diagnostic=1` para abrir el diagnóstico inicial.

5. **25 Cuentas Seed en Firestore (`/users`) y Selector de Divisiones (`src/views/LeaderboardView.vue`)**:
   - Se poblaron **`25` cuentas demo (`seed_league_bronce_1..5` a `seed_league_supremo_1..5`)** en Firestore (`surilearn-9b60e`), alcanzando **`29` usuarios totales** repartidos en las 5 ligas (`Bronce=8`, `Plata=5`, `Oro=5`, `Diamante=6`, `Supremo=5`) sin alterar las 4 cuentas reales previas.
   - Se añadieron pestañas en `LeaderboardView.vue` para explorar los podios y clasificaciones de las 5 divisiones (`Bronce`, `Plata`, `Oro`, `Diamante`, `Supremo`), destacando `"Tu liga"` y mostrando la barra inferior `"Tú"` solo en tu división o torneo PYME.

---

## 2. Verificación Ejecutada

- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`4` archivos, **`20/20` pruebas aprobadas**)
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`172` módulos transformados, chunk inicial `64.35 kB` / `19.75 kB` gzip)
- Escaneo de secretos reales en `dist/assets/*.js` → `0` coincidencias (`REAL_DIST_SECRET_HITS=0`)
- Verificación Firestore `surilearn-9b60e` `/users` (`firestore_list_documents`) → `TOTAL=29` (`Bronce=8`, `Plata=5`, `Oro=5`, `Diamante=6`, `Supremo=5`)
