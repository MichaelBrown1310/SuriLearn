# Changelog — SuriLearn Gamified Cybersecurity App

Todos los cambios notables, avances de arquitectura y planes ejecutados en **SuriLearn** quedan registrados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/) bajo una política estricta **Pre-1.0 (`0.x.y`)** hasta que se autorice formalmente el cierre de la versión `1.0.0`. Cada versión cuenta con su plan de desarrollo almacenado en [`docs/plans/`](./docs/plans/README.md).

<!-- CHANGELOG_ENTRIES_START -->

## [v0.16.0] - 2026-11-23

- **Resumen**: 15 cursos secuenciales (75 lecciones), diagnostico de 10 preguntas, mapa limpio y podios poblados en Firestore
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.16.0.md](./docs/plans/PLAN_v0.16.0.md)
- **Archivos impactados**:
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M src/__tests__/curriculum.spec.ts`
  - `M src/__tests__/gamificationEngine.spec.ts`
  - `M src/components/common/DiagnosticModal.vue`
  - `M src/components/learn/CourseWindingPath.vue`
  - `M src/composables/useFirestore.ts`
  - `M src/data/curriculum.ts`
  - `M src/stores/useGamificationStore.ts`
  - `M src/stores/useUserStore.ts`
  - `M src/types/gamification.ts`
  - `M src/utils/gamificationEngine.ts`
  - `M src/views/LeaderboardView.vue`
  - `M src/views/LearnView.vue`
  - `M src/views/RegisterOnboardingView.vue`
  - `?? docs/plans/PLAN_v0.16.0.md`
  - `?? src/data/curriculumExpansion.ts`


## [v0.15.0] - 2026-11-23

- **Resumen**: Ruta continua estilo Duolingo con todos los cursos, separadores y camino curvo SVG
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.15.0.md](./docs/plans/PLAN_v0.15.0.md)
- **Archivos impactados**:
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M src/views/LearnView.vue`
  - `?? docs/plans/PLAN_v0.15.0.md`
  - `?? src/__tests__/pathGeometry.spec.ts`
  - `?? src/components/learn/`
  - `?? src/utils/pathGeometry.ts`


## [v0.14.0] - 2026-11-23

- **Resumen**: Paleta SuriLearn en juegos previos, mejoras jugables y 4 nuevos juegos clasicos (Curso 8)
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.14.0.md](./docs/plans/PLAN_v0.14.0.md)
- **Archivos impactados**:
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M src/__tests__/curriculum.spec.ts`
  - `M src/components/games/CodePatcherGame.vue`
  - `M src/components/games/CyberSnakeGame.vue`
  - `M src/components/games/FirewallDefenseGame.vue`
  - `M src/components/games/ForensicInvestigatorGame.vue`
  - `M src/components/games/IncidentCommandGame.vue`
  - `M src/components/games/NetworkMazeGame.vue`
  - `M src/data/curriculum.ts`
  - `M src/types/exercises.ts`
  - `M src/views/LearnView.vue`
  - `M src/views/LessonView.vue`
  - `?? docs/plans/PLAN_v0.14.0.md`
  - `?? src/components/games/CyberBreakoutGame.vue`
  - `?? src/components/games/CyberInvadersGame.vue`
  - `?? src/components/games/CyberMinesweeperGame.vue`
  - `?? src/components/games/CyberWordSearchGame.vue`


## [v0.13.0] - 2026-11-23

- **Resumen**: Zona Arcade Clasica (Ahorcado, Culebrita, Memorama, Atrapa al Hacker) y animaciones vivas de Suri
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.13.0.md](./docs/plans/PLAN_v0.13.0.md)
- **Archivos impactados**:
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M src/__tests__/curriculum.spec.ts`
  - `M src/components/common/LessonVictoryModal.vue`
  - `M src/components/common/SuriFeedbackModal.vue`
  - `M src/data/curriculum.ts`
  - `M src/types/exercises.ts`
  - `M src/utils/suriAssets.ts`
  - `M src/views/LearnView.vue`
  - `M src/views/LessonView.vue`
  - `M src/views/WelcomeView.vue`
  - `?? docs/plans/PLAN_v0.13.0.md`
  - `?? src/components/common/SuriMascotAnimated.vue`
  - `?? src/components/games/CyberHangmanGame.vue`
  - `?? src/components/games/CyberMemoryGame.vue`
  - `?? src/components/games/CyberSnakeGame.vue`
  - `?? src/components/games/ThreatWhackGame.vue`


## [v0.12.0] - 2026-11-23

- **Resumen**: Personalizacion adaptativa, B2B real con RBAC, WCAG 2.1 AA, PWA, lazy-loading y pruebas Vitest
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.12.0.md](./docs/plans/PLAN_v0.12.0.md)
- **Archivos impactados**:
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M index.html`
  - `M package-lock.json`
  - `M package.json`
  - `M src/App.vue`
  - `M src/components/common/LessonVictoryModal.vue`
  - `M src/components/common/SuriFeedbackModal.vue`
  - `M src/components/common/SuspendedAccountModal.vue`
  - `M src/components/games/InboxThreatScanner.vue`
  - `M src/components/games/PasswordVaultBuilder.vue`
  - `M src/components/games/PermissionGatekeeper.vue`
  - `M src/components/organization/AdminAnalytics.vue`
  - `M src/composables/useFirestore.ts`
  - `M src/data/curriculum.ts`
  - `M src/main.ts`
  - `M src/router/index.ts`
  - `M src/stores/useGamificationStore.ts`
  - `M src/stores/useUserStore.ts`
  - `M src/style.css`
  - `M src/theme/variables.css`
  - `M src/types/gamification.ts`
  - `M src/views/LeaderboardView.vue`
  - `M src/views/LearnView.vue`
  - `M src/views/LessonView.vue`
  - `M src/views/OrganizationDashboardView.vue`
  - `M src/views/ProfileView.vue`
  - `M src/views/ShopView.vue`
  - `M tailwind.config.js`
  - `M vite.config.ts`
  - `?? docs/plans/PLAN_v0.12.0.md`
  - `?? public/manifest.webmanifest`
  - `?? public/sw.js`
  - `?? src/__tests__/`
  - `?? src/components/common/DiagnosticModal.vue`
  - `?? src/utils/authErrors.ts`
  - `?? src/utils/gamificationEngine.ts`
  - `?? vitest.config.ts`


## [v0.11.0] - 2026-11-23

- **Resumen**: Endurecimiento P0 de seguridad, estabilidad en minijuegos, vidas y login dual
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.11.0.md](./docs/plans/PLAN_v0.11.0.md)
- **Archivos impactados**:
  - `M .env.example`
  - `M README.md`
  - `M docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`
  - `M firebase.json`
  - `M firestore.rules`
  - `M src/App.vue`
  - `M src/components/games/InboxThreatScanner.vue`
  - `M src/components/games/SocialEngineeringChat.vue`
  - `M src/components/games/UrlInspector.vue`
  - `M src/composables/useFirestore.ts`
  - `M src/router/index.ts`
  - `M src/services/stripeService.ts`
  - `M src/stores/useGamificationStore.ts`
  - `M src/stores/useUserStore.ts`
  - `M src/views/LessonView.vue`
  - `M src/views/LoginView.vue`
  - `M src/views/OrganizationDashboardView.vue`
  - `M src/views/RegisterOnboardingView.vue`
  - `M src/views/ShopView.vue`
  - `M src/views/WelcomeView.vue`
  - `M vite.config.ts`
  - `?? docs/plans/PLAN_v0.11.0.md`
  - `?? functions/`
  - `?? src/components/common/ToastNotification.vue`


## [v0.10.0] - 2026-10-19

- **Resumen**: Adicion de Cursos 5 y 6 con 2 nuevos videojuegos y contador de rachas dinamico por dia
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.10.0.md](./docs/plans/PLAN_v0.10.0.md)
- **Archivos impactados**:
  - `M src/composables/useFirestore.ts`
  - `M src/data/curriculum.ts`
  - `M src/stores/useGamificationStore.ts`
  - `M src/types/exercises.ts`
  - `M src/types/gamification.ts`
  - `M src/views/LearnView.vue`
  - `M src/views/LessonView.vue`
  - `?? docs/plans/PLAN_v0.10.0.md`
  - `?? src/components/games/CodePatcherGame.vue`
  - `?? src/components/games/ForensicInvestigatorGame.vue`


## [v0.9.2] - 2026-10-19

- **Resumen**: Diseno 100% responsive sin desbordamiento de texto en Consola SOC en tiempo real
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.9.2.md](./docs/plans/PLAN_v0.9.2.md)
- **Archivos impactados**:
  - `M src/components/games/FirewallDefenseGame.vue`
  - `M src/components/games/IncidentCommandGame.vue`
  - `M src/views/LessonView.vue`
  - `?? docs/plans/PLAN_v0.9.2.md`


## [v0.9.1] - 2026-10-19

- **Resumen**: Imagenes oficiales de Suri sin fondo desde carpeta Suri y Ranking Semanal con usuarios reales en Aprender
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.9.1.md](./docs/plans/PLAN_v0.9.1.md)
- **Archivos impactados**:
  - `M public/suri-running.png`
  - `M src/components/games/FirewallDefenseGame.vue`
  - `M src/utils/suriAssets.ts`
  - `M src/views/LearnView.vue`
  - `?? Suri/`
  - `?? docs/plans/PLAN_v0.9.1.md`


## [v0.9.0] - 2026-10-19

- **Resumen**: Expansion a 4 cursos completos con teoria interactiva y 3 nuevos motores de videojuego
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.9.0.md](./docs/plans/PLAN_v0.9.0.md)
- **Archivos impactados**:
  - `M src/composables/useFirestore.ts`
  - `M src/data/curriculum.ts`
  - `M src/types/exercises.ts`
  - `M src/types/gamification.ts`
  - `M src/views/LearnView.vue`
  - `M src/views/LessonView.vue`
  - `?? docs/plans/PLAN_v0.9.0.md`
  - `?? src/components/common/LessonTheoryBriefing.vue`
  - `?? src/components/common/UnitTheoryModal.vue`
  - `?? src/components/games/FirewallDefenseGame.vue`
  - `?? src/components/games/IncidentCommandGame.vue`
  - `?? src/components/games/NetworkMazeGame.vue`


## [v0.8.0] - 2026-10-19

- **Resumen**: Modo Oscuro *Dark Sentinel*, reorganización estructural del repositorio (`docs/`, `docs/plans/`, `prototypes/`), sanitización de secretos para GitHub Push Protection y sistema automatizado de versionamiento Pre-1.0.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.8.0_DARK_SENTINEL_ORGANIZACION_Y_VERSIONAMIENTO.md](./docs/plans/PLAN_v0.8.0_DARK_SENTINEL_ORGANIZACION_Y_VERSIONAMIENTO.md)
- **Añadido**:
  - Composable reactivo `src/composables/useTheme.ts` y tokens CSS `src/theme/variables.css` para alternar entre Modo Claro Canónico y Modo Oscuro *Dark Sentinel*.
  - Carpeta `docs/plans/` con trazabilidad de planes por versión (`README.md`, `PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md`, `PLAN_v0.8.0_...md`, `TEMPLATE_PLAN_VERSION.md`).
  - Documentos maestros de ingeniería en `docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md` y `docs/INFORME_TECNICO_Y_MARCO_TEORICO.md`.
  - Script `scripts/release.mjs` y comandos `npm run release:patch`, `npm run release:minor`, `npm run release:v1`.
  - Script de inicio rápido para Windows `iniciar_app.bat`.
- **Seguridad y Organización**:
  - Creación de `.gitignore` excluyendo `node_modules/`, `dist/` y `.env`.
  - Sanitización de `vite.config.ts` y `src/services/stripeService.ts` leyendo `VITE_STRIPE_SECRET_KEY` exclusivamente desde variables de entorno.

---

## [v0.7.0] - 2026-10-19

- **Resumen**: Panel Corporativo Multi-Tenant PYME (B2B), Analítica Ejecutiva CISO con Chart.js y Pasarela de Pagos Stripe Checkout.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v070](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v070--panel-corporativo-b2b-pyme-y-stripe-checkout)
- **Añadido**:
  - Vista `src/views/OrganizationDashboardView.vue` para creación de organizaciones PYME, códigos de invitación de 6 caracteres y gestión de licencias por asiento (`Micro-PYME`, `Growth PYME`, `Enterprise Centinela`).
  - Componentes `src/components/organization/AdminAnalytics.vue` (gráficas Chart.js de distribución de riesgo y vectores de ataque) y `MemberDetailModal.vue`.
  - Servicio `src/services/stripeService.ts` y middleware Vite en `vite.config.ts` para sesiones de pago B2C y B2B con Stripe Checkout.

---

## [v0.6.0] - 2026-10-19

- **Resumen**: Vistas principales SPA B2C, flujo de onboarding, ruta de aprendizaje, ligas competitivas, tienda y perfil de usuario.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v060](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v060--vistas-principales-b2c-y-enrutamiento-spa)
- **Añadido**:
  - Enrutador SPA `src/router/index.ts`, componente raíz `src/App.vue` y bootstrap `src/main.ts`.
  - Vistas `WelcomeView.vue`, `LoginView.vue`, `RegisterOnboardingView.vue`, `TabsLayout.vue`, `LearnView.vue`, `LessonView.vue`, `LeaderboardView.vue`, `ShopView.vue` y `ProfileView.vue`.

---

## [v0.5.0] - 2026-10-19

- **Resumen**: Motor de 6 Minijuegos Interactivos de Ciberseguridad, HUD gamificado y modales de retroalimentación pedagógica en 3 pasos.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v050](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v050--motor-de-6-minijuegos-interactivos-y-componentes-comunes)
- **Añadido**:
  - Minijuegos en `src/components/games/`: `InboxThreatScanner.vue`, `UrlInspector.vue`, `PasswordVaultBuilder.vue`, `SocialEngineeringChat.vue`, `PermissionGatekeeper.vue` y `RapidTriageRadar.vue`.
  - Componentes comunes en `src/components/common/` (`HeaderHud.vue`, `BottomTabBar.vue`, `SuriFeedbackModal.vue`, `LessonVictoryModal.vue`, `OutOfHeartsModal.vue`, `SuspendedAccountModal.vue`) y `src/components/navigation/SidebarNav.vue`.

---

## [v0.4.0] - 2026-10-19

- **Resumen**: Stores reactivos en Pinia (`useUserStore`, `useGamificationStore`) y currículo completo del Módulo 1 (*Fundamentos y Phishing*).
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v040](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v040--stores-reactivos-pinia-y-curriculo-modulo-1)
- **Añadido**:
  - `src/stores/useUserStore.ts`: Gestión reactiva de identidad Firebase Auth, membresía Pro, organizaciones PYME y reclamación de cofres.
  - `src/stores/useGamificationStore.ts`: Motor cuantitativo de 5 vidas (regeneración cada 4h), modo refuerzo, rachas, XP y Bits.
  - `src/data/curriculum.ts`: Árbol de aprendizaje del Módulo 1 con 7 lecciones prácticas y cofre de recompensa.

---

## [v0.3.0] - 2026-10-19

- **Resumen**: Contratos TypeScript de dominio, integración Firebase BaaS (Spark $0) con caché de doble nivel y reglas Zero Trust.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v030](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v030--contratos-typescript-firebase-baas-y-seguridad-zero-trust)
- **Añadido**:
  - Interfaces y reglas matemáticas en `src/types/gamification.ts` y `src/types/exercises.ts`.
  - Configuración Firebase con caché persistente multi-pestaña IndexedDB en `src/firebase/config.ts`.
  - Capa de datos `src/composables/useFirestore.ts` con caché en memoria TTL, transacciones ACID y datos semilla offline.
  - Configuración `firebase.json`, `.firebaserc`, `firestore.rules` y `firestore.indexes.json`.

---

## [v0.2.0] - 2026-10-19

- **Resumen**: Sistema de Diseño *Suri Sentinel* (Táctil 2.5D), activos de la mascota Suri (8 poses) y 7 prototipos Stitch UI.
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v020](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v020--sistema-de-diseno-suri-sentinel-y-prototipos-stitch-ui)
- **Añadido**:
  - Especificación `docs/DESIGN_SURI_SENTINEL.md`.
  - Prototipos HTML/PNG de alta fidelidad en `prototypes/surilearn_*`.
  - Ilustraciones de Suri en `public/suri-*.png`, `src/assets/images/suri/suri-idle.png` y helper `src/utils/suriAssets.ts`.

---

## [v0.1.0] - 2026-10-19

- **Resumen**: Configuración e inicialización base del proyecto (Vue 3, Vite, TypeScript, Tailwind CSS e Ionic).
- **Plan de Desarrollo**: [docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v010](./docs/plans/PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v010--configuracion-base-del-proyecto-bootstrap)
- **Añadido**:
  - Configuración base en `package.json`, `tsconfig.json`, `tsconfig.node.json`, `postcss.config.js`, `tailwind.config.js`, `index.html`, `.env.example`, `.gitattributes` y `.gitignore`.
