<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/useUserStore';
import { DailyGoalType, DAILY_GOAL_CONFIGS } from '../types/gamification';
import { getSuriImage } from '../utils/suriAssets';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const fullName = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');
const showPassword = ref<boolean>(false);
const selectedGoal = ref<DailyGoalType>('constante');
const companyName = ref<string>('');
const localError = ref<string | null>(null);

const suriImg = getSuriImage('idle');

function getRedirectTarget(): string {
  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }
  return '/tabs/learn';
}

async function handleGoogleAuth() {
  localError.value = null;
  const success = await userStore.loginWithGoogle();
  if (success) {
    await userStore.setDailyGoal(selectedGoal.value);
    router.push(getRedirectTarget());
  }
}

async function handleSubmit() {
  localError.value = null;
  userStore.authError = null;

  if (!fullName.value.trim()) {
    localError.value = 'Por favor ingresa tu nombre completo.';
    return;
  }
  if (!email.value.trim() || !email.value.includes('@')) {
    localError.value = 'Ingresa un correo electrónico válido.';
    return;
  }
  if (password.value.length < 6) {
    localError.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  const success = await userStore.registerWithEmail(
    email.value.trim(),
    password.value,
    fullName.value.trim(),
    selectedGoal.value,
    companyName.value.trim()
  );
  if (success) {
    router.push(getRedirectTarget());
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col justify-between max-w-lg mx-auto pb-safe select-none text-left">
    <!-- Header -->
    <header class="w-full pt-safe px-margin flex items-center justify-between pb-2">
      <button
        type="button"
        class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <span class="text-xs font-bold text-secondary uppercase tracking-wider">
        Registro & Guardia
      </span>
      <div class="w-10"></div>
    </header>

    <main class="flex-1 w-full px-margin flex flex-col gap-space-md py-2 overflow-y-auto">
      <!-- Steps Capsule Bar -->
      <div class="flex items-center justify-between bg-surface-container px-space-md py-space-xs rounded-full shadow-xs">
        <div class="flex items-center gap-space-xs">
          <span class="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse"></span>
          <span class="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
            Configuración Inicial: Perfil y Ritmo
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-6 h-2 rounded-full bg-primary-container"></span>
          <span class="w-2 h-2 rounded-full bg-surface-variant"></span>
        </div>
      </div>

      <!-- Suri Sentinel Banner -->
      <div class="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-2xl shadow-xs border border-outline-variant/30 relative overflow-hidden">
        <div class="w-16 h-16 shrink-0 relative flex items-center justify-center bg-surface-container-highest rounded-full overflow-hidden shadow-inner p-1">
          <img :src="suriImg" alt="Suri Centinela" class="w-full h-full object-contain" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled">visibility</span>
            <h1 class="text-sm font-extrabold text-on-surface leading-tight">Únete a la manada</h1>
          </div>
          <p class="text-xs text-on-surface-variant leading-tight">
            Configura tu perfil centinela y mantén tu madriguera a salvo de amenazas.
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
        <!-- Google Social Button -->
        <button
          type="button"
          class="w-full min-h-[48px] py-2.5 px-space-md rounded-full bg-surface-container hover:bg-surface-container-high transition-all active:scale-[0.99] flex items-center justify-center gap-3 text-on-surface text-xs font-bold shadow-xs border border-outline-variant/30"
          @click="handleGoogleAuth"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" fill="#4285F4"/>
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"/>
            <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"/>
            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div class="flex items-center gap-space-sm my-1">
          <div class="flex-1 h-[1px] bg-outline-variant/40"></div>
          <span class="text-[10px] uppercase font-bold text-on-surface-variant">o usa tu correo</span>
          <div class="flex-1 h-[1px] bg-outline-variant/40"></div>
        </div>

        <div class="flex flex-col gap-2">
          <!-- Full Name -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-on-surface-variant px-1">Nombre completo</label>
            <div class="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-outline-variant/30">
              <span class="material-symbols-outlined text-secondary mr-2 text-[18px]">person</span>
              <input
                v-model="fullName"
                type="text"
                placeholder="Tu nombre completo"
                class="w-full bg-transparent border-none outline-none text-xs text-on-surface"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-on-surface-variant px-1">Correo electrónico</label>
            <div class="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-outline-variant/30">
              <span class="material-symbols-outlined text-secondary mr-2 text-[18px]">mail</span>
              <input
                v-model="email"
                type="email"
                placeholder="correo@ejemplo.com"
                class="w-full bg-transparent border-none outline-none text-xs text-on-surface"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-on-surface-variant px-1">Contraseña</label>
            <div class="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-outline-variant/30">
              <span class="material-symbols-outlined text-secondary mr-2 text-[18px]">lock</span>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                class="w-full bg-transparent border-none outline-none text-xs text-on-surface pr-8"
              />
              <button
                type="button"
                class="absolute right-2 text-secondary hover:text-on-surface p-1"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Goal Selector Card -->
      <div class="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2.5">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled">timer</span>
            <h2 class="text-sm font-extrabold text-on-surface">Meta diaria de guardia</h2>
          </div>
          <span class="text-[10px] font-bold text-secondary-container bg-secondary px-2 py-0.5 rounded-full uppercase">
            Ritmo
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <!-- Casual -->
          <div
            class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99]"
            :class="
              selectedGoal === 'casual'
                ? 'border-primary-container bg-primary-fixed/20 shadow-xs'
                : 'border-outline-variant/30 bg-surface-container-low'
            "
            @click="selectedGoal = 'casual'"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-on-surface-variant text-[18px]">eco</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-extrabold text-on-surface">Casual</span>
                <span class="text-[11px] text-on-surface-variant">3 min/día • 1 lección diaria</span>
              </div>
            </div>
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center border"
              :class="selectedGoal === 'casual' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant'"
            >
              <span v-if="selectedGoal === 'casual'" class="material-symbols-outlined text-[14px]">check</span>
            </div>
          </div>

          <!-- Constante (Recommended) -->
          <div
            class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99]"
            :class="
              selectedGoal === 'constante'
                ? 'border-primary-container bg-primary-fixed/30 shadow-xs'
                : 'border-outline-variant/30 bg-surface-container-low'
            "
            @click="selectedGoal = 'constante'"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                <span class="material-symbols-outlined text-[18px] icon-filled">local_fire_department</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-extrabold text-on-surface">Constante</span>
                  <span class="bg-secondary-container text-on-secondary-container text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    🔥 Recomendado
                  </span>
                </div>
                <span class="text-[11px] text-on-surface-variant">5 min/día • 2 lecciones diarias</span>
              </div>
            </div>
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center border"
              :class="selectedGoal === 'constante' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant'"
            >
              <span v-if="selectedGoal === 'constante'" class="material-symbols-outlined text-[14px]">check</span>
            </div>
          </div>

          <!-- Pro -->
          <div
            class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99]"
            :class="
              selectedGoal === 'pro'
                ? 'border-primary-container bg-primary-fixed/20 shadow-xs'
                : 'border-outline-variant/30 bg-surface-container-low'
            "
            @click="selectedGoal = 'pro'"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-tertiary">
                <span class="material-symbols-outlined text-[18px] icon-filled">bolt</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-extrabold text-on-surface">Centinela Pro ⚡</span>
                <span class="text-[11px] text-on-surface-variant">10 min/día • 3 lecciones diarias</span>
              </div>
            </div>
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center border"
              :class="selectedGoal === 'pro' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant'"
            >
              <span v-if="selectedGoal === 'pro'" class="material-symbols-outlined text-[14px]">check</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Error Alert & Login Link -->
      <div
        v-if="localError || userStore.authError"
        role="alert"
        class="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-bold flex items-start gap-2"
      >
        <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
        <span>{{ localError || userStore.authError }}</span>
      </div>

      <div class="text-center pb-2">
        <router-link to="/login" class="text-xs font-bold text-primary hover:underline">
          ¿Ya tienes una cuenta? Inicia sesión aquí
        </router-link>
      </div>
    </main>

    <!-- Persistent Bottom Action Anchor -->
    <footer class="w-full p-margin bg-surface/95 backdrop-blur-md border-t border-outline-variant/20 shadow-lg">
      <button
        type="button"
        class="w-full h-13 py-3 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 btn-tactile-primary disabled:opacity-60"
        :disabled="userStore.isLoading"
        @click="handleSubmit"
      >
        <span v-if="userStore.isLoading" class="material-symbols-outlined text-[18px] animate-spin">sync</span>
        <span v-else class="material-symbols-outlined text-[18px]">shield</span>
        <span>{{ userStore.isLoading ? 'Creando cuenta...' : 'Empezar entrenamiento' }}</span>
      </button>
    </footer>
  </div>
</template>
