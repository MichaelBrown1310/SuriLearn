# 🛡️ SuriLearn — Plataforma Gamificada de Ciberseguridad (B2C + PYMES B2B)

> **Versión Actual:** `v0.14.0` (Pre-1.0 · P0 + P1 + P2 + 2 Zonas Arcade & Paleta SuriLearn Homologada)  
> **Propuesta de Valor:** *Una plataforma de aprendizaje de ciberseguridad gamificada que transforma la capacitación tradicional en una experiencia interactiva, progresiva y personalizada, dirigida tanto a usuarios individuales como a organizaciones que buscan fortalecer las competencias de seguridad de sus empleados.*

---

## 📌 Visión General del Ecosistema

**SuriLearn** sustituye los cursos corporativos pasivos (PDFs extensos, charlas anuales con lenguaje técnico) por cápsulas gamificadas diarias de **3 a 5 minutos** guiadas por **Suri, el Centinela Suricato**, integrando los marcos **Octalysis**, **Modelo Conductual de Fogg**, **NIST SP 800-63B**, **NIST SP 800-61** y **OWASP Top 10**.

Este monorepo reúne los **3 pilares completos del proyecto**:

| Carpeta | Contenido | Tecnología / Entregables |
|---|---|---|
| [`app/`](./app/) | **Aplicación Web Progresiva PWA (`v0.14.0`)** | Vue 3, TypeScript (`strict: true`), Pinia, Tailwind CSS (WCAG 2.1 AA), Chart.js, Vitest (`16/16`), Firebase Auth/Firestore, Stripe Checkout + Cloud Functions v2 |
| [`promo-video/`](./promo-video/) | **Video Promocional Animado (1080p @ 30fps)** | Remotion (`4.0.539`), React 19, Tailwind CSS v4, escenas actualizadas a `v0.12.0` + renders `.mp4` / `.png` |
| [`docs-negocio/`](./docs-negocio/) | **Emprendimiento, Validación y Modelado** | Business Model Canvas, Estudio Estadístico ($n=50$), Análisis Financiero, Buyer Personas, Mapa de Empatía, Diagramas UML/BPMN/ER y Mockups HD |

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart LR
    subgraph Cliente ["Frontend Vue 3 SPA (Sin secretos)"]
        UI["Vistas: Learn · Lesson (19 juegos) · Shop · Leagues · OrgDashboard"]
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

## 🎮 Currículo y Suite de 19 Motores Interactivos

La plataforma incluye **8 cursos completos (`29 lecciones` + `8 cofres`)** con un **Sistema Teórico Dual** (**Códice del Curso** en `UnitTheoryModal.vue` + **Briefing Pre-Misión** en `LessonTheoryBriefing.vue`) y **19 motores de juego desacoplados**:

### Cursos Disponibles
1. **Curso 1 (`unit_01`) — Anatomía del Phishing e Ingeniería Social** *(5 lecciones)*: Cabeceras SMTP (SPF/DKIM), typosquatting DNS, fraude del CEO (BEC), adjuntos `.pdf.exe`/`.xlsm` y triaje contrarreloj.
2. **Curso 2 (`unit_02`) — Criptografía, Identidad y Bastión Firewall** *(4 lecciones)*: Entropía NIST SP 800-63B, auditoría de permisos móviles y videojuego arcade de firewall en vivo.
3. **Curso 3 (`unit_03`) — Redes Seguras, Wi-Fi Público y Laberinto VPN** *(3 lecciones)*: Sniffers Man-in-the-Middle, redes Evil Twin, túneles VPN AES-256 y llaves MFA.
4. **Curso 4 (`unit_04`) — Respuesta a Incidentes SOC, Ransomware e IA** *(3 lecciones)*: Consola SOC en tiempo real (1. Aislar VLAN → 2. Purgar EDR → 3. Backup 3-2-1) y defensa contra Deepfakes de voz.
5. **Curso 5 (`unit_05`) — Seguridad Web OWASP & Blindaje DevSecOps** *(3 lecciones)*: Parcheo en vivo contra SQL Injection, XSS, IDOR, Command Injection y JWT `none`.
6. **Curso 6 (`unit_06`) — Forense Digital, Threat Hunting & Anti-IA** *(3 lecciones)*: Caza de procesos maliciosos en memoria RAM (PID/PPID, sockets C2) y dictamen de causa raíz (IoC).
7. **Curso 7 (`unit_07`) — Zona Arcade Centinela (Juegos Clásicos)** *(4 lecciones)*: Mecánicas retro entretenidas aplicadas a ciberseguridad (Ahorcado técnico, Culebrita Firewall, Memorama Amenaza↔Defensa y Atrapa al Hacker).
8. **Curso 8 (`unit_08`) — Zona Arcade Pro — Acción & Ingenio** *(4 lecciones)*: Sopa de Letras Centinela (`8×8`), Buscaminas de Malware (`6×6`), Rompe-Malware Arcade (`60fps`) e Invasores del Spam (`60fps`).

### 19 Motores de Minijuegos y Videojuegos (`app/src/components/games/`)
- **6 Minijuegos Core**: `InboxThreatScanner`, `UrlInspector`, `PasswordVaultBuilder`, `SocialEngineeringChat`, `PermissionGatekeeper`, `RapidTriageRadar`.
- **5 Videojuegos Avanzados (Paleta SuriLearn `v0.14.0`)**: `FirewallDefenseGame` (3 carriles a `60fps` con bonus de puntería), `NetworkMazeGame` (Madriguera 2.5D con rastro y swipe), `IncidentCommandGame` (consola SOC), `CodePatcherGame` (hotfix DevSecOps) y `ForensicInvestigatorGame` (laboratorio CSI en RAM).
- **4 Juegos Clásicos Arcade (`v0.13.0`)**: `CyberHangmanGame` (Ahorcado Ciberdefensor), `CyberSnakeGame` (Culebrita Firewall), `CyberMemoryGame` (Memorama de Pares) y `ThreatWhackGame` (Atrapa al Hacker en puertos).
- **4 Juegos Clásicos Zona Arcade Pro (`v0.14.0`)**: `CyberWordSearchGame` (Sopa de Letras), `CyberMinesweeperGame` (Buscaminas de Malware), `CyberBreakoutGame` (Rompe-Malware Canvas `60fps`) y `CyberInvadersGame` (Invasores del Spam Canvas `60fps`).

---

## ⚙️ Funcionalidades Principales

- 🎯 **Personalización Adaptativa (`v0.12.0`)**: Diagnóstico inicial de 4 preguntas (`DiagnosticModal.vue`) que detecta perfil y brechas para recomendar curso, **Centro de Errores** real (`/lesson/error-review`) con repaso dirigido de fallos previos, selector editable de Meta Diaria (`3 / 5 / 10 min`) y seguimiento diario real.
- ❤️ **Gamificación y Economía**: 5 vidas con regeneración pasiva cada 4h, **Modo Refuerzo** a 0 vidas, aprobación mínima (`≥60%`) con `1–3` estrellas persistentes, cofres atómicos (`runTransaction`), rachas diarias con multiplicadores `x1.0`–`x2.0` y consumo real de *Congelador de Racha*, boosts `2X XP` persistidos, medallas dinámicas, notificaciones `ToastNotification.vue` y **Dark Sentinel WCAG 2.1 AA**.
- 🏆 **Ligas en Tiempo Real**: Ranking global con promoción automática por XP (`Bronce → Plata → Oro → Diamante → Supremo`), cuenta regresiva semanal real y **Liga Privada Empresarial** sincronizados con `onSnapshot`.
- 🏢 **Panel Corporativo PYME (B2B + RBAC)**: Creación de organizaciones (`micro_pyme` 10, `growth_pyme` 30, `enterprise` 100), código transaccional (`runTransaction`), aislamiento RBAC entre Administradores CISO y Colaboradores, analítica semanal real (`activeDates`) + **Exportar CSV**, detección `"En Riesgo"` y suspensión preventiva en tiempo real (`onSnapshot`).
- 📱 **PWA, Mascota Animada y Calidad (`v0.14.0`)**: Instalable (`manifest.webmanifest` + Service Worker `sw.js`), lazy-loading completo de rutas y `manualChunks` (`71.96 kB` de entrada), mascota **Suri reactiva con 11 poses y animaciones continuas** (`SuriMascotAnimated.vue`), paleta oficial unificada en los 19 motores, manejo global de errores y **16 pruebas unitarias Vitest** automatizadas.
- 🔒 **Endurecimiento P0 (`v0.11.0`)**: Autenticación dual (**Email/Contraseña** + **Google OAuth**), guards `requiresAuth` / `guestOnly`, reglas **Zero Trust** en [`app/firestore.rules`](./app/firestore.rules), y secrets/verificación de Stripe exclusivamente server-side (`vite.config.ts` / [`app/functions/`](./app/functions/)).

---

## 🚀 Guía Rápida de Ejecución

### 1. Aplicación Web (`app/`)
```bash
cd app
npm install
cp .env.example .env   # Configura tus claves Firebase y STRIPE_SECRET_KEY (sin prefijo VITE_)
npm run dev            # Levanta la app + endpoints locales de Stripe en http://localhost:3000
```
Pruebas, verificación estricta de tipos y compilación PWA:
```bash
npm test
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
├── CHANGELOG.md               # Historial cronológico de versiones (v0.1.0 -> v0.14.0)
├── .gitignore                 # Exclusiones de secretos (.env), node_modules, dist y temporales
├── app/                       # PWA Vue 3 + TypeScript + Vitest + Firebase + Stripe + Cloud Functions
│   ├── README.md              # Documentación técnica de la aplicación
│   ├── docs/                  # SRS, Informe Técnico, Design System y Planes v0.1.0 - v0.14.0
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

## 🧭 Siguientes Fases Planeadas (Hacia `v1.0.0`)
- **Cloud Functions en Producción (Plan Blaze)** y webhook firmado con `STRIPE_WEBHOOK_SECRET` en Firebase.
- **Certificados PDF/QR verificables**, asignación de módulos obligatorios por departamento e integración IA Gemini en servidor.
- **Re-renderizado de video Remotion (`promo-video/`)** para actualizar el archivo `.mp4` con las escenas de `v0.12.0`.
