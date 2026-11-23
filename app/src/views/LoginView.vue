<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/useUserStore';
import { getSuriImage } from '../utils/suriAssets';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const suriImg = getSuriImage('idle');

const email = ref<string>('');
const password = ref<string>('');
const showPassword = ref<boolean>(false);
const localError = ref<string | null>(null);

function getRedirectTarget(): string {
  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }
  return '/tabs/learn';
}

async function handleEmailLogin() {
  localError.value = null;
  userStore.authError = null;

  if (!email.value.trim() || !password.value) {
    localError.value = 'Ingresa tu correo electrónico y tu contraseña para continuar.';
    return;
  }

  const success = await userStore.loginWithEmail(email.value.trim(), password.value);
  if (success) {
    router.push(getRedirectTarget());
  }
}

async function handleGoogleLogin() {
  localError.value = null;
  const success = await userStore.loginWithGoogle();
  if (success) {
    router.push(getRedirectTarget());
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col justify-between max-w-lg mx-auto px-margin pt-safe pb-safe select-none text-left">
    <!-- Top Nav -->
    <div class="flex items-center justify-between py-2">
      <button
        type="button"
        class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <span class="text-xs font-bold text-secondary uppercase tracking-wider">Acceso Centinela</span>
      <div class="w-10"></div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-space-md justify-center py-space-sm">
      <!-- Mascot Banner -->
      <div class="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-2xl shadow-xs border border-outline-variant/30">
        <div class="w-16 h-16 rounded-full bg-surface-container-high p-1 shrink-0 flex items-center justify-center overflow-hidden">
          <img :src="suriImg" alt="Suri Centinela" class="w-full h-full object-contain" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-extrabold text-on-surface">Bienvenido de vuelta</h2>
          <p class="text-xs text-on-surface-variant mt-0.5 leading-snug">
            Inicia sesión con tu correo registrado o vincula tu cuenta de Google para continuar tu racha.
          </p>
        </div>
      </div>

      <!-- Dual Auth Form Card -->
      <div class="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
        <div class="flex flex-col items-center gap-1 text-center">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">
            Autenticación Dual
          </span>
          <h3 class="text-lg font-extrabold text-on-surface">
            Inicio de Sesión Seguro
          </h3>
        </div>

        <!-- Google Auth Button -->
        <button
          type="button"
          class="w-full min-h-[48px] py-2.5 px-space-md rounded-full bg-surface-container hover:bg-surface-container-high transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-on-surface text-sm font-bold shadow-xs border-2 border-outline-variant/40 hover:border-primary-container"
          :disabled="userStore.isLoading"
          @click="handleGoogleLogin"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" fill="#4285F4"/>
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"/>
            <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"/>
            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"/>
          </svg>
          <span>{{ userStore.isLoading ? 'Conectando...' : 'Continuar con Google' }}</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-space-sm">
          <div class="flex-1 h-[1px] bg-outline-variant/40"></div>
          <span class="text-[10px] uppercase font-bold text-on-surface-variant">o ingresa con tu correo</span>
          <div class="flex-1 h-[1px] bg-outline-variant/40"></div>
        </div>

        <!-- Email & Password Form -->
        <form class="flex flex-col gap-3" @submit.prevent="handleEmailLogin">
          <div class="flex flex-col gap-1">
            <label for="login-email" class="text-xs font-bold text-on-surface-variant px-1">
              Correo electrónico
            </label>
            <div class="flex items-center bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/30 focus-within:border-primary">
              <span class="material-symbols-outlined text-secondary mr-2 text-[18px]">mail</span>
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="correo@ejemplo.com"
                class="w-full bg-transparent border-none outline-none text-xs text-on-surface"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label for="login-password" class="text-xs font-bold text-on-surface-variant px-1">
              Contraseña
            </label>
            <div class="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/30 focus-within:border-primary">
              <span class="material-symbols-outlined text-secondary mr-2 text-[18px]">lock</span>
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Tu contraseña"
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

          <!-- Auth Error Alert -->
          <div
            v-if="localError || userStore.authError"
            role="alert"
            class="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-bold flex items-start gap-2"
          >
            <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
            <span>{{ localError || userStore.authError }}</span>
          </div>

          <button
            type="submit"
            class="w-full h-12 rounded-full font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 btn-tactile-primary mt-1 disabled:opacity-60"
            :disabled="userStore.isLoading"
          >
            <span v-if="userStore.isLoading" class="material-symbols-outlined text-[18px] animate-spin">sync</span>
            <span v-else class="material-symbols-outlined text-[18px]">login</span>
            <span>{{ userStore.isLoading ? 'Verificando...' : 'Iniciar Sesión' }}</span>
          </button>
        </form>

        <!-- Register link -->
        <div class="text-center pt-1">
          <router-link
            to="/register"
            class="text-xs font-bold text-primary hover:underline"
          >
            ¿Aún no tienes cuenta? Crear cuenta gratis
          </router-link>
        </div>

        <!-- Trust Info -->
        <div class="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-on-surface-variant/70 border-t border-outline-variant/20">
          <span class="material-symbols-outlined text-[14px]">shield</span>
          <span>Protegido con Firebase Authentication</span>
        </div>
      </div>
    </div>
  </div>
</template>
