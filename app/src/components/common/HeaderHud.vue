<script setup lang="ts">
import { computed } from 'vue';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useUserStore } from '../../stores/useUserStore';
import { useTheme } from '../../composables/useTheme';

defineProps<{
  title: string;
}>();

const gamificationStore = useGamificationStore();
const userStore = useUserStore();
const { isDark, toggleDark } = useTheme();

const heartsDisplay = computed(() => {
  return gamificationStore.hasInfiniteHearts ? '∞' : gamificationStore.hearts;
});

const userAvatarUrl = computed(() => {
  const url = userStore.profile.avatarUrl || userStore.profile.photoURL;
  if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/'))) {
    return url;
  }
  return null;
});
</script>

<template>
  <header
    class="suri-header sticky top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-colors duration-200"
  >
    <div class="header-content-wrapper h-14">
      <!-- Title & Live Status Indicator -->
      <div class="flex items-center gap-2 min-w-0">
        <h1 class="text-base font-extrabold text-primary tracking-tight truncate">
          {{ title }}
        </h1>
      </div>

      <!-- Gamified HUD Capsule Chips & Theme Toggle -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Hearts Chip -->
        <div
          class="flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-xs shadow-xs transition-colors"
          :class="gamificationStore.hasInfiniteHearts ? 'bg-amber-400/15 text-amber-500 border border-amber-400/40 shadow-amber-500/10' : 'bg-surface-container text-error'"
          :title="gamificationStore.hasInfiniteHearts ? 'Corazones dorados ilimitados (SuriPro Centinela)' : `${gamificationStore.hearts}/5 Vidas`"
        >
          <span
            class="material-symbols-outlined text-[17px] icon-filled"
            :class="gamificationStore.hasInfiniteHearts ? 'text-amber-500' : 'text-error'"
          >
            favorite
          </span>
          <span :class="gamificationStore.hasInfiniteHearts ? 'text-amber-500 text-sm leading-none font-black' : ''">{{ heartsDisplay }}</span>
        </div>

        <!-- Streak Chip -->
        <div
          class="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-primary font-extrabold text-xs shadow-xs"
          :title="`Racha de ${gamificationStore.streakDays} días (${gamificationStore.streakMultiplier}x XP)`"
        >
          <span class="material-symbols-outlined text-[17px] icon-filled text-[#e1a653]">
            local_fire_department
          </span>
          <span>{{ gamificationStore.streakDays }}</span>
        </div>

        <!-- Bits / Gems Chip -->
        <div
          class="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-on-surface font-extrabold text-xs shadow-xs"
          :title="`${gamificationStore.bits} Bits disponibles en bóveda`"
        >
          <span class="material-symbols-outlined text-[17px] icon-filled text-tech-cyan">
            diamond
          </span>
          <span>{{ gamificationStore.bits }}</span>
        </div>

        <!-- Dark Sentinel Theme Toggle Button -->
        <button
          type="button"
          @click="toggleDark"
          class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-xs active:scale-95"
          :title="isDark ? 'Cambiar a Modo Claro' : 'Activar Modo Oscuro (Dark Sentinel)'"
          aria-label="Alternar tema de color"
        >
          <span class="material-symbols-outlined text-[18px]">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>

        <!-- Profile Avatar Link -->
        <router-link
          to="/tabs/profile"
          class="ml-0.5 flex items-center justify-center"
          title="Ver Perfil"
        >
          <div
            class="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed border border-primary/20 flex items-center justify-center shadow-xs"
          >
            <img
              v-if="userAvatarUrl"
              :src="userAvatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xs font-extrabold text-primary">
              {{ userStore.userInitials }}
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </header>
</template>
