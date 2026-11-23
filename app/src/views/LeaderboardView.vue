<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useUserStore } from '../stores/useUserStore';
import { useFirestore } from '../composables/useFirestore';
import { auth } from '../firebase/config';
import HeaderHud from '../components/common/HeaderHud.vue';
import { getSuriImage } from '../utils/suriAssets';
import { computeLeagueFromXp, getWeeklyCountdownLabel } from '../utils/gamificationEngine';
import { LeagueLeaderboardEntry } from '../types/gamification';

const route = useRoute();
const gamificationStore = useGamificationStore();
const userStore = useUserStore();
const firestore = useFirestore();

const suriImg = getSuriImage('idle');
const suriIdleFallback = suriImg;

// Scope toggle: 'global' (Division ranking) or 'company' (Private Organization ranking)
const activeScope = ref<'global' | 'company'>('global');

// Reactive states
const rawGlobalLeaderboard = ref<LeagueLeaderboardEntry[]>([]);
const rawCompanyLeaderboard = ref<LeagueLeaderboardEntry[]>([]);
const isLoading = ref<boolean>(true);
const isRefreshing = ref<boolean>(false);
let unsubscribeGlobal: (() => void) | null = null;
let unsubscribeCompany: (() => void) | null = null;

function resolveAvatar(url?: string | null): string {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/'))) {
    return url;
  }
  return suriIdleFallback;
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  if (target && target.src !== suriIdleFallback) {
    target.src = suriIdleFallback;
  }
}

const currentLeagueTier = computed(() => {
  return computeLeagueFromXp(currentUserXp.value);
});

const currentLeagueTitle = computed(() => {
  return gamificationStore.state.currentLeague || userStore.profile.currentLeague || currentLeagueTier.value.name;
});

const nextLeagueTitle = computed(() => {
  return currentLeagueTier.value.nextLeagueName;
});

const weeklyCountdown = computed(() => getWeeklyCountdownLabel());

// Current Authenticated User attributes from store & auth
const currentUserId = computed(() => userStore.profile.uid || auth.currentUser?.uid || '');

const currentUserDisplayName = computed(() => {
  return userStore.profile.displayName || auth.currentUser?.displayName || 'Centinela';
});

const currentUserAvatar = computed(() => {
  const photo = userStore.profile.photoURL || userStore.profile.avatarUrl || auth.currentUser?.photoURL;
  return resolveAvatar(photo);
});

const currentUserXp = computed(() => {
  return typeof userStore.profile.xp === 'number' && userStore.profile.xp > 0
    ? userStore.profile.xp
    : (gamificationStore.xp || 0);
});

const currentUserStreak = computed(() => {
  return userStore.profile.streakDays || gamificationStore.streakDays || 0;
});

const currentUserAccuracy = computed(() => {
  return userStore.profile.accuracyRate || gamificationStore.state.accuracyRate || 0;
});

const hasCompany = computed(() => !!userStore.profile.organizationId);
const companyName = computed(() => userStore.currentOrganization?.name || userStore.profile.companyName || 'Mi Empresa');

/**
 * Helper to process and sort raw pool of users with multicriteria tiebreaking
 */
function sortAndRank(poolRaw: LeagueLeaderboardEntry[]): LeagueLeaderboardEntry[] {
  const myUid = currentUserId.value;
  let pool = [...poolRaw];

  // If the logged-in user is not yet returned in the query pool, inject their real profile
  if (myUid && !pool.some((e) => e.userId === myUid)) {
    pool.push({
      id: `lb_${myUid}`,
      userId: myUid,
      displayName: currentUserDisplayName.value,
      avatarUrl: currentUserAvatar.value,
      xp: currentUserXp.value,
      streakDays: currentUserStreak.value,
      accuracyRate: currentUserAccuracy.value,
      rank: pool.length + 1,
      isCurrentUser: true,
      trend: 'same',
      zone: 'safe',
    });
  }

  // Ensure current user record has the freshest local store values
  pool = pool.map((item) => {
    if (myUid && item.userId === myUid) {
      return {
        ...item,
        isCurrentUser: true,
        displayName: currentUserDisplayName.value || item.displayName,
        avatarUrl: currentUserAvatar.value || item.avatarUrl,
        xp: Math.max(item.xp, currentUserXp.value),
        streakDays: Math.max(item.streakDays || 0, currentUserStreak.value),
        accuracyRate: item.accuracyRate ?? currentUserAccuracy.value,
      };
    }
    return {
      ...item,
      isCurrentUser: false,
    };
  });

  // Quantitative sorting with tiebreakers
  pool.sort((a, b) => {
    const xpA = typeof a.xp === 'number' ? a.xp : 0;
    const xpB = typeof b.xp === 'number' ? b.xp : 0;
    if (xpB !== xpA) return xpB - xpA;

    const accA = typeof a.accuracyRate === 'number' ? a.accuracyRate : 0;
    const accB = typeof b.accuracyRate === 'number' ? b.accuracyRate : 0;
    if (accB !== accA) return accB - accA;

    const strA = typeof a.streakDays === 'number' ? a.streakDays : 0;
    const strB = typeof b.streakDays === 'number' ? b.streakDays : 0;
    return strB - strA;
  });

  return pool.map((item, index) => {
    const rank = index + 1;
    return {
      ...item,
      rank,
      zone: rank <= 5 ? ('promotion' as const) : ('safe' as const),
    };
  });
}

/**
 * Computed Sorted Leaderboard depending on activeScope ('global' or 'company')
 */
const sortedLeaderboard = computed<LeagueLeaderboardEntry[]>(() => {
  if (activeScope.value === 'company') {
    return sortAndRank(rawCompanyLeaderboard.value);
  }
  return sortAndRank(rawGlobalLeaderboard.value);
});

// Ranking of the current authenticated user
const currentUserRank = computed(() => {
  const myUid = currentUserId.value;
  const index = sortedLeaderboard.value.findIndex(
    (e) => e.userId === myUid || e.isCurrentUser
  );
  return index !== -1 ? index + 1 : 1;
});

const isCurrentUserInPodium = computed(() => currentUserRank.value <= 3);

// Dynamic podium elements (< 3 users gracefully handled)
const top1 = computed(() => sortedLeaderboard.value[0] || null);
const top2 = computed(() => sortedLeaderboard.value[1] || null);
const top3 = computed(() => sortedLeaderboard.value[2] || null);
const restOfBoard = computed(() => sortedLeaderboard.value.slice(3));

const xpToPromotion = computed(() => {
  const userRank = currentUserRank.value;
  if (userRank <= 5) return 0;
  const fifthPlaceXp = sortedLeaderboard.value[4]?.xp || 0;
  return Math.max(1, fifthPlaceXp - currentUserXp.value + 5);
});

async function loadData() {
  const userLeague = currentLeagueTitle.value;
  const myUid = currentUserId.value;
  const orgId = userStore.profile.organizationId;

  try {
    const globalData = await firestore.getLeaderboard(userLeague, myUid);
    rawGlobalLeaderboard.value = globalData;

    if (orgId) {
      const companyData = await firestore.getOrganizationLeaderboard(orgId, myUid);
      rawCompanyLeaderboard.value = companyData;
    }
  } catch (err) {
    console.warn('[LeaderboardView] Error fetching leaderboard:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleRefresh() {
  isRefreshing.value = true;
  await loadData();
  await gamificationStore.loadGamificationData(currentUserId.value);
  setTimeout(() => {
    isRefreshing.value = false;
  }, 400);
}

function setupSubscriptions() {
  const userLeague = currentLeagueTitle.value;
  const myUid = currentUserId.value;
  const orgId = userStore.profile.organizationId;

  // Global subscription
  if (unsubscribeGlobal) unsubscribeGlobal();
  unsubscribeGlobal = firestore.subscribeToLeaderboard(
    userLeague,
    myUid,
    (updatedEntries) => {
      rawGlobalLeaderboard.value = updatedEntries;
      isLoading.value = false;
    }
  );

  // Company subscription if assigned
  if (unsubscribeCompany) unsubscribeCompany();
  if (orgId) {
    unsubscribeCompany = firestore.subscribeToOrganizationLeaderboard(
      orgId,
      myUid,
      (updatedEntries) => {
        rawCompanyLeaderboard.value = updatedEntries;
      }
    );
  }
}

watch(
  () => userStore.profile.organizationId,
  (newOrgId) => {
    if (newOrgId) {
      loadData();
      setupSubscriptions();
    }
  }
);

watch(
  () => route.query.scope,
  (newScope) => {
    if (newScope === 'company') {
      activeScope.value = 'company';
    } else if (newScope === 'global') {
      activeScope.value = 'global';
    }
  }
);

onMounted(async () => {
  if (route.query.scope === 'company' || route.query.view === 'company') {
    activeScope.value = 'company';
  }

  await loadData();
  setupSubscriptions();
});

onUnmounted(() => {
  if (unsubscribeGlobal) {
    unsubscribeGlobal();
    unsubscribeGlobal = null;
  }
  if (unsubscribeCompany) {
    unsubscribeCompany();
    unsubscribeCompany = null;
  }
});
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col w-full select-none text-left">
    <!-- Header HUD: Ancho completo de borde a borde -->
    <HeaderHud title="Tabla De Clasificación" />

    <main class="view-master-container flex-1 w-full pb-28 flex flex-col gap-5">
      <!-- Scope Selector Toggle: Global vs Company -->
      <div class="mt-2 bg-surface-container-high/80 p-1 rounded-2xl flex items-center gap-1 border border-outline-variant/30 shadow-xs">
        <button
          type="button"
          @click="activeScope = 'global'"
          class="flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
          :class="activeScope === 'global' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
        >
          <span class="material-symbols-outlined text-[17px] icon-filled">emoji_events</span>
          <span>Liga Global</span>
        </button>

        <button
          type="button"
          @click="activeScope = 'company'"
          class="flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
          :class="activeScope === 'company' ? 'bg-[#5F4030] text-[#F6E3B8] shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
        >
          <span class="material-symbols-outlined text-[17px] icon-filled">domain</span>
          <span class="truncate">{{ hasCompany ? companyName : 'Mi PYME' }}</span>
        </button>
      </div>

      <!-- State: User selected 'company' scope but doesn't have an organization -->
      <div
        v-if="activeScope === 'company' && !hasCompany"
        class="mt-2 bg-surface-container-high rounded-2xl p-6 text-center border border-outline-variant/30 flex flex-col items-center gap-3"
      >
        <div class="w-14 h-14 rounded-2xl bg-[#5F4030] text-[#F6E3B8] flex items-center justify-center shadow-md">
          <span class="material-symbols-outlined text-[32px] icon-filled">domain_add</span>
        </div>
        <div>
          <h2 class="text-sm font-black text-on-surface">Ligas Privadas Empresariales</h2>
          <p class="text-xs text-on-surface-variant mt-1 max-w-xs">
            Aún no estás vinculado a una organización. Ingresa el código de 6 caracteres de tu empresa para competir exclusivamente con tus compañeros.
          </p>
        </div>
        <router-link
          to="/tabs/organization"
          class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 shadow-xs"
        >
          Unirme o Registrar Empresa
        </router-link>
      </div>

      <!-- Normal Leaderboard View (Global or Company when enrolled) -->
      <template v-else>
        <!-- League Status Card -->
        <div class="bg-surface-container-high rounded-2xl p-space-md shadow-xs border border-outline-variant/30 relative overflow-hidden">
          <div class="flex items-center justify-between gap-space-sm">
            <div class="flex items-center gap-space-xs min-w-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center shadow-xs shrink-0"
                :class="activeScope === 'company' ? 'bg-[#5F4030] text-[#F6E3B8]' : 'bg-primary-container text-on-primary-container'"
              >
                <span class="material-symbols-outlined text-[24px] icon-filled">
                  {{ activeScope === 'company' ? 'domain' : 'emoji_events' }}
                </span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-base font-extrabold text-on-surface truncate">
                  {{ activeScope === 'company' ? `Liga Privada · ${companyName}` : `Liga ${currentLeagueTitle}` }}
                </span>
                <div class="flex items-center gap-1.5 text-on-surface-variant text-xs">
                  <span class="material-symbols-outlined text-[14px]">
                    {{ activeScope === 'company' ? 'group' : 'schedule' }}
                  </span>
                  <span>
                    {{ activeScope === 'company' ? `${sortedLeaderboard.length} colaboradores activos` : weeklyCountdown }}
                  </span>
                  <button
                    @click="handleRefresh"
                    class="ml-1 text-primary hover:text-primary-container active:scale-95 transition-transform flex items-center"
                    title="Actualizar ranking en vivo"
                  >
                    <span
                      class="material-symbols-outlined text-[15px]"
                      :class="{ 'animate-spin': isRefreshing }"
                    >
                      refresh
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 shrink-0 border border-outline-variant/30">
              <span class="material-symbols-outlined text-[15px] text-primary icon-filled">
                {{ activeScope === 'company' ? 'verified' : 'workspace_premium' }}
              </span>
              <span class="text-[11px] font-bold text-on-surface">
                {{ activeScope === 'company' ? 'Interna' : currentLeagueTier.divisionRoman }}
              </span>
            </div>
          </div>

          <div class="mt-2.5 bg-tertiary-fixed/40 rounded-xl p-2.5 flex items-center gap-2 border border-tertiary/20">
            <span class="material-symbols-outlined text-tertiary text-[18px] shrink-0 icon-filled">
              {{ activeScope === 'company' ? 'military_tech' : 'keyboard_double_arrow_up' }}
            </span>
            <p class="text-xs text-on-tertiary-fixed-variant truncate">
              <template v-if="activeScope === 'company'">
                Torneo interno exclusivo para colaboradores de <strong class="text-tertiary font-extrabold">{{ companyName }}</strong>
              </template>
              <template v-else>
                Top 5 asciende a <strong class="text-tertiary font-extrabold">{{ nextLeagueTitle }}</strong>
              </template>
            </p>
          </div>
        </div>

        <!-- Loading State Skeleton -->
        <div v-if="isLoading" class="bg-surface-container rounded-2xl p-6 shadow-xs border border-outline-variant/30 mt-1 flex flex-col items-center justify-center gap-3">
          <div class="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p class="text-xs font-bold text-on-surface-variant">Conectando con la liga en Firestore...</p>
        </div>

        <!-- Top Podium Container (Dynamic Adaptability for < 3 users) -->
        <div
          v-else
          class="bg-surface-container rounded-2xl pt-space-md px-space-sm pb-2 shadow-xs border border-outline-variant/30 mt-1"
        >
          <!-- Scenario 0: Zero users registered yet -->
          <div v-if="sortedLeaderboard.length === 0" class="py-8 text-center flex flex-col items-center">
            <div class="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary mb-2 shadow-xs">
              <span class="material-symbols-outlined text-[32px] icon-filled">emoji_events</span>
            </div>
            <p class="text-sm font-extrabold text-on-surface">
              {{ activeScope === 'company' ? `¡Inaugura la tabla de ${companyName}!` : `¡Inaugura la Liga ${currentLeagueTitle}!` }}
            </p>
            <p class="text-xs text-on-surface-variant max-w-xs mt-1">
              Completa lecciones para ganar XP y proclamarte líder en el podio.
            </p>
          </div>

          <!-- Scenario 1: Exactly 1 User (Solo Winner Podium) -->
          <div
            v-else-if="sortedLeaderboard.length === 1 && top1"
            class="flex flex-col items-center py-3 max-w-xs mx-auto text-center"
          >
            <div class="text-primary-container animate-bounce mb-[-2px]">
              <span class="material-symbols-outlined text-[28px] icon-filled">crown</span>
            </div>
            <div class="relative mb-2">
              <div
                class="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 bg-primary-container"
                :class="top1.isCurrentUser ? 'border-primary ring-4 ring-primary/30' : 'border-primary'"
              >
                <img
                  :src="resolveAvatar(top1.avatarUrl)"
                  @error="handleImageError"
                  :alt="top1.displayName"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs text-xs font-black">
                1
              </div>
            </div>
            <span
              class="text-sm truncate w-full"
              :class="top1.isCurrentUser ? 'font-black text-primary' : 'font-extrabold text-on-surface'"
            >
              {{ top1.isCurrentUser ? `${top1.displayName} (Tú)` : top1.displayName }}
            </span>
            <div class="flex items-center gap-1 mt-1">
              <span class="material-symbols-outlined text-primary text-[15px] icon-filled">bolt</span>
              <span class="text-xs font-black text-primary">{{ top1.xp.toLocaleString() }} XP</span>
              <span v-if="(top1.streakDays || 0) > 0" class="text-[11px] font-bold text-amber-500 ml-1.5 flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[13px] icon-filled">local_fire_department</span>
                {{ top1.streakDays }}d
              </span>
            </div>
            <div class="w-full mt-3 h-20 rounded-xl bg-primary-container flex flex-col items-center justify-center shadow-inner text-white">
              <span class="material-symbols-outlined text-[28px] icon-filled">emoji_events</span>
              <span class="text-[10px] font-black uppercase tracking-wider">
                {{ activeScope === 'company' ? 'LÍDER DEL EQUIPO' : 'LÍDER DE LIGA' }}
              </span>
            </div>
            <p class="text-[11px] text-on-surface-variant font-bold mt-2">
              {{ activeScope === 'company' ? 'Invita a más compañeros a sumar puntos por tu empresa.' : 'Esperando a los próximos competidores en esta liga...' }}
            </p>
          </div>

          <!-- Scenario 2: Exactly 2 Users (2-person Balanced Podium) -->
          <div
            v-else-if="sortedLeaderboard.length === 2 && top1 && top2"
            class="flex items-end justify-center gap-4 max-w-xs mx-auto py-2"
          >
            <!-- 2nd Place -->
            <div class="flex-1 flex flex-col items-center">
              <div class="relative mb-2">
                <div
                  class="w-13 h-13 rounded-full overflow-hidden shadow-md bg-surface-container-highest border-2"
                  :class="top2.isCurrentUser ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant'"
                >
                  <img
                    :src="resolveAvatar(top2.avatarUrl)"
                    @error="handleImageError"
                    :alt="top2.displayName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-outline-variant text-on-surface flex items-center justify-center shadow-xs text-[10px] font-extrabold">
                  2
                </div>
              </div>
              <span
                class="text-xs truncate w-full text-center"
                :class="top2.isCurrentUser ? 'font-extrabold text-primary' : 'font-bold text-on-surface'"
              >
                {{ top2.isCurrentUser ? `${top2.displayName} (Tú)` : top2.displayName }}
              </span>
              <div class="flex items-center gap-0.5 mt-0.5">
                <span class="material-symbols-outlined text-primary text-[13px] icon-filled">bolt</span>
                <span class="text-[11px] font-extrabold text-on-surface-variant">{{ top2.xp.toLocaleString() }}</span>
              </div>
              <div class="w-full mt-2 h-16 rounded-t-xl bg-surface-container-highest flex flex-col items-center justify-center shadow-inner">
                <span class="material-symbols-outlined text-[24px] text-outline icon-filled">military_tech</span>
              </div>
            </div>

            <!-- 1st Place (Winner) -->
            <div class="flex-1 flex flex-col items-center -mt-5 z-10">
              <div class="text-primary-container animate-bounce mb-[-4px]">
                <span class="material-symbols-outlined text-[24px] icon-filled">crown</span>
              </div>
              <div class="relative mb-2">
                <div
                  class="w-14 h-14 rounded-full overflow-hidden shadow-lg bg-primary-container border-2"
                  :class="top1.isCurrentUser ? 'border-primary ring-2 ring-primary/50' : 'border-primary'"
                >
                  <img
                    :src="resolveAvatar(top1.avatarUrl)"
                    @error="handleImageError"
                    :alt="top1.displayName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs text-[10px] font-extrabold">
                  1
                </div>
              </div>
              <span
                class="text-xs truncate w-full text-center"
                :class="top1.isCurrentUser ? 'font-black text-primary' : 'font-extrabold text-on-surface'"
              >
                {{ top1.isCurrentUser ? `${top1.displayName} (Tú)` : top1.displayName }}
              </span>
              <div class="flex items-center gap-0.5 mt-0.5">
                <span class="material-symbols-outlined text-primary text-[14px] icon-filled">bolt</span>
                <span class="text-xs font-extrabold text-primary">{{ top1.xp.toLocaleString() }}</span>
              </div>
              <div class="w-full mt-2 h-24 rounded-t-xl bg-primary-container flex flex-col items-center justify-center shadow-inner text-white">
                <span class="material-symbols-outlined text-[28px] icon-filled">emoji_events</span>
                <span class="text-[9px] font-black uppercase tracking-wider">
                  {{ activeScope === 'company' ? 'LÍDER PYME' : 'LÍDER' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Scenario 3: 3 or more users (Full Podium) -->
          <div
            v-else-if="sortedLeaderboard.length >= 3 && top1 && top2 && top3"
            class="flex items-end justify-center gap-2 max-w-sm mx-auto"
          >
            <!-- 2nd Place -->
            <div class="flex-1 flex flex-col items-center">
              <div class="relative mb-2">
                <div
                  class="w-12 h-12 rounded-full overflow-hidden shadow-md bg-surface-container-highest border-2"
                  :class="top2.isCurrentUser ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant'"
                >
                  <img
                    :src="resolveAvatar(top2.avatarUrl)"
                    @error="handleImageError"
                    :alt="top2.displayName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-outline-variant text-on-surface flex items-center justify-center shadow-xs text-[10px] font-extrabold">
                  2
                </div>
              </div>
              <span
                class="text-xs truncate w-full text-center"
                :class="top2.isCurrentUser ? 'font-extrabold text-primary' : 'font-bold text-on-surface'"
              >
                {{ top2.isCurrentUser ? `${top2.displayName} (Tú)` : top2.displayName }}
              </span>
              <div class="flex items-center gap-0.5 mt-0.5">
                <span class="material-symbols-outlined text-primary text-[13px] icon-filled">bolt</span>
                <span class="text-[11px] font-extrabold text-on-surface-variant">{{ top2.xp.toLocaleString() }}</span>
              </div>
              <div class="w-full mt-2 h-16 rounded-t-xl bg-surface-container-highest flex flex-col items-center justify-center shadow-inner">
                <span class="material-symbols-outlined text-[24px] text-outline icon-filled">military_tech</span>
              </div>
            </div>

            <!-- 1st Place (Winner) -->
            <div class="flex-1 flex flex-col items-center -mt-5 z-10">
              <div class="text-primary-container animate-bounce mb-[-4px]">
                <span class="material-symbols-outlined text-[24px] icon-filled">crown</span>
              </div>
              <div class="relative mb-2">
                <div
                  class="w-14 h-14 rounded-full overflow-hidden shadow-lg bg-primary-container border-2"
                  :class="top1.isCurrentUser ? 'border-tertiary ring-2 ring-tertiary' : 'border-primary'"
                >
                  <img
                    :src="resolveAvatar(top1.avatarUrl)"
                    @error="handleImageError"
                    :alt="top1.displayName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs text-[10px] font-extrabold">
                  1
                </div>
              </div>
              <span
                class="text-xs truncate w-full text-center"
                :class="top1.isCurrentUser ? 'font-black text-primary' : 'font-extrabold text-on-surface'"
              >
                {{ top1.isCurrentUser ? `${top1.displayName} (Tú)` : top1.displayName }}
              </span>
              <div class="flex items-center gap-0.5 mt-0.5">
                <span class="material-symbols-outlined text-primary text-[14px] icon-filled">bolt</span>
                <span class="text-xs font-extrabold text-primary">{{ top1.xp.toLocaleString() }}</span>
              </div>
              <div class="w-full mt-2 h-24 rounded-t-xl bg-primary-container flex flex-col items-center justify-center shadow-inner text-white">
                <span class="material-symbols-outlined text-[28px] icon-filled">emoji_events</span>
                <span class="text-[9px] font-black uppercase tracking-wider">
                  {{ activeScope === 'company' ? 'LÍDER PYME' : 'LÍDER' }}
                </span>
              </div>
            </div>

            <!-- 3rd Place -->
            <div class="flex-1 flex flex-col items-center">
              <div class="relative mb-2">
                <div
                  class="w-12 h-12 rounded-full overflow-hidden shadow-md bg-secondary-container border-2"
                  :class="top3.isCurrentUser ? 'border-primary ring-2 ring-primary/40' : 'border-secondary'"
                >
                  <img
                    :src="resolveAvatar(top3.avatarUrl)"
                    @error="handleImageError"
                    :alt="top3.displayName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs text-[10px] font-extrabold">
                  3
                </div>
              </div>
              <span
                class="text-xs truncate w-full text-center"
                :class="top3.isCurrentUser ? 'font-extrabold text-primary' : 'font-bold text-on-surface'"
              >
                {{ top3.isCurrentUser ? `${top3.displayName} (Tú)` : top3.displayName }}
              </span>
              <div class="flex items-center gap-0.5 mt-0.5">
                <span class="material-symbols-outlined text-primary text-[13px] icon-filled">bolt</span>
                <span class="text-[11px] font-extrabold text-on-surface-variant">{{ top3.xp.toLocaleString() }}</span>
              </div>
              <div class="w-full mt-2 h-14 rounded-t-xl bg-secondary-container flex flex-col items-center justify-center shadow-inner">
                <span class="material-symbols-outlined text-[22px] text-on-secondary-container icon-filled">workspace_premium</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Promotion Zone Title -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-tertiary"></span>
            <span class="text-[11px] text-tertiary uppercase tracking-wider font-extrabold">
              {{ activeScope === 'company' ? `Equipo ${companyName}` : 'Zona de Ascenso Directo' }}
            </span>
          </div>
          <span class="text-[11px] text-on-surface-variant font-bold">
            {{ activeScope === 'company' ? `${sortedLeaderboard.length} Miembros` : 'Top 5' }}
          </span>
        </div>

        <!-- Leaderboard List (Ranks 4+) -->
        <div v-if="restOfBoard.length > 0" class="flex flex-col gap-2">
          <div
            v-for="entry in restOfBoard"
            :key="entry.id"
            class="rounded-xl p-2.5 flex items-center justify-between shadow-xs border transition-colors"
            :class="[
              entry.isCurrentUser
                ? 'border-2 shadow-sm font-extrabold'
                : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container',
            ]"
            :style="entry.isCurrentUser ? 'background-color: #F6E3B8; border-color: #5F4030; color: #5F4030;' : ''"
          >
            <div class="flex items-center gap-space-sm min-w-0">
              <span
                class="w-5 text-center text-xs font-black shrink-0"
                :class="entry.isCurrentUser ? 'text-[#5F4030]' : 'text-on-surface'"
              >
                {{ entry.rank }}
              </span>
              <div
                class="w-9 h-9 rounded-full overflow-hidden bg-surface-container shrink-0 border"
                :class="entry.isCurrentUser ? 'border-[#5F4030]' : 'border-outline-variant/30'"
              >
                <img
                  :src="resolveAvatar(entry.avatarUrl)"
                  @error="handleImageError"
                  :alt="entry.displayName"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 truncate">
                  <span
                    class="text-xs truncate font-extrabold"
                    :class="entry.isCurrentUser ? 'text-[#5F4030]' : 'text-on-surface'"
                  >
                    {{ entry.displayName }}
                  </span>
                  <span
                    v-if="entry.isCurrentUser"
                    class="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#5F4030] text-[#F6E3B8] shrink-0"
                  >
                    Tú
                  </span>
                </div>
                <div class="flex items-center gap-2 text-[10px] font-bold">
                  <span
                    class="flex items-center gap-0.5"
                    :class="entry.zone === 'promotion' ? 'text-tertiary' : 'text-on-surface-variant'"
                  >
                    <span v-if="entry.zone === 'promotion'" class="material-symbols-outlined text-[13px]">arrow_upward</span>
                    {{ entry.zone === 'promotion' ? 'Sube de liga' : 'Mantiene posición' }}
                  </span>
                  <span v-if="(entry.streakDays || 0) > 0" class="text-amber-600 flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-[12px] icon-filled">local_fire_department</span>
                    {{ entry.streakDays }}d
                  </span>
                </div>
              </div>
            </div>

            <div
              class="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
              :class="entry.isCurrentUser ? 'bg-[#5F4030]/10 text-[#5F4030]' : 'bg-surface-container text-on-surface'"
            >
              <span class="material-symbols-outlined text-[14px] text-primary icon-filled">bolt</span>
              <span class="text-xs font-black">{{ entry.xp.toLocaleString() }} XP</span>
            </div>
          </div>
        </div>

        <!-- Friendly Note when all real users fit in podium (< 4 users) -->
        <div
          v-else-if="!isLoading && sortedLeaderboard.length > 0"
          class="text-center py-4 px-3 bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/40 mt-1"
        >
          <p class="text-xs font-bold text-on-surface">
            {{
              activeScope === 'company'
                ? `¡Todos los colaboradores de ${companyName} están en el podio!`
                : (sortedLeaderboard.length === 1 ? '¡Eres el único centinela en esta liga!' : '¡Los competidores registrados están en el podio!')
            }}
          </p>
          <p class="text-[11px] text-on-surface-variant mt-0.5">
            {{
              activeScope === 'company'
                ? 'Invita a más miembros de tu equipo con el código de la empresa.'
                : 'Invita a tus compañeros a unirse a SuriLearn para competir por el ascenso.'
            }}
          </p>
        </div>

        <!-- Current User Sticky Rank Bar ("Tú") -->
        <div class="sticky bottom-18 mt-2 z-30 pointer-events-auto">
          <div
            class="rounded-2xl p-3 shadow-lg border-2 flex items-center justify-between backdrop-blur-md"
            :class="[
              isCurrentUserInPodium
                ? 'bg-[#F6E3B8]/95 border-[#5F4030] text-[#5F4030]'
                : 'bg-primary-fixed/40 border-primary-container text-on-surface',
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="w-6 text-center text-sm font-black shrink-0"
                :class="isCurrentUserInPodium ? 'text-[#5F4030]' : 'text-primary'"
              >
                #{{ currentUserRank }}
              </span>
              <div
                class="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 shadow-xs"
                :class="isCurrentUserInPodium ? 'border-[#5F4030] bg-[#5F4030]/10' : 'border-primary bg-primary-fixed'"
              >
                <img
                  :src="currentUserAvatar"
                  @error="handleImageError"
                  alt="Tú"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-xs font-black truncate">
                    Tú ({{ currentUserDisplayName }})
                  </span>
                  <span
                    class="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0"
                    :class="isCurrentUserInPodium ? 'bg-[#5F4030] text-[#F6E3B8]' : 'bg-primary text-white'"
                  >
                    Tú
                  </span>
                </div>
                <span
                  class="text-[10px] font-bold truncate flex items-center gap-0.5"
                  :class="isCurrentUserInPodium ? 'text-[#5F4030]' : (currentUserRank <= 5 ? 'text-tertiary' : 'text-primary')"
                >
                  <span class="material-symbols-outlined text-[13px]">
                    {{ currentUserRank === 1 ? 'emoji_events' : (currentUserRank <= 5 ? 'arrow_upward' : 'shield') }}
                  </span>
                  {{
                    currentUserRank === 1
                      ? (activeScope === 'company' ? `👑 ¡Liderando ${companyName}!` : '👑 ¡Liderando la Liga!')
                      : (currentUserRank <= 5
                        ? '🎉 ¡En Zona de Ascenso Directo!'
                        : `A ${xpToPromotion} XP de Zona de Ascenso`)
                  }}
                </span>
              </div>
            </div>

            <div class="flex flex-col items-end shrink-0 pl-2">
              <div
                class="flex items-center gap-1 px-2.5 py-1 rounded-full shadow-xs"
                :class="isCurrentUserInPodium ? 'bg-[#5F4030] text-[#F6E3B8]' : 'bg-surface-container text-on-surface'"
              >
                <span class="material-symbols-outlined text-[14px] icon-filled" :class="isCurrentUserInPodium ? 'text-[#F6E3B8]' : 'text-primary'">bolt</span>
                <span class="text-xs font-black">{{ currentUserXp.toLocaleString() }} XP</span>
              </div>
              <span v-if="currentUserStreak > 0" class="text-[10px] font-bold mt-0.5 flex items-center gap-0.5" :class="isCurrentUserInPodium ? 'text-[#5F4030]' : 'text-amber-600'">
                <span class="material-symbols-outlined text-[12px] icon-filled">local_fire_department</span>
                {{ currentUserStreak }}d racha
              </span>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
