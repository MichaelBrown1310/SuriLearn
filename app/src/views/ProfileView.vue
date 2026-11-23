<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/useUserStore';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useTheme } from '../composables/useTheme';
import HeaderHud from '../components/common/HeaderHud.vue';
import { getSuriImage } from '../utils/suriAssets';

const router = useRouter();
const userStore = useUserStore();
const gamificationStore = useGamificationStore();
const { isDark, toggleDark } = useTheme();

const suriImg = getSuriImage('idle');
const alertsActive = ref<boolean>(true);

const userAvatarSrc = computed(() => {
  const url = userStore.profile.avatarUrl || userStore.profile.photoURL;
  if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/'))) {
    return url;
  }
  return suriImg;
});

async function handleLogout() {
  await userStore.logout();
  router.push('/welcome');
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col w-full select-none text-left">
    <!-- Header HUD: Ancho completo de borde a borde -->
    <HeaderHud title="Perfil De Usuario" />

    <!-- Contenedor Maestro de Vista -->
    <main class="view-master-container flex-1 w-full pb-16 flex flex-col gap-6">
      <!-- User Profile Hero Card (Ocupa el ancho total) -->
      <div class="w-full bg-surface-container-high rounded-3xl p-6 lg:p-8 shadow-xs border border-outline-variant/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Ambient auras -->
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed-dim/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute -left-6 -bottom-6 w-28 h-28 bg-tech-cyan/20 rounded-full blur-xl pointer-events-none"></div>

        <!-- Left / Center Avatar and Profile Details -->
        <div class="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
          <!-- Avatar with Verified Level Chip -->
          <div class="relative shrink-0">
            <div class="w-24 h-24 rounded-full bg-surface p-1 shadow-md border-2 border-primary-container flex items-center justify-center relative overflow-hidden">
              <img
                :src="userAvatarSrc"
                alt="Avatar Centinela"
                class="w-full h-full rounded-full object-cover"
              />
            </div>
            <div class="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
              <span class="material-symbols-outlined text-[12px] icon-filled">verified</span>
              <span>NVL {{ gamificationStore.level }}</span>
            </div>
          </div>

          <!-- User Details -->
          <div>
            <h2 class="text-xl lg:text-2xl font-black text-on-surface">
              {{ userStore.profile.displayName || 'Centinela' }}
            </h2>
            <p class="text-xs text-on-surface-variant mt-0.5 font-medium">
              {{ userStore.profile.email || userStore.profile.companyName || 'Centinela Independiente' }} · Activo en Guardia 2026
            </p>

            <!-- Sentinel Rank Tag & Identity Chips -->
            <div class="mt-3 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <div class="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full shadow-xs border border-outline-variant/30">
                <span class="text-xs">🛡️</span>
                <span class="text-xs font-black text-on-surface">
                  {{ gamificationStore.levelTitle }}
                </span>
              </div>
              <div
                v-if="userStore.isPro"
                class="inline-flex items-center gap-1 bg-amber-400/20 text-amber-500 border border-amber-400/40 px-2.5 py-1 rounded-full text-xs font-black"
              >
                <span class="material-symbols-outlined text-[14px]">workspace_premium</span>
                <span>SuriPro Activo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Quick Action / Link to Org -->
        <div class="relative z-10 shrink-0 flex items-center gap-3">
          <router-link
            to="/tabs/organization"
            class="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl btn-tactile-primary shadow-xs flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[17px]">domain</span>
            <span>{{ userStore.hasOrganization ? 'Panel PYME' : 'Vincular Empresa' }}</span>
          </router-link>
        </div>
      </div>

      <!-- Enterprise PYME Access Card -->
      <router-link
        to="/tabs/organization"
        class="w-full bg-gradient-to-r from-surface-container-high via-surface-container-low to-primary-fixed/20 rounded-2xl p-4 border border-outline-variant/30 shadow-xs flex items-center justify-between hover:border-primary/40 transition-all"
      >
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-[#5F4030] text-[#F6E3B8] flex items-center justify-center shadow-xs shrink-0">
            <span class="material-symbols-outlined text-[26px] icon-filled">domain</span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2 truncate">
              <span class="text-sm font-black text-on-surface truncate">
                {{ userStore.currentOrganization?.name || userStore.profile.companyName || 'Organización PYME' }}
              </span>
              <span
                class="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                :class="userStore.isSmeAdmin ? 'bg-primary text-white' : 'bg-tertiary text-white'"
              >
                {{ userStore.isSmeAdmin ? 'Admin PYME' : 'Colaborador' }}
              </span>
            </div>
            <span class="text-xs text-on-surface-variant font-medium truncate mt-0.5">
              {{ userStore.hasOrganization ? 'Supervisa el índice de salud digital, colaboradores y ligas privadas corporativas' : 'Vincula tu cuenta con el código de 6 caracteres de tu empresa' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1 text-primary shrink-0 font-bold text-xs">
          <span>Abrir</span>
          <span class="material-symbols-outlined text-[18px]">chevron_right</span>
        </div>
      </router-link>

      <!-- Telemetry Stats Panel (4 Columnas Horizontales en Pantallas >= 992px) -->
      <div class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between px-1">
          <span class="text-sm font-black text-on-surface uppercase tracking-wider">Estadísticas De Guardia</span>
          <span class="text-xs font-bold text-primary tracking-wide">Resumen Acumulado</span>
        </div>

        <!-- Grid 4 columnas en desktop (grid-template-columns: repeat(4, 1fr) en >= 992px) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <!-- Stat 1: Streak -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-2xl">🔥</span>
              <span
                class="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase"
                :class="gamificationStore.streakDays > 0 ? 'text-primary bg-primary-fixed' : 'text-on-surface-variant bg-surface-container'"
              >
                {{ gamificationStore.streakDays > 0 ? 'Activa' : 'Inicial' }}
              </span>
            </div>
            <div class="mt-3">
              <span class="text-xl font-black text-on-surface block">
                {{ gamificationStore.streakDays }} Días
              </span>
              <span class="text-xs text-on-surface-variant font-medium">Racha de guardia</span>
            </div>
          </div>

          <!-- Stat 2: Total XP -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-2xl">⚡</span>
              <span class="text-[10px] font-black text-tertiary bg-tertiary-fixed px-2.5 py-0.5 rounded-full uppercase">
                {{ gamificationStore.streakMultiplier }}x Bonus
              </span>
            </div>
            <div class="mt-3">
              <span class="text-xl font-black text-on-surface block">
                {{ gamificationStore.xp.toLocaleString() }} XP
              </span>
              <span class="text-xs text-on-surface-variant font-medium">Experiencia total</span>
            </div>
          </div>

          <!-- Stat 3: Accuracy -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-2xl">🛡️</span>
              <span
                class="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase"
                :class="(gamificationStore.state.accuracyRate ?? gamificationStore.state.accuracyPercentage) > 0 ? 'text-tertiary bg-tertiary-fixed' : 'text-on-surface-variant bg-surface-container'"
              >
                {{ (gamificationStore.state.accuracyRate ?? gamificationStore.state.accuracyPercentage) > 0 ? 'Precisión' : 'Inicial' }}
              </span>
            </div>
            <div class="mt-3">
              <span class="text-xl font-black text-on-surface block">
                {{ gamificationStore.state.accuracyRate ?? gamificationStore.state.accuracyPercentage }}%
              </span>
              <span class="text-xs text-on-surface-variant font-medium">Precisión antiphishing</span>
            </div>
          </div>

          <!-- Stat 4: League -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-2xl">🏆</span>
              <span class="text-[10px] font-black text-primary bg-primary-fixed px-2.5 py-0.5 rounded-full uppercase">
                {{ gamificationStore.state.currentLeague || userStore.profile.currentLeague || 'Bronce' }}
              </span>
            </div>
            <div class="mt-3">
              <span class="text-xl font-black text-on-surface block">
                Liga {{ gamificationStore.state.currentLeague || userStore.profile.currentLeague || 'Bronce' }}
              </span>
              <span class="text-xs text-on-surface-variant font-medium">División actual</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Badges Showcase (Se extiende ocupando todo el ancho en filas ordenadas) -->
      <div class="bg-surface-container-low rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-black text-on-surface uppercase tracking-wider">Vitrina de Medallas e Insignias</h3>
            <span class="bg-surface-container px-2.5 py-0.5 rounded-full text-xs font-bold text-primary">
              {{ gamificationStore.badges.filter(b => b.isUnlocked).length }}/{{ gamificationStore.badges.length }}
            </span>
          </div>
          <button
            type="button"
            class="text-xs font-bold text-primary hover:underline"
            @click="gamificationStore.showToast('¡Todas las insignias están desplegadas en tu vitrina!', true)"
          >
            Ver catálogo
          </button>
        </div>

        <!-- Grid ordenado y fluido de medallas para escritorio -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div
            v-for="badge in gamificationStore.badges"
            :key="badge.id"
            class="p-3 rounded-2xl flex items-center gap-3 border transition-all hover:scale-[1.01]"
            :class="
              badge.isUnlocked
                ? 'bg-surface-container-lowest border-outline-variant/30 shadow-xs'
                : 'bg-surface-dim/20 border-outline-variant/20 opacity-60'
            "
          >
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              :class="badge.isUnlocked ? 'bg-surface-container-high text-primary' : 'bg-surface-dim text-outline'"
            >
              <span class="material-symbols-outlined text-[22px] icon-filled">
                {{ badge.iconUrl }}
              </span>
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-extrabold text-on-surface truncate">{{ badge.title }}</h4>
              <p
                class="text-[10px] font-bold truncate mt-0.5"
                :class="badge.isUnlocked ? 'text-primary' : 'text-outline'"
              >
                {{ badge.subtitle }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings & Account Options in 2 Columns on Desktop -->
      <div class="flex flex-col gap-3">
        <span class="text-sm font-black text-on-surface uppercase tracking-wider px-1">Ajustes & Configuración</span>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Card 1: Preferencias y Tema -->
          <div class="bg-surface-container-lowest rounded-2xl p-2 shadow-xs border border-outline-variant/30 flex flex-col gap-1">
            <!-- Theme Toggle Option -->
            <div
              @click="toggleDark"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined text-[20px]">
                    {{ isDark ? 'dark_mode' : 'light_mode' }}
                  </span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-on-surface">Modo Visual</p>
                  <p class="text-[10px] text-on-surface-variant truncate">
                    {{ isDark ? 'Tema Dark Sentinel (Carbón y Ceniza)' : 'Tema Claro Canónico Suri' }}
                  </p>
                </div>
              </div>
              <span class="text-xs font-black text-primary px-2.5 py-1 rounded-full bg-surface-container">
                {{ isDark ? 'Oscuro' : 'Claro' }}
              </span>
            </div>

            <!-- Daily Goal Option -->
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined text-[20px]">timer</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-on-surface">Meta diaria de entrenamiento</p>
                  <p class="text-[10px] text-on-surface-variant truncate">5 min / día (Ritmo Constante de Guardia)</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline text-[18px] shrink-0">chevron_right</span>
            </div>

            <!-- Alerts Toggle Option -->
            <div class="flex items-center justify-between p-3 rounded-xl">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-tertiary shrink-0">
                  <span class="material-symbols-outlined text-[20px]">notifications_active</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-on-surface">Alertas y racha diaria</p>
                  <p class="text-[10px] text-on-surface-variant truncate">Recordatorios inteligentes de Suri</p>
                </div>
              </div>
              <button
                type="button"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out p-0.5"
                :class="alertsActive ? 'bg-tertiary' : 'bg-surface-dim'"
                @click="alertsActive = !alertsActive"
              >
                <span
                  class="inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                  :class="alertsActive ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <!-- Card 2: Membresía & Sesión -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-4">
            <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined text-[20px]">workspace_premium</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-black text-on-surface">
                      {{ userStore.isPro ? 'Membresía SuriPro' : 'Plan Spark Gratuito' }}
                    </p>
                    <span class="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[9px] font-bold">
                      {{ userStore.isPro ? 'Ilimitado' : '$0 Costo' }}
                    </span>
                  </div>
                  <p class="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {{ userStore.isPro ? 'Corazones dorados y diagnósticos IA activos' : 'Vidas limitadas (5/5) y lecciones base' }}
                  </p>
                </div>
              </div>
              <router-link
                to="/tabs/shop"
                class="bg-primary text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 active:scale-95 transition-all"
              >
                {{ userStore.isPro ? 'Gestionar' : 'Mejorar' }}
              </router-link>
            </div>

            <!-- Logout Button -->
            <button
              type="button"
              class="w-full bg-surface-container-low hover:bg-error-container/40 text-error text-xs font-black py-3 rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              @click="handleLogout"
            >
              <span class="material-symbols-outlined text-[18px]">logout</span>
              <span>Cerrar Sesión Activa</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
