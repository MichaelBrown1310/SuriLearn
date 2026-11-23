# Plan de Desarrollo `v0.17.0` — Despliegue Web Público en Firebase Hosting y APK Android TWA Firmada

- **Versión Objetivo**: `v0.17.0`
- **Fecha**: 2026-11-23
- **Estado**: Completado
- **Fase**: Desarrollo Pre-1.0

---

## 1. Objetivo del Avance

Publicar la plataforma **SuriLearn** en una dirección web pública accesible desde cualquier dispositivo y empaquetar una aplicación móvil **Android `.apk` firmada** lista para descargar, instalar y compartir:

1. **Despliegue Público en Firebase Hosting (`https://surilearn-9b60e.web.app`)**:
   - Adaptación de [`firebase.json`](../../firebase.json) al plan gratuito **Spark** con enrutamiento SPA (`** -> /index.html`), cabeceras explícitas `application/json` para `/.well-known/assetlinks.json` y `no-cache` para `/sw.js`, preservando intacta la configuración Blaze con Cloud Functions en [`firebase.blaze.json`](../../firebase.blaze.json).
   - Actualización de [`public/sw.js`](../../public/sw.js) (`CACHE_NAME = 'surilearn-v0.17.0'`), excluyendo `/api/`, `/.well-known/` y `/downloads/` del caché del Service Worker.
   - Generación de iconos cuadrados proporcionales sobre fondo `#FFF8F1` (`public/suri-icon-192.png` y `public/suri-icon-512.png`) e integración en [`public/manifest.webmanifest`](../../public/manifest.webmanifest).

2. **Aplicación Android TWA Firmada (`android-twa/`, `com.surilearn.app`, v2-signed)**:
   - Proyecto Gradle Android (`com.android.application` `8.13.0`, `compileSdk 36`, `targetSdk 36`, `minSdk 24`, `com.google.androidbrowserhelper:androidbrowserhelper:2.6.2`) apuntando a `https://surilearn-9b60e.web.app/welcome` con pantalla de carga personalizada (`splash.png`), colores oficiales SuriLearn (`#5F4030`, `#161311`, `#FFF8F1`) y soporte `WebViewFallbackActivity`.
   - Verificación criptográfica **Digital Asset Links** (`public/.well-known/assetlinks.json`) firmada con huella SHA-256 `F4:F7:56:8D:F1:1A:8A:AD:F6:54:98:1B:1E:61:55:F9:A7:51:E9:55:09:B0:81:79:15:C2:1B:18:17:76:8B:6B` (almacenando el keystore `.jks` fuera del repositorio y bloqueado en `.gitignore`).

3. **Descarga Directa y Compartible de la APK**:
   - Alojamiento público del binario firmado `SuriLearn-v0.17.0.apk` (`3,749,917` bytes) en GitHub (`https://github.com/MichaelBrown1310/SuriLearn/raw/main/releases/SuriLearn-v0.17.0.apk`) para superar la restricción de ejecutables del plan Spark de Firebase Hosting.
   - Botón `"Descargar App Android (.APK)"` integrado en [`WelcomeView.vue`](../../src/views/WelcomeView.vue) (oculto automáticamente cuando ya corre dentro de la app instalada en modo `standalone` / TWA).

---

## 2. Verificación Ejecutada

- `apksigner.bat verify --verbose --print-certs` → `Verifies` (`APK Signature Scheme v2: true`, SHA-256 `f4f7568df11a8aadf654981b1e6155f9a751e95509b0817915c21b1817768b6b`, `APKSIGNER_EXIT=0`, `3,749,917` bytes).
- `node ./node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → Exit `0`.
- `node ./node_modules/vitest/vitest.mjs run` → Exit `0` (`4` archivos, `20/20` pruebas aprobadas).
- `node ./node_modules/vite/bin/vite.js build` → Exit `0` (`172` módulos transformados, `REAL_DIST_SECRET_HITS=0`).
- `firebase-tools deploy --only hosting --project surilearn-9b60e` → Exit `0` (`46` archivos).
- Verificación HTTPS en vivo:
  - `https://surilearn-9b60e.web.app/` → HTTP `200` (`HAS_SURILEARN=True`).
  - `https://surilearn-9b60e.web.app/.well-known/assetlinks.json` → HTTP `200`, `Content-Type: application/json`, paquete `com.surilearn.app` y huella SHA-256 coincidentes.
