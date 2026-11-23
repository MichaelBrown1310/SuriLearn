# Índice de Planes de Desarrollo por Versión — SuriLearn

Esta carpeta almacena todos los **Planes de Ingeniería y Desarrollo** utilizados para construir cada versión de **SuriLearn** durante la fase **Pre-1.0 (`0.x.y`)** y posteriores. Cada avance de versión en el repositorio está vinculado a su respectivo documento de planificación para garantizar trazabilidad total entre el diseño y el código entregado.

---

## Tabla de Trazabilidad de Planes y Versiones

<!-- PLANS_TABLE_START -->
| Versión | Fecha | Estado | Resumen del Avance | Documento del Plan |
|---|---|---|---|---|
| **v0.12.0** | 2026-11-23 | Completado | Personalizacion adaptativa, B2B real con RBAC, WCAG 2.1 AA, PWA, lazy-loading y pruebas Vitest | [PLAN_v0.12.0.md](./PLAN_v0.12.0.md) |
| **v0.11.0** | 2026-11-23 | Completado | Endurecimiento P0 de seguridad, estabilidad en minijuegos, vidas y login dual | [PLAN_v0.11.0.md](./PLAN_v0.11.0.md) |
| **v0.10.0** | 2026-10-19 | Completado | Adicion de Cursos 5 y 6 con 2 nuevos videojuegos y contador de rachas dinamico por dia | [PLAN_v0.10.0.md](./PLAN_v0.10.0.md) |
| **v0.9.2** | 2026-10-19 | Completado | Diseno 100% responsive sin desbordamiento de texto en Consola SOC en tiempo real | [PLAN_v0.9.2.md](./PLAN_v0.9.2.md) |
| **v0.9.1** | 2026-10-19 | Completado | Imagenes oficiales de Suri sin fondo desde carpeta Suri y Ranking Semanal con usuarios reales en Aprender | [PLAN_v0.9.1.md](./PLAN_v0.9.1.md) |
| **v0.9.0** | 2026-10-19 | Completado | Expansion a 4 cursos completos con teoria interactiva y 3 nuevos motores de videojuego | [PLAN_v0.9.0.md](./PLAN_v0.9.0.md) |
| **v0.8.0** | 2026-10-19 | Completado | Modo Oscuro *Dark Sentinel*, reorganización (`docs/`, `prototypes/`, `docs/plans/`), sanitización para GitHub y automatización de versionamiento Pre-1.0 | [PLAN_v0.8.0_DARK_SENTINEL_ORGANIZACION_Y_VERSIONAMIENTO.md](./PLAN_v0.8.0_DARK_SENTINEL_ORGANIZACION_Y_VERSIONAMIENTO.md) |
| **v0.7.0** | 2026-10-19 | Completado | Panel Corporativo Multi-Tenant PYME (B2B), Analítica CISO con Chart.js y Pasarela Stripe Checkout | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v070](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v070--panel-corporativo-b2b-pyme-y-stripe-checkout) |
| **v0.6.0** | 2026-10-19 | Completado | Vistas principales SPA B2C (`Welcome`, `Login`, `Onboarding`, `Learn`, `Lesson`, `Leaderboard`, `Shop`, `Profile`) y Router | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v060](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v060--vistas-principales-b2c-y-enrutamiento-spa) |
| **v0.5.0** | 2026-10-19 | Completado | Motor de 6 Minijuegos Interactivos de Ciberseguridad, HUD Superior y Modales Pedagógicos de 3 Pasos | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v050](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v050--motor-de-6-minijuegos-interactivos-y-componentes-comunes) |
| **v0.4.0** | 2026-10-19 | Completado | Motor Cuantitativo de Gamificación en Pinia (`useUserStore`, `useGamificationStore`) y Currículo del Módulo 1 | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v040](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v040--stores-reactivos-pinia-y-curriculo-modulo-1) |
| **v0.3.0** | 2026-10-19 | Completado | Contratos TypeScript, Integración Firebase BaaS (Spark $0), Caché TTL + IndexedDB y Reglas Zero Trust | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v030](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v030--contratos-typescript-firebase-baas-y-seguridad-zero-trust) |
| **v0.2.0** | 2026-10-19 | Completado | Sistema de Diseño *Suri Sentinel* (Táctil 2.5D), Mascota Suri (8 poses) y 7 Prototipos Stitch UI | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v020](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v020--sistema-de-diseno-suri-sentinel-y-prototipos-stitch-ui) |
| **v0.1.0** | 2026-10-19 | Completado | Configuración e Inicialización Base del Proyecto (Vue 3, Vite, TypeScript, Tailwind CSS, Ionic) | [PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v010](./PLAN_v0.1.0_a_v0.7.0_ARQUITECTURA_Y_MODULOS_MVP.md#plan-v010--configuracion-base-del-proyecto-bootstrap) |
<!-- PLANS_TABLE_END -->

---

## ¿Cómo se registran nuevos planes en cada versión?

1. **Antes o durante el desarrollo de una nueva funcionalidad**:
   - Se crea un archivo en `docs/plans/PLAN_v0.x.y_<NOMBRE>.md` tomando como base [`TEMPLATE_PLAN_VERSION.md`](./TEMPLATE_PLAN_VERSION.md) (o se genera automáticamente al correr el script de release).
2. **Al cerrar y versionar el avance (`0.x.y`)**:
   - Ejecuta:
     ```bash
     npm run release:patch -- "Resumen del avance"
     # o para un bloque funcional nuevo antes de 1.0:
     npm run release:minor -- "Resumen del nuevo modulo"
     ```
   - El script [`scripts/release.mjs`](../../scripts/release.mjs) verifica o genera automáticamente el documento del plan en `docs/plans/PLAN_v0.x.y.md`, lo añade a la tabla superior de este índice y lo enlaza en [`CHANGELOG.md`](../../CHANGELOG.md).
3. **Lanzamiento de la versión `1.0.0`**:
   - Todas las versiones se mantienen bajo el esquema `0.x.y` hasta que autorices explícitamente el cierre de la versión `1.0.0` mediante `npm run release:v1 -- "Lanzamiento Oficial SuriLearn v1.0.0"`.
