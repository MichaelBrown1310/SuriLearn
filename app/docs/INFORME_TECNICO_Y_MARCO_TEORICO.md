# INFORME TÉCNICO Y MARCO TEÓRICO — SuriLearn

## Plataforma Gamificada de Aprendizaje en Ciberseguridad para PYMES

**Versión del Informe:** 1.0  
**Fecha de Auditoría:** 28 de septiembre de 2026  
**Rol del Auditor:** Principal Software Architect, Lead Code Auditor e Investigador Técnico-Académico  
**Repositorio:** `stitch_surilearn_gamified_app`  
**Versión de la Aplicación:** 1.0.0

---

## SECCIÓN 1: FICHA TÉCNICA Y STACK TECNOLÓGICO EXHAUSTIVO

### 1.1 Tabla Comparativa del Stack Completo

| Tecnología / Dependencia | Versión Declarada | Categoría | Rol en SuriLearn | Justificación Técnica de Selección | Paradigma Subyacente |
|---|---|---|---|---|---|
| **Vue.js** | ^3.4.21 | Framework UI | Motor de renderizado declarativo de toda la interfaz SPA. Orquesta componentes reactivos con `<script setup lang="ts">` y Composition API | Rendimiento superior al Virtual DOM optimizado de Vue 3 con tree-shaking nativo. Ecosistema maduro con soporte TypeScript de primera clase vs React (JSX) o Angular (decorators) | Reactividad declarativa basada en Proxy ES6 |
| **TypeScript** | ^5.4.0 | Lenguaje / Tipado Estático | Provee seguridad de tipos en todas las interfaces, stores, composables y contratos de datos (`src/types/`) | Elimina errores en tiempo de compilación. Superior a JavaScript puro para proyectos con contratos complejos de gamificación y múltiples entidades | Tipado estático gradual (Gradual Typing) |
| **Pinia** | ^2.1.7 | State Management | Gestión del estado global reactivo: `useUserStore` (autenticación/perfil) y `useGamificationStore` (vidas, XP, bits, racha) | Sucesor oficial de Vuex con API Composition-native, soporte TypeScript nativo, DevTools integrado y menor boilerplate. Patrón Store como Single Source of Truth (SSOT) | Programación reactiva / Store Pattern (SSOT) |
| **Firebase SDK** | ^10.12.0 | Backend-as-a-Service (BaaS) | Autenticación (Email/Password + Google OAuth), base de datos en tiempo real (Firestore), hosting y reglas de seguridad declarativas | Elimina la necesidad de backend propio, reduciendo costos a $0 (Plan Spark). Escalabilidad automática, SDK optimizado para web y caché offline con IndexedDB persistente | NoSQL orientada a documentos / Serverless / Consistencia eventual |
| **Ionic Framework** (`@ionic/vue`) | ^8.0.0 | Framework UI Híbrido / PWA | Provee componentes nativos iOS/Android (ion-app, ion-content, ion-router-outlet) y gestión de safe areas para dispositivos móviles | Permite despliegue multiplataforma (Web, iOS, Android) desde una sola base de código Vue. Componentes adaptativos con look & feel nativo por plataforma | Component-Based UI / Hybrid Mobile Architecture |
| **Ionic Vue Router** (`@ionic/vue-router`) | ^8.0.0 | Enrutamiento Híbrido | Integración del enrutamiento de Vue Router con transiciones de página nativas de Ionic y tab navigation | Sincroniza el stack de navegación de Ionic con `vue-router`, habilitando tabs, modales y deep linking nativos | Declarative Routing / Navigation Stack Pattern |
| **Vue Router** | ^4.3.0 | Enrutamiento SPA | Definición de rutas (`/welcome`, `/login`, `/register`, `/tabs/*`, `/lesson/:id`), guards y lazy-loading de vistas | Enrutamiento declarativo con soporte para rutas anidadas, parámetros dinámicos, history mode HTML5 y code-splitting automático | Client-Side Routing / History API |
| **Chart.js** | ^4.5.1 | Visualización de Datos | Renderizado de gráficas analíticas PYME: gráfica de dona (distribución de riesgo) y gráfica de barras (rendimiento semanal) en `AdminAnalytics.vue` | Librería ligera (< 60KB gzipped) con renderizado Canvas 2D de alto rendimiento. Extensible, responsive y compatible con modo oscuro dinámico | Renderizado imperativo Canvas 2D / Data Visualization |
| **Ionicons** | ^7.4.0 | Iconografía | Iconos de plataforma para elementos UI de Ionic | Set de iconos optimizados para Ionic con variantes iOS/Material Design | SVG Web Components |
| **Material Symbols Outlined** | CDN (Google Fonts) | Iconografía Principal | Sistema principal de iconos con fill dinámico (`icon-filled`), variable font con parámetros opsz, wght, FILL, GRAD | Iconos variables que permiten weight y fill dinámico por estado de UI, reduciendo solicitudes HTTP vs sprites SVG | Variable Font Technology (WOFF2) |
| **Tailwind CSS** | ^3.4.3 | Framework de Utilidades CSS | Estilización de todos los componentes mediante clases utilitarias con tokens de diseño personalizados (colores Suri, espaciado, tipografía, sombras 2.5D) | Eliminación de CSS muerto con PurgeCSS integrado. Prototipado acelerado con clases semánticas vs CSS-in-JS | Utility-First CSS / Atomic Design |
| **Plus Jakarta Sans** | CDN (Google Fonts) | Tipografía | Fuente principal del sistema de diseño (weights 400-800). Aplicada globalmente vía `font-family` en `tailwind.config.js` y `style.css` | Tipografía moderna, geométrica y altamente legible con excelente rendering en pantallas de alta densidad (Retina/AMOLED) | Web Typography / Variable Fonts |
| **Vite** | ^5.2.0 | Bundler / Dev Server | Servidor de desarrollo con HMR instantáneo, bundling para producción con Rollup, plugin middleware personalizado para Stripe Checkout | Velocidad de inicio 10-100x más rápido que Webpack gracias a ESBuild (Go). Native ES Modules en desarrollo, Rollup optimizado en producción | ESModules nativos / Ahead-of-Time bundling |
| **PostCSS** | ^8.4.38 | Procesador CSS | Pipeline de transformación CSS para Tailwind (autoprefixer, nesting) | Integración estándar con Tailwind CSS para procesamiento de directivas `@tailwind` y `@apply` | CSS Transform Pipeline |
| **Autoprefixer** | ^10.4.19 | Prefijos CSS | Añade prefijos de vendor automáticamente (-webkit-, -moz-) para compatibilidad cross-browser | Evita la gestión manual de prefijos, garantizando compatibilidad con Safari, Chrome y Firefox | PostCSS Plugin / Browserslist |
| **vue-tsc** | ^2.0.0 | Type Checker Vue | Validación de tipos TypeScript dentro de SFCs (`.vue`) en el pipeline de build (`vue-tsc && vite build`) | Verifica tipos en plantillas Vue y scripts setup, detectando errores que TSC estándar no cubre en SFCs | Static Analysis / Template Type-Checking |
| **Stripe API** | REST v1 (directo) | Pasarela de Pagos | Creación de sesiones de Checkout para suscripciones SuriPro (mensual con 7 días trial, anual) y planes B2B corporativos | Pasarela PCI DSS Level 1 con Checkout Sessions pre-construidas. Redirect-based flow elimina la necesidad de manejar datos de tarjeta | Subscription Billing / PCI Compliance |
| **Firebase Hosting** | Configurado | CDN / Hosting | Distribución del build de producción (`/dist`) con rewrites SPA y CDN global de Google | Hosting gratuito en Plan Spark con SSL automático, CDN edge global y zero-config deployment vía Firebase CLI | Edge CDN / Static Site Hosting |
| **Firestore Security Rules** | v2 | Seguridad Declarativa | Control de acceso a colecciones `/users`, `/gamification`, `/learning_units`, `/lessons`, `/leaderboard`, `/organizations` | Seguridad evaluada en el servidor sin necesidad de backend propio. Modelo Zero Trust donde cada lectura/escritura se valida contra reglas declarativas | Declarative Security / Zero Trust Architecture |

### 1.2 Estructura del Proyecto

```
stitch_surilearn_gamified_app/
├── index.html                    # Entry point HTML5 con meta SEO y fonts
├── package.json                  # Dependencias y scripts (dev, build, preview)
├── vite.config.ts                # Bundler + Stripe Checkout middleware plugin
├── tsconfig.json                 # TypeScript strict mode, path aliases @/*
├── tailwind.config.js            # Tokens de diseño Suri + Dark Sentinel
├── postcss.config.js             # Pipeline PostCSS (Tailwind + Autoprefixer)
├── firebase.json                 # Firebase Hosting + Firestore rules config
├── firestore.rules               # Reglas de seguridad Zero Trust
├── firestore.indexes.json        # Índice compuesto (currentLeague + xp DESC)
├── .env / .env.example           # Variables de entorno Firebase + Stripe
└── src/
    ├── main.ts                   # Bootstrap: Vue + Pinia + Router + Theme init
    ├── App.vue                   # Root component con Auth/Gamification init
    ├── style.css                 # Tailwind directives + 2.5D tactile system
    ├── vite-env.d.ts             # Declaraciones de tipos Vite
    ├── types/
    │   ├── gamification.ts       # 284 líneas: contratos, reglas, interfaces
    │   └── exercises.ts          # 298 líneas: tipos de minijuegos y ejercicios
    ├── firebase/
    │   └── config.ts             # Singleton Firebase App + Firestore persistente
    ├── stores/
    │   ├── useUserStore.ts       # 493 líneas: autenticación y perfil de usuario
    │   └── useGamificationStore.ts # 302 líneas: motor de gamificación
    ├── composables/
    │   ├── useFirestore.ts       # 1,736 líneas: capa de datos con caché TTL
    │   └── useTheme.ts           # 51 líneas: Dark Sentinel toggle
    ├── services/
    │   └── stripeService.ts      # 242 líneas: Stripe Checkout B2C y B2B
    ├── data/
    │   └── curriculum.ts         # 723 líneas: árbol de aprendizaje y ejercicios
    ├── utils/
    │   └── suriAssets.ts         # 22 líneas: mapeo de poses de Suri
    ├── router/
    │   └── index.ts              # 101 líneas: rutas SPA con tabs layout
    ├── theme/
    │   └── variables.css         # 129 líneas: tokens Light/Dark Sentinel
    ├── views/
    │   ├── WelcomeView.vue       # Pantalla de bienvenida con mascota Suri
    │   ├── LoginView.vue         # Autenticación Email + Google OAuth
    │   ├── RegisterOnboardingView.vue # Registro + selección de meta diaria
    │   ├── TabsLayout.vue        # Shell de tabs con sidebar responsive
    │   ├── LearnView.vue         # Ruta de aprendizaje con árbol de nodos
    │   ├── LessonView.vue        # Runtime de lección con motor de ejercicios
    │   ├── LeaderboardView.vue   # Ligas y clasificaciones en tiempo real
    │   ├── ShopView.vue          # Tienda con economía de Bits y SuriPro
    │   ├── ProfileView.vue       # Perfil, badges y estadísticas
    │   └── OrganizationDashboardView.vue # Panel PYME B2B multi-tenant
    ├── components/
    │   ├── common/
    │   │   ├── HeaderHud.vue     # HUD gamificado (vidas, racha, bits, avatar)
    │   │   ├── BottomTabBar.vue  # Barra de tabs inferior adaptativa
    │   │   ├── SuriFeedbackModal.vue # Feedback pedagógico de 3 pasos
    │   │   ├── LessonVictoryModal.vue # Modal de lección completada
    │   │   ├── OutOfHeartsModal.vue   # Modal sin vidas + refuerzo
    │   │   └── SuspendedAccountModal.vue # Cuenta corporativa pausada
    │   ├── games/
    │   │   ├── InboxThreatScanner.vue  # Minijuego 1: Bandeja de phishing
    │   │   ├── UrlInspector.vue        # Minijuego 2: Disección de URLs
    │   │   ├── PasswordVaultBuilder.vue # Minijuego 3: Bóveda de contraseñas
    │   │   ├── SocialEngineeringChat.vue # Minijuego 4: Chat simulado
    │   │   ├── PermissionGatekeeper.vue  # Minijuego 5: Auditor de permisos
    │   │   └── RapidTriageRadar.vue     # Minijuego 6: Triaje contrarreloj
    │   ├── navigation/
    │   │   └── SidebarNav.vue    # Sidebar desktop con branding y navegación
    │   └── organization/
    │       ├── AdminAnalytics.vue # Dashboard analítico Chart.js para PYME
    │       └── MemberDetailModal.vue # Detalle de colaborador individual
    └── assets/                   # Recursos estáticos (imágenes de Suri)
```

---

## SECCIÓN 2: ARQUITECTURA GENERAL, PATRONES DE DISEÑO Y FLUJO DE DATOS

### 2.1 Diagrama Textual de Arquitectura

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN (Vue 3)                        │
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  LearnView   │  │ LessonView   │  │ ShopView     │  │  ProfileView │   │
│  │ (Ruta Nodos) │  │ (Runtime de  │  │ (Economía    │  │ (Badges,     │   │
│  │              │  │  Minijuegos) │  │  de Bits)    │  │  Stats)      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐   │
│  │ Leaderboard  │  │ OrgDashboard │  │ HeaderHud    │  │ BottomTabBar │   │
│  │ View         │  │ View (PYME)  │  │ (HUD Vidas)  │  │ (Navegación) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘   │
│         │                 │                 │                              │
│  ┌──────┴─────────────────┴─────────────────┴──────────────────────┐       │
│  │             COMPONENTES DE MINIJUEGOS (src/components/games/)   │       │
│  │  InboxThreatScanner │ UrlInspector │ PasswordVaultBuilder       │       │
│  │  SocialEngineeringChat │ PermissionGatekeeper │ RapidTriageRadar│       │
│  └─────────────────────────────────────────────────────────────────┘       │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   CAPA DE ESTADO REACTIVO (Pinia Stores)                   │
│                                                                            │
│  ┌──────────────────────────┐    ┌──────────────────────────────────┐      │
│  │    useUserStore          │    │     useGamificationStore          │      │
│  │ ─────────────────────    │    │ ────────────────────────────      │      │
│  │ • currentUser (Auth)     │◄──►│ • state (hearts, xp, bits, etc.) │      │
│  │ • profile (UserProfile)  │    │ • units (LearningUnit[])         │      │
│  │ • currentOrganization    │    │ • leaderboard (Entries[])        │      │
│  │ • organizationMembers    │    │ • badges (Badge[])               │      │
│  │                          │    │ • isReinforcementMode            │      │
│  │ Actions:                 │    │                                  │      │
│  │ • loginWithEmail/Google  │    │ Actions:                         │      │
│  │ • registerWithEmail      │    │ • loadGamificationData           │      │
│  │ • logout                 │    │ • deductHeart / restoreHeart     │      │
│  │ • activateProMembership  │    │ • completeLesson                 │      │
│  │ • joinOrganizationByCode │    │ • buyShopItem                    │      │
│  │ • createNewOrganization  │    │ • claimChest                     │      │
│  │ • toggleMemberStatus     │    │ • completeReinforcementSession   │      │
│  │ • removeMemberFromOrg    │    │                                  │      │
│  └────────────┬─────────────┘    └────────────────┬─────────────────┘      │
└───────────────┼────────────────────────────────────┼───────────────────────┘
                │                                    │
                ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                CAPA DE ACCESO A DATOS (Composable useFirestore)             │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  useFirestore() — 1,736 líneas                                  │       │
│  │ ──────────────────────────────────────────────────────────────── │       │
│  │ • In-Memory TTL Cache Engine (Map<string, CacheEntry<T>>)       │       │
│  │ • localStorage Fallback para operación offline                  │       │
│  │ • Passive Heart Regeneration Algorithm (4h intervals)           │       │
│  │ • Seed Data para bootstrap sin Firestore                       │       │
│  │                                                                 │       │
│  │ Operaciones CRUD:                                               │       │
│  │ • ensureUserDocument / getUserProfile / saveUserProfile          │       │
│  │ • getGamificationState / saveGamificationState                  │       │
│  │ • getLearningUnits / getLessonExercises                          │       │
│  │ • getLeaderboard / subscribeToLeaderboard (onSnapshot)          │       │
│  │ • recordLessonCompletion / purchaseItem / claimReward            │       │
│  │ • createOrganization / joinOrganizationWithCode                 │       │
│  │ • getOrganizationMembers / removeMemberFromOrganization         │       │
│  │ • updateUserStatus (active / suspended)                         │       │
│  └──────────────────────────────┬──────────────────────────────────┘       │
└─────────────────────────────────┼─────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│              CAPA DE BACKEND-AS-A-SERVICE (Firebase / Stripe)               │
│                                                                            │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  Firebase Auth       │  │  Cloud Firestore  │  │  Stripe API REST    │   │
│  │ ──────────────────── │  │ ──────────────── │  │ ────────────────── │   │
│  │ • Email/Password     │  │  /users/{uid}     │  │ POST /v1/checkout/ │   │
│  │ • Google OAuth 2.0   │  │  /organizations/  │  │   sessions         │   │
│  │ • onAuthStateChanged │  │  /leaderboard/    │  │ • SuriPro Monthly  │   │
│  │                      │  │  /learning_units/ │  │ • SuriPro Annual   │   │
│  │                      │  │                   │  │ • B2B Plans        │   │
│  └─────────────────────┘  └──────────────────┘  └─────────────────────┘   │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  Firestore Security Rules (Zero Trust)                            │     │
│  │  • /users/{uid}: read=auth; write=auth                            │     │
│  │  • /gamification/{uid}: read/write=auth && uid==auth.uid          │     │
│  │  • /learning_units, /lessons, /leaderboard: read=public           │     │
│  │  • /organizations/{orgId}: read/create/update=auth                │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Patrones de Diseño de Software Aplicados

| Patrón | Implementación en SuriLearn | Archivo(s) Clave |
|---|---|---|
| **Single Page Application (SPA)** | Toda la aplicación renderiza en un solo `<div id="app">` con navegación client-side vía `createWebHistory`. El shell de tabs (`TabsLayout.vue`) provee navegación persistente | `index.html`, `router/index.ts`, `TabsLayout.vue` |
| **Store Pattern / SSOT (Single Source of Truth)** | Pinia stores (`useUserStore`, `useGamificationStore`) centralizan todo el estado reactivo. Los componentes consumen y mutan estado exclusivamente a través de actions del store | `stores/useUserStore.ts`, `stores/useGamificationStore.ts` |
| **Composable Pattern (Vue 3 Composition API)** | Lógica reutilizable encapsulada en funciones composables: `useFirestore()` (1,736 líneas), `useTheme()`. Patrón `<script setup lang="ts">` en todos los SFCs | `composables/useFirestore.ts`, `composables/useTheme.ts` |
| **Observer / Reactive Streams** | `onSnapshot()` de Firestore suscribe en tiempo real a cambios en la colección `/users` para actualizar el leaderboard instantáneamente. `onAuthStateChanged()` observa el estado de autenticación | `composables/useFirestore.ts` (L994-L1034), `stores/useUserStore.ts` (L234-L274) |
| **Singleton Pattern** | Instancia única de Firebase App (`getApps().length === 0 ? initializeApp() : getApp()`), previniendo re-inicialización durante HMR | `firebase/config.ts` (L30) |
| **In-Memory Cache with TTL** | `Map<string, CacheEntry<T>>` con TTL configurable (1h contenido estático, 5min leaderboard, 2min estado usuario). Reduce lecturas Firestore en Plan Spark ($0) | `composables/useFirestore.ts` (L52-L80) |
| **Middleware Plugin Pattern** | Plugin personalizado de Vite (`stripeCheckoutPlugin`) que intercepta `POST /api/create-checkout-session` para proxy de pagos en desarrollo | `vite.config.ts` (L5-L87) |
| **Multi-Tenant Architecture** | Colección `/organizations/{orgId}` con `inviteCode` de 6 caracteres. Los usuarios se vinculan vía `organizationId` en su perfil. Aislamiento de datos por organización | `composables/useFirestore.ts` (L1036-L1354) |
| **Transaction Pattern (Atomic Operations)** | `runTransaction()` de Firestore para reclamar recompensas de cofre, previniendo exploit de doble-claim. Verifica `claimedRewards` antes de sumar bits/XP | `composables/useFirestore.ts` (L1562-L1705) |
| **Fallback / Graceful Degradation** | Triple fallback: (1) Firestore remoto → (2) localStorage → (3) Seed data hardcodeada. La app funciona completamente offline con datos demo | `composables/useFirestore.ts` (L84-L368, L534-L660) |
| **Component-Based Architecture (CBSE)** | 6 minijuegos encapsulados como componentes independientes con props tipadas y emits declarativos. Zero acoplamiento entre juegos | `components/games/*.vue` |
| **Dark Mode / Theme Token System** | Variables CSS dual-mode (`:root` light / `body.dark` dark) con tokens semánticos (`--suri-bg-canvas`, `--color-surface`). Toggle reactivo via `useTheme()` | `theme/variables.css`, `composables/useTheme.ts` |

### 2.3 Ciclo de Vida de la Sesión de Usuario

```
1. Usuario llega a /welcome
   │
2. ├─ Login (Email/Google) ──→ signInWithEmailAndPassword / signInWithPopup
   │   │
   │   ├─ ensureUserDocument(user) ──→ Si no existe: crea doc /users/{uid} con baseline 0
   │   ├─ loadGamificationData(uid) ──→ Lee estado de gamificación + regenera hearts pasivos
   │   └─ onAuthStateChanged(callback) ──→ Observer reactivo permanente
   │
3. ├─ Registro + Onboarding ──→ Selección de meta diaria (casual/constante/pro)
   │   │
   │   └─ registerWithEmail() ──→ createUserWithEmailAndPassword + saveUserProfile
   │
4. ├─ Sesión Activa (Tabs)
   │   │
   │   ├─ Estado 'active' ──→ Acceso completo a lecciones, tienda, ligas
   │   │   │
   │   │   ├─ Rol 'sme_member' ──→ Miembro corporativo, tab "Mi Empresa"
   │   │   ├─ Rol 'sme_admin' ──→ Panel PYME con analytics, gestión de miembros
   │   │   └─ Rol 'individual' ──→ Usuario libre sin organización
   │   │
   │   └─ Estado 'suspended' ──→ SuspendedAccountModal bloquea interacción
   │       └─ Solo el admin puede reactivar vía toggleMemberStatus()
   │
5. └─ Logout ──→ signOut() + reset completo de stores + localStorage.clear()
```

---

## SECCIÓN 3: INVENTARIO EXHAUSTIVO DE MÓDULOS, COMPONENTES Y MÉTODOS

### 3.1 Contratos e Interfaces de Datos

#### 3.1.1 `src/types/gamification.ts` (284 líneas)

**Responsabilidad:** Define todas las constantes matemáticas del sistema de gamificación, los contratos TypeScript para el perfil de usuario, estado de gamificación, ligas, tienda, badges, organizaciones y ruta de aprendizaje.

**Constantes y Reglas Exportadas:**

| Constante / Tipo | Descripción | Valor |
|---|---|---|
| `GAMIFICATION_RULES.HEARTS.MAX_CAPACITY` | Tope máximo de vidas | 5 |
| `GAMIFICATION_RULES.HEARTS.COST_PER_MISTAKE` | Vidas deducidas por error | 1 |
| `GAMIFICATION_RULES.HEARTS.REFILL_INTERVAL_HOURS` | Horas para regeneración pasiva | 4 |
| `GAMIFICATION_RULES.HEARTS.REFILL_INTERVAL_MS` | Intervalo en milisegundos | 14,400,000 |
| `GAMIFICATION_RULES.HEARTS.REINFORCEMENT_RESTORE_AMOUNT` | Vidas restauradas por refuerzo 100% | 1 |
| `GAMIFICATION_RULES.ECONOMY.XP_LESSON_BASE` | XP base por lección | 15 |
| `GAMIFICATION_RULES.ECONOMY.XP_PERFECT_BONUS` | XP bono por puntuación perfecta | 5 |
| `GAMIFICATION_RULES.ECONOMY.BITS_LESSON_COMPLETED` | Bits por lección completada | 10 |
| `GAMIFICATION_RULES.ECONOMY.BITS_UNIT_COMPLETED` | Bits por unidad completada | 50 |
| `GAMIFICATION_RULES.ECONOMY.BITS_7_DAY_STREAK` | Bits por racha de 7 días | 100 |
| `STREAK_TIERS[0]` | Días 1-3, multiplicador x1.0 | "Iniciación" |
| `STREAK_TIERS[1]` | Días 4-7, multiplicador x1.2 | "En guardia" |
| `STREAK_TIERS[2]` | Días 8-14, multiplicador x1.5 | "Centinela alerta" |
| `STREAK_TIERS[3]` | Días 15+, multiplicador x2.0 | "Guardián veterano" |

**Función Exportada:**

- `calculateStreakMultiplier(streakDays: number): number` — Itera sobre `STREAK_TIERS` y retorna el multiplicador correspondiente al rango de días activos. Default: 2.0 para racha >= 15.

**Interfaces Principales:** `UserProfile`, `Organization`, `UserGamificationState`, `LeagueLeaderboardEntry`, `LeagueDetails`, `ShopItem`, `InventoryItem`, `Badge`, `LearningNode`, `LearningUnit`, `DailyGoalConfig`.

**Tipos Union:** `DailyGoalType`, `OrganizationPlan`, `OrganizationSubscriptionStatus`, `LeagueDivision`, `ShopItemCode`, `LearningNodeType`, `LearningNodeStatus`, `NodeLanePosition`.

#### 3.1.2 `src/types/exercises.ts` (298 líneas)

**Responsabilidad:** Define los contratos de los 6 tipos de minijuegos educativos, las interfaces de ejercicio base, el sistema de poses de la mascota Suri y el modelo de retroalimentación pedagógica de 3 pasos.

**Tipos y Interfaces:**

| Tipo/Interfaz | Propósito |
|---|---|
| `SuriPose` | 8 poses de mascota: 'idle', 'victory', 'error', 'sleeping', 'shield', 'idea', 'cool', 'running' |
| `PedagogicalFeedback` | Feedback de 3 pasos: `empathy`, `technicalIndicator`, `preventiveTip` |
| `ExerciseType` | Union de 6 tipos: `inbox_simulator`, `url_inspector`, `password_builder`, `chat_simulator`, `permission_swipe`, `rapid_triage` |
| `BaseExercise` | Interfaz padre con `id`, `type`, `title`, `instruction`, `suriPrompt`, `suriPoseInitial`, `feedback` |
| `InboxThreatScannerExercise` | Extends BaseExercise: headers SPF/DKIM, links, attachments, correctVerdict, clues |
| `UrlInspectorExercise` | Extends BaseExercise: segments tipados, maliciousSegmentId, attackTechnique |
| `PasswordVaultBuilderExercise` | Extends BaseExercise: tokens con entropyContributionBits, targetCrackYears, minEntropyRequired |
| `SocialEngineeringChatExercise` | Extends BaseExercise: dialogueNodes (árbol de decisiones), attackerContact, psychologicalTrigger |
| `PermissionGatekeeperExercise` | Extends BaseExercise: appInfo, requestedPermissions con riskSeverity, expectedVerdict |
| `RapidTriageRadarExercise` | Extends BaseExercise: cards con isThreat, timeLimitSeconds (7s), requiredCorrectPass |
| `ExerciseResult` | Resultado individual: isCorrect, heartsDeducted, timeSpentSeconds |
| `LessonSessionSummary` | Resumen de sesión: correctAnswersCount, earnedXp, earnedBits, isPerfectScore, streakAppliedMultiplier |

### 3.2 Stores (Estado Global Reactivo)

#### 3.2.1 `src/stores/useUserStore.ts` (493 líneas)

**Responsabilidad:** Gestión completa de autenticación Firebase, perfil de usuario, membresía Pro, organizaciones multi-tenant y control de acceso basado en roles.

**Estado Reactivo:**

| Variable | Tipo | Propósito |
|---|---|---|
| `currentUser` | `ref<FirebaseUser \| null>` | Objeto de usuario Firebase Auth activo |
| `profile` | `ref<UserProfile>` | Perfil completo con baseline 0 |
| `isLoading` | `ref<boolean>` | Indicador de operaciones async |
| `authError` | `ref<string \| null>` | Último error de autenticación |
| `isAuthInitialized` | `ref<boolean>` | Flag de inicialización del observer |
| `currentOrganization` | `ref<Organization \| null>` | Organización actual del usuario |
| `organizationMembers` | `ref<UserProfile[]>` | Lista de miembros de la organización |

**Computed Properties (Getters):**

| Getter | Tipo Retorno | Lógica |
|---|---|---|
| `isAuthenticated` | `boolean` | `!!currentUser && profile.uid !== ''` |
| `isPro` | `boolean` | `profile.isPro` |
| `currentDailyGoal` | `DailyGoalType` | `profile.dailyGoal` |
| `hasOrganization` | `boolean` | `!!profile.organizationId \|\| !!currentOrganization` |
| `isSmeAdmin` | `boolean` | `profile.role === 'sme_admin'` |
| `isSmeMember` | `boolean` | `profile.role === 'sme_member'` |
| `isSuspended` | `boolean` | `profile.status === 'suspended'` |
| `userOrganizationName` | `string` | Nombre de la organización o fallback |
| `userInitials` | `string` | Primeras 2 letras del nombre en mayúsculas |
| `claimedRewards` | `string[]` | Lista de recompensas reclamadas |

**Inventario de Métodos:**

| Método | Parámetros | Retorno | Descripción Algorítmica |
|---|---|---|---|
| `loadProfile` | `uid: string` | `Promise<void>` | Lee perfil de Firestore vía `firestore.getUserProfile()`. Si tiene `organizationId`, carga la organización asociada |
| `loginWithEmail` | `email: string, pass: string` | `Promise<boolean>` | Llama `signInWithEmailAndPassword`, luego `ensureUserDocument`, carga organización si aplica, sincroniza gamification store |
| `registerWithEmail` | `email, pass, displayName, dailyGoal?, companyName?` | `Promise<boolean>` | Crea usuario Firebase Auth, genera doc baseline en Firestore, guarda perfil con meta diaria seleccionada |
| `loginWithGoogle` | — | `Promise<boolean>` | `signInWithPopup(auth, googleAuthProvider)`, ensure doc, load org, sync gamification |
| `logout` | — | `Promise<void>` | `signOut()`, resetea stores a baseline 0, limpia localStorage y refs de organización |
| `setDailyGoal` | `goal: DailyGoalType` | `Promise<void>` | Actualiza meta diaria localmente y persiste en Firestore |
| `initAuthObserver` | — | `void` | Registra `onAuthStateChanged`. En login: ensure doc + load gamification. En logout: reset state |
| `activateProMembership` | `plan?: 'monthly' \| 'annual'` | `Promise<boolean>` | Calcula fecha de expiración, actualiza perfil y gamification con `isPro=true` y hearts=5 |
| `claimChestReward` | `rewardId: string, bitsReward?, xpReward?` | `Promise<boolean>` | Verifica que no esté reclamado (anti-exploit), ejecuta transacción atómica, sincroniza stores y refresca árbol de aprendizaje |
| `isRewardClaimed` | `rewardId: string` | `boolean` | Verifica en `claimedRewards` incluyendo alias (`chest_01` ↔ `unit_1_completion_chest`) |
| `loadOrganization` | `orgId?: string` | `Promise<void>` | Carga datos de organización y miembros desde Firestore |
| `joinOrganizationByCode` | `inviteCode: string` | `Promise<{success, message}>` | Busca org por código, valida seats disponibles, actualiza usuario como `sme_member` con `isPro=true`, incrementa `usedSeats` |
| `createNewOrganization` | `name, plan?` | `Promise<{success, message, organization?}>` | Crea org en Firestore, genera inviteCode de 6 chars, asigna creador como `sme_admin` |
| `toggleMemberStatus` | `memberUid: string` | `Promise<{success, message}>` | Alterna entre 'active' y 'suspended', actualiza timestamp `suspendedAt` |
| `removeMemberFromOrg` | `orgId, memberUid` | `Promise<{success, message}>` | Desvincula usuario de org, revierte a `role='individual'`, `isPro=false`, decrementa `usedSeats` |

#### 3.2.2 `src/stores/useGamificationStore.ts` (302 líneas)

**Responsabilidad:** Motor cuantitativo de gamificación que gestiona vidas, XP, Bits, racha, multiplicadores, modo refuerzo y compras de tienda.

**Estado Reactivo Principal:**

| Variable | Tipo | Propósito |
|---|---|---|
| `state` | `ref<UserGamificationState>` | Estado completo de gamificación con 17 campos |
| `units` | `ref<LearningUnit[]>` | Árbol dinámico de unidades de aprendizaje |
| `leaderboard` | `ref<LeagueLeaderboardEntry[]>` | Tabla de clasificación actual |
| `badges` | `ref<Badge[]>` | Insignias del usuario |
| `isReinforcementMode` | `ref<boolean>` | Modo repaso activo cuando hearts=0 |
| `toastMessage` / `toastSuccess` | `ref<string\|null>`, `ref<boolean>` | Sistema de notificaciones toast |

**Computed Properties:**

| Getter | Lógica |
|---|---|
| `hasInfiniteHearts` | `userStore.isPro` (Pro/SME → ∞ hearts) |
| `hearts` | Si Pro: siempre 5; sino: `state.hearts` |
| `canStartLesson` | `hasInfiniteHearts \|\| hearts > 0 \|\| isReinforcementMode` |
| `streakMultiplier` | `calculateStreakMultiplier(state.streakDays)` |
| `timeUntilNextHeart` | Calcula ms restantes hasta próxima regeneración pasiva (4h) |
| `formattedHeartTimer` | Formato legible: "3h 42m" o "Lleno" |

**Inventario de Métodos:**

| Método | Parámetros | Retorno | Descripción |
|---|---|---|---|
| `showToast` | `msg: string, success?: boolean` | `void` | Muestra notificación temporal (2800ms auto-dismiss) |
| `loadGamificationData` | `uid?: string` | `Promise<void>` | Carga estado, unidades, leaderboard y badges en paralelo vía `Promise.all`. Sincroniza userStore |
| `deductHeart` | — | `Promise<boolean>` | Deduce 1 vida si no es Pro ni está en refuerzo. Si llega a 0, activa `isReinforcementMode`. Persiste en Firestore |
| `restoreHeart` | `amount?: number` | `Promise<void>` | Restaura hearts clamped a MAX_CAPACITY (5). Si > 0, desactiva modo refuerzo |
| `completeReinforcementSession` | `isPerfect: boolean` | `Promise<boolean>` | Si 100% precisión: restaura +1 heart, desactiva refuerzo, muestra toast. Si no: muestra mensaje de fallo |
| `completeLesson` | `summary: LessonSessionSummary` | `Promise<void>` | Delega a `firestore.recordLessonCompletion`, sincroniza stores, refresca árbol de aprendizaje, muestra toast de recompensas |
| `claimChest` | `nodeId, bitsReward?` | `Promise<void>` | Proxy a `userStore.claimChestReward` |
| `refreshLearningUnits` | — | `Promise<void>` | Regenera el árbol de aprendizaje con estado actual de lecciones completadas y rewards reclamados |
| `buyShopItem` | `itemCode: ShopItemCode` | `Promise<boolean>` | Llama `firestore.purchaseItem`, sincroniza estado (hearts, bits, streakFreeze), desactiva refuerzo si aplica |

### 3.3 Composables

#### 3.3.1 `src/composables/useFirestore.ts` (1,736 líneas)

**Responsabilidad:** Capa de abstracción completa sobre Firestore con caché en memoria TTL, fallback localStorage, regeneración pasiva de vidas, seed data, operaciones CRUD, transacciones atómicas y suscripciones en tiempo real.

**Motor de Caché TTL:**

- `memoryCache: Map<string, CacheEntry<T>>` — Almacena datos con timestamp de inserción
- `getCached<T>(key, ttlMs): T | null` — Retorna dato si es fresco (edad < TTL), elimina si expirado
- `setCached<T>(key, data): void` — Inserta/actualiza entrada en caché
- TTL_STATIC_CONTENT: 1 hora | TTL_LEADERBOARD: 5 minutos | TTL_USER_STATE: 2 minutos

**Algoritmo de Regeneración Pasiva de Vidas (`applyPassiveHeartRegeneration`):**

1. Si usuario es Pro → fuerza hearts=5, retorna
2. Si hearts >= MAX_CAPACITY (5) → no actualiza
3. Calcula `elapsedMs = Date.now() - lastHeartRefill`
4. Calcula `intervalsPassed = floor(elapsedMs / 14,400,000)` (intervalos de 4h)
5. Si intervalsPassed > 0: restaura `min(MAX_CAPACITY - hearts, intervalsPassed)` hearts
6. Actualiza `lastHeartRefill` avanzando por los intervalos consumidos
7. Persiste en background vía `updateDoc()` sin bloquear UI

**(Se documentan las 30+ funciones en la Sección 4 con enfoque en minijuegos y algoritmia)**

#### 3.3.2 `src/composables/useTheme.ts` (51 líneas)

**Responsabilidad:** Gestión del modo visual Light/Dark ("Dark Sentinel") con persistencia en localStorage y detección de preferencia del sistema operativo.

**Funciones:**

| Función | Descripción |
|---|---|
| `initTheme()` | Lee localStorage o `prefers-color-scheme`. Aplica clase `dark` a `<html>` y `<body>` |
| `useTheme()` | Retorna `isDark` (ref reactiva), `toggleDark()` y `setDark(val)` |
| `applyTheme(dark)` | Añade/remueve clase CSS `dark`, persiste en localStorage con clave `surilearn_theme_mode` |

### 3.4 Servicios

#### 3.4.1 `src/services/stripeService.ts` (242 líneas)

**Responsabilidad:** Integración con Stripe Checkout API para suscripciones SuriPro (B2C) y planes corporativos B2B PYME.

**Funciones B2C:**

| Función | Descripción |
|---|---|
| `createCheckoutSession(options)` | Intenta primero vía proxy Vite (`/api/create-checkout-session`); fallback: API REST directa a Stripe. Configura mode=subscription, trial de 7 días (mensual), metadata con userId |
| `redirectToStripeCheckout(options)` | Wrapper que crea sesión y redirige `window.location.href` |

**Funciones B2B:**

| Función | Descripción |
|---|---|
| `createB2BCheckoutSession(options)` | Crea sesión con metadata de organización (orgId, orgName, plan, seats). Tres planes: micro_pyme ($49/mes, 10 seats), growth_pyme ($119/mes, 30 seats), enterprise ($249/mes, 100 seats) |
| `redirectToB2BStripeCheckout(options)` | Wrapper B2B con redirección |

### 3.5 Datos del Currículo

#### 3.5.1 `src/data/curriculum.ts` (723 líneas)

**Responsabilidad:** Define la secuencia de lecciones del Módulo 1, los nodos base del árbol de aprendizaje, todos los ejercicios de cada lección con sus datos pedagógicos, y el algoritmo de desbloqueo progresivo.

**Secuencia de Lecciones (LESSON_SEQUENCE):** 7 lecciones + 1 cofre de recompensa

**Función `buildLearningUnit(completedLessons, claimedRewards): LearningUnit`:**

1. Normaliza IDs legacy (`lesson_01` → `inbox-scanner-1`)
2. Itera sobre `MODULE_1_BASE_NODES` evaluando cada nodo:
   - **Cofre:** Claimed → 'completed'; previo completado → 'active'; sino → 'locked'
   - **Lección:** Completed → 'completed' (3 estrellas); previo completado y primer activo → 'active'; sino → 'locked'
   - Los cofres no bloquean la siguiente lección (la lección anterior al cofre desbloquea ambos)
3. Calcula `progressPercentage = completedLessons / totalLessons * 100`

**Función `getNextLessonId(currentLessonId): string | null`:** Busca en `LESSON_SEQUENCE` el índice de la lección actual y retorna la siguiente, o null si es la última.

**Función `getLessonNode(lessonId): LearningNode | undefined`:** Busca el nodo en `MODULE_1_BASE_NODES` por ID (con normalización legacy).

---

## SECCIÓN 4: MOTOR DE MINIJUEGOS Y ALGORITMOS DE GAMIFICACIÓN

### 4.1 Minijuego 1: Inbox Threat Scanner (`InboxThreatScanner.vue`, 293 líneas)

**Simulación:** Cliente de correo corporativo con bandeja de entrada que presenta emails potencialmente maliciosos.

**Mecánicas Interactivas:**

1. **Inspección de Cabeceras Técnicas:** Botón "Desplegar Cabecera Técnica" revela: remitente real (FROM), estado SPF (pass/fail), firma DKIM (pass/fail). Los valores `fail` se resaltan en rojo con fondo `bg-error/10`.
2. **Revelación Hover de URLs:** Al pasar el cursor sobre el botón de acción del email (`mouseenter`/`mouseleave`) o al tocarlo (`click`), se despliega una barra oscura (`bg-inverse-surface`) mostrando la URL real de destino con badge "Sospechoso" en rojo o "Seguro" en verde.
3. **Detección de Adjuntos Maliciosos:** Si `exercise.attachment` existe, renderiza tarjeta de adjunto con borde punteado rojo, nombre de archivo en font-mono, badge ".EXE DETECTADO".
4. **Triple Veredicto:** Tres botones de acción: "Es Seguro" (safe), "¡Es Phishing!" (phish), "Pedir Verificación a Soporte/TI" (verify). Emite evento `submit(verdict: InboxVerdict)`.

### 4.2 Minijuego 2: URL Inspector 3000 (`UrlInspector.vue`, 131 líneas)

**Simulación:** Barra de direcciones de navegador con URL descompuesta en bloques interactivos.

**Algoritmo de Tokenización de URLs:**

1. La URL raw se pre-descompone en `segments: UrlSegment[]` en los datos del ejercicio
2. Cada segmento tiene: `type` ('protocol' | 'subdomain' | 'root_domain' | 'path'), `text`, `isSuspicious`, `annotation` opcional
3. Los segmentos se renderizan como botones seleccionables con radio-button visual
4. El usuario selecciona el bloque sospechoso vía `selectSegment(id)` → almacena en `selectedSegmentId`
5. Al confirmar (`handleConfirm`), emite `submit(selectedSegmentId)` para validar contra `exercise.maliciousSegmentId`

**Técnicas de Ataque Modeladas:** `typosquatting`, `deceptive_subdomain`, `punycode`, `insecure_http`, `suspicious_tld`

### 4.3 Minijuego 3: Password Vault Builder (`PasswordVaultBuilder.vue`, 202 líneas)

**Simulación:** Cámara de construcción de contraseñas con simulador de fuerza bruta en tiempo real.

**Algoritmo de Cálculo de Entropía:**

```typescript
totalEntropyBits = assembledTokens.reduce((sum, t) => sum + t.entropyContributionBits, 0);
```

Cada token posee un valor de `entropyContributionBits` pre-asignado:
- `predictable_pattern` ('P@ss', 'w0rd', '123'): 2-10 bits
- `passphrase_word` ('Caballo', 'Reloj', 'Plátano'): 20-26 bits
- `special_char` ('#89'): 18 bits

**Simulador de Fuerza Bruta (Estimación de Tiempo de Crackeo):**

```typescript
calculatedCrackYears = computed(() => {
  const bits = totalEntropyBits.value;
  if (bits < 20) return 0.0001;    // Instantáneo
  if (bits < 35) return 0.05;      // Días
  if (bits < 45) return 5;         // 5 años
  if (bits < 55) return 120;       // 120 años
  if (bits < 65) return 450;       // 450 años
  if (bits < 75) return 12000;     // 12,000 años
  return 800000;                    // 800,000 años
});
```

**Métodos:**
- `addToken(token)` — Añade token al arreglo `assembledTokens`
- `removeToken(index)` — Elimina token por índice (splice)
- `clearAll()` — Vacía todos los tokens
- `handleConfirm()` — Emite `submit({ password, years, isStrongEnough })` donde `isStrongEnough = calculatedCrackYears >= targetCrackYears`

**Barra de Progreso Visual:** Ancho proporcional = `min(100, (crackYears / targetCrackYears) * 100)%`. Verde (`bg-shield-green`) si alcanzado; ámbar si insuficiente.

### 4.4 Minijuego 4: Social Engineering Chat Challenge (`SocialEngineeringChat.vue`, 232 líneas)

**Simulación:** Interfaz de mensajería estilo WhatsApp con atacante que ejecuta ingeniería social.

**Árbol de Decisiones Ramificado:**

- `dialogueNodes: Record<string, ChatDialogueNode>` — Mapa de nodos de diálogo
- Cada nodo tiene `incomingMessages` (mensajes del atacante) y `options` (opciones de respuesta)
- Las opciones se clasifican como `isSafeChoice` (verdadero/falso) y opcionalmente `isPanicButton`

**Simulación Secuencial de Escritura ("Escribiendo..."):**

```typescript
onMounted(() => {
  isTyping.value = true;  // Muestra indicador "Escribiendo..." con 3 dots animados
  setTimeout(() => {
    isTyping.value = false;  // Después de 1,100ms, revela los mensajes del atacante
    for (const msg of root.incomingMessages) {
      chatHistory.value.push({ sender: 'attacker', text: msg.text, time: msg.timestamp });
    }
  }, 1100);
});
```

**Control de Estados en `handleChoice(choice)`:**

1. **Botón de Pánico** (`isPanicButton=true`): Éxito inmediato → `emit('submit', true)` después de 400ms
2. **Opción Insegura** (`isSafeChoice=false`): Revela identidad del atacante (`isAttackerRevealed=true`), cambia avatar a calavera con animación bounce, header cambia a rojo, añade mensaje "💀 [ATACANTE]..." → `emit('submit', false)` después de 1200ms
3. **Opción Segura** (`isSafeChoice=true`): Si hay `nextDialogueNodeId`, navega al siguiente nodo con nueva animación de escritura (800ms). Si es terminal, éxito → `emit('submit', true)`

### 4.5 Minijuego 5: Permission Gatekeeper (`PermissionGatekeeper.vue`, 186 líneas)

**Simulación:** Tarjeta de instalación de app móvil con lista de permisos solicitados y mecánica de swipe.

**Mecánica de Swipe (Touch Events):**

```typescript
onTouchStart(e) → startX = e.touches[0].clientX
onTouchMove(e) → dragOffset = currentX - startX
onTouchEnd() → {
  if (dragOffset > 80)  → handleDecision('allow')
  if (dragOffset < -80) → handleDecision('deny')
  dragOffset = 0  // Reset
}
```

**Estilo Reactivo de la Tarjeta:**

```typescript
cardStyle = computed(() => ({
  transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.08}deg)`,
  transition: isDragging ? 'none' : 'transform 0.3s ease',
}));
```

**Overlays Direccionales:** Badge "DENEGAR" (rojo, rotado 12°) aparece al arrastrar < -30px; "AUTORIZAR" (verde, rotado -12°) aparece al arrastrar > 30px.

**Validación:** El veredicto del usuario (`deny` | `allow`) se compara contra `exercise.expectedVerdict` en el componente padre.

### 4.6 Minijuego 6: Rapid Triage Radar (`RapidTriageRadar.vue`, 193 líneas)

**Simulación:** Flashcards de amenazas con temporizador circular de 7 segundos por tarjeta.

**Temporizador Circular de 7 Segundos:**

```typescript
function startTimer() {
  clearInterval(timerInterval);
  remainingSeconds = 7;
  timerInterval = setInterval(() => {
    if (remainingSeconds > 1) {
      remainingSeconds -= 1;
    } else {
      remainingSeconds = 0;
      timeExpired = true;
      handleVerdict(null);  // Timeout = error inmediato (-1 corazón)
    }
  }, 1000);
}
```

**Renderizado SVG del Temporizador:** Arco circular con `stroke-dasharray="100, 100"` y `stroke-dashoffset = 100 - timerPercentage`. Cuando quedan ≤3 segundos: color rojo (`text-error`) con animación pulse.

**Lógica de Veredicto (`handleVerdict`):**

1. Si `userVerdictThreat === null` (timeout) → error inmediato, `emit('submit', false)`
2. Si `userVerdictThreat === card.isThreat` → correcto, incrementa `correctCount`
3. Si hay más tarjetas → avanza a la siguiente y reinicia timer
4. Si era la última → `emit('submit', true)` (éxito total)
5. Si incorrecto → `emit('submit', false)` inmediato (no hay segundo intento)

### 4.7 Subsistemas Cuantitativos de Gamificación

#### 4.7.1 Motor de Vidas (Hearts)

**Recarga Pasiva (4 horas):**

Implementada en `useFirestore.applyPassiveHeartRegeneration()`:

```
intervalsPassed = floor((Date.now() - lastHeartRefill) / 14,400,000)
restoredHearts = min(MAX_CAPACITY - currentHearts, intervalsPassed)
newHearts = currentHearts + restoredHearts
```

**Modo Refuerzo Activo:** Cuando `hearts === 0`, se activa `isReinforcementMode = true`. El usuario puede practicar lecciones completadas sin costo de vidas. Si logra 100% de precisión en la sesión de refuerzo: `restoreHeart(1)`.

**Corazones Infinitos (Pro/SME):** Si `isPro === true`, `hasInfiniteHearts` retorna true. La UI muestra "∞" dorado en el HUD y `hearts` siempre retorna 5.

#### 4.7.2 Motor de XP y Multiplicadores de Racha

**Fórmula de XP por Lección:**

```
earnedXp = XP_LESSON_BASE (15) + (isPerfect ? XP_PERFECT_BONUS (5) : 0)
earnedXp = round(earnedXp * streakMultiplier * boostMultiplier)
```

**Escala de Multiplicadores de Racha:**

| Días de Racha | Multiplicador | Etiqueta |
|---|---|---|
| 1-3 | x1.0 | Iniciación |
| 4-7 | x1.2 | En guardia |
| 8-14 | x1.5 | Centinela alerta |
| 15+ | x2.0 | Guardián veterano |

**Progresión de Nivel:** `level = floor(xp / 400) + 1`

#### 4.7.3 Economía de Bits y Transacciones Atómicas

**Fuentes de Bits:**
- Lección completada: +10 Bits
- Unidad completada (cofre): +50 Bits
- Racha de 7 días: +100 Bits

**Anti-Exploit de Cofres (`claimReward` con `runTransaction`):**

1. Inicia transacción Firestore (`runTransaction`)
2. Lee `claimedRewards` del documento actual del usuario
3. Verifica que `rewardId` no esté en la lista (incluyendo aliases `chest_01` ↔ `unit_1_completion_chest`)
4. Si ya reclamado → retorna `alreadyClaimed: true` sin modificar datos
5. Si no reclamado → actualiza `bits`, `xp`, `claimedRewards` atómicamente con `arrayUnion`
6. Fallback local si la transacción falla (offline): persiste vía `saveUserProfile` + `saveGamificationState`

**Catálogo de la Tienda:**

| Item | Código | Costo (Bits) | Efecto |
|---|---|---|---|
| Congelador de Racha | `streak_freeze` | 200 | Protege la racha por 1 día de inactividad |
| Recarga de Vidas | `heart_refill` | 150 | Restaura 5/5 hearts instantáneamente |
| Potenciador XP 2X | `xp_boost_2x` | 100 | Doble XP en las próximas 3 lecciones |
| SuriPro Centinela | `suripro_monthly` | 0 | Redirección a Stripe Checkout |

---

## SECCIÓN 5: PANEL ANALÍTICO PYME Y GESTIÓN DE COLABORADORES

### 5.1 AdminAnalytics.vue (478 líneas)

**Responsabilidad:** Dashboard corporativo para gestores PYME (role `sme_admin`) con 4 KPIs globales y 2 gráficas interactivas Chart.js.

#### 5.1.1 Métricas de Agregación (Computed Properties)

| KPI | Fórmula | Descripción |
|---|---|---|
| **Colaboradores Activos** | `members.length / maxSeats * 100` | Porcentaje de capacidad utilizada del plan |
| **Índice de Salud Digital** | `sum(m.accuracyRate) / members.length` | Precisión promedio global del equipo (%) |
| **Total Lecciones Superadas** | `sum(m.completedLessons.length)` | Suma de lecciones completadas por todos los miembros |
| **Colaboradores en Riesgo** | Filtro: `accuracyRate < 60 \|\| inactivos > 7 días \|\| status === 'suspended'` | Empleados que requieren intervención |

#### 5.1.2 Algoritmo de Detección de Riesgo (`membersAtRisk`)

```typescript
membersAtRisk = members.filter((m) => {
  const isLowAccuracy = (m.accuracyRate ?? 0) < 60;
  const lastActive = m.lastActiveDate || m.lastLoginAt;
  const isInactive = lastActive && (Date.now() - new Date(lastActive).getTime() > 7 * 24 * 60 * 60 * 1000);
  return isLowAccuracy || isInactive || m.status === 'suspended';
});
```

#### 5.1.3 Gráficas Chart.js

**Gráfica de Dona (Distribución de Riesgo):**
- Segmentos: Zona Segura (≥80%, verde `#22C55E`), Precaución (60-79%, ámbar `#E1A653`), En Riesgo (<60%, rojo `#EF4444`)
- Cutout: 72% (dona delgada)
- Centro: porcentaje de resiliencia global
- Leyenda personalizada con badges coloreados

**Gráfica de Barras (Rendimiento Semanal):**
- Eje X: Lun-Dom
- Eje Y: XP acumulados
- Datos: `baseAvgXp * multipliers[dia]` donde multipliers = [0.8, 1.4, 1.1, 1.5, 1.2, 0.4, 0.3] (Martes y Jueves son picos)
- borderRadius: 8, maxBarThickness: 32

**Adaptación Dark Mode:** Los charts se re-renderizan (destroy + init) al cambiar `isDark`. Los colores de texto, bordes y grillas se ajustan dinámicamente.

### 5.2 Gestión de Colaboradores

**Desvinculación Segura (`removeMemberFromOrganization`):**

1. Actualiza `/users/{memberUid}`: `organizationId=null`, `companyName=''`, `role='individual'`, `isPro=false`, `status='active'`
2. Decrementa `usedSeats` en `/organizations/{orgId}` vía `increment(-1)`
3. Limpia caché localStorage del miembro

**Suspensión/Reactivación (`updateUserStatus`):**

1. Actualiza `/users/{uid}` con `status='suspended'` + `suspendedAt=serverTimestamp()` (o `null` al reactivar)
2. El `SuspendedAccountModal.vue` se activa automáticamente cuando `isSuspended` es true

---

## SECCIÓN 6: MATRIZ DE CONEXIÓN CON EL MARCO TEÓRICO Y ANTECEDENTES

### 6.1 Gamificación y Psicología Educativa

| Teoría / Framework | Autor(es) | Mecánica en SuriLearn | Archivo(s) de Implementación |
|---|---|---|---|
| **Framework Octalysis — Core Drive 1: Significado Épico y Llamado** | Yu-kai Chou (2015) | El usuario es investido como "Centinela" de la ciberseguridad de su organización. La mascota Suri es un suricato vigilante que protege la "madriguera" digital de la PYME | `types/gamification.ts` (levelTitle: "Recluta de Perímetro"), `utils/suriAssets.ts` |
| **Octalysis — Core Drive 2: Desarrollo y Logro** | Yu-kai Chou | Sistema de XP con niveles progresivos (400 XP/nivel), ligas competitivas (Bronce→Sentinel), badges desbloqueables con progreso parcial visible | `types/gamification.ts` (levels), `composables/useFirestore.ts` (recordLessonCompletion) |
| **Octalysis — Core Drive 3: Empoderamiento de Creatividad** | Yu-kai Chou | Password Vault Builder permite construir frases de paso con múltiples combinaciones de tokens, explorando la creatividad en la composición de contraseñas seguras | `components/games/PasswordVaultBuilder.vue` |
| **Octalysis — Core Drive 5: Influencia Social y Relación** | Yu-kai Chou | Leaderboard en tiempo real con ranking, zonas de promoción/descenso, ligas privadas de empresa, y observación de racha/precisión de compañeros | `views/LeaderboardView.vue`, `composables/useFirestore.ts` (subscribeToLeaderboard) |
| **Octalysis — Core Drive 6: Escasez e Impaciencia** | Yu-kai Chou | Sistema de 5 vidas con regeneración pasiva de 4 horas por vida. La espera obliga a planificar sesiones de estudio o a ganar vidas por mérito (modo refuerzo) | `stores/useGamificationStore.ts` (deductHeart, restoreHeart, timeUntilNextHeart) |
| **Octalysis — Core Drive 7: Imprevisibilidad y Curiosidad** | Yu-kai Chou | Cofres de recompensa intercalados en la ruta de aprendizaje que otorgan +50 Bits. Bonus de 100 Bits por racha de 7 días (variable intermitente) | `data/curriculum.ts` (chest_01), `composables/useFirestore.ts` (claimReward) |
| **Octalysis — Core Drive 8: Pérdida y Evitación** | Yu-kai Chou | Pérdida de racha si no se practica un día (mitigable con Streak Freeze comprable por 200 Bits). Pérdida de vidas por errores. Descenso de liga si XP insuficiente | `types/gamification.ts` (STREAK_TIERS), `stores/useGamificationStore.ts` |
| **Teoría de la Autodeterminación (SDT)** | Deci & Ryan (1985, 2000) | **Autonomía:** selección de meta diaria (casual/constante/pro), libertad de elección en minijuegos. **Competencia:** feedback inmediato, XP, niveles, badges. **Relación:** ligas sociales, organizaciones | `types/gamification.ts` (DailyGoalConfig), `views/RegisterOnboardingView.vue` |
| **Retórica Procedimental** | Ian Bogost (2007) | Los minijuegos no "dicen" qué es phishing; obligan al usuario a operar con las reglas reales: inspeccionar cabeceras SPF, analizar dominios, evaluar permisos. El aprendizaje emerge de la práctica simulada | `components/games/*.vue` (toda la suite de 6 minijuegos) |
| **Microlearning** | Hug (2005), Bruck et al. (2012) | Lecciones de 2-4 minutos con 1-3 ejercicios por sesión. Metas diarias de 3, 5 o 10 minutos. Diseño mobile-first para micro-momentos de aprendizaje | `types/gamification.ts` (DAILY_GOAL_CONFIGS), `data/curriculum.ts` (estimatedMinutes) |
| **Curva del Olvido y Repetición Espaciada** | Hermann Ebbinghaus (1885) | Modo Refuerzo (cuando hearts=0) obliga a repasar lecciones previas para consolidar memoria a largo plazo antes de avanzar. Racha diaria refuerza hábito regular | `stores/useGamificationStore.ts` (completeReinforcementSession, isReinforcementMode) |

### 6.2 Ciberseguridad y Factores Humanos

| Teoría / Norma / Modelo | Autor(es) / Organismo | Implementación en SuriLearn | Archivo(s) |
|---|---|---|---|
| **Taxonomía de Ataques de Ingeniería Social** | Mouton et al. (2016), Hadnagy (2010) | 6 tipos de ataque simulados: phishing email, phishing URL (typosquatting, deceptive subdomain), vishing/SMiShing, attachments maliciosos (.pdf.exe), permisos excesivos en apps, chat de autoridad falsa | `types/exercises.ts` (ExerciseType, attackTechnique), `data/curriculum.ts` |
| **Principios de Influencia — Falsa Urgencia y Autoridad** | Robert Cialdini (1984) | El `SocialEngineeringChat` simula un supuesto gerente financiero exigiendo un código OTP con urgencia máxima (`psychologicalTrigger: 'urgency'`). El `InboxThreatScanner` usa "⚠️ URGENTE" y amenaza de retención de nómina | `data/curriculum.ts` (chat-urgency-1, ex_inbox_01), `types/exercises.ts` (psychologicalTrigger) |
| **Entropía de Contraseñas y NIST SP 800-63B** | NIST (2020, Rev. 4) | El PasswordVaultBuilder calcula entropía acumulada en bits por token y simula tiempo de crackeo por fuerza bruta. La meta de > 400 años y > 65 bits alinea con las recomendaciones NIST de passphrases sobre complejidad forzada | `components/games/PasswordVaultBuilder.vue` (totalEntropyBits, calculatedCrackYears) |
| **Modelo de Comportamiento Seguro en Organizaciones (SBIM)** | Sommestad et al. (2014) | El panel AdminAnalytics mide la "intención de comportamiento seguro" indirectamente via `accuracyRate` por colaborador, detectando miembros en riesgo (<60%) para intervención del CISO | `components/organization/AdminAnalytics.vue` (membersAtRisk) |
| **NIST Cybersecurity Framework (CSF)** | NIST (2018) | La función "Identificar" del CSF se materializa en la capacidad del gestor PYME para evaluar la postura de seguridad del equipo. La función "Proteger" en el entrenamiento continuo con lecciones | `views/OrganizationDashboardView.vue`, `components/organization/AdminAnalytics.vue` |
| **ISO/IEC 27001 — Control A.7.2.2: Concientización y Formación** | ISO/IEC (2022) | SuriLearn satisface el control de "asegurar que los empleados reciban formación apropiada en concienciación de seguridad de la información" mediante entrenamiento gamificado continuo con métricas rastreables | Todo el sistema de lecciones y dashboard analítico |
| **Doble Extensión de Archivos como Vector de Ataque** | CERT/CISA, MITRE ATT&CK T1036.007 | La lección `attachment-phish-1` simula archivo `Factura_Demanda_48291.pdf.exe` con detección visual de la extensión real `.exe` | `data/curriculum.ts` (attachment-phish-1) |

### 6.3 Interacción Humano-Computador (HCI) y Agentes Pedagógicos

| Teoría / Principio | Autor(es) | Implementación | Archivo(s) |
|---|---|---|---|
| **Efecto del Agente Pedagógico (Pedagogical Agent Effect)** | Moreno & Mayer (2007) | La mascota Suri (suricato centinela) acompaña todas las lecciones con 8 poses contextuales (`idle`, `victory`, `error`, `shield`, `idea`, `running`, `sleeping`, `cool`). Proporciona tips proactivos y feedback empático | `types/exercises.ts` (SuriPose), `utils/suriAssets.ts`, `components/common/SuriFeedbackModal.vue` |
| **Ecuación de los Medios (Media Equation Theory)** | Reeves & Nass (1996) | Los usuarios tratan a Suri como un "compañero protector" que celebra sus aciertos (pose victory), se preocupa ante errores (pose error), y duerme cuando no hay vidas (pose sleeping). La antropomorfización genera vínculo emocional con la plataforma | `components/common/OutOfHeartsModal.vue` (Suri sleeping con Zzz), `SuriFeedbackModal.vue` |
| **Retroalimentación Pedagógica de 3 Pasos** | Diseño instruccional (Merrill, 2002; Hattie & Timperley, 2007) | Cada error activa un bottom-sheet con 3 secciones: (1) 🤝 Empatía con el engaño, (2) 🔍 Indicador técnico objetivo, (3) 🛡️ Consejo preventivo del mundo real | `types/exercises.ts` (PedagogicalFeedback), `components/common/SuriFeedbackModal.vue` |
| **Accesibilidad Web (WCAG 2.1)** | W3C WAI (2018) | **Contrastes cromáticos** tema Dark Sentinel: fondo `#161311` con texto `#FDFBF7` (ratio > 15:1). Botones con `aria-label`. Safe area padding para notch de dispositivos móviles. `select-none` para prevenir selección accidental | `theme/variables.css`, `style.css`, `components/common/HeaderHud.vue` |
| **Diseño Tridimensional Táctil (2.5D Skeuomorphism)** | Principios de affordance (Norman, 2013) | Botones con sombra inferior sólida (`box-shadow: 0 4px 0 #b87b2e`) que se comprimen al presionar (`translateY(3px)`, `box-shadow: 0 1px 0`), simulando profundidad física y feedback háptico visual | `style.css` (btn-tactile-primary, btn-tactile-secondary, card-tactile) |
| **Principio de Proximidad y Agrupamiento Visual** | Gestalt (Wertheimer, 1923) | El HUD agrupa pills de vidas, racha y bits como chips cohesivos en la barra superior. Los KPIs del panel PYME están en grid de 4 columnas simétricas | `components/common/HeaderHud.vue`, `components/organization/AdminAnalytics.vue` |

### 6.4 Ingeniería de Software y Sistemas Distribuidos

| Paradigma / Arquitectura | Referencia | Implementación en SuriLearn | Archivo(s) |
|---|---|---|---|
| **Component-Based Software Engineering (CBSE)** | Szyperski (2002), IEEE 1517 | 30+ componentes Vue SFC con interfaces tipadas (props/emits), reutilizables e independientes. Los 6 minijuegos son componentes plug-and-play sin acoplamiento mutuo | `src/components/**/*.vue` |
| **Arquitectura Serverless / BaaS** | Roberts (2016), AWS Lambda whitepaper | Cero infraestructura de backend: Firebase Auth maneja identidad, Firestore maneja persistencia, Stripe maneja pagos. El frontend es el único artefacto desplegado | `firebase/config.ts`, `firebase.json`, `services/stripeService.ts` |
| **Consistencia Eventual en NoSQL** | Brewer (2000) — Teorema CAP | Firestore con caché IndexedDB persistente opera en consistencia eventual. Las escrituras quedan en cola offline y se sincronizan cuando hay conectividad. El `try/catch` con fallback local garantiza disponibilidad (AP del triángulo CAP) | `composables/useFirestore.ts` (saveUserProfile, saveGamificationState) |
| **Transacciones ACID en NoSQL** | Google Cloud Firestore docs | `runTransaction()` para `claimReward` garantiza atomicidad: lectura + verificación + escritura en una sola operación atómica. Previene race conditions y double-spending | `composables/useFirestore.ts` (L1562-L1705) |
| **Progressive Web App (PWA) Architecture** | Google Web Fundamentals | Meta viewport con `viewport-fit=cover`, safe area CSS (`env(safe-area-inset-*))`), fuentes preconnect, responsive design mobile-first con breakpoints Tailwind | `index.html`, `style.css` (.pb-safe, .pt-safe) |
| **Multi-Tenant SaaS Architecture** | Chong et al. (2006) | Aislamiento por `organizationId` en documentos de usuario. Queries con `where('organizationId', '==', orgId)`. Seats management (`usedSeats`/`maxSeats`) por organización | `composables/useFirestore.ts` (L1036-L1354) |
| **Cache-First / Stale-While-Revalidate** | Google HTTP caching best practices | Caché TTL en memoria + localStorage como doble capa. La UI siempre responde con datos locales mientras Firestore revalida en background | `composables/useFirestore.ts` (getCached, setCached, TTL_*) |

---

## SECCIÓN 7: ESTRUCTURA PARA EL MAPA MENTAL DEL MARCO TEÓRICO

```
                    ┌──────────────────────────────────────────┐
                    │              SURILEARN                    │
                    │   Plataforma Gamificada de Aprendizaje   │
                    │       en Ciberseguridad para PYMES       │
                    └────────────────┬─────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ 1. CIBERSEGURIDAD│   │ 2. GAMIFICACIÓN  │   │ 3. HCI Y AGENTES │
│ Y FACTORES       │   │ Y PSICOLOGÍA     │   │   PEDAGÓGICOS    │
│ HUMANOS          │   │ DEL APRENDIZAJE  │   │                  │
└───────┬──────────┘   └───────┬──────────┘   └───────┬──────────┘
        │                      │                      │
        │                      │                      │
   ┌────┴────────────┐    ┌────┴────────────┐    ┌────┴────────────┐
   │                 │    │                 │    │                 │
   ▼                 ▼    ▼                 ▼    ▼                 ▼
┌────────────┐ ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐ ┌────────────┐
│Ingeniería  │ │Entropía│ │Octalysis   │ │Autodete│ │Agente Ped. │ │Media Eq.   │
│Social y    │ │NIST    │ │Framework   │ │rminación│ │Effect      │ │Theory      │
│Phishing    │ │800-63B │ │(Yu-kai     │ │(Deci & │ │(Moreno &   │ │(Reeves &   │
│            │ │        │ │Chou)       │ │Ryan)   │ │Mayer)      │ │Nass)       │
└─────┬──────┘ └───┬────┘ └─────┬──────┘ └───┬────┘ └─────┬──────┘ └─────┬──────┘
      │            │            │            │            │            │
      ▼            ▼            ▼            ▼            ▼            ▼
 InboxThreat  PasswordVault  Vidas 4h   DailyGoal    Suri 8 poses  Suri como
 Scanner      Builder        Racha XP   Configs      Feedback 3    compañero
 SocialChat   (entropía      Cofres     (autonomía)  pasos         protector
 UrlInspector  bits)         Ligas                   (empatía,     (sleeping,
 RapidTriage                 Tienda                   técnico,     victory)
                                                      preventivo)
```

### Esquema Jerárquico Multinivel (Optimizado para XMind/Coggle/Miro)

```
SURILEARN — Plataforma Gamificada de Ciberseguridad para PYMES
│
├── 1. CIBERSEGURIDAD Y FACTORES HUMANOS
│   ├── 1.1 Taxonomía de Ingeniería Social
│   │   ├── Mouton et al. (2016) — Clasificación de vectores de ataque
│   │   ├── Hadnagy (2010) — The Art of Human Hacking
│   │   └── → InboxThreatScanner, SocialEngineeringChat, RapidTriageRadar
│   │
│   ├── 1.2 Principios de Influencia y Persuasión
│   │   ├── Cialdini (1984) — Urgencia, Autoridad, Reciprocidad
│   │   ├── psychologicalTrigger: 'urgency' | 'fear' | 'authority' | 'sympathy'
│   │   └── → SocialEngineeringChat.vue (chat-urgency-1), InboxThreatScanner (isUrgentFlag)
│   │
│   ├── 1.3 Entropía de Contraseñas
│   │   ├── Shannon (1948) — Teoría de la Información
│   │   ├── NIST SP 800-63B Rev. 4 (2020) — Digital Identity Guidelines
│   │   ├── Fórmula: entropyBits = Σ(token.entropyContributionBits)
│   │   └── → PasswordVaultBuilder.vue (totalEntropyBits, calculatedCrackYears)
│   │
│   ├── 1.4 Comportamiento Seguro Organizacional
│   │   ├── SBIM — Security Behavior Intentions Model (Sommestad, 2014)
│   │   ├── Métricas: accuracyRate < 60%, inactividad > 7 días
│   │   └── → AdminAnalytics.vue (membersAtRisk, avgAccuracyRate)
│   │
│   └── 1.5 Marcos Normativos de Gestión del Riesgo
│       ├── NIST CSF (Identify, Protect, Detect, Respond, Recover)
│       ├── ISO/IEC 27001:2022 — Control A.7.2.2 Concientización
│       ├── MITRE ATT&CK T1036.007 — Masquerading: Double File Extension
│       └── → OrganizationDashboardView, curriculum.ts (attachment-phish-1)
│
├── 2. GAMIFICACIÓN Y PSICOLOGÍA DEL APRENDIZAJE
│   ├── 2.1 Framework Octalysis (Yu-kai Chou, 2015)
│   │   ├── CD1: Significado Épico → Rol de "Centinela", protector de la madriguera digital
│   │   ├── CD2: Desarrollo y Logro → XP (15+5 base), niveles (400 XP/nivel), badges, ligas
│   │   ├── CD3: Empoderamiento → Construcción libre de passphrases en PasswordVault
│   │   ├── CD5: Influencia Social → Leaderboard en tiempo real (onSnapshot), ligas privadas
│   │   ├── CD6: Escasez → 5 vidas, 1 regenera cada 4h (REFILL_INTERVAL_MS = 14,400,000)
│   │   ├── CD7: Imprevisibilidad → Cofres intercalados, bono 100 Bits cada 7 días racha
│   │   └── CD8: Pérdida y Evitación → Pérdida de racha, pérdida de vidas, descenso de liga
│   │
│   ├── 2.2 Teoría de la Autodeterminación (Deci & Ryan, 1985)
│   │   ├── Autonomía: Selección de meta diaria (casual 3min, constante 5min, pro 10min)
│   │   ├── Competencia: Feedback inmediato, XP, niveles, badges con progreso parcial
│   │   ├── Relación: Ligas sociales, organizaciones PYME, ranking entre compañeros
│   │   └── → DailyGoalConfig, RegisterOnboardingView, LeaderboardView
│   │
│   ├── 2.3 Retórica Procedimental (Bogost, 2007)
│   │   ├── Aprendizaje por operación de reglas, no por instrucción explícita
│   │   ├── El usuario aprende a inspeccionar cabeceras SPF/DKIM operando el scanner
│   │   └── → Todos los 6 minijuegos como sistemas de reglas operables
│   │
│   ├── 2.4 Microlearning (Hug, 2005; Bruck et al., 2012)
│   │   ├── Lecciones de 2-4 minutos, 1-3 ejercicios por sesión
│   │   ├── Diseño mobile-first para micro-momentos
│   │   └── → curriculum.ts (estimatedMinutes: 2-4), DailyGoalConfig (3/5/10 min)
│   │
│   └── 2.5 Repetición Espaciada y Curva del Olvido (Ebbinghaus, 1885)
│       ├── Modo Refuerzo obliga repaso cuando hearts = 0
│       ├── Racha diaria consolida hábito de práctica regular
│       └── → useGamificationStore (completeReinforcementSession, isReinforcementMode)
│
├── 3. INTERACCIÓN HUMANO-COMPUTADOR (HCI) Y AGENTES PEDAGÓGICOS
│   ├── 3.1 Efecto del Agente Pedagógico (Moreno & Mayer, 2007)
│   │   ├── Mascota Suri con 8 poses contextuales (idle, victory, error, shield...)
│   │   ├── Tips proactivos ("suriPrompt") y feedback empático personalizado
│   │   └── → SuriFeedbackModal.vue, suriAssets.ts (SURI_IMAGES)
│   │
│   ├── 3.2 Ecuación de los Medios (Reeves & Nass, 1996)
│   │   ├── Suri como compañero protector que celebra, se preocupa y descansa
│   │   ├── Antropomorfización genera vínculo emocional con la plataforma
│   │   └── → OutOfHeartsModal (Suri sleeping), LessonVictoryModal (Suri victory)
│   │
│   ├── 3.3 Retroalimentación Pedagógica de 3 Pasos
│   │   ├── Merrill (2002) — First Principles of Instruction
│   │   ├── Hattie & Timperley (2007) — Power of Feedback
│   │   ├── Paso 1: Empatía con el engaño (normalización)
│   │   ├── Paso 2: Indicador técnico objetivo (qué falló y por qué)
│   │   ├── Paso 3: Consejo preventivo del mundo real (qué hacer mañana)
│   │   └── → PedagogicalFeedback interface, SuriFeedbackModal.vue
│   │
│   ├── 3.4 Accesibilidad Web (WCAG 2.1, W3C 2018)
│   │   ├── Contrastes: Dark Sentinel #161311/#FDFBF7 (ratio > 15:1)
│   │   ├── aria-label en toggles, safe area padding para notch devices
│   │   └── → variables.css (Dark mode tokens), HeaderHud.vue
│   │
│   └── 3.5 Diseño Táctil 2.5D y Affordances (Norman, 2013)
│       ├── Botones con sombra sólida inferior que se comprimen al presionar
│       ├── Tarjetas con profundidad visual (card-tactile, shadow 2.5D)
│       └── → style.css (btn-tactile-primary, card-tactile, card-tactile-selected)
│
└── 4. ARQUITECTURA DE SOFTWARE WEB/MÓVIL Y BaaS
    ├── 4.1 Component-Based Software Engineering (Szyperski, 2002)
    │   ├── 30+ componentes Vue SFC con interfaces tipadas
    │   ├── 6 minijuegos encapsulados como componentes independientes
    │   └── → src/components/**/*.vue
    │
    ├── 4.2 Arquitectura Serverless / BaaS (Roberts, 2016)
    │   ├── Firebase Auth + Firestore + Hosting = backend serverless completo
    │   ├── Stripe API REST = pasarela de pagos sin servidor propio
    │   └── → firebase/config.ts, services/stripeService.ts
    │
    ├── 4.3 Consistencia Eventual y Teorema CAP (Brewer, 2000)
    │   ├── IndexedDB persistente multi-tab para Firestore
    │   ├── Caché TTL en memoria + localStorage como fallback offline
    │   ├── Disponibilidad priorizada (AP del triángulo CAP)
    │   └── → firebase/config.ts (persistentLocalCache), useFirestore.ts
    │
    ├── 4.4 Seguridad Zero Trust (NIST SP 800-207)
    │   ├── Firestore Security Rules evalúan auth en cada operación
    │   ├── No hay backend de confianza implícita
    │   └── → firestore.rules
    │
    ├── 4.5 Multi-Tenant SaaS (Chong et al., 2006)
    │   ├── Aislamiento por organizationId en documentos de usuario
    │   ├── Seats management (usedSeats/maxSeats)
    │   ├── Invite codes de 6 caracteres alfanuméricos
    │   └── → useFirestore.ts (createOrganization, joinOrganizationWithCode)
    │
    └── 4.6 Progressive Web App (Google Web Fundamentals)
        ├── Mobile-first responsive con Tailwind breakpoints
        ├── Safe area CSS para dispositivos con notch
        ├── Viewport-fit=cover, preconnect fonts, antialiased
        └── → index.html, style.css, tailwind.config.js
```

---

## REFERENCIAS BIBLIOGRÁFICAS

1. **Bogost, I.** (2007). *Persuasive Games: The Expressive Power of Videogames*. MIT Press.
2. **Brewer, E.** (2000). *Towards Robust Distributed Systems (CAP Theorem)*. ACM Symposium on Principles of Distributed Computing.
3. **Bruck, P. A., Motiwalla, L., & Foerster, F.** (2012). Mobile Learning with Micro-content: A Framework and Evaluation. *Bled eConference*, 25, 527-543.
4. **Chong, F., Carraro, G., & Wolter, R.** (2006). *Multi-Tenant Data Architecture*. Microsoft MSDN Architecture.
5. **Chou, Y.** (2015). *Actionable Gamification: Beyond Points, Badges, and Leaderboards*. Octalysis Media.
6. **Cialdini, R. B.** (1984). *Influence: The Psychology of Persuasion*. Harper Business.
7. **Deci, E. L., & Ryan, R. M.** (1985). *Intrinsic Motivation and Self-Determination in Human Behavior*. Plenum Press.
8. **Deci, E. L., & Ryan, R. M.** (2000). The "What" and "Why" of Goal Pursuits. *Psychological Inquiry*, 11(4), 227-268.
9. **Ebbinghaus, H.** (1885). *Über das Gedächtnis* (Memory: A Contribution to Experimental Psychology). Dover Publications (1964 reprint).
10. **Hadnagy, C.** (2010). *Social Engineering: The Art of Human Hacking*. Wiley.
11. **Hattie, J., & Timperley, H.** (2007). The Power of Feedback. *Review of Educational Research*, 77(1), 81-112.
12. **Hug, T.** (2005). Micro Learning and Narration. *4th International Conference on New Media Technology*.
13. **ISO/IEC** (2022). *ISO/IEC 27001:2022 — Information Security Management Systems*.
14. **Merrill, M. D.** (2002). First Principles of Instruction. *Educational Technology Research and Development*, 50(3), 43-59.
15. **Moreno, R., & Mayer, R. E.** (2007). Interactive Multimodal Learning Environments. *Educational Psychology Review*, 19, 309-326.
16. **Mouton, F., Leenen, L., & Venter, H. S.** (2016). Social Engineering Attack Examples, Templates and Scenarios. *Computers & Security*, 59, 186-209.
17. **NIST** (2018). *Framework for Improving Critical Infrastructure Cybersecurity (CSF)* v1.1. National Institute of Standards and Technology.
18. **NIST** (2020). *SP 800-63B Rev. 4: Digital Identity Guidelines — Authentication and Lifecycle Management*. National Institute of Standards and Technology.
19. **Norman, D. A.** (2013). *The Design of Everyday Things* (Revised Edition). Basic Books.
20. **Reeves, B., & Nass, C.** (1996). *The Media Equation: How People Treat Computers, Television, and New Media Like Real People and Places*. Cambridge University Press.
21. **Roberts, M.** (2016). *Serverless Architectures*. Martin Fowler Blog.
22. **Shannon, C. E.** (1948). A Mathematical Theory of Communication. *Bell System Technical Journal*, 27(3), 379-423.
23. **Sommestad, T., Hallberg, J., Lundholm, K., & Bengtsson, J.** (2014). Variables Influencing Information Security Policy Compliance. *Information Management & Computer Security*, 22(1), 42-75.
24. **Szyperski, C.** (2002). *Component Software: Beyond Object-Oriented Programming* (2nd Edition). Addison-Wesley.
25. **W3C WAI** (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium.
26. **Wertheimer, M.** (1923). *Untersuchungen zur Lehre von der Gestalt II*. Psychologische Forschung, 4(1), 301-350.

---

*Fin del Informe Técnico y Marco Teórico — SuriLearn v1.0*
*Generado automáticamente mediante auditoría exhaustiva del repositorio de código fuente.*
