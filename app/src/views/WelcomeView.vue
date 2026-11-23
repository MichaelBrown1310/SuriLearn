<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/useUserStore';
import SuriMascotAnimated from '../components/common/SuriMascotAnimated.vue';
import { SuriPose } from '../types/exercises';

const router = useRouter();
const userStore = useUserStore();
const isStandaloneApp = ref<boolean>(
  typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true)
);

const currentPose = ref<SuriPose>('idle');
const showBubble = ref<boolean>(false);
const bubbleMessage = ref<string>('¡Ojos abiertos, centinela! 👀');

const poseCycle: SuriPose[] = ['ok', 'wink', 'cool', 'shield', 'idea', 'idle'];
const messages = [
  '¡Ojos abiertos, centinela! 👀',
  '¡Listo para blindar tu red! 🛡️',
  '¿Hueles ese phishing sospechoso? 🐾',
  '¡3 minutos al día hacen la diferencia! ⚡',
  '¡Nueva Zona Arcade lista para ti! 🎮',
  '¡Aprender seguridad puede ser divertido! 🔥',
];
let msgIdx = 0;
let bubbleTimer: any = null;

function handleMascotClick() {
  msgIdx = (msgIdx + 1) % messages.length;
  currentPose.value = poseCycle[msgIdx % poseCycle.length];
  bubbleMessage.value = messages[msgIdx];
  showBubble.value = true;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    showBubble.value = false;
    currentPose.value = 'idle';
  }, 2400);
}

async function handleGoogleLogin() {
  const success = await userStore.loginWithGoogle();
  if (success) {
    router.push('/tabs/learn');
  }
}

function goToOnboarding() {
  router.push('/onboarding');
}

function goToLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col justify-between max-w-lg mx-auto px-margin pt-safe pb-safe select-none">
    <!-- Top Minimalist Security Badge -->
    <div class="flex items-center justify-center pt-space-sm pb-space-xs">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high shadow-xs border border-outline-variant/30">
        <span class="material-symbols-outlined text-[16px] text-tertiary-container icon-filled">
          verified_user
        </span>
        <span class="text-[11px] text-tertiary font-extrabold uppercase tracking-wider">
          Perímetro Seguro Activo
        </span>
        <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
      </div>
    </div>

    <!-- Hero Mascot Presentation -->
    <div class="relative w-full flex flex-col items-center justify-center my-space-xs">
      <!-- Ambient Backdrop Aura -->
      <div class="absolute w-56 h-56 rounded-full bg-primary-fixed/40 blur-2xl pointer-events-none"></div>

      <!-- Suri Live Animated Mascot -->
      <div class="relative z-10 flex items-center justify-center">
        <SuriMascotAnimated
          :pose="currentPose"
          size="xl"
          :auto-blink="true"
          :interactive="true"
          :bubble-text="showBubble ? bubbleMessage : ''"
          @interact="handleMascotClick"
        />
      </div>
    </div>

    <!-- Branding & Mission -->
    <div class="flex flex-col items-center text-center mt-space-xs mb-space-sm">
      <div class="flex items-center justify-center gap-2 mb-1">
        <h1 class="text-3xl font-extrabold text-on-secondary-fixed-variant tracking-tight">
          SuriLearn
        </h1>
        <span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-extrabold shadow-xs">
          Beta Vigilante
        </span>
      </div>
      <p class="text-sm text-on-surface-variant max-w-[300px] leading-snug">
        Domina tu perímetro digital en 3 minutos al día sin tecnicismos aburridos.
      </p>
    </div>

    <!-- Quick Benefits Floating Showcase -->
    <div class="w-full bg-surface-container-low rounded-2xl p-3 shadow-xs mb-space-md border border-outline-variant/20">
      <div class="grid grid-cols-1 gap-2">
        <div class="flex items-center gap-3 bg-surface-container-lowest/90 p-2.5 rounded-xl shadow-xs">
          <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
            <span class="material-symbols-outlined text-[19px] icon-filled">phishing</span>
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-on-secondary-fixed-variant">Simulaciones Reales</span>
            <span class="text-[11px] text-on-surface-variant leading-tight">Detecta trampas y correos maliciosos sin riesgo</span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-surface-container-lowest/90 p-2.5 rounded-xl shadow-xs">
          <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
            <span class="material-symbols-outlined text-[19px] icon-filled">bolt</span>
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-on-secondary-fixed-variant">Micro-lecciones Gamificadas</span>
            <span class="text-[11px] text-on-surface-variant leading-tight">Racha de hábitos seguros en ráfagas divertidas</span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-surface-container-lowest/90 p-2.5 rounded-xl shadow-xs">
          <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
            <span class="material-symbols-outlined text-[19px] icon-filled">emoji_events</span>
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-on-secondary-fixed-variant">Ligas de Centinelas</span>
            <span class="text-[11px] text-on-surface-variant leading-tight">Compite en madrigueras comunitarias y gana rangos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tactile Action Stack (Google Auth Focused) -->
    <div class="flex flex-col gap-2.5 w-full pb-space-sm">
      <!-- Primary Button: Google Sign-in -->
      <button
        type="button"
        class="w-full h-13 py-3 rounded-full font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 bg-surface-container-lowest text-on-surface border-2 border-primary-container shadow-md active:translate-y-1 transition-all"
        @click="handleGoogleLogin"
      >
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" fill="#4285F4"/>
          <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"/>
          <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"/>
          <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"/>
        </svg>
        <span>Continuar con Google</span>
      </button>

      <!-- Secondary Button: Configure Goal -->
      <button
        type="button"
        class="w-full h-13 py-3 rounded-full font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 btn-tactile-secondary"
        @click="goToOnboarding"
      >
        <span>Personalizar meta diaria</span>
      </button>

      <!-- Existing Account Link -->
      <button
        type="button"
        class="w-full py-2 text-xs font-extrabold text-primary hover:underline flex items-center justify-center gap-1"
        @click="goToLogin"
      >
        <span>Ya tengo cuenta · Iniciar Sesión</span>
      </button>

      <!-- Android APK Download Button (visible in Web browser, hidden inside standalone/TWA app) -->
      <a
        v-if="!isStandaloneApp"
        href="https://github.com/MichaelBrown1310/SuriLearn/raw/main/releases/SuriLearn-v0.17.0.apk"
        target="_blank"
        rel="noopener noreferrer"
        class="w-full py-2.5 px-4 rounded-full bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-xs font-extrabold text-on-surface flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] transition-all"
      >
        <span class="material-symbols-outlined text-[17px] text-primary icon-filled">android</span>
        <span>Descargar App Android (.APK)</span>
      </a>
    </div>

    <!-- Footnote Trust Seal -->
    <div class="flex items-center justify-center gap-1.5 pb-space-xs text-on-surface-variant/80 text-[11px]">
      <span class="material-symbols-outlined text-[13px]">lock</span>
      <span class="font-semibold">100% Gratuito y diseñado para blindar a tu equipo</span>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
