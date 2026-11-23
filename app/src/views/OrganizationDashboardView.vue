<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/useUserStore';
import { useFirestore } from '../composables/useFirestore';
import { useGamificationStore } from '../stores/useGamificationStore';
import HeaderHud from '../components/common/HeaderHud.vue';
import AdminAnalytics from '../components/organization/AdminAnalytics.vue';
import MemberDetailModal from '../components/organization/MemberDetailModal.vue';
import { getSuriImage } from '../utils/suriAssets';
import { Organization, UserProfile } from '../types/gamification';
import { redirectToB2BStripeCheckout, verifyCheckoutSession, B2B_PLANS_CONFIG, B2BPlan } from '../services/stripeService';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const firestore = useFirestore();
const gamificationStore = useGamificationStore();

const suriShieldImg = getSuriImage('shield');
const suriIdleImg = getSuriImage('idle');

const isLoading = ref<boolean>(true);
const inviteCodeInput = ref<string>('');
const isJoining = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const newOrgName = ref<string>('');
const showCreateModal = ref<boolean>(false);
const showUpgradeModal = ref<boolean>(false);
const isProcessingPayment = ref<boolean>(false);
const copySuccess = ref<boolean>(false);

// Member Management State
const selectedMember = ref<UserProfile | null>(null);
const isDetailModalOpen = ref<boolean>(false);
const memberSearchQuery = ref<string>('');
const memberStatusFilter = ref<'all' | 'active' | 'suspended'>('all');

const organization = computed<Organization | null>(() => userStore.currentOrganization);
const members = computed<UserProfile[]>(() => userStore.organizationMembers);
const isSmeAdmin = computed(() => userStore.isSmeAdmin);
const hasOrganization = computed(() => userStore.hasOrganization);

// Filtered member list for directory
const filteredMembers = computed(() => {
  const query = memberSearchQuery.value.trim().toLowerCase();
  return members.value.filter((m) => {
    // Filter by text query
    const matchName = (m.displayName || '').toLowerCase().includes(query);
    const matchEmail = (m.email || '').toLowerCase().includes(query);
    const matchesSearch = !query || matchName || matchEmail;

    // Filter by status
    const status = m.status || 'active';
    const matchesStatus =
      memberStatusFilter.value === 'all' ||
      (memberStatusFilter.value === 'active' && status === 'active') ||
      (memberStatusFilter.value === 'suspended' && status === 'suspended');

    return matchesSearch && matchesStatus;
  });
});

function resolveAvatar(url?: string | null): string {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/'))) {
    return url;
  }
  return suriIdleImg;
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  if (target && target.src !== suriIdleImg) {
    target.src = suriIdleImg;
  }
}

async function copyInviteCode() {
  if (!organization.value?.inviteCode) return;
  try {
    await navigator.clipboard.writeText(organization.value.inviteCode);
    copySuccess.value = true;
    gamificationStore.showToast(`¡Código de invitación ${organization.value.inviteCode} copiado! 📋`, true);
    setTimeout(() => {
      copySuccess.value = false;
    }, 2500);
  } catch {
    gamificationStore.showToast(`Código: ${organization.value.inviteCode}`, true);
  }
}

function openMemberDetail(member: UserProfile) {
  selectedMember.value = member;
  isDetailModalOpen.value = true;
}

async function handleToggleMemberStatus(member: UserProfile) {
  await userStore.toggleMemberStatus(member.uid);
  if (selectedMember.value?.uid === member.uid) {
    selectedMember.value.status = selectedMember.value.status === 'suspended' ? 'active' : 'suspended';
  }
}

async function handleRemoveMember(member: UserProfile) {
  if (!organization.value) return;
  const res = await userStore.removeMemberFromOrg(organization.value.id, member.uid);
  if (res.success) {
    isDetailModalOpen.value = false;
    selectedMember.value = null;
  }
}

async function handleJoinWithCode() {
  if (!inviteCodeInput.value.trim()) return;
  isJoining.value = true;
  try {
    const res = await userStore.joinOrganizationByCode(inviteCodeInput.value.trim());
    if (res.success) {
      inviteCodeInput.value = '';
    } else {
      gamificationStore.showToast(res.message, false);
    }
  } finally {
    isJoining.value = false;
  }
}

async function handleCreateOrg() {
  if (!newOrgName.value.trim()) return;
  isCreating.value = true;
  try {
    const res = await userStore.createNewOrganization(newOrgName.value.trim(), 'micro_pyme');
    if (res.success) {
      showCreateModal.value = false;
      newOrgName.value = '';
    } else {
      gamificationStore.showToast(res.message, false);
    }
  } finally {
    isCreating.value = false;
  }
}

async function handleUpgradePlan(plan: B2BPlan) {
  if (!organization.value || isProcessingPayment.value) return;
  isProcessingPayment.value = true;
  try {
    gamificationStore.showToast('Conectando de forma segura con Stripe Checkout B2B... 💳🔒', true);
    await redirectToB2BStripeCheckout({
      plan,
      orgId: organization.value.id,
      orgName: organization.value.name,
      adminEmail: userStore.profile.email,
      adminUid: userStore.profile.uid,
    });
  } catch (err: any) {
    console.error('[OrganizationDashboard] Error en Stripe B2B:', err);
    gamificationStore.showToast(err.message || 'Error al conectar con Stripe.', false);
  } finally {
    isProcessingPayment.value = false;
  }
}

onMounted(async () => {
  isLoading.value = true;
  try {
    if (userStore.profile.organizationId) {
      await userStore.loadOrganization(userStore.profile.organizationId);
    } else if (userStore.profile.uid) {
      await userStore.loadProfile(userStore.profile.uid);
    }

    // Verificar retorno de pago Stripe B2B en el servidor antes de activar el plan
    const status = route.query.status as string;
    const sessionId = (route.query.session_id as string) || '';
    const planParam = route.query.plan as string;
    const queryOrgId = (route.query.orgId as string) || '';

    if (status === 'success') {
      if (!sessionId) {
        gamificationStore.showToast('No se pudo verificar el pago corporativo (sesión ausente).', false);
        router.replace({ path: '/tabs/organization' });
        return;
      }

      try {
        const verification = await verifyCheckoutSession(sessionId);
        const targetOrgId = organization.value?.id || verification.orgId || queryOrgId;
        const orgMatches = !verification.orgId || !targetOrgId || verification.orgId === targetOrgId;

        if (verification.verified && orgMatches && targetOrgId) {
          const verifiedPlan = (verification.plan || planParam || 'micro_pyme') as B2BPlan;
          const seats = verifiedPlan === 'enterprise' ? 100 : verifiedPlan === 'growth_pyme' ? 30 : 10;

          await firestore.updateOrganization(targetOrgId, {
            plan: verifiedPlan,
            subscriptionStatus: 'active',
            maxSeats: seats,
          });
          await userStore.loadOrganization(targetOrgId);
          gamificationStore.showToast(`¡Plan corporativo ${verifiedPlan.toUpperCase()} activado con éxito! 🛡️💼`, true);
        } else {
          gamificationStore.showToast(
            verification.error || 'El pago corporativo no pudo verificarse con Stripe.',
            false
          );
        }
      } catch (err: any) {
        gamificationStore.showToast(err?.message || 'Error verificando pago corporativo en Stripe.', false);
      }

      router.replace({ path: '/tabs/organization' });
    } else if (status === 'cancelled') {
      gamificationStore.showToast('Suscripción corporativa cancelada. No se realizó ningún cobro.', false);
      router.replace({ path: '/tabs/organization' });
    }
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col w-full select-none text-left">
    <!-- Header HUD: Ancho completo de borde a borde -->
    <HeaderHud title="Panel Corporativo PYME" />

    <main class="view-master-container flex-1 w-full pb-24 lg:pb-12 flex flex-col gap-6 overflow-y-auto">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="bg-surface-container rounded-3xl p-10 mt-3 flex flex-col items-center justify-center gap-3">
        <div class="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p class="text-xs font-bold text-on-surface-variant">Cargando infraestructura empresarial...</p>
      </div>

      <!-- State A: User belongs to an Organization -->
      <template v-else-if="hasOrganization && organization">
        <!-- Top Row: Enterprise Header & Quick League Access -->
        <div class="mt-2 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-highest rounded-3xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="w-14 h-14 rounded-2xl bg-[#5F4030] text-[#F6E3B8] flex items-center justify-center shadow-md shrink-0">
                <span class="material-symbols-outlined text-[32px] icon-filled">domain</span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <h1 class="text-xl lg:text-2xl font-black text-on-surface truncate">
                    {{ organization.name }}
                  </h1>
                  <span
                    class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                    :class="isSmeAdmin ? 'bg-primary text-white' : 'bg-tertiary text-white'"
                  >
                    {{ isSmeAdmin ? 'Gestor CISO' : 'Colaborador' }}
                  </span>
                </div>
                <span class="text-xs text-on-surface-variant font-medium">
                  {{ organization.industry || 'Infraestructura de Ciberseguridad' }}
                </span>
              </div>
            </div>

            <!-- Action Buttons: Upgrade Plan & League Link -->
            <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                v-if="isSmeAdmin"
                @click="showUpgradeModal = true"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-sm hover:bg-primary/90 transition-all"
              >
                <span class="material-symbols-outlined text-[16px]">workspace_premium</span>
                <span>Planes SaaS</span>
              </button>

              <router-link
                to="/tabs/leaderboard?scope=company"
                class="flex items-center gap-1.5 px-3.5 py-2 bg-tertiary text-white rounded-xl text-xs font-black hover:bg-tertiary/90 transition-all shadow-sm"
              >
                <span class="material-symbols-outlined text-[16px] icon-filled">trophy</span>
                <span>Liga de la Empresa</span>
              </router-link>
            </div>
          </div>

          <!-- Invite Code Bar (Strictly visible only to SME Admins) -->
          <div
            v-if="isSmeAdmin"
            class="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[20px]">group_add</span>
              <div class="flex flex-col">
                <span class="text-[11px] font-black uppercase tracking-wider text-on-surface">Código de Invitación Corporativo</span>
                <span class="text-[10px] text-on-surface-variant">Comparte este código para vincular nuevos colaboradores</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="font-mono text-base font-black tracking-widest text-primary bg-surface-container-low px-3 py-1 rounded-xl border border-outline-variant/30">
                {{ organization.inviteCode }}
              </span>
              <button
                @click="copyInviteCode"
                class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                :class="copySuccess ? 'bg-[#22C55E] text-white' : 'bg-primary text-white hover:bg-primary/90'"
              >
                <span class="material-symbols-outlined text-[15px]">
                  {{ copySuccess ? 'done' : 'content_copy' }}
                </span>
                <span>{{ copySuccess ? '¡Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View: Accumulated Analytics & Team Directory (RBAC Protected) -->
        <template v-if="isSmeAdmin">
          <AdminAnalytics :organization="organization" :members="members" />

          <!-- Section: Team Collaborators Management Directory -->
          <div class="flex flex-col gap-3 bg-surface-container-lowest p-4 lg:p-5 rounded-3xl border border-outline-variant/30 shadow-xs">
            <!-- Title & Search/Filter Controls -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <h2 class="text-sm font-black uppercase tracking-wider text-on-surface">
                    Directorio de Colaboradores
                  </h2>
                  <p class="text-[11px] text-on-surface-variant font-medium">
                    Supervisa y gestiona los accesos del personal en guardia
                  </p>
                </div>
              </div>

              <!-- Filters & Search -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Search Input -->
                <div class="relative flex-1 sm:w-48">
                  <span class="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant/60 text-[16px]">search</span>
                  <input
                    v-model="memberSearchQuery"
                    type="text"
                    placeholder="Buscar colaborador..."
                    class="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                </div>

                <!-- Status Toggle Filters -->
                <div class="flex bg-surface-container-low p-0.5 rounded-xl border border-outline-variant/30 text-[11px] font-black">
                  <button
                    @click="memberStatusFilter = 'all'"
                    class="px-2.5 py-1 rounded-lg transition-all"
                    :class="memberStatusFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
                  >
                    Todos ({{ members.length }})
                  </button>
                  <button
                    @click="memberStatusFilter = 'active'"
                    class="px-2.5 py-1 rounded-lg transition-all"
                    :class="memberStatusFilter === 'active' ? 'bg-[#22C55E] text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
                  >
                    Activos
                  </button>
                  <button
                    @click="memberStatusFilter = 'suspended'"
                    class="px-2.5 py-1 rounded-lg transition-all"
                    :class="memberStatusFilter === 'suspended' ? 'bg-[#EF4444] text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
                  >
                    Suspendidos
                  </button>
                </div>
              </div>
            </div>

            <!-- Members Grid / List -->
            <div v-if="filteredMembers.length === 0" class="py-8 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-1">person_search</span>
              <p class="text-xs font-bold">No se encontraron colaboradores con los criterios seleccionados.</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div
                v-for="member in filteredMembers"
                :key="member.uid"
                class="bg-surface rounded-2xl p-3.5 border transition-all hover:shadow-xs flex items-center justify-between gap-3"
                :class="
                  member.status === 'suspended'
                    ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                    : (member.uid === userStore.profile.uid ? 'border-[#5F4030] bg-[#F6E3B8]/20' : 'border-outline-variant/30')
                "
              >
                <!-- Left Info -->
                <div class="flex items-center gap-3 min-w-0">
                  <div class="relative w-11 h-11 rounded-2xl overflow-hidden bg-primary-fixed border border-primary/20 shrink-0">
                    <img
                      :src="resolveAvatar(member.avatarUrl)"
                      @error="handleImageError"
                      :alt="member.displayName"
                      class="w-full h-full object-cover"
                    />
                    <!-- Status Indicator Dot -->
                    <div
                      class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                      :class="member.status === 'suspended' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'"
                      :title="member.status === 'suspended' ? 'Cuenta pausada' : 'Activo'"
                    ></div>
                  </div>

                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs font-black text-on-surface truncate">
                        {{ member.displayName }}
                      </span>
                      <span
                        v-if="member.uid === userStore.profile.uid"
                        class="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#5F4030] text-[#F6E3B8] shrink-0"
                      >
                        Tú
                      </span>
                      <span
                        v-if="member.role === 'sme_admin'"
                        class="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0"
                      >
                        Admin
                      </span>
                      <span
                        v-if="(member.accuracyRate ?? 0) < 60 || member.status === 'suspended'"
                        class="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-error/15 text-error border border-error/30 shrink-0"
                      >
                        En Riesgo
                      </span>
                    </div>
                    <span class="text-[10px] text-on-surface-variant truncate">
                      {{ member.email }}
                    </span>
                    <!-- Metrics Sub-row -->
                    <div class="flex items-center gap-2 mt-0.5 text-[10px] font-bold">
                      <span class="text-primary flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[11px] icon-filled">bolt</span>
                        {{ (member.xp || 0).toLocaleString() }} XP
                      </span>
                      <span class="text-on-surface-variant/40">•</span>
                      <span class="text-tertiary">
                        {{ member.accuracyRate || 0 }}% acierto
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Right Actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Detail Button -->
                  <button
                    @click="openMemberDetail(member)"
                    class="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                    title="Ver Detalle y Métricas"
                  >
                    <span class="material-symbols-outlined text-[16px]">visibility</span>
                  </button>

                  <!-- Admin Action Quick Toggle (only if current user is SME admin and not targeting self) -->
                  <template v-if="isSmeAdmin && member.uid !== userStore.profile.uid">
                    <button
                      @click="handleToggleMemberStatus(member)"
                      class="p-2 rounded-xl transition-colors"
                      :class="
                        member.status === 'suspended'
                          ? 'bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25'
                          : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25'
                      "
                      :title="member.status === 'suspended' ? 'Reactivar acceso' : 'Pausar/Suspender colaborador'"
                    >
                      <span class="material-symbols-outlined text-[16px]">
                        {{ member.status === 'suspended' ? 'play_arrow' : 'pause' }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Regular Employee View (RBAC: Private personal telemetry only, no teammate emails or org metrics) -->
        <div
          v-else
          class="bg-surface-container-lowest rounded-3xl p-5 lg:p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px] icon-filled">verified_user</span>
            </div>
            <div>
              <h2 class="text-sm font-black uppercase tracking-wider text-on-surface">
                Mi Licencia Corporativa
              </h2>
              <p class="text-xs text-on-surface-variant font-medium">
                Tu empresa <strong class="text-on-surface">{{ organization.name }}</strong> te otorga corazones infinitos (SuriPro) para tu entrenamiento diario.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span class="text-[10px] font-black uppercase text-on-surface-variant block">Tu XP</span>
              <span class="text-xl font-black text-primary mt-0.5 block">{{ (userStore.profile.xp || 0).toLocaleString() }}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span class="text-[10px] font-black uppercase text-on-surface-variant block">Tu Precisión</span>
              <span class="text-xl font-black text-on-surface mt-0.5 block">{{ userStore.profile.accuracyRate || 0 }}%</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span class="text-[10px] font-black uppercase text-on-surface-variant block">Tu Racha</span>
              <span class="text-xl font-black text-on-surface mt-0.5 block">{{ userStore.profile.streakDays || 0 }}d</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span class="text-[10px] font-black uppercase text-on-surface-variant block">Lecciones</span>
              <span class="text-xl font-black text-tertiary mt-0.5 block">{{ userStore.profile.completedLessons?.length || 0 }}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <router-link
              to="/tabs/leaderboard?scope=company"
              class="px-4 py-2.5 rounded-2xl bg-tertiary text-white text-xs font-black flex items-center gap-1.5 shadow-xs"
            >
              <span class="material-symbols-outlined text-[16px] icon-filled">trophy</span>
              <span>Ver Liga Privada del Equipo</span>
            </router-link>
            <router-link
              to="/tabs/learn"
              class="px-4 py-2.5 rounded-2xl btn-tactile-primary text-xs font-black flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Continuar Entrenamiento</span>
            </router-link>
          </div>
        </div>
      </template>

      <!-- State B: Fallback for User without Organization -->
      <template v-else>
        <div class="mt-4 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center gap-4">
          <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">business_center</span>
          </div>

          <div class="flex flex-col gap-1 max-w-sm">
            <h2 class="text-lg font-black text-on-surface">Plataforma Empresarial PYME</h2>
            <p class="text-xs text-on-surface-variant leading-relaxed font-medium">
              Conecta tu cuenta corporativa para capacitar a tu equipo con misiones prácticas, telemetría y ligas privadas.
            </p>
          </div>

          <!-- Join with code form -->
          <div class="w-full max-w-sm flex flex-col gap-3 pt-2">
            <div class="flex gap-2">
              <input
                v-model="inviteCodeInput"
                type="text"
                maxlength="6"
                placeholder="Código de 6 caracteres (ej: ALB202)"
                class="flex-1 px-4 py-2.5 bg-surface-container-low rounded-2xl text-xs font-mono font-bold tracking-widest uppercase border border-outline-variant/30 focus:outline-none focus:border-primary text-center"
              />
              <button
                @click="handleJoinWithCode"
                :disabled="isJoining || !inviteCodeInput.trim()"
                class="px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
              >
                <span>{{ isJoining ? 'Uniendo...' : 'Unirse' }}</span>
                <span class="material-symbols-outlined text-[16px]">login</span>
              </button>
            </div>

            <div class="flex items-center gap-3 my-1">
              <div class="flex-1 h-px bg-outline-variant/30"></div>
              <span class="text-[10px] uppercase font-bold text-on-surface-variant">O crea tu empresa</span>
              <div class="flex-1 h-px bg-outline-variant/30"></div>
            </div>

            <button
              @click="showCreateModal = true"
              class="w-full py-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-black text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">add_business</span>
              <span>Registrar una Nueva PYME</span>
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- Modal: Member Detail Breakdown & Management -->
    <MemberDetailModal
      :member="selectedMember"
      :is-open="isDetailModalOpen"
      :is-admin="isSmeAdmin"
      :is-self="selectedMember?.uid === userStore.profile.uid"
      @close="isDetailModalOpen = false"
      @toggle-status="handleToggleMemberStatus"
      @remove-member="handleRemoveMember"
    />

    <!-- Modal: Create New Organization -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      @click.self="showCreateModal = false"
    >
      <div class="bg-surface rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-black text-on-surface">Nueva Organización</h3>
          <button @click="showCreateModal = false" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant font-medium">
          Crea el espacio empresarial para tu empresa y comienza a invitar a tus colaboradores.
        </p>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-black uppercase text-on-surface-variant">Nombre de la Empresa</label>
          <input
            v-model="newOrgName"
            type="text"
            placeholder="Ej: Inversiones Suri Ltda."
            class="px-4 py-2.5 bg-surface-container-low rounded-2xl text-xs font-bold text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            @click="showCreateModal = false"
            class="flex-1 py-2.5 rounded-2xl bg-surface-container-high text-xs font-bold text-on-surface"
          >
            Cancelar
          </button>
          <button
            @click="handleCreateOrg"
            :disabled="isCreating || !newOrgName.trim()"
            class="flex-1 py-2.5 rounded-2xl bg-primary text-white text-xs font-black hover:bg-primary/90 disabled:opacity-50"
          >
            {{ isCreating ? 'Creando...' : 'Crear Espacio' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Upgrade SaaS B2B Plans via Stripe -->
    <div
      v-if="showUpgradeModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      @click.self="showUpgradeModal = false"
    >
      <div class="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">workspace_premium</span>
            <h3 class="text-base font-black text-on-surface">Planes Corporativos SaaS</h3>
          </div>
          <button @click="showUpgradeModal = false" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant">
          Escala el entrenamiento de ciberseguridad en tu empresa aumentando los puestos y habilitando telemetría avanzada.
        </p>

        <!-- Tier Grid -->
        <div class="flex flex-col gap-3">
          <div
            v-for="(cfg, planKey) in B2B_PLANS_CONFIG"
            :key="planKey"
            class="p-4 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden"
            :class="organization?.plan === planKey ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/50'"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-black uppercase text-on-surface block">{{ cfg.name }}</span>
                <span class="text-lg font-black text-primary">${{ cfg.priceMonthlyUsd }} USD <span class="text-[10px] font-normal text-on-surface-variant">/ mes</span></span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary-fixed text-on-primary-fixed">
                Hasta {{ cfg.seats }} Centinelas
              </span>
            </div>

            <ul class="text-[11px] text-on-surface-variant space-y-1 my-1">
              <li v-for="(feat, idx) in cfg.features" :key="idx" class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px] text-[#22C55E]">check</span>
                <span>{{ feat }}</span>
              </li>
            </ul>

            <button
              v-if="organization?.plan !== planKey"
              @click="handleUpgradePlan(planKey)"
              :disabled="isProcessingPayment"
              class="w-full py-2 mt-1 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{{ isProcessingPayment ? 'Conectando con Stripe...' : 'Contratar Plan' }}</span>
              <span class="material-symbols-outlined text-[15px]">credit_card</span>
            </button>
            <div v-else class="w-full py-1.5 text-center text-xs font-extrabold text-[#22C55E] bg-[#22C55E]/10 rounded-xl">
              ✓ Plan Actualmente Activo
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
