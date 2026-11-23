# Planes de Desarrollo de Arquitectura y Módulos Base (`v0.1.0` a `v0.7.0`)

Este documento consolida los planes técnicos de ingeniería ejecutados para construir las primeras 7 iteraciones pre-1.0 de **SuriLearn** bajo la metodología **Extreme Programming (XP) + Crystal Clear**.

---

## Plan `v0.1.0` — Configuración Base del Proyecto (Bootstrap)

### Objetivo
Establecer los cimientos técnicos de una SPA/PWA moderna de alto rendimiento utilizando Vue 3, TypeScript estricto, Vite, Tailwind CSS e Ionic Framework.

### Alcance y Entregables
- Inicialización de `package.json` con dependencias principales (`vue`, `vue-router`, `pinia`, `firebase`, `@ionic/vue`, `chart.js`).
- Configuración de compilación TypeScript (`tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`) con alias `@/* -> ./src/*`.
- Configuración de `tailwind.config.js` y `postcss.config.js` con la paleta cromática cálida de Suri y sombras táctiles 2.5D (`2.5d-primary`, `2.5d-secondary`, `2.5d-card`).
- Punto de entrada `index.html` con tipografía **Plus Jakarta Sans** e iconografía **Material Symbols Outlined**.
- Archivo `.env.example` documentando las variables de entorno requeridas para Firebase y Stripe.

---

## Plan `v0.2.0` — Sistema de Diseño Suri Sentinel y Prototipos Stitch UI

### Objetivo
Traducir la metáfora del sistema (*"La Madriguera Digital y el Centinela Suri"*) en un sistema de diseño visual coherente, móvil-primero y gamificado.

### Alcance y Entregables
- Especificación del sistema de diseño [`docs/DESIGN_SURI_SENTINEL.md`](../DESIGN_SURI_SENTINEL.md): paleta cálida de sabana (`#E1A653` Arena Ocre, `#5F4030` Café Ceniza, `#00E5FF` Cyber Cyan), tipografía tabular y modelo de elevación táctil 2.5D con labio inferior de 4px.
- Organización de los 7 prototipos base de interfaz en `prototypes/`:
  - `surilearn_bienvenida`
  - `surilearn_registro_y_onboarding`
  - `surilearn_ruta_de_aprendizaje`
  - `surilearn_motor_de_lecci_n_phishing`
  - `surilearn_ligas_y_clasificaci_n`
  - `surilearn_tienda_y_suripro`
  - `surilearn_perfil_y_logros`
- Integración de activos gráficos de la mascota Suri (`public/suri-*.png`, `src/assets/images/suri/`) y helper de mapeo de las 8 poses pedagógicas en `src/utils/suriAssets.ts`.

---

## Plan `v0.3.0` — Contratos TypeScript, Firebase BaaS y Seguridad Zero Trust

### Objetivo
Diseñar los contratos estáticos del dominio y construir una capa de persistencia Serverless en Google Firebase optimizada para operar con **$0 de costo (Plan Spark)**.

### Alcance y Entregables
- Contratos matemáticos y entidades de gamificación en `src/types/gamification.ts`:
  - Sistema de 5 vidas con regeneración cada 4 horas y modo refuerzo.
  - Multiplicadores de racha (`x1.0`, `x1.2`, `x1.5`, `x2.0`).
  - Perfiles de usuario, organizaciones multi-tenant (`Organization`), ligas, tienda y árbol de aprendizaje.
- Contratos de los 6 tipos de ejercicios interactivos y feedback pedagógico de 3 pasos en `src/types/exercises.ts`.
- Inicialización Singleton de Firebase Auth y Firestore con `persistentLocalCache` y `persistentMultipleTabManager` en `src/firebase/config.ts`.
- Composable maestro `src/composables/useFirestore.ts` con caché en memoria con TTL (1h estático, 5m ligas, 2m usuario), transacciones atómicas ACID (`runTransaction`) y datos semilla offline.
- Reglas de seguridad declarativas Zero Trust en `firestore.rules` e índices compuestos en `firestore.indexes.json`.

---

## Plan `v0.4.0` — Stores Reactivos Pinia y Currículo Módulo 1

### Objetivo
Implementar la capa de gestión de estado global (Single Source of Truth) con Pinia y estructurar el currículo pedagógico completo del Módulo 1 (*Fundamentos y Phishing*).

### Alcance y Entregables
- `src/stores/useUserStore.ts`:
  - Autenticación con Email/Password y Google OAuth (`signInWithPopup`).
  - Observador reactivo `initAuthObserver`, gestión de membresía `SuriPro`, reclamación transaccional de cofres y administración de miembros de organización PYME.
- `src/stores/useGamificationStore.ts`:
  - Motor cuantitativo de vidas, temporizador de regeneración pasiva, descuento de vidas por error, modo refuerzo activo, compra de artículos en tienda y sincronización de árbol de unidades.
- `src/data/curriculum.ts`:
  - Secuencia progresiva de 7 lecciones + cofre intermedio (`inbox-scanner-1`, `url-inspector-1`, `chest_01`, `chat-urgency-1`, `attachment-phish-1`, `password-builder-1`, `permission-swipe-1`, `rapid-triage-1`) con escenarios realistas para PYMES.

---

## Plan `v0.5.0` — Motor de 6 Minijuegos Interactivos y Componentes Comunes

### Objetivo
Desarrollar las 6 mecánicas interactivas de entrenamiento defensivo y los modales de retroalimentación pedagógica y estado del jugador.

### Alcance y Entregables
- **6 Minijuegos en `src/components/games/`**:
  1. `InboxThreatScanner.vue`: Inspección de cabeceras SPF/DKIM, remitente real vs visual, enlaces y adjuntos.
  2. `UrlInspector.vue`: Análisis interactivo de segmentos de URL y detección de dominios trampa.
  3. `PasswordVaultBuilder.vue`: Creación de contraseñas robustas con medidor de entropía en bits y estimación de años de crackeo.
  4. `SocialEngineeringChat.vue`: Simulación de conversación en vivo ante tácticas de urgencia y autoridad con botón de reporte a seguridad.
  5. `PermissionGatekeeper.vue`: Evaluación de permisos móviles solicitados vs propósito real de la app.
  6. `RapidTriageRadar.vue`: Clasificación rápida bajo límite de 7 segundos por tarjeta.
- **Componentes transversales en `src/components/common/` y `navigation/`**:
  - `HeaderHud.vue`, `BottomTabBar.vue`, `SidebarNav.vue`, `SuriFeedbackModal.vue` (feedback en 3 pasos), `LessonVictoryModal.vue`, `OutOfHeartsModal.vue` y `SuspendedAccountModal.vue`.

---

## Plan `v0.6.0` — Vistas Principales B2C y Enrutamiento SPA

### Objetivo
Integrar todos los flujos de usuario individual y colaborador en las vistas principales de la aplicación y configurar el enrutamiento SPA.

### Alcance y Entregables
- Configuración de rutas en `src/router/index.ts`, componente raíz `src/App.vue` y bootstrap `src/main.ts`.
- Vistas de autenticación y onboarding: `WelcomeView.vue`, `LoginView.vue`, `RegisterOnboardingView.vue`.
- Vistas principales dentro de `TabsLayout.vue`:
  - `LearnView.vue`: Mapa sinuoso de nodos de aprendizaje, cofres y misiones diarias.
  - `LessonView.vue`: Motor de ejecución de sesiones de lección, barra de progreso y cálculo de recompensas.
  - `LeaderboardView.vue`: Ligas competitivas con zonas de ascenso, permanencia y descenso.
  - `ShopView.vue`: Tienda de potenciadores con Bits virtuales y planes SuriPro.
  - `ProfileView.vue`: Estadísticas de precisión, racha, medallas desbloqueables y vinculación por código a PYME.

---

## Plan `v0.7.0` — Panel Corporativo B2B PYME y Stripe Checkout

### Objetivo
Habilitar la capa SaaS B2B Multi-Tenant para que administradores de PYMES gestionen a sus colaboradores, midan el riesgo humano con gráficas ejecutivas y contraten planes corporativos vía Stripe.

### Alcance y Entregables
- `src/views/OrganizationDashboardView.vue`: Panel de control corporativo con creación de organización, código de invitación, gestión de asientos (`usedSeats`/`maxSeats`), suspensión/reactivación de cuentas y planes B2B (`Micro-PYME`, `Growth PYME`, `Enterprise Centinela`).
- `src/components/organization/AdminAnalytics.vue`: Dashboard analítico CISO con **Chart.js** (distribución de riesgo del equipo, rendimiento por vector de ataque, tabla de colaboradores en riesgo).
- `src/components/organization/MemberDetailModal.vue`: Ficha individual de telemetría por colaborador.
- `src/services/stripeService.ts` + plugin middleware en `vite.config.ts`: Integración con Stripe REST API (`/v1/checkout/sessions`) para suscripciones B2C (con 7 días de prueba en plan mensual) y planes corporativos B2B.
