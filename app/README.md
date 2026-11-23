# 🛡️ SuriLearn — Aplicación Web Gamificada de Ciberseguridad (PWA)

> **Versión Actual:** `v0.17.0` (Pre-1.0 · Web Pública en Firebase Hosting + APK Android TWA Firmada)  
> **URL Pública Web:** https://surilearn-9b60e.web.app  
> **Descarga APK Android:** https://github.com/MichaelBrown1310/SuriLearn/raw/main/releases/SuriLearn-v0.17.0.apk  
> **Metáfora del Sistema:** *"La Madriguera Digital y el Centinela Suri"*

**SuriLearn** es una aplicación web progresiva (**PWA / SPA** con Vue 3 + TypeScript + Pinia + Tailwind CSS + Firebase + Stripe) que transforma la capacitación tradicional en ciberseguridad en micro-entrenamientos diarios interactivos de **3 a 5 minutos**, dirigida tanto a **usuarios individuales (B2C)** como a **PYMES (B2B)**.

---

## ✨ Características Principales (`v0.16.0`)

### 1. Currículo Secuencial de 15 Cursos (75 Lecciones + 15 Cofres) de Fácil a Maestro
Sin selector superior de saltos: el usuario recorre el **mapa continuo estilo Duolingo** de forma **estrictamente secuencial** (sin completar la lección y el curso anterior no puede avanzar, salvo acreditación mediante el diagnóstico inicial). Cada curso cuenta con **5 lecciones interactivas**, **1 cofre de Bits**, **Códice / Manual Teórico** (`UnitTheoryModal.vue`) y **Briefing Pre-Misión** (`LessonTheoryBriefing.vue`):

| Nivel de Dificultad | Cursos | Lecciones | Enfoque Técnico Progresivo |
|---|---|---|---|
| **Nivel 1 · Principiante** | **Cursos 1 – 3** | 15 lecciones + 3 cofres | Vocabulario base (arcade), phishing e ingeniería social, contraseñas NIST, MFA y permisos móviles |
| **Nivel 2 · Explorador** | **Cursos 4 – 6** | 15 lecciones + 3 cofres | Reflejos arcade (Culebrita, Topos, Breakout, Buscaminas, Invasores), firewall perimetral y redes/VPN |
| **Nivel 3 · Intermedio** | **Cursos 7 – 9** | 15 lecciones + 3 cofres | Fraude del CEO (BEC), deepfakes IA, consola SOC ante Ransomware (NIST), nube SaaS y prevención DLP |
| **Nivel 4 · Avanzado** | **Cursos 10 – 12** | 15 lecciones + 3 cofres | OWASP Top 10 (SQLi, XSS, IDOR), Zero Trust & APIs (SSRF/JWT) y forense digital / Threat Hunting RAM |
| **Nivel 5 · Maestro** | **Cursos 13 – 15** | 15 lecciones + 3 cofres | Defensa APT y cadena de suministro, gobierno CISO / ISO 27001 / NIS2 y Desafío Maestro integrado |

### 2. Suite de 19 Motores Interactivos (`src/components/games/`) y Mascota Animada
- **6 Minijuegos Core**: `InboxThreatScanner`, `UrlInspector`, `PasswordVaultBuilder`, `SocialEngineeringChat`, `PermissionGatekeeper`, `RapidTriageRadar`.
- **5 Videojuegos Avanzados (Paleta SuriLearn Homologada en `v0.14.0`)**: `FirewallDefenseGame` (3 carriles a `60fps` con bonus de puntería), `NetworkMazeGame` (Madriguera 2.5D con rastro y swipe táctil), `IncidentCommandGame` (consola SOC), `CodePatcherGame` (hotfix DevSecOps) y `ForensicInvestigatorGame` (laboratorio CSI en RAM).
- **4 Juegos Clásicos Zona Arcade (`v0.13.0`)**: `CyberHangmanGame` (Ahorcado Ciberdefensor), `CyberSnakeGame` (Culebrita Firewall), `CyberMemoryGame` (Memorama Amenaza ↔ Defensa) y `ThreatWhackGame` (Atrapa al Hacker).
- **4 Juegos Clásicos Zona Arcade Pro (`v0.14.0`)**: `CyberWordSearchGame` (Sopa de Letras 8×8), `CyberMinesweeperGame` (Buscaminas de Malware), `CyberBreakoutGame` (Rompe-Malware Canvas `60fps`) y `CyberInvadersGame` (Invasores del Spam Canvas `60fps`).
- **Animación Viva de Suri (`SuriMascotAnimated.vue`)**: Parpadeo/guiño periódico automático, respiración idle, rebote alegre, sacudida de alerta, partículas y **11 poses expresivas** reactivas integradas en las vistas, modales y juegos.

### 3. Personalización, Progresión Secuencial y Ligas (`v0.11.0` – `v0.16.0`)
- **Evaluación Inicial de 10 Preguntas (`v0.16.0`)**: Diagnóstico progresivo (`DiagnosticModal.vue`) disparado automáticamente tras el registro (`/tabs/learn?diagnostic=1`) que ubica al estudiante en su curso inicial (`Cursos 1, 4, 7, 10 o 13`), acreditando módulos previos para repaso y manteniendo bloqueo secuencial hacia adelante.
- **Ligas Pobladas en 5 Divisiones**: Ranking global real en Firestore (`Bronce`, `Plata`, `Oro`, `Diamante`, `Supremo`) con cuentas en cada podio y pestañas de exploración por división (`LeaderboardView.vue`), además de **Liga Privada Empresarial** para PYMES.
- **Centro de Errores & Meta Diaria**: Repaso dirigido en `/lesson/error-review`, selector de Meta Diaria (`3 / 5 / 10 min`) y seguimiento diario en la ruta de aprendizaje.
- **Gamificación Cuantitativa**: 5 vidas con recarga pasiva cada 4h, **Modo Refuerzo** a 0 vidas, regla de aprobación mínima (`≥60%`) con `1–3` estrellas persistentes, multiplicadores de racha (`x1.0` a `x2.0`) con consumo real del Congelador de Racha, persistencia de boosts `2X XP`, ascenso automático de ligas (`Bronce → Plata → Oro → Diamante → Supremo`), medallas dinámicas, notificaciones `ToastNotification.vue` y **Dark Sentinel WCAG 2.1 AA**.
- **Panel PYME B2B con RBAC**: Creación de organizaciones (`micro_pyme` 10, `growth_pyme` 30, `enterprise` 100), código de invitación transaccional (`runTransaction`), aislamiento RBAC entre Administradores CISO y Colaboradores, analítica semanal real basada en `activeDates` + exportación CSV, badge `"En Riesgo"` y suspensión preventiva en tiempo real (`onSnapshot`).
- **PWA, Rendimiento y Seguridad**: Autenticación dual (**Email/Contraseña** + **Google OAuth**), guards `requiresAuth` / `guestOnly`, reglas Zero Trust en `firestore.rules`, Stripe server-side (`vite.config.ts` / `functions/`), PWA instalable (`manifest.webmanifest` + `sw.js`), lazy-loading completo de rutas y suite de `20/20` pruebas unitarias con **Vitest**.

---

## 🗂️ Estructura de la Aplicación

```text
app/ (stitch_surilearn_gamified_app/)
├── android-twa/                # Proyecto Android TWA firmado (com.surilearn.app · Gradle 8.14.3)
├── functions/                  # Firebase Cloud Functions v2 (Stripe Checkout B2C/B2B + Webhooks)
├── src/
│   ├── __tests__/              # Suite de pruebas unitarias Vitest (motor, currículo y Stripe/Auth)
│   ├── components/
│   │   ├── common/             # HeaderHud, BottomTabBar, ToastNotification, DiagnosticModal, SuriMascotAnimated y modales Suri
│   │   ├── games/              # 19 Minijuegos y videojuegos interactivos
│   │   ├── learn/              # CourseWindingPath.vue (ruta continua estilo Duolingo con camino curvo SVG)
│   │   ├── navigation/         # SidebarNav responsivo
│   │   └── organization/       # AdminAnalytics (Chart.js + CSV) y MemberDetailModal
│   ├── composables/            # useFirestore (caché TTL + ACID) y useTheme (Dark Sentinel)
│   ├── data/                   # curriculum.ts + curriculumExpansion.ts (15 cursos, 75 lecciones, manuales)
│   ├── firebase/config.ts      # Singleton Firebase + caché persistente IndexedDB
│   ├── router/index.ts         # Rutas SPA con lazy-loading y guards requiresAuth / guestOnly
│   ├── services/stripeService.ts # Cliente seguro hacia /api/* (sin llaves secretas)
│   ├── stores/                 # Pinia: useUserStore y useGamificationStore
│   ├── types/                  # Contratos TypeScript estrictos
│   ├── utils/                  # gamificationEngine.ts, pathGeometry.ts, authErrors.ts y suriAssets.ts
│   └── views/                  # 10 Vistas principales (LearnView 15 cursos + WelcomeView con descarga APK)
├── public/                     # manifest.webmanifest, sw.js, iconos PWA y .well-known/assetlinks.json
├── docs/                       # SRS, Informe Técnico, Design System y Planes v0.1.0 - v0.17.0
├── prototypes/                 # Prototipos originales Stitch UI
├── Suri/                       # Poses oficiales transparentes de Suri
├── firestore.rules             # Reglas Zero Trust validadas
├── firebase.json               # Hosting SPA Spark + assetlinks + Firestore config
└── firebase.blaze.json         # Respaldo de rewrites Cloud Functions para Plan Blaze
```

---

## 🚀 Instalación y Ejecución Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Configurar variables de entorno**:
   Copia `.env.example` a `.env` y completa tus claves de Firebase y de servidor Stripe (`STRIPE_SECRET_KEY`, sin prefijo `VITE_`):
   ```bash
   cp .env.example .env
   ```
3. **Ejecutar servidor de desarrollo** (`http://localhost:3000`):
   ```bash
   npm run dev
   ```
4. **Ejecutar pruebas, verificar tipos y compilar para producción**:
   ```bash
   npm test
   node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit
   npm run build
   ```
5. **Cloud Functions (opcional para producción Firebase Blaze)**:
   ```bash
   cd functions && npm install && npm run build
   ```
