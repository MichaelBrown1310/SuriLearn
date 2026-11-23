<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/useUserStore';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  isOpen: boolean;
  globalBlock?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const router = useRouter();
const userStore = useUserStore();
const suriSleeping = getSuriImage('sleeping');

function handleReturn() {
  emit('close');
  router.replace('/tabs/learn');
}

async function handleLogout() {
  emit('close');
  await userStore.logout();
  router.replace('/welcome');
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
  >
    <div
      class="bg-surface rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col items-center text-center gap-4 animate-scale-up"
    >
      <!-- Suri Sleeping Illustration -->
      <div class="relative w-28 h-28 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center p-2 shadow-inner">
        <img
          :src="suriSleeping"
          alt="Suri en pausa"
          class="w-full h-full object-contain filter drop-shadow-sm"
        />
        <div class="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
          <span class="material-symbols-outlined text-[20px]">pause</span>
        </div>
      </div>

      <!-- Warning Heading -->
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-black text-on-surface">
          Cuenta Corporativa en Pausa
        </h3>
        <p class="text-xs font-semibold text-on-surface-variant leading-relaxed">
          Tu cuenta corporativa ha sido pausada temporalmente por el administrador de tu empresa.
        </p>
      </div>

      <!-- Detail Box -->
      <div class="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-[11px] text-on-surface-variant text-left flex items-start gap-2.5">
        <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
        <span>
          Para reactivar tu acceso a las misiones y lecciones de ciberseguridad, comunícate con el gestor o CISO de tu organización.
        </span>
      </div>

      <!-- Return / Logout Action -->
      <button
        v-if="globalBlock"
        type="button"
        @click="handleLogout"
        class="w-full py-3 rounded-2xl bg-error text-white font-black text-xs hover:bg-error/90 transition-all shadow-md flex items-center justify-center gap-1.5"
      >
        <span class="material-symbols-outlined text-[16px]">logout</span>
        <span>Cerrar Sesión Activa</span>
      </button>
      <button
        v-else
        type="button"
        @click="handleReturn"
        class="w-full py-3 rounded-2xl btn-tactile-primary font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
      >
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        <span>Entendido, volver a inicio</span>
      </button>
    </div>
  </div>
</template>
