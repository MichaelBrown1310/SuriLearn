# Plan de Desarrollo: `v0.9.1` — Imágenes Oficiales de Suri (Sin Fondo) y Ranking Semanal Real en Aprender

- **Versión Asociada**: `v0.9.1`
- **Etapa**: Pre-Release (`0.x.y` — antes de `1.0.0`)
- **Estado**: Completado ✅
- **Objetivo**: Reemplazar todas las imágenes de Suri en videojuegos y manuales teóricos por los activos oficiales sin fondo de la carpeta `Suri/`, y conectar el bloque de **Ranking Semanal** de la vista de Aprender directamente a los usuarios reales de Firestore (igual que en la pestaña Ligas).

---

## 1. Cambios Implementados

1. **Activos Oficiales Sin Fondo desde `Suri/` (`src/utils/suriAssets.ts` y `public/suri-running.png`)**:
   - Se vincularon directamente las ilustraciones oficiales PNG sin fondo de la carpeta `Suri/`:
     - `running` → `Suri/Suri_pose_Corriendo.png` (Suri corriendo sin fondo para el Laberinto Táctico 2D).
     - `shield` → `Suri/Suri_pose_SentadoConLaptop.png` (Suri con laptop y escudo de seguridad para el Arcade Firewall En Vivo y el Resumen Ejecutivo de los Manuales Teóricos).
     - `idle` / `victory` → `Suri/Suri_pose_ParadoAlegre.png`.
     - `idea` → `Suri/Suri_pose_PensandoInterrogacion.png`.
     - `cool` → `Suri/Suri_pose_ParadGafasDeSol.png`.
     - `error` → `Suri/Suri_pose_TristeSentado.png`.
     - `sleeping` → `Suri/Suri_pose_AcostadoDurmiendo.png`.
2. **Arcade Firewall En Vivo (`src/components/games/FirewallDefenseGame.vue`)**:
   - Se incorporó la imagen oficial sin fondo de Suri tanto en el encabezado del HUD como en la torreta defensora del carril activo.
3. **Laberinto Táctico 2D (`src/components/games/NetworkMazeGame.vue`)**:
   - Se actualizó el sprite del jugador por `Suri/Suri_pose_Corriendo.png` con fondo transparente.
4. **Manuales Teóricos (`src/components/common/UnitTheoryModal.vue`)**:
   - La sección **Resumen Ejecutivo del Curso** en la pestaña **Marco Teórico** ahora carga la imagen local sin fondo `Suri/Suri_pose_SentadoConLaptop.png`.
5. **Ranking Semanal con Usuarios Reales (`src/views/LearnView.vue`)**:
   - Se eliminaron los nombres ficticios estáticos (*"Santiago R."*, *"Valeria M."*) y se conectó el bloque de **Ranking Semanal** a `useFirestore().getLeaderboard` y `subscribeToLeaderboard`, mostrando en tiempo real a los usuarios registrados en la liga actual igual que en `LeaderboardView.vue`.
