# Plan de Desarrollo: `v0.9.0` — Expansión Curricular (4 Cursos), Teoría Interactiva y Motores de Videojuego

- **Versión Asociada**: `v0.9.0`
- **Etapa**: Pre-Release (`0.x.y` — antes de `1.0.0`)
- **Estado**: Completado ✅
- **Objetivo**: Reestructurar y expandir los cursos de **SuriLearn** para que sean más extensos y completos con teoría estructurada (Manual/Códice de Curso + Briefing de Inteligencia pre-misión), e incorporar **3 nuevos motores de videojuego interactivo** alineados con el concepto técnico de cada curso según la retroalimentación del docente.

---

## 1. Diagnóstico y Reestructuración Curricular (De 1 Unidad a 4 Cursos Completos)

### Curso 1: Ingeniería Social & Defensa Anti-Phishing (`unit_01`)
1. **`node_01` — Anatomía del Phishing y Typosquatting** (Teoría de cabeceras SMTP + Inspector de Correos + Caso interactivo).
2. **`node_02` — Smishing, Vishing y Fraude Móvil** (Teoría de ataques multicanal + Retos de SMS bancarios y llamadas de falso soporte).
3. **`node_03` — 🎮 VIDEOJUEGO: Firewall Arcade: Escudo de Paquetes** (`FirewallDefenseGame.vue`) — Defensa en tiempo real de 3 carriles contra paquetes maliciosos (SQLi, Malware, Spoofing) permitiendo tráfico HTTPS legítimo.
4. **`node_04` — 🏆 EXAMEN BOSS: Operación Caza-Phishers** (Evaluación integral + Ronda de Firewall).

### Curso 2: Criptografía, Contraseñas & Autenticación (`unit_02`)
1. **`node_05` — Entropía, Hashing y Fuerza Bruta** (Teoría de entropía de bits, diccionarios y salting + Simulador en vivo `PasswordTesterGame.vue`).
2. **`node_06` — Autenticación Multifactor (MFA) y Fatiga de Push** (Teoría de MFA Push Bombing, SIM Swapping y llaves FIDO2).
3. **`node_07` — 🎮 VIDEOJUEGO: Encripta el Mensaje: Fuerza Bruta** (`CryptoCrackerGame.vue`) — Decodificación criptográfica contrarreloj mediante pistas de frecuencia e inyección de llaves.
4. **`node_08` — 🏆 EXAMEN BOSS: El Guardián de la Bóveda** (Auditoría de credenciales + Desafío Criptográfico).

### Curso 3: Seguridad en Redes & Navegación Táctica (`unit_03` — *Nuevo*)
1. **`node_09` — Redes Wi-Fi Públicas, Evil Twin y ataques MitM** (Teoría de ARP Spoofing, puntos de acceso gemelos maliciosos y túneles VPN/TLS).
2. **`node_10` — 🎮 VIDEOJUEGO: Infiltración en la Red: Ruta Segura** (`NetworkMazeGame.vue`) — Videojuego táctico en cuadrícula 2D donde el jugador controla al paquete de datos de Suri (`WASD`/Flechas o D-Pad táctil), recolecta nodos de **Cifrado VPN** y **Llaves MFA**, y esquiva **Sniffers MitM** y **antenas Wi-Fi Evil Twin** hasta llegar al Servidor Seguro.
3. **`node_11` — Puertos, Cortafuegos y Filtrado de Tráfico** (Teoría de puertos críticos 22/80/443/3389 + Videojuego `FirewallDefenseGame.vue` en dificultad avanzada).
4. **`node_12` — 🏆 EXAMEN BOSS: Arquitecto Zero-Trust** (Auditoría de arquitectura de red + Misión táctica en el Laberinto de Red).

### Curso 4: Respuesta a Incidentes & Defensa Contra Malware (`unit_04` — *Nuevo*)
1. **`node_13` — Anatomía del Ransomware, Troyanos y Zero-Days** (Teoría de vectores de infección, macros maliciosas, doble extorsión y regla de respaldos 3-2-1).
2. **`node_14` — 🎮 VIDEOJUEGO: Comando SOC: Contención de Ransomware** (`IncidentCommandGame.vue`) — Simulador estratégico de Centro de Operaciones de Seguridad (SOC) en tiempo real donde un brote de Ransomware intenta propagarse por 6 servidores corporativos y el jugador debe aplicar el protocolo **NIST SP 800-61** en orden: **1. Aislar VLAN / Revocar IAM → 2. Purgar EDR → 3. Restaurar Backup 3-2-1**.
3. **`node_15` — Forense Digital y Continuidad del Negocio** (Teoría de triaje forense, preservación de memoria volátil RAM y contención).
4. **`node_16` — 🏆 EXAMEN BOSS: Director de Ciberdefensa (CISO)** (Simulación de crisis corporativa + Operación final en el Comando SOC).

---

## 2. Sistema Dual de Teoría Pedagógica

1. **Manual / Códice del Curso (`src/components/common/UnitTheoryModal.vue`)**:
   - Accesible desde el botón **"📖 Manual Teórico"** en la cabecera de cada curso en `LearnView.vue`.
   - Incluye 3 pestañas: **Marco Teórico** (conceptos detallados, ejemplos reales de ataque vs. defensa y puntos clave), **Temario & Juegos** (con acceso directo a cada misión) y **Reglas de Oro de Suri**.
2. **Briefing de Inteligencia Pre-Misión (`src/components/common/LessonTheoryBriefing.vue`)**:
   - Carrusel interactivo de diapositivas antes de iniciar los retos de cada lección, explicando la teoría necesaria para superar los ejercicios y videojuegos.

---

## 3. Archivos Creados y Modificados

- `src/types/gamification.ts`: Interfaces `TheorySlide`, `UnitTheorySection`, `UnitTheoryGuide` y extensión de `LearningNode` y `LearningUnit`.
- `src/types/exercises.ts`: Interfaces `FirewallDefenseExercise`, `NetworkMazeExercise` e `IncidentCommandExercise`.
- `src/components/common/LessonTheoryBriefing.vue`: Briefing interactivo de teoría previo a cada lección.
- `src/components/common/UnitTheoryModal.vue`: Modal del Códice/Manual completo por curso.
- `src/components/games/FirewallDefenseGame.vue`: Videojuego arcade de filtrado de paquetes en 3 carriles.
- `src/components/games/NetworkMazeGame.vue`: Videojuego táctico 2D de enrutamiento seguro con VPN y llaves MFA.
- `src/components/games/IncidentCommandGame.vue`: Videojuego estratégico de consola SOC contra propagación de Ransomware.
- `src/data/curriculum.ts`: 4 cursos completos (`16 lecciones`), guías teóricas completas (`UNIT_THEORY_GUIDES`), diapositivas de teoría por lección (`theorySlides`) y `buildAllLearningUnits()`.
- `src/composables/useFirestore.ts`: Soporte multicurso en `getLearningUnits()`.
- `src/views/LearnView.vue`: Selector de los 4 cursos, estadísticas del curso activo, tarjetas de misión con insignia `🎮 VIDEOJUEGO` y modal del Manual Teórico.
- `src/views/LessonView.vue`: Integración del Briefing Teórico pre-misión y renderizado de los 3 nuevos motores de videojuego.
