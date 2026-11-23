<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '../../stores/useUserStore';
import { evaluateDiagnosticAnswers } from '../../utils/gamificationEngine';
import { DiagnosticProfile } from '../../types/gamification';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectCourse', courseIndex: number): void;
}>();

const userStore = useUserStore();
const suriIdeaImg = getSuriImage('idea');
const suriShieldImg = getSuriImage('shield');

interface DiagnosticQuestion {
  id: string;
  area: 'phishing' | 'crypto_firewall' | 'network_vpn' | 'soc_ransomware';
  badge: string;
  prompt: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'dq_1',
    area: 'phishing',
    badge: '1 · Phishing & DNS',
    prompt: 'Recibes un enlace: https://pagos.banco-nacional.com.validar-acceso.xyz/login. ¿Qué dominio controla realmente la página?',
    options: [
      { id: 'a', text: 'banco-nacional.com', isCorrect: false },
      { id: 'b', text: 'validar-acceso.xyz (el dominio raíz antes de /login)', isCorrect: true },
      { id: 'c', text: 'Es seguro porque usa candado HTTPS', isCorrect: false },
    ],
  },
  {
    id: 'dq_2',
    area: 'crypto_firewall',
    badge: '2 · Identidad y Claves',
    prompt: 'Según NIST SP 800-63B, ¿qué credencial ofrece mayor resistencia para proteger tu correo o cuenta corporativa?',
    options: [
      { id: 'a', text: 'Admin2026! cambiada cada 30 días', isCorrect: false },
      { id: 'b', text: 'Frase larga inesperada (ej. VolcanOrbita$74Cobalto) + MFA', isCorrect: true },
      { id: 'c', text: 'Misma contraseña con letras sustituidas (P@ssw0rd)', isCorrect: false },
    ],
  },
  {
    id: 'dq_3',
    area: 'network_vpn',
    badge: '3 · Redes y Wi-Fi',
    prompt: 'Necesitas aprobar una transferencia o entrar al ERP desde el Wi-Fi abierto de un aeropuerto. ¿Cuál es la acción segura?',
    options: [
      { id: 'a', text: 'Conectarte al Wi-Fi gratis "Aeropuerto_VIP_5G" sin VPN', isCorrect: false },
      { id: 'b', text: 'Activar túnel VPN cifrado o usar datos móviles antes de iniciar sesión', isCorrect: true },
      { id: 'c', text: 'Navegar en modo incógnito del navegador', isCorrect: false },
    ],
  },
  {
    id: 'dq_4',
    area: 'soc_ransomware',
    badge: '4 · Respuesta a Incidentes',
    prompt: 'Un archivo .pdf.exe comienza a renombrar documentos compartidos en tu equipo. ¿Cuál debe ser tu PRIMER paso?',
    options: [
      { id: 'a', text: 'Desconectar el equipo de la red / Wi-Fi inmediatamente y alertar a TI/SOC', isCorrect: true },
      { id: 'b', text: 'Reiniciar la computadora varias veces para detener el proceso', isCorrect: false },
      { id: 'c', text: 'Abrir los backups en la misma carpeta compartida para verificarlos', isCorrect: false },
    ],
  },
];

const stepIndex = ref<number>(-1); // -1 = profile select, 0..3 = questions, 4 = summary
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
              Diagnóstico Adaptativo
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
            <img :src="suriIdeaImg" alt="Suri evaluando ruta" class="w-14 h-14 object-contain shrink-0" />
            <p class="text-xs text-on-surface-variant leading-relaxed font-medium">
              Responde <strong class="text-on-surface">4 preguntas rápidas</strong> y adaptaré tu punto de partida según tu rol y áreas a reforzar.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              1. ¿Cuál es tu enfoque principal?
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
            <span>Comenzar Evaluación (4 Preguntas)</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </template>

        <!-- Steps 0..3: Interactive Diagnostic Questions -->
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

        <!-- Step 4: Personalized Result -->
        <template v-else-if="diagnosticResult">
          <div class="flex flex-col items-center text-center gap-2">
            <img :src="suriShieldImg" alt="Diagnóstico completado" class="w-20 h-20 object-contain" />
            <span class="px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-black uppercase">
              Nivel {{ diagnosticResult.levelLabel }} · {{ diagnosticResult.score }}/{{ diagnosticResult.totalQuestions }} Aciertos
            </span>
            <h4 class="text-base font-black text-on-surface mt-1">
              Ruta Recomendada Lista
            </h4>
          </div>

          <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 flex flex-col gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-primary">
              Curso Sugerido Para Ti
            </span>
            <p class="text-sm font-black text-on-surface leading-snug">
              {{ diagnosticResult.recommendedCourseTitle }}
            </p>
            <div v-if="diagnosticResult.weakAreas.length > 0" class="pt-2 border-t border-outline-variant/25">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant block mb-1">
                Áreas prioritarias a reforzar:
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
              ¡Excelente base! Puedes comenzar directamente por simuladores tácticos avanzados.
            </p>
          </div>

          <button
            type="button"
            :disabled="isSaving"
            class="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider btn-tactile-primary flex items-center justify-center gap-1.5"
            @click="goToRecommendedCourse"
          >
            <span>Ir al Curso Recomendado</span>
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
