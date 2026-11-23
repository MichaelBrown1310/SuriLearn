# 🛡️ SuriLearn — Aplicación Web Gamificada de Ciberseguridad (PWA)

> **Versión Actual:** `v0.14.0` (Pre-1.0 · P0 + P1 + P2 + 2 Zonas Arcade & Paleta SuriLearn Homologada)  
> **Metáfora del Sistema:** *"La Madriguera Digital y el Centinela Suri"*

**SuriLearn** es una aplicación web progresiva (**PWA / SPA** con Vue 3 + TypeScript + Pinia + Tailwind CSS + Firebase + Stripe) que transforma la capacitación tradicional en ciberseguridad en micro-entrenamientos diarios interactivos de **3 a 5 minutos**, dirigida tanto a **usuarios individuales (B2C)** como a **PYMES (B2B)**.

---

## ✨ Características Principales (`v0.14.0`)

### 1. Currículo Completo de 8 Cursos (29 Lecciones) y Sistema Teórico Dual
Cada curso integra un **Códice / Manual Teórico** (`UnitTheoryModal.vue`) y un **Briefing Pre-Misión** (`LessonTheoryBriefing.vue`) antes de pasar a la práctica:

| Curso | Módulo | Lecciones | Enfoque Técnico |
|---|---|---|---|
| **Curso 1** | Phishing e Ingeniería Social | 5 lecciones + Cofre | SPF/DKIM, spoofing, typosquatting, adjuntos `.pdf.exe`/`.xlsm`, chats de urgencia |
| **Curso 2** | Criptografía, Identidad y Firewall | 4 lecciones + Cofre | Entropía NIST SP 800-63B, permisos móviles, filtrado de paquetes en vivo |
| **Curso 3** | Redes Seguras, Wi-Fi Público y VPN | 3 lecciones + Cofre | Sniffers MitM, Evil Twin Wi-Fi, túneles VPN AES-256 y llaves MFA |
| **Curso 4** | Respuesta a Incidentes SOC, Ransomware e IA | 3 lecciones + Cofre | Protocolo NIST (Aislar VLAN → Purgar EDR → Backup 3-2-1) y Deepfakes |
| **Curso 5** | Seguridad Web OWASP & DevSecOps | 3 lecciones + Cofre | Inyección SQL, XSS, IDOR, RCE y parcheo de código en vivo |
| **Curso 6** | Forense Digital, Threat Hunting & Anti-IA | 3 lecciones + Cofre | Análisis de memoria RAM (PID/PPID, sockets C2) y dictamen de causa raíz (IoC) |
| **Curso 7** | Zona Arcade Centinela (Juegos Clásicos) | 4 lecciones + Cofre | Vocabulario técnico, filtrado de paquetes, pares Amenaza ↔ Defensa y puertos en tiempo real |
| **Curso 8** | Zona Arcade Pro — Acción & Ingenio | 4 lecciones + Cofre | Sopa de Letras Centinela, Buscaminas de Malware, Rompe-Malware Arcade e Invasores del Spam |

> *Nota*: El primer nodo de cada curso y los nodos marcados como videojuego permanecen accesibles directamente en el mapa para facilitar la demostración de la variedad de mecánicas.

### 2. Suite de 19 Motores Interactivos (`src/components/games/`) y Mascota Animada
- **6 Minijuegos Core**: `InboxThreatScanner`, `UrlInspector`, `PasswordVaultBuilder`, `SocialEngineeringChat`, `PermissionGatekeeper`, `RapidTriageRadar`.
- **5 Videojuegos Avanzados (Paleta SuriLearn Homologada en `v0.14.0`)**: `FirewallDefenseGame` (3 carriles a `60fps` con bonus de puntería), `NetworkMazeGame` (Madriguera 2.5D con rastro y swipe táctil), `IncidentCommandGame` (consola SOC), `CodePatcherGame` (hotfix DevSecOps) y `ForensicInvestigatorGame` (laboratorio CSI en RAM).
- **4 Juegos Clásicos Zona Arcade (`v0.13.0`)**: `CyberHangmanGame` (Ahorcado Ciberdefensor), `CyberSnakeGame` (Culebrita Firewall), `CyberMemoryGame` (Memorama Amenaza ↔ Defensa) y `ThreatWhackGame` (Atrapa al Hacker).
- **4 Juegos Clásicos Zona Arcade Pro (`v0.14.0`)**: `CyberWordSearchGame` (Sopa de Letras 8×8), `CyberMinesweeperGame` (Buscaminas de Malware), `CyberBreakoutGame` (Rompe-Malware Canvas `60fps`) y `CyberInvadersGame` (Invasores del Spam Canvas `60fps`).
- **Animación Viva de Suri (`SuriMascotAnimated.vue`)**: Parpadeo/guiño periódico automático, respiración idle, rebote alegre, sacudida de alerta, partículas y **11 poses expresivas** reactivas integradas en las vistas, modales y juegos.

### 3. Personalización, Gamificación, B2B Real y Calidad (`v0.11.0` – `v0.12.0`)
- **Personalización Adaptativa**: Evaluación diagnóstica inicial de 4 preguntas (`DiagnosticModal.vue`) que recomienda curso según perfil y brechas, **Centro de Errores** real (`/lesson/error-review`) con repaso dirigido, selector funcional de Meta Diaria (`3 / 5 / 10 min`) y meta diaria real en la ruta de aprendizaje.
- **Gamificación Cuantitativa**: 5 vidas con recarga pasiva cada 4h, **Modo Refuerzo** a 0 vidas, regla de aprobación mínima (`≥60%`) con `1–3` estrellas persistentes, multiplicadores de racha (`x1.0` a `x2.0`) con consumo real del Congelador de Racha, persistencia de boosts `2X XP`, ascenso automático de ligas (`Bronce → Plata → Oro → Diamante → Supremo`), medallas dinámicas, notificaciones `ToastNotification.vue` y **Dark Sentinel WCAG 2.1 AA**.
- **Panel PYME B2B con RBAC**: Creación de organizaciones (`micro_pyme` 10, `growth_pyme` 30, `enterprise` 100), código de invitación transaccional (`runTransaction`), aislamiento RBAC entre Administradores CISO y Colaboradores, analítica semanal real basada en `activeDates` + exportación CSV, badge `"En Riesgo"` y suspensión preventiva en tiempo real (`onSnapshot`).
- **PWA, Rendimiento y Seguridad**: Autenticación dual (**Email/Contraseña** + **Google OAuth**), guards `requiresAuth` / `guestOnly`, reglas Zero Trust en `firestore.rules`, Stripe server-side (`vite.config.ts` / `functions/`), PWA instalable (`manifest.webmanifest` + `sw.js`), lazy-loading completo de rutas y suite de pruebas unitarias con **Vitest**.

---

## 🗂️ Estructura de la Aplicación

```text
app/ (stitch_surilearn_gamified_app/)
├── functions/                  # Firebase Cloud Functions v2 (Stripe Checkout B2C/B2B + Webhooks)
├── src/
│   ├── __tests__/              # Suite de pruebas unitarias Vitest (motor, currículo y Stripe/Auth)
│   ├── components/
│   │   ├── common/             # HeaderHud, BottomTabBar, ToastNotification, DiagnosticModal, SuriMascotAnimated y modales Suri
│   │   ├── games/              # 19 Minijuegos y videojuegos interactivos
│   │   ├── navigation/         # SidebarNav responsivo
│   │   └── organization/       # AdminAnalytics (Chart.js + CSV) y MemberDetailModal
│   ├── composables/            # useFirestore (caché TTL + ACID) y useTheme (Dark Sentinel)
│   ├── data/curriculum.ts      # 8 cursos, 29 lecciones, manuales y briefings
│   ├── firebase/config.ts      # Singleton Firebase + caché persistente IndexedDB
│   ├── router/index.ts         # Rutas SPA con lazy-loading y guards requiresAuth / guestOnly
│   ├── services/stripeService.ts # Cliente seguro hacia /api/* (sin llaves secretas)
│   ├── stores/                 # Pinia: useUserStore y useGamificationStore
│   ├── types/                  # Contratos TypeScript estrictos
│   ├── utils/                  # Motor puro gamificationEngine.ts, authErrors.ts y suriAssets.ts
│   └── views/                  # 10 Vistas principales
├── public/                     # manifest.webmanifest, sw.js e iconos oficiales de Suri
├── docs/                       # SRS, Informe Técnico, Design System y Planes v0.1.0 - v0.14.0
├── prototypes/                 # Prototipos originales Stitch UI
├── Suri/                       # Poses oficiales transparentes de Suri
├── firestore.rules             # Reglas Zero Trust validadas
└── firebase.json               # Hosting + Functions + Firestore config
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
