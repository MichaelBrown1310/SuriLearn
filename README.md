# 🛡️ SuriLearn — Plataforma Gamificada de Ciberseguridad (B2C + PYMES B2B)

> **Versión Actual:** `v0.11.0` (Pre-1.0 · Endurecimiento Crítico P0)  
> **Propuesta de Valor:** *Una plataforma de aprendizaje de ciberseguridad gamificada que transforma la capacitación tradicional en una experiencia interactiva, progresiva y personalizada, dirigida tanto a usuarios individuales como a organizaciones que buscan fortalecer las competencias de seguridad de sus empleados.*

---

## 📌 Visión General del Ecosistema

**SuriLearn** sustituye los cursos corporativos pasivos (PDFs extensos, charlas anuales con lenguaje técnico) por cápsulas gamificadas diarias de **3 a 5 minutos** guiadas por **Suri, el Centinela Suricato**, integrando los marcos **Octalysis**, **Modelo Conductual de Fogg**, **NIST SP 800-63B**, **NIST SP 800-61** y **OWASP Top 10**.

Este monorepo reúne los **3 pilares completos del proyecto**:

| Carpeta | Contenido | Tecnología / Entregables |
|---|---|---|
| [`app/`](./app/) | **Aplicación Web Gamificada (`v0.11.0`)** | Vue 3, TypeScript (`strict: true`), Pinia, Tailwind CSS, Chart.js, Firebase Auth/Firestore, Stripe Checkout + Cloud Functions v2 |
| [`promo-video/`](./promo-video/) | **Video Promocional Animado (1080p @ 30fps)** | Remotion (`4.0.539`), React 19, Tailwind CSS v4, escenas animadas + renders `.mp4` / `.png` |
| [`docs-negocio/`](./docs-negocio/) | **Emprendimiento, Validación y Modelado** | Business Model Canvas, Estudio Estadístico ($n=50$), Análisis Financiero, Buyer Personas, Mapa de Empatía, Diagramas UML/BPMN/ER y Mockups HD |

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart LR
    subgraph Cliente ["Frontend Vue 3 SPA (Sin secretos)"]
        UI["Vistas: Learn · Lesson (11 juegos) · Shop · Leagues · OrgDashboard"]
        Toast["ToastNotification.vue (Global)"]
        Guards["Vue Router Guards (requiresAuth / guestOnly)"]
        StripeClient["stripeService.ts (/api/*)"]
    end

    subgraph Backend ["Servidor Seguro (Vite Dev / Firebase Cloud Functions v2)"]
        B2C["POST /api/create-checkout-session"]
        B2B["POST /api/create-b2b-checkout-session"]
        Verify["GET /api/verify-checkout-session"]
        Webhook["POST /api/stripe-webhook"]
    end

    subgraph Cloud ["Firebase & Stripe"]
        Auth["Firebase Auth (Email/Pass + Google OAuth)"]
        Firestore["Cloud Firestore + Reglas Zero Trust"]
        Stripe["Stripe REST API (STRIPE_SECRET_KEY server-only)"]
    end

    UI --> Guards --> Auth
    UI --> Toast
    UI --> StripeClient
    StripeClient --> B2C & B2B & Verify --> Stripe
    Stripe --> Webhook --> Firestore
    UI --> Firestore
```

---

## 🎮 Currículo y Suite de 11 Motores Interactivos

La plataforma incluye **6 cursos completos (`21 lecciones` + `6 cofres`)** con un **Sistema Teórico Dual** (**Códice del Curso** en `UnitTheoryModal.vue` + **Briefing Pre-Misión** en `LessonTheoryBriefing.vue`) y **11 motores de juego desacoplados**:

### Cursos Disponibles
1. **Curso 1 (`unit_01`) — Anatomía del Phishing e Ingeniería Social** *(5 lecciones)*: Cabeceras SMTP (SPF/DKIM), typosquatting DNS, fraude del CEO (BEC), adjuntos `.pdf.exe`/`.xlsm` y triaje contrarreloj.
2. **Curso 2 (`unit_02`) — Criptografía, Identidad y Bastión Firewall** *(4 lecciones)*: Entropía NIST SP 800-63B, auditoría de permisos móviles y videojuego arcade de firewall en vivo.
3. **Curso 3 (`unit_03`) — Redes Seguras, Wi-Fi Público y Laberinto VPN** *(3 lecciones)*: Sniffers Man-in-the-Middle, redes Evil Twin, túneles VPN AES-256 y llaves MFA.
4. **Curso 4 (`unit_04`) — Respuesta a Incidentes SOC, Ransomware e IA** *(3 lecciones)*: Consola SOC en tiempo real (1. Aislar VLAN → 2. Purgar EDR → 3. Backup 3-2-1) y defensa contra Deepfakes de voz.
5. **Curso 5 (`unit_05`) — Seguridad Web OWASP & Blindaje DevSecOps** *(3 lecciones)*: Parcheo en vivo contra SQL Injection, XSS, IDOR, Command Injection y JWT `none`.
6. **Curso 6 (`unit_06`) — Forense Digital, Threat Hunting & Anti-IA** *(3 lecciones)*: Caza de procesos maliciosos en memoria RAM (PID/PPID, sockets C2) y dictamen de causa raíz (IoC).

### 11 Motores de Minijuegos y Videojuegos (`app/src/components/games/`)
- **6 Minijuegos Core**: `InboxThreatScanner`, `UrlInspector`, `PasswordVaultBuilder`, `SocialEngineeringChat`, `PermissionGatekeeper`, `RapidTriageRadar`.
- **5 Videojuegos Avanzados**: `FirewallDefenseGame` (3 carriles en tiempo real), `NetworkMazeGame` (laberinto táctico 2D), `IncidentCommandGame` (consola SOC), `CodePatcherGame` (hotfix DevSecOps) y `ForensicInvestigatorGame` (laboratorio CSI en RAM).

---

## ⚙️ Funcionalidades Principales

- ❤️ **Gamificación y Economía**: 5 vidas con regeneración pasiva cada 4h, **Modo Refuerzo** a 0 vidas (+1 vida al obtener 100%), cofres atómicos anti-exploit (`runTransaction`), rachas diarias dinámicas por fecha local con multiplicadores `x1.0`–`x2.0`, tienda de Bits y Modo Oscuro **Dark Sentinel**.
- 🏆 **Ligas en Tiempo Real**: Ranking global por liga y **Liga Privada Empresarial** sincronizados con `onSnapshot`.
- 🏢 **Panel Corporativo PYME (B2B Multi-Tenant)**: Creación de organizaciones, códigos de invitación de 6 caracteres, control de asientos (`Micro-PYME` 10, `Growth PYME` 30, `Enterprise` 100), métricas **Chart.js**, detección de colaboradores en riesgo (`<60%` acierto o inactividad >7 días), suspensión/reactivación y desvinculación.
- 🔒 **Endurecimiento P0 (`v0.11.0`)**:
  - Autenticación dual (**Email/Contraseña** + **Google OAuth**) con traducción de errores y guards `requiresAuth` / `guestOnly` en Vue Router.
  - Reglas **Zero Trust** reales en [`app/firestore.rules`](./app/firestore.rules) (sin reglas globales abiertas).
  - Secretos y verificación de pagos Stripe movidos al servidor (`vite.config.ts` dev middleware + [`app/functions/`](./app/functions/) Cloud Functions v2), cerrando el bypass de activación por parámetros de URL.

---

## 🚀 Guía Rápida de Ejecución

### 1. Aplicación Web (`app/`)
```bash
cd app
npm install
cp .env.example .env   # Configura tus claves Firebase y STRIPE_SECRET_KEY (sin prefijo VITE_)
npm run dev            # Levanta la app + endpoints locales de Stripe en http://localhost:3000
```
Compilación y verificación estricta de tipos:
```bash
node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit
npm run build
```

### 2. Cloud Functions de Producción (`app/functions/`)
```bash
cd app/functions
npm install
npm run build
```
*(Despliegue en Firebase requiere Plan Blaze: `firebase deploy --only functions,hosting,firestore:rules,firestore:indexes`)*

### 3. Video Promocional (`promo-video/`)
```bash
cd promo-video
npm install
npm run dev            # Abre Remotion Studio
```

---

## 🗺️ Mapa del Repositorio

```text
SuriLearn/
├── README.md                  # Documentación principal del ecosistema SuriLearn
├── CHANGELOG.md               # Historial cronológico de versiones (v0.1.0 -> v0.11.0)
├── .gitignore                 # Exclusiones de secretos (.env), node_modules, dist y temporales
├── app/                       # SPA Vue 3 + TypeScript + Firebase + Stripe + Cloud Functions
│   ├── README.md              # Documentación técnica de la aplicación
│   ├── docs/                  # SRS, Informe Técnico, Design System y Planes v0.1.0–v0.11.0
│   ├── functions/             # Cloud Functions v2 para Stripe B2C/B2B y Webhooks
│   ├── prototypes/            # Prototipos HTML/PNG de Stitch UI
│   ├── src/                   # Código fuente (vistas, minijuegos, stores, composables)
│   └── Suri/                  # Poses oficiales de la mascota Suri
├── promo-video/               # Proyecto Remotion del video promocional + renderizado MP4
└── docs-negocio/              # Canvas, Validación (n=50), Análisis Financiero, Diagramas SVG y Mockups
```

---

## 📚 Documentación Detallada

- 📘 **[Documento de Ingeniería de Software y Gestión TI (SRS, Arquitectura y Algoritmos)](./app/docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md)**
- 📙 **[Informe Técnico y Marco Teórico](./app/docs/INFORME_TECNICO_Y_MARCO_TEORICO.md)**
- 🎨 **[Sistema de Diseño "Suri Sentinel" 2.5D](./app/docs/DESIGN_SURI_SENTINEL.md)**
- 📋 **[Índice de Planes por Versión (`docs/plans/`)](./app/docs/plans/README.md)**
- 💼 **[Artefactos de Negocio, Diagramas y Mockups (`docs-negocio/`)](./docs-negocio/README.md)**
- 🎬 **[Video Promocional (`promo-video/`)](./promo-video/README.md)**

---

## 🧭 Hoja de Ruta (Post-P0)
- **Prioridad 1 (Personalización y B2B Avanzado)**: Evaluación diagnóstica adaptativa, Centro de Errores táctico, certificados verificables, analítica semanal basada en `activeDates` reales, aislamiento RBAC en vistas B2B, ascenso automático de ligas y mejoras WCAG 2.1 AA.
- **Prioridad 2 (Empaquetado y Calidad)**: Lazy-loading completo de rutas, suite de pruebas unitarias/E2E, soporte PWA/Capacitor y actualización del video promocional a los 6 cursos y 11 motores.
