# 🛡️ SuriLearn — Aplicación Web Gamificada de Ciberseguridad

> **Versión Actual:** `v0.11.0` (Pre-1.0 con Endurecimiento P0)  
> **Metáfora del Sistema:** *"La Madriguera Digital y el Centinela Suri"*

**SuriLearn** es una aplicación web (**SPA** con Vue 3 + TypeScript + Pinia + Tailwind CSS + Firebase + Stripe) que transforma la capacitación tradicional en ciberseguridad en micro-entrenamientos diarios interactivos de **3 a 5 minutos**, dirigida tanto a **usuarios individuales (B2C)** como a **PYMES (B2B)**.

---

## ✨ Características Principales (`v0.11.0`)

### 1. Currículo Completo de 6 Cursos (21 Lecciones) y Sistema Teórico Dual
Cada curso integra un **Códice / Manual Teórico** (`UnitTheoryModal.vue`) y un **Briefing Pre-Misión** (`LessonTheoryBriefing.vue`) antes de pasar a la práctica:

| Curso | Módulo | Lecciones | Enfoque Técnico |
|---|---|---|---|
| **Curso 1** | Phishing e Ingeniería Social | 5 lecciones + Cofre | SPF/DKIM, spoofing, typosquatting, adjuntos `.pdf.exe`/`.xlsm`, chats de urgencia |
| **Curso 2** | Criptografía, Identidad y Firewall | 4 lecciones + Cofre | Entropía NIST SP 800-63B, permisos móviles, filtrado de paquetes en vivo |
| **Curso 3** | Redes Seguras, Wi-Fi Público y VPN | 3 lecciones + Cofre | Sniffers MitM, Evil Twin Wi-Fi, túneles VPN AES-256 y llaves MFA |
| **Curso 4** | Respuesta a Incidentes SOC, Ransomware e IA | 3 lecciones + Cofre | Protocolo NIST (Aislar VLAN → Purgar EDR → Backup 3-2-1) y Deepfakes |
| **Curso 5** | Seguridad Web OWASP & DevSecOps | 3 lecciones + Cofre | Inyección SQL, XSS, IDOR, RCE y parcheo de código en vivo |
| **Curso 6** | Forense Digital, Threat Hunting & Anti-IA | 3 lecciones + Cofre | Análisis de memoria RAM (PID/PPID, sockets C2) y dictamen de causa raíz (IoC) |

> *Nota*: El primer nodo de cada curso y los nodos marcados como videojuego permanecen accesibles directamente en el mapa para facilitar la demostración de la variedad de mecánicas.

### 2. Suite de 11 Motores Interactivos (`src/components/games/`)
- **6 Minijuegos Core**: `InboxThreatScanner`, `UrlInspector`, `PasswordVaultBuilder`, `SocialEngineeringChat`, `PermissionGatekeeper`, `RapidTriageRadar`.
- **5 Videojuegos Avanzados**: `FirewallDefenseGame` (arcade 3 carriles), `NetworkMazeGame` (laberinto táctico 2D), `IncidentCommandGame` (consola SOC en tiempo real), `CodePatcherGame` (hotfix DevSecOps) y `ForensicInvestigatorGame` (laboratorio CSI en RAM).

### 3. Gamificación, B2B Multi-Tenant y Seguridad
- **Gamificación**: 5 vidas con recarga pasiva cada 4 horas, **Modo Refuerzo** a 0 vidas, multiplicadores de racha (`x1.0` a `x2.0`) conscientes del calendario local, tienda de Bits, cofres atómicos (`runTransaction`), notificaciones `ToastNotification.vue`, Modo Oscuro *Dark Sentinel* y ligas en tiempo real (`onSnapshot`).
- **Panel PYME B2B**: Creación de empresas, códigos de invitación de 6 caracteres, límites de puestos (`10` / `30` / `100`), analítica con **Chart.js** (`AdminAnalytics.vue`), suspensión y desvinculación de colaboradores.
- **Seguridad P0**: Autenticación dual (**Email/Contraseña** + **Google OAuth**), guards `router.beforeEach`, reglas Zero Trust en `firestore.rules`, y procesamiento/verificación de pagos Stripe exclusivamente en el servidor (`vite.config.ts` en dev y `functions/` Cloud Functions v2 en producción) sin llaves secretas en el bundle cliente.

---

## 🗂️ Estructura de la Aplicación

```text
app/ (stitch_surilearn_gamified_app/)
├── functions/                  # Firebase Cloud Functions v2 (Stripe Checkout B2C/B2B + Webhooks)
├── src/
│   ├── components/
│   │   ├── common/             # HeaderHud, BottomTabBar, ToastNotification y modales Suri
│   │   ├── games/              # 11 Minijuegos y videojuegos interactivos
│   │   ├── navigation/         # SidebarNav responsivo
│   │   └── organization/       # AdminAnalytics (Chart.js) y MemberDetailModal
│   ├── composables/            # useFirestore (caché TTL + ACID) y useTheme (Dark Sentinel)
│   ├── data/curriculum.ts      # 6 cursos, 21 lecciones, manuales y briefings
│   ├── firebase/config.ts      # Singleton Firebase + caché persistente IndexedDB
│   ├── router/index.ts         # Rutas SPA con guards requiresAuth / guestOnly
│   ├── services/stripeService.ts # Cliente seguro hacia /api/* (sin llaves secretas)
│   ├── stores/                 # Pinia: useUserStore y useGamificationStore
│   ├── types/                  # Contratos TypeScript estrictos
│   └── views/                  # 10 Vistas principales
├── docs/                       # SRS, Informe Técnico, Design System y Planes v0.1.0 - v0.11.0
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
4. **Verificar tipos y compilar para producción**:
   ```bash
   node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit
   npm run build
   ```
5. **Cloud Functions (opcional para producción Firebase Blaze)**:
   ```bash
   cd functions && npm install && npm run build
   ```
