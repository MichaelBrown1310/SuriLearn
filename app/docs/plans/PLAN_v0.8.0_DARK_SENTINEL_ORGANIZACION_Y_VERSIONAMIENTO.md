# Plan de Desarrollo `v0.8.0` — Modo Oscuro *Dark Sentinel*, Organización del Repositorio y Versionamiento Pre-1.0

- **Versión Objetivo**: `v0.8.0`
- **Fecha**: 2026-10-19
- **Estado**: Completado
- **Repositorio Destino**: `https://github.com/MichaelBrown1310/stitch_surilearn_gamified_app`

---

## 1. Contexto y Objetivos de la Versión `v0.8.0`

1. **Sistema de Tema Dual (Modo Claro Canónico + Modo Oscuro *Dark Sentinel*)**:
   - Implementar soporte reactivo y persistente para modo oscuro cálido inspirado en tonos carbón tierra y café ceniza (`#161311`, `#231D19`, `#2B241F`, `#E1A653`), evitando fatiga visual y manteniendo la identidad táctil 2.5D de Suri.
   - Optimizar los contenedores maestros (`view-master-container`, `header-content-wrapper`, `shop-grid`) para visualización fluida tanto en dispositivos móviles como en pantallas de escritorio anchas.
2. **Organización Estructural del Repositorio y Sanitización para GitHub**:
   - Excluir `node_modules/`, `dist/` y `.env` mediante `.gitignore`.
   - Eliminar claves secretas hardcodeadas (`rk_test_...`) en `vite.config.ts` y `src/services/stripeService.ts` para cumplir con **GitHub Push Protection**, manteniendo las credenciales exclusivamente en `.env` local.
   - Estructurar la documentación de ingeniería en `docs/`, los planes por versión en `docs/plans/` y los prototipos HTML de Stitch en `prototypes/`.
3. **Sistema de Versionamiento Pre-1.0 (`0.x.y`) y Trazabilidad de Planes**:
   - Reconstruir el historial de Git limpio desde `v0.1.0` hasta `v0.8.0`.
   - Crear `CHANGELOG.md`, `README.md` y el automatizador `scripts/release.mjs` que registra cada cambio y su plan asociado en `docs/plans/` antes de llegar a la versión `1.0.0`.

---

## 2. Cambios Implementados en `v0.8.0`

### 2.1 Tema *Dark Sentinel* y Adaptabilidad UI
- `src/composables/useTheme.ts`: Composable reactivo con detección de preferencia del sistema (`prefers-color-scheme: dark`), persistencia en `localStorage` (`surilearn_theme_mode`) y sincronización de la clase `.dark` en `<html>` y `<body>`.
- `src/theme/variables.css` y `src/style.css`: Definición de tokens CSS semánticos para modo claro y modo oscuro *Dark Sentinel*, junto con sombras 2.5D adaptativas.
- Actualización de vistas y componentes (`HeaderHud.vue`, `SidebarNav.vue`, `AdminAnalytics.vue`, `LearnView.vue`, `LessonView.vue`, `LeaderboardView.vue`, `ShopView.vue`, `ProfileView.vue`, `OrganizationDashboardView.vue`, `TabsLayout.vue`) para consumir los tokens reactivos de tema y layout responsivo.

### 2.2 Organización de Documentación y Planes (`docs/` y `prototypes/`)
- `docs/DOCUMENTO_PROYECTO_TI_SURILEARN.md`: Especificación integral de ingeniería de software (SRS, XP + Crystal Clear, arquitectura, algoritmos y matriz de pruebas).
- `docs/INFORME_TECNICO_Y_MARCO_TEORICO.md`: Auditoría de arquitectura, stack tecnológico y fundamentación teórica (Octalysis, Fogg, NIST SP 800-63B).
- `docs/DESIGN_SURI_SENTINEL.md`: Manual de identidad y sistema de diseño táctil 2.5D.
- `docs/plans/`: Carpeta dedicada para almacenar el plan de cada versión (`README.md`, `PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md`, `PLAN_v0.8.0_DARK_SENTINEL_ORGANIZACION_Y_VERSIONAMIENTO.md`, `TEMPLATE_PLAN_VERSION.md`).
- `prototypes/`: Agrupación de los 7 prototipos originales de Stitch UI.

### 2.3 Automatización de Versiones Pre-1.0
- `scripts/release.mjs`: Script CLI para incrementar versiones `patch` (`0.8.x`) o `minor` (`0.9.0`), generar/vincular el documento de plan en `docs/plans/`, actualizar `CHANGELOG.md` y crear commits + tags SemVer, con bloqueo de seguridad para no pasar a `1.0.0` hasta que el usuario ejecute explícitamente `npm run release:v1`.

---

## 3. Verificación Ejecutada
- Compilación limpia con `npm run build` (`vue-tsc && vite build`).
- Auditoría de `git ls-files` confirmando ausencia de `node_modules/`, `dist/`, `.env` y claves `rk_test_`.
- Sincronización completa de commits y tags (`v0.1.0` a `v0.8.0`) con el repositorio remoto en GitHub.
