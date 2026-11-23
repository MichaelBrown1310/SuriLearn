# Plan de Implementación — Versión `0.11.0` (Endurecimiento P0, Seguridad & Consolidación)

- **Versión Objetivo**: `v0.11.0` (`MINOR` pre-1.0)
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance

Resolver íntegramente los hallazgos críticos de **Prioridad 0 (P0)** identificados en la auditoría del proyecto, preservando los **6 cursos completos (21 lecciones)**, el sistema dual de teoría y los **11 motores interactivos de ciberseguridad** (6 minijuegos base + 5 videojuegos avanzados), y preparar la plataforma para publicación en el repositorio unificado `SuriLearn`.

## 2. Cambios Implementados

### P0-1: Seguridad de Stripe, Cloud Functions y Cierre de Bypass de Pagos (`RNF-04` / `RNF-12`)
- Eliminación completa de `VITE_STRIPE_SECRET_KEY` y de llamadas directas a `api.stripe.com` en el código fuente del cliente ([`src/services/stripeService.ts`](../../src/services/stripeService.ts)).
- Implementación de endpoints exclusivos de servidor en [`vite.config.ts`](../../vite.config.ts) (`POST /api/create-checkout-session`, `POST /api/create-b2b-checkout-session` con precios diferenciados de \$49 / \$119 / \$249 USD y `GET /api/verify-checkout-session`).
- Creación del paquete [`functions/`](../../functions/) con Firebase Cloud Functions v2 (`createCheckoutSession`, `createB2BCheckoutSession`, `verifyCheckoutSession`, `stripeWebhook`) y configuración de rewrites en [`firebase.json`](../../firebase.json).
- Verificación obligatoria en servidor de `session_id` en [`ShopView.vue`](../../src/views/ShopView.vue) y [`OrganizationDashboardView.vue`](../../src/views/OrganizationDashboardView.vue) antes de activar `isPro` o planes corporativos.
- Corrección de `maxSeats` del plan `enterprise` a `100` en [`useUserStore.ts`](../../src/stores/useUserStore.ts) y alineación del precio B2B mostrado en `ShopView.vue`.

### P0-2: Reglas Zero Trust en Firestore y Guards de Navegación (`RNF-03`)
- Eliminación de la regla global abierta en [`firestore.rules`](../../firestore.rules) e implementación de validación estricta por propietario (`isOwner`), rol administrativo de organización (`isOrgAdmin`) y control atómico de incremento de asientos (`usedSeats <= maxSeats`).
- Adición de `router.beforeEach` y resolución inicial de sesión Firebase (`waitForAuthUser`) en [`src/router/index.ts`](../../src/router/index.ts) protegiendo `/tabs/*` y `/lesson/:id`.

### P0-3: Corrección de Soft-Lock y Estado Residual en Minijuegos (`RF-04` / `RF-08`)
- Adición de `:key="currentExercise.id"` en los **11 componentes de juego** y `:key="lessonId"` en `<LessonTheoryBriefing>` dentro de [`LessonView.vue`](../../src/views/LessonView.vue), resolviendo el soft-lock en `chat-urgency-1` y el estado residual entre ejercicios consecutivos del mismo tipo.
- Limpieza de `isReinforcementMode` al salir de la lección, `watch` + limpieza de timers en [`SocialEngineeringChat.vue`](../../src/components/games/SocialEngineeringChat.vue), corrección de duplicación de protocolo en [`UrlInspector.vue`](../../src/components/games/UrlInspector.vue) y badge de extensión dinámico en [`InboxThreatScanner.vue`](../../src/components/games/InboxThreatScanner.vue).

### P0-4: Flujo de 0 Vidas, Timer de 4h y Toast Global (`RF-12` / `RF-13` / `RF-14`)
- Eliminación de la activación prematura de `isReinforcementMode` dentro de `deductHeart()` y persistencia de `lastHeartRefill` al perder la 5ª vida en [`useGamificationStore.ts`](../../src/stores/useGamificationStore.ts), asegurando el disparo inmediato de `OutOfHeartsModal` al llegar a `0` vidas.
- Creación de [`ToastNotification.vue`](../../src/components/common/ToastNotification.vue) y montaje global en [`App.vue`](../../src/App.vue).

### P0-5: Login Dual (Email + Google), Mensajes de Error y Rol Base (`RF-01` / `RF-02`)
- Restauración del formulario de Correo + Contraseña en [`LoginView.vue`](../../src/views/LoginView.vue) junto al proveedor OAuth de Google, con traducción legible de errores Firebase en `useUserStore.ts`.
- Enlace directo a `/login` en [`WelcomeView.vue`](../../src/views/WelcomeView.vue), persistencia de meta diaria al usar Google desde [`RegisterOnboardingView.vue`](../../src/views/RegisterOnboardingView.vue) y asignación del rol inicial `'individual'` para cuentas nuevas en [`useFirestore.ts`](../../src/composables/useFirestore.ts).

## 3. Verificación
- [x] `vue-tsc --noEmit` sin errores de tipos.
- [x] `vite build` completado sin errores y sin secretos de Stripe en `dist/`.
- [x] `firestore.rules` validado mediante `firebase_validate_security_rules` sin errores.
- [x] Documentación (`README.md`, `DOCUMENTO_PROYECTO_TI_SURILEARN.md`, `CHANGELOG.md`) actualizada a `v0.11.0`.
