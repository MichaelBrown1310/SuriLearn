<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '../../stores/useUserStore';
import { evaluateDiagnosticAnswers } from '../../utils/gamificationEngine';
import { DiagnosticProfile } from '../../types/gamification';
import SuriMascotAnimated from './SuriMascotAnimated.vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectCourse', courseIndex: number): void;
}>();

const userStore = useUserStore();

type DiagnosticArea =
  | 'basics_phishing'
  | 'social_eng'
  | 'passwords_mfa'
  | 'mobile_malware'
  | 'firewall_ports'
  | 'network_vpn'
  | 'ai_bec'
  | 'soc_ransomware'
  | 'owasp_devsecops'
  | 'forensic_ciso';

interface DiagnosticQuestion {
  id: string;
  area: DiagnosticArea;
  badge: string;
  prompt: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'dq_1',
    area: 'basics_phishing',
    badge: '1 / 10 · Phishing & Dominios',
    prompt:
      'Recibes un enlace: https://pagos.banco-nacional.com.validar-acceso.xyz/login. ¿Qué dominio controla realmente la página?',
    options: [
      { id: 'a', text: 'banco-nacional.com', isCorrect: false },
      { id: 'b', text: 'validar-acceso.xyz (el dominio raíz antes de /login)', isCorrect: true },
      { id: 'c', text: 'Es seguro porque usa candado HTTPS', isCorrect: false },
    ],
  },
  {
    id: 'dq_2',
    area: 'social_eng',
    badge: '2 / 10 · Adjuntos e Ingeniería Social',
    prompt:
      'Llega un correo urgente de supuesta facturación con el archivo adjunto "Factura_2026.pdf.exe". ¿Cómo debes actuar?',
    options: [
      {
        id: 'a',
        text: 'Es un programa ejecutable (.exe) disfrazado de PDF: no abrir y reportar',
        isCorrect: true,
      },
      { id: 'b', text: 'Abrirlo rápido porque empieza con "Factura" y tiene .pdf', isCorrect: false },
      { id: 'c', text: 'Reenviarlo al grupo del equipo para preguntar si alguien lo conoce', isCorrect: false },
    ],
  },
  {
    id: 'dq_3',
    area: 'passwords_mfa',
    badge: '3 / 10 · Contraseñas y MFA',
    prompt:
      'Según NIST SP 800-63B, ¿qué credencial ofrece mayor resistencia para proteger tu correo o cuenta corporativa?',
    options: [
      { id: 'a', text: 'Admin2026! cambiada cada 30 días', isCorrect: false },
      {
        id: 'b',
        text: 'Frase larga inesperada (ej. VolcanOrbita$74Cobalto) + MFA',
        isCorrect: true,
      },
      { id: 'c', text: 'Misma contraseña con letras sustituidas (P@ssw0rd)', isCorrect: false },
    ],
  },
  {
    id: 'dq_4',
    area: 'mobile_malware',
    badge: '4 / 10 · Seguridad Móvil',
    prompt:
      'Una app gratuita de "Linterna" solicita permisos para leer tus SMS, Contactos y Servicio de Accesibilidad. ¿Qué decides?',
    options: [
      { id: 'a', text: 'Aceptar todo para poder probar la app', isCorrect: false },
      {
        id: 'b',
        text: 'Denegar e desinstalar: pide permisos críticos ajenos a su función',
        isCorrect: true,
      },
      { id: 'c', text: 'Permitir solo SMS porque es un permiso ligero', isCorrect: false },
    ],
  },
  {
    id: 'dq_5',
    area: 'firewall_ports',
    badge: '5 / 10 · Firewall y Puertos',
    prompt:
      '¿Qué recomendación de Firewall protege mejor los puertos administrativos críticos SSH (:22), RDP (:3389) y SMB (:445)?',
    options: [
      {
        id: 'a',
        text: 'Bloquear su exposición pública en Internet y permitirlos solo detrás de VPN',
        isCorrect: true,
      },
      { id: 'b', text: 'Dejarlos abiertos en 0.0.0.0/0 para trabajar desde cualquier café', isCorrect: false },
      { id: 'c', text: 'Desactivar el Firewall interno para reducir latencia', isCorrect: false },
    ],
  },
  {
    id: 'dq_6',
    area: 'network_vpn',
    badge: '6 / 10 · Redes y Wi-Fi',
    prompt:
      'Necesitas aprobar una transferencia o entrar al ERP desde el Wi-Fi abierto de un aeropuerto. ¿Cuál es la acción segura?',
    options: [
      { id: 'a', text: 'Conectarte al Wi-Fi gratis "Aeropuerto_VIP_5G" sin VPN', isCorrect: false },
      {
        id: 'b',
        text: 'Activar túnel VPN cifrado o usar datos móviles antes de iniciar sesión',
        isCorrect: true,
      },
      { id: 'c', text: 'Navegar en modo incógnito del navegador', isCorrect: false },
    ],
  },
  {
    id: 'dq_7',
    area: 'ai_bec',
    badge: '7 / 10 · Fraude BEC y Deepfakes IA',
    prompt:
      'Recibes por WhatsApp una nota de voz que suena exactamente como la Directora pidiendo un giro confidencial inmediato. ¿Qué haces?',
    options: [
      { id: 'a', text: 'Transferir de inmediato porque reconociste su voz', isCorrect: false },
      {
        id: 'b',
        text: 'Verificar fuera de banda (llamada interna / palabra clave) ante posible Deepfake/BEC',
        isCorrect: true,
      },
      { id: 'c', text: 'Responder al mismo chat pidiendo la cuenta bancaria', isCorrect: false },
    ],
  },
  {
    id: 'dq_8',
    area: 'soc_ransomware',
    badge: '8 / 10 · Respuesta a Incidentes SOC',
    prompt:
      'Detectas un ataque de Ransomware cifrando carpetas compartidas de la oficina. ¿Cuál es el PRIMER paso del protocolo NIST?',
    options: [
      {
        id: 'a',
        text: 'Aislar el equipo de la red/VLAN inmediatamente antes de purgar EDR y restaurar Backup 3-2-1',
        isCorrect: true,
      },
      { id: 'b', text: 'Conectar un disco duro externo con backups al equipo infectado', isCorrect: false },
      { id: 'c', text: 'Pagar el rescate para recuperar las carpetas más rápido', isCorrect: false },
    ],
  },
  {
    id: 'dq_9',
    area: 'owasp_devsecops',
    badge: '9 / 10 · Seguridad Web OWASP',
    prompt:
      '¿Qué práctica de código detiene de raíz la Inyección SQL (OWASP A03) en consultas a bases de datos?',
    options: [
      { id: 'a', text: 'Ocultar el formulario de login detrás de un botón en JavaScript', isCorrect: false },
      {
        id: 'b',
        text: 'Usar Consultas Parametrizadas (Prepared Statements con ? o $1)',
        isCorrect: true,
      },
      { id: 'c', text: 'Concatenar las variables con comillas simples y validar solo en HTML', isCorrect: false },
    ],
  },
  {
    id: 'dq_10',
    area: 'forensic_ciso',
    badge: '10 / 10 · Forense RAM y Threat Hunting',
    prompt:
      'En memoria RAM observas que "winword.exe" lanzó "powershell.exe -enc ..." con conexión saliente a una IP extranjera :4444. ¿Qué indica?',
    options: [
      { id: 'a', text: 'Actualización rutinaria de formato de Word', isCorrect: false },
      {
        id: 'b',
        text: 'Indicador de Compromiso (IoC): macro maliciosa ejecutando payload y canal C2',
        isCorrect: true,
      },
      { id: 'c', text: 'Tráfico DNS corporativo saludable', isCorrect: false },
    ],
  },
];

const stepIndex = ref<number>(-1); // -1 = profile select, 0..9 = questions, 10 = summary
const profileType = ref<'individual' | 'employee' | 'tech'>('individual');
const selectedAnswers = ref<Record<string, boolean>>({});
const diagnosticResult = ref<DiagnosticProfile | null>(null);
const isSaving = ref<boolean>(false);

const currentQuestion = computed(() => {
  if (stepIndex.value >= 0 && stepIndex.value < QUESTIONS.length) {
    return QUESTIONS[stepIndex.value];
  }
  return null;
});

function startQuiz() {
  selectedAnswers.value = {};
  diagnosticResult.value = null;
  stepIndex.value = 0;
}

async function selectOption(option: { id: string; text: string; isCorrect: boolean }) {
  const q = currentQuestion.value;
  if (!q) return;
  selectedAnswers.value[q.id] = option.isCorrect;

  if (stepIndex.value < QUESTIONS.length - 1) {
    stepIndex.value += 1;
  } else {
    const payload = QUESTIONS.map((item) => ({
      area: item.area,
      isCorrect: !!selectedAnswers.value[item.id],
    }));
    const result = evaluateDiagnosticAnswers(payload, profileType.value);
    diagnosticResult.value = result;
    stepIndex.value = QUESTIONS.length;
    isSaving.value = true;
    try {
      await userStore.saveDiagnosticProfile(result);
    } finally {
      isSaving.value = false;
    }
  }
}

function goToRecommendedCourse() {
  if (diagnosticResult.value) {
    emit('selectCourse', diagnosticResult.value.recommendedCourseIndex);
  }
  emit('close');
}

function resetAndClose() {
  stepIndex.value = -1;
  emit('close');
}
</script>

<template>
  <Transition name="fade-scale">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm select-none overflow-y-auto"
      @click.self="resetAndClose"
    >
      <div class="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4 my-auto text-left">
        <!-- Header -->
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/25">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px] icon-filled">tune</span>
            <h3 class="text-sm font-black uppercase tracking-wider text-on-surface">
              Diagnóstico de Nivelación (10 Preguntas)
            </h3>
          </div>
          <button
            type="button"
            aria-label="Cerrar diagnóstico"
            class="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            @click="resetAndClose"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <!-- Step -1: Select Role Context -->
        <template v-if="stepIndex === -1">
          <div class="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30">
            <SuriMascotAnimated pose="idea" size="sm" :show-shadow="false" />
            <p class="text-xs text-on-surface-variant leading-relaxed font-medium">
              Responde <strong class="text-on-surface">10 preguntas progresivas</strong> (de lo básico a SOC/Forense) para ubicarte en el curso exacto de los <strong class="text-primary">15 cursos secuenciales</strong>.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              ¿Cuál es tu enfoque principal?
            </span>

            <button
              type="button"
              class="p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3"
              :class="profileType === 'individual' ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-surface-container-low'"
              @click="profileType = 'individual'"
            >
              <span class="material-symbols-outlined text-primary text-[22px]">person</span>
              <div>
                <p class="text-xs font-black text-on-surface">Usuario Individual (B2C)</p>
                <p class="text-[11px] text-on-surface-variant">Proteger banca móvil, redes sociales, Wi-Fi y claves personales.</p>
              </div>
            </button>

            <button
              type="button"
              class="p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3"
              :class="profileType === 'employee' ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-surface-container-low'"
              @click="profileType = 'employee'"
            >
              <span class="material-symbols-outlined text-primary text-[22px]">domain</span>
              <div>
                <p class="text-xs font-black text-on-surface">Colaborador / Gestor PYME (B2B)</p>
                <p class="text-[11px] text-on-surface-variant">Prevenir fraudes BEC, facturas maliciosas y ransomware corporativo.</p>
              </div>
            </button>

            <button
              type="button"
              class="p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3"
              :class="profileType === 'tech' ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-surface-container-low'"
              @click="profileType = 'tech'"
            >
              <span class="material-symbols-outlined text-primary text-[22px]">terminal</span>
              <div>
                <p class="text-xs font-black text-on-surface">Perfil Técnico / TI & DevSecOps</p>
                <p class="text-[11px] text-on-surface-variant">Parcheo OWASP, respuesta SOC e investigación forense.</p>
              </div>
            </button>
          </div>

          <button
            type="button"
            class="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider btn-tactile-primary flex items-center justify-center gap-1.5"
            @click="startQuiz"
          >
            <span>Comenzar Evaluación (10 Preguntas)</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </template>

        <!-- Steps 0..9: Interactive Diagnostic Questions -->
        <template v-else-if="currentQuestion">
          <div class="flex items-center justify-between text-[11px] font-black text-primary uppercase">
            <span>{{ currentQuestion.badge }}</span>
            <span>{{ stepIndex + 1 }} / {{ QUESTIONS.length }}</span>
          </div>

          <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: `${((stepIndex + 1) / QUESTIONS.length) * 100}%` }"
            ></div>
          </div>

          <p class="text-sm font-extrabold text-on-surface leading-snug">
            {{ currentQuestion.prompt }}
          </p>

          <div class="flex flex-col gap-2.5">
            <button
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              type="button"
              class="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 hover:border-primary text-left text-xs font-bold text-on-surface transition-all"
              @click="selectOption(opt)"
            >
              {{ opt.text }}
            </button>
          </div>
        </template>

        <!-- Step 10: Personalized Placement Result -->
        <template v-else-if="diagnosticResult">
          <div class="flex flex-col items-center text-center gap-2">
            <SuriMascotAnimated pose="victory" size="md" :show-shadow="false" />
            <span class="px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-black uppercase">
              Nivel {{ diagnosticResult.levelLabel }} · {{ diagnosticResult.score }}/{{ diagnosticResult.totalQuestions }} Aciertos
            </span>
            <h4 class="text-base font-black text-on-surface mt-1">
              Punto de Inicio Asignado
            </h4>
          </div>

          <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 flex flex-col gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-primary">
              Ubicación en la Escalera de 15 Cursos
            </span>
            <p class="text-sm font-black text-on-surface leading-snug">
              {{ diagnosticResult.recommendedCourseTitle }}
            </p>
            <p class="text-[11px] text-on-surface-variant leading-relaxed">
              Tu nivel inicial te ubica en el <strong class="text-on-surface">Curso {{ diagnosticResult.recommendedCourseIndex + 1 }}</strong> (los cursos anteriores quedan acreditados para repaso; desde aquí el avance es estrictamente secuencial).
            </p>
            <div v-if="diagnosticResult.weakAreas.length > 0" class="pt-2 border-t border-outline-variant/25">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant block mb-1">
                Áreas a reforzar ({{ diagnosticResult.weakAreas.length }}):
              </span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="area in diagnosticResult.weakAreas"
                  :key="area"
                  class="px-2 py-0.5 rounded-full bg-error/15 text-error text-[10px] font-extrabold"
                >
                  {{ area }}
                </span>
              </div>
            </div>
            <p v-else class="text-[11px] font-bold text-shield-green">
              ¡Dominio sobresaliente! Comienzas directo en los retos avanzados de ciberseguridad.
            </p>
          </div>

          <button
            type="button"
            :disabled="isSaving"
            class="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider btn-tactile-primary flex items-center justify-center gap-1.5"
            @click="goToRecommendedCourse"
          >
            <span>Ir al Curso {{ diagnosticResult.recommendedCourseIndex + 1 }}</span>
            <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
          </button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
