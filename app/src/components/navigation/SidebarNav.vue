<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../../stores/useUserStore';
import { getSuriImage } from '../../utils/suriAssets';
import { useTheme } from '../../composables/useTheme';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { isDark, toggleDark } = useTheme();

const suriLogo = getSuriImage('idle');

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
  requiresOrgAdmin?: boolean;
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { path: '/tabs/learn', label: 'Aprender', icon: 'map' },
    { path: '/tabs/leaderboard', label: 'Ligas', icon: 'leaderboard' },
    { path: '/tabs/shop', label: 'Tienda', icon: 'shopping_bag' },
    { path: '/tabs/profile', label: 'Perfil', icon: 'person' },
  ];

  // Panel PYME visible for enterprise admin or members
  if (userStore.hasOrganization || userStore.isSmeAdmin) {
    items.push({
      path: '/tabs/organization',
      label: userStore.isSmeAdmin ? 'Panel PYME' : 'Mi Empresa',
      icon: 'domain',
      badge: userStore.isSmeAdmin ? 'Admin' : undefined,
    });
  }

  return items;
});

function isActive(path: string): boolean {
  if (path === '/tabs/organization') {
    return route.path.startsWith('/tabs/organization') || route.path.startsWith('/admin');
  }
  return route.path.startsWith(path);
}

async function handleLogout() {
  await userStore.logout();
  router.push('/login');
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.src = suriLogo;
}
</script>

<template>
  <aside
    class="w-[270px] shrink-0 min-h-screen sticky top-0 flex flex-col justify-between bg-surface border-r border-outline-variant/30 z-30 select-none px-4 py-5 transition-colors duration-200"
  >
    <!-- Top Branding & Navigation -->
    <div class="flex flex-col gap-6">
      <!-- App Brand Logo Header -->
      <router-link
        to="/tabs/learn"
        class="flex items-center gap-3 px-2 py-1.5 rounded-2xl transition-transform hover:scale-[1.02] group"
      >
        <div class="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-container to-primary/20 p-1 flex items-center justify-center border border-outline-variant/40 shadow-sm">
          <img
            :src="suriLogo"
            alt="Suri"
            class="w-full h-full object-contain filter drop-shadow-sm group-hover:rotate-6 transition-transform"
          />
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-1">
            <span class="text-xl font-black tracking-tight text-on-surface">SuriLearn</span>
            <span class="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </div>
          <span class="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
            Ciberseguridad PYME
          </span>
        </div>
      </router-link>

      <!-- Nav Links -->
      <nav class="flex flex-col gap-1.5">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-between px-3.5 py-3 rounded-2xl font-black text-sm transition-all relative overflow-hidden group"
          :class="
            isActive(item.path)
              ? 'bg-surface-container text-on-surface shadow-xs border border-primary/30 translate-x-1 font-black'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 hover:translate-x-0.5'
          "
        >
          <div class="flex items-center gap-3.5">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              :class="
                isActive(item.path)
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-high/60 text-on-surface-variant group-hover:text-primary'
              "
            >
              <span
                class="material-symbols-outlined text-[20px]"
                :class="{ 'icon-filled': isActive(item.path) }"
              >
                {{ item.icon }}
              </span>
            </div>
            <span class="tracking-wide">{{ item.label }}</span>
          </div>

          <!-- Optional Badge -->
          <span
            v-if="item.badge"
            class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
            :class="
              isActive(item.path)
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-primary border border-primary/20'
            "
          >
            {{ item.badge }}
          </span>

          <!-- Active indicator bar -->
          <div
            v-if="isActive(item.path)"
            class="absolute left-0 top-2 bottom-2 w-1.5 bg-primary rounded-r-full"
          ></div>
        </router-link>
      </nav>
    </div>

    <!-- Bottom Controls: Theme Toggle, User Profile Card & Sign Out -->
    <div class="flex flex-col gap-2.5 pt-4 border-t border-outline-variant/30">
      <!-- Dark Sentinel Mode Switcher -->
      <button
        type="button"
        @click="toggleDark"
        class="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 transition-all text-xs font-bold text-on-surface"
      >
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-outlined text-[19px] text-primary">
            {{ isDark ? 'dark_mode' : 'light_mode' }}
          </span>
          <span>{{ isDark ? 'Modo Oscuro' : 'Modo Claro' }}</span>
        </div>
        <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-full" :class="isDark ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'">
          {{ isDark ? 'Sentinel' : 'Canónico' }}
        </span>
      </button>

      <!-- User Card -->
      <div class="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-primary overflow-hidden border border-outline-variant/40 shrink-0 flex items-center justify-center">
            <img
              v-if="userStore.profile.photoURL || userStore.profile.avatarUrl"
              :src="(userStore.profile.photoURL || userStore.profile.avatarUrl) || suriLogo"
              @error="handleImageError"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <span v-else class="font-black text-xs text-primary">
              {{ userStore.userInitials }}
            </span>
          </div>

          <div class="flex flex-col min-w-0">
            <span class="text-xs font-black text-on-surface truncate">
              {{ userStore.profile.displayName || 'Centinela' }}
            </span>
            <span class="text-[10px] text-on-surface-variant truncate">
              {{ userStore.isSmeAdmin ? 'Gestor PYME' : (userStore.hasOrganization ? userStore.userOrganizationName : 'Colaborador') }}
            </span>
          </div>
        </div>

        <!-- Logout Action Button -->
        <button
          @click="handleLogout"
          class="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors shrink-0"
          title="Cerrar Sesión"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>

      <p class="text-[10px] text-center text-on-surface-variant/70 font-bold">
        SuriLearn v1.0 • Multi-Tenant B2B
      </p>
    </div>
  </aside>
</template>
