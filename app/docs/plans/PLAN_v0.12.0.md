# Plan de Desarrollo `v0.12.0` — Prioridad 1 y 2 Completas (Personalización, B2B Real, WCAG, PWA, Vitest y Remotion)

- **Versión Objetivo**: `v0.12.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance
Cerrar las brechas de **Propuesta de Valor (Prioridad 1)** y de **Calidad / Empaquetado (Prioridad 2)** manteniendo los **6 cursos (`21` lecciones)**, los **11 motores interactivos** y el acceso demostrativo inicial:

1. **Personalización Adaptativa (`P1-1`)**:
   - Diagnóstico adaptativo de 4 preguntas (`DiagnosticModal.vue` + `evaluateDiagnosticAnswers` en `gamificationEngine.ts`) que detecta perfil (`individual` / `employee` / `tech`), nivel y áreas débiles para recomendar el curso ideal en `LearnView.vue`.
   - **Centro de Errores real** (`recordFailedExercise`, `resolveFailedExercises`, `getExercisesByIds` y ruta `/lesson/error-review`) con repaso dirigido sin perder vidas desde `LearnView.vue`, `ProfileView.vue` y `OutOfHeartsModal`.
   - Selector funcional de **Meta Diaria** (`3 / 5 / 10 min`) en `ProfileView.vue`, corrección del rol visual (`Cuenta Individual` vs `Colaborador PYME` / `Admin PYME`) y misión diaria en `LearnView.vue` vinculada a `dailyLessonsCompletedToday`.
2. **Módulo PYME B2B Real + RBAC (`P1-2`)**:
   - Analítica semanal en `AdminAnalytics.vue` calculada con `activeDates` reales de los miembros (`computeRealWeeklyTeamActivity`), comparativa real frente a la semana anterior y botón **Exportar CSV** UTF-8.
   - Aislamiento **RBAC estricto** en `OrganizationDashboardView.vue`: los colaboradores regulares (`sme_member`) no ven el código de invitación, analítica corporativa ni correos de compañeros; visualizan su licencia Pro y métricas propias.
   - Badge rojo `"En Riesgo"` (`<60%` acierto o suspendido), enlace directo a `?scope=company`, creación inicial en `micro_pyme` con `orgId` único, `joinOrganizationWithCode` transaccional (`runTransaction`), y listener `onSnapshot` global en `App.vue` + `useUserStore.ts` para suspensión preventiva inmediata (`RN-08`).
3. **Accesibilidad WCAG 2.1 AA y Modo Oscuro (`P1-3`)**:
   - Habilitación de zoom en `index.html`, tokens `--color-primary/secondary/tertiary` accesibles en claro y oscuro (`variables.css`, `tailwind.config.js`), `.btn-tactile-primary` en alto contraste (`#291800` sobre `#e1a653`) y corrección de lectura Dark Sentinel en `SuriFeedbackModal.vue` y `SuspendedAccountModal.vue`.
   - Eliminación de spoilers pre-veredicto en `InboxThreatScanner.vue` y `PermissionGatekeeper.vue`, y bloqueo de tokens duplicados + visualización de entropía en `PasswordVaultBuilder.vue`.
4. **Economía y Progresión Real (`P1-4`)**:
   - Motor puro `src/utils/gamificationEngine.ts`: regla de aprobación mínima (`≥60%`) con retry en `LessonVictoryModal.vue`, estrellas persistidas (`lessonStars`), consumo real de `hasStreakFreeze`, persistencia de `xpBoostMultiplier`/`xpBoostLessonsRemaining`, ascenso automático de ligas por XP (`Bronce → Plata → Oro → Diamante → Supremo`), cuenta regresiva real y cálculo dinámico de 6 medallas (`computeDynamicBadges`).
5. **Calidad, PWA y Consistencia Documental (`P2`)**:
   - Conversión a **PWA instalable** (`public/manifest.webmanifest` + `public/sw.js` registrado en producción desde `src/main.ts` junto con `app.config.errorHandler`).
   - Desinstalación de paquetes `@ionic/vue`, `@ionic/vue-router` e `ionicons` no utilizados.
   - Lazy-loading de todas las vistas en `src/router/index.ts` y `manualChunks` en `vite.config.ts` (reduciendo el chunk inicial JS de `1,053.9 KB` a `71.67 kB`).
   - Suite de pruebas unitarias **Vitest** (`src/__tests__/gamificationEngine.spec.ts`, `curriculum.spec.ts`, `authAndStripe.spec.ts`) y sincronización del código de escenas en Remotion (`SuriLean`).

---

## 2. Verificación Ejecutada
- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`3` archivos, `15/15` pruebas aprobadas)
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`143` módulos, chunk inicial `71.67 kB`, `dist/manifest.webmanifest` y `dist/sw.js` emitidos)
- Escaneo de secretos en `dist/assets/*.js` → `0` coincidencias de llaves Stripe o llamadas directas a `api.stripe.com`
- `tsc --noEmit` en `SuriLean` (Remotion) → Exit `0`
