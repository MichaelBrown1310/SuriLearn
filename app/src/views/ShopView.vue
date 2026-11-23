<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useUserStore } from '../stores/useUserStore';
import HeaderHud from '../components/common/HeaderHud.vue';
import { ShopItemCode } from '../types/gamification';
import { getSuriImage } from '../utils/suriAssets';
import { redirectToStripeCheckout, verifyCheckoutSession, SuriProPlan } from '../services/stripeService';

const route = useRoute();
const router = useRouter();
const gamificationStore = useGamificationStore();
const userStore = useUserStore();

const suriCoolImg = getSuriImage('cool');
const suriSleepingImg = getSuriImage('sleeping');
const isPurchasing = ref<ShopItemCode | null>(null);
const isCheckingOut = ref<SuriProPlan | null>(null);
const showSuccessModal = ref<boolean>(false);
const confirmedPlan = ref<string>('Mensual');

onMounted(async () => {
  await gamificationStore.loadGamificationData();

  // Comprobar retorno de pasarela de pago Stripe con verificación en servidor
  const status = route.query.status as string;
  const sessionId = (route.query.session_id as string) || '';
  const plan = (route.query.plan as SuriProPlan) || 'monthly';

  if (status === 'success') {
    if (!sessionId) {
      gamificationStore.showToast('No se pudo verificar el pago (sesión de Stripe ausente).', false);
      router.replace({ path: '/tabs/shop' });
      return;
    }

    try {
      const verification = await verifyCheckoutSession(sessionId);
      const sessionOwnerMatches =
        !verification.userId ||
        !userStore.profile.uid ||
        verification.userId === userStore.profile.uid;

      if (verification.verified && sessionOwnerMatches) {
        const verifiedPlan: SuriProPlan = verification.plan === 'annual' ? 'annual' : plan;
        confirmedPlan.value = verifiedPlan === 'annual' ? 'Anual' : 'Mensual';
        const success = await userStore.activateProMembership(verifiedPlan);
        if (success) {
          showSuccessModal.value = true;
          gamificationStore.showToast('¡Membresía SuriPro Centinela activada con éxito! 🛡️✨', true);
        } else {
          gamificationStore.showToast('Tu pago fue verificado. Si no ves tu membresía, reinicia sesión.', true);
        }
      } else {
        gamificationStore.showToast(
          verification.error || 'El pago no pudo verificarse con Stripe.',
          false
        );
      }
    } catch (err: any) {
      gamificationStore.showToast(err?.message || 'Error al verificar tu sesión de Stripe.', false);
    }
    router.replace({ path: '/tabs/shop' });
  } else if (status === 'cancelled') {
    gamificationStore.showToast('Proceso de pago cancelado. No se realizó ningún cobro.', false);
    router.replace({ path: '/tabs/shop' });
  }
});

async function handleBuy(itemCode: ShopItemCode) {
  if (isPurchasing.value) return;
  isPurchasing.value = itemCode;
  try {
    await gamificationStore.buyShopItem(itemCode);
  } finally {
    isPurchasing.value = null;
  }
}

async function handleStripeCheckout(plan: SuriProPlan) {
  if (isCheckingOut.value) return;

  if (!userStore.isAuthenticated && !userStore.profile.uid) {
    gamificationStore.showToast('Inicia sesión para vincular tu membresía SuriPro 🛡️', false);
    router.push({ path: '/login', query: { redirect: '/tabs/shop' } });
    return;
  }

  isCheckingOut.value = plan;

  try {
    gamificationStore.showToast('Conectando de forma segura con Stripe Checkout... 🔒', true);
    await redirectToStripeCheckout({
      plan,
      userId: userStore.profile.uid,
      userEmail: userStore.profile.email,
    });
  } catch (err: any) {
    console.error('[ShopView] Error al iniciar checkout de Stripe:', err);
    gamificationStore.showToast(
      err.message || 'Error al conectar con la pasarela de pagos de Stripe. Intenta de nuevo.',
      false
    );
  } finally {
    isCheckingOut.value = null;
  }
}

const isHeartsFull = computed(() => gamificationStore.hearts >= 5);
const hasStreakFreeze = computed(() => gamificationStore.hasStreakFreeze);
const hasXpBoostActive = computed(() => (gamificationStore.state.xpBoostLessonsRemaining || 0) > 0);
const isPro = computed(() => userStore.isPro);
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col w-full select-none text-left">
    <!-- Header HUD: Ancho completo de borde a borde -->
    <HeaderHud title="Tienda De Recompensas" />

    <!-- Contenedor Maestro de Vista -->
    <main class="view-master-container flex-1 w-full pb-16 flex flex-col gap-6">
      <!-- Top Balance and Mascot Callout Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Balance Card (Columna 1 y 2 en desktop) -->
        <div class="md:col-span-2 bg-surface-container-low rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-13 h-13 rounded-2xl bg-surface-container-high flex items-center justify-center text-tech-cyan shadow-inner p-2.5">
              <span class="material-symbols-outlined text-[32px] icon-filled">diamond</span>
            </div>
            <div>
              <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Tu Bóveda de Bits</p>
              <p class="text-2xl font-black text-on-surface flex items-center gap-1.5 mt-0.5">
                {{ gamificationStore.bits }}
                <span class="text-xs text-tech-cyan font-extrabold uppercase tracking-wide">Bits Disponibles</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            class="bg-surface-container-highest active:scale-95 text-on-surface text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs border border-outline-variant/20 hover:border-primary transition-all"
            @click="gamificationStore.showToast('Completa lecciones diarias para minar más Bits 💎', true)"
          >
            <span class="material-symbols-outlined text-[18px] text-primary">add_circle</span>
            <span>Minar Bits</span>
          </button>
        </div>

        <!-- Suri Mascot Motivational Mini-Prompt (Columna 3 en desktop) -->
        <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-surface-container overflow-hidden shrink-0 p-1 border border-outline-variant/20">
            <img :src="suriSleepingImg" alt="Suri pensando" class="w-full h-full object-contain" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-on-surface-variant leading-snug">
              <strong class="text-primary font-bold block mb-0.5">Suri dice:</strong>
              ¡Equípate bien antes de explorar nuevas madrigueras cibernéticas!
            </p>
          </div>
        </div>
      </div>

      <!-- Section 1: Items for Bits (Cuadrícula Adaptable Multicolumna) -->
      <section class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-base font-extrabold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">storefront</span>
            Artículos de Manada
          </h2>
          <span class="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            Canjeable con Bits
          </span>
        </div>

        <!-- Grid adaptable de 3-4 columnas para artículos -->
        <div class="shop-grid">
          <!-- Item 1: Streak Freeze -->
          <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center shrink-0 relative overflow-hidden p-2.5">
                <span class="material-symbols-outlined text-tech-cyan text-[32px] icon-filled">
                  local_fire_department
                </span>
                <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tertiary-fixed-dim/40 flex items-center justify-center">
                  <span class="material-symbols-outlined text-tertiary text-[12px]">ac_unit</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-extrabold text-on-surface truncate">Congelador de Racha</h3>
                <p class="text-xs text-on-surface-variant mt-1 leading-snug">
                  Protege tu racha diaria si olvidas practicar un día de guardia.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between mt-5 pt-3 border-t border-outline-variant/20">
              <span class="text-xs font-black text-tech-cyan flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] icon-filled">diamond</span> 200 Bits
              </span>
              <div
                v-if="hasStreakFreeze"
                class="px-3.5 py-1.5 bg-surface-container text-secondary text-xs font-black rounded-xl flex items-center gap-1 border border-secondary/30"
              >
                <span class="material-symbols-outlined text-[16px] icon-filled">check_circle</span>
                <span>Equipado</span>
              </div>
              <button
                v-else
                type="button"
                class="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-xl btn-tactile-primary flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                :disabled="isPurchasing === 'streak_freeze'"
                @click="handleBuy('streak_freeze')"
              >
                <span v-if="isPurchasing === 'streak_freeze'" class="material-symbols-outlined text-[14px] animate-spin">sync</span>
                <span v-else>Equipar</span>
              </button>
            </div>
          </div>

          <!-- Item 2: Heart Refill -->
          <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl bg-error-container/30 flex items-center justify-center shrink-0 p-2.5">
                <span class="material-symbols-outlined text-error text-[32px] icon-filled">favorite</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-extrabold text-on-surface truncate">Recarga de Vidas</h3>
                <p class="text-xs text-on-surface-variant mt-1 leading-snug">
                  Restaura todas tus vidas (+5 corazones) de inmediato sin esperar 4 horas.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between mt-5 pt-3 border-t border-outline-variant/20">
              <span class="text-xs font-black text-tech-cyan flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] icon-filled">diamond</span> 150 Bits
              </span>
              <button
                v-if="isHeartsFull"
                type="button"
                class="px-3.5 py-1.5 bg-surface-container text-on-surface-variant text-xs font-bold rounded-xl border border-outline-variant/30 opacity-75 flex items-center gap-1 cursor-default"
                title="Tus vidas ya están al máximo (5/5)"
              >
                <span class="material-symbols-outlined text-[15px] text-error icon-filled">favorite</span>
                <span>Lleno (5/5)</span>
              </button>
              <button
                v-else
                type="button"
                class="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-xl btn-tactile-primary flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                :disabled="isPurchasing === 'heart_refill'"
                @click="handleBuy('heart_refill')"
              >
                <span v-if="isPurchasing === 'heart_refill'" class="material-symbols-outlined text-[14px] animate-spin">sync</span>
                <span v-else>Comprar</span>
              </button>
            </div>
          </div>

          <!-- Item 3: 2X XP Boost -->
          <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0 p-2.5 text-primary">
                <span class="material-symbols-outlined text-[32px] icon-filled">security</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-extrabold text-on-surface truncate">Potenciador de XP (2X)</h3>
                <p class="text-xs text-on-surface-variant mt-1 leading-snug">
                  Gana el doble de experiencia durante tus próximas 3 lecciones completadas.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between mt-5 pt-3 border-t border-outline-variant/20">
              <span class="text-xs font-black text-tech-cyan flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] icon-filled">diamond</span> 100 Bits
              </span>
              <div
                v-if="hasXpBoostActive"
                class="px-3.5 py-1.5 bg-surface-container text-primary text-xs font-black rounded-xl flex items-center gap-1 border border-primary/30"
              >
                <span class="material-symbols-outlined text-[16px] icon-filled">bolt</span>
                <span>Activo ({{ gamificationStore.state.xpBoostLessonsRemaining }} lecc.)</span>
              </div>
              <button
                v-else
                type="button"
                class="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-xl btn-tactile-primary flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                :disabled="isPurchasing === 'xp_boost_2x'"
                @click="handleBuy('xp_boost_2x')"
              >
                <span v-if="isPurchasing === 'xp_boost_2x'" class="material-symbols-outlined text-[14px] animate-spin">sync</span>
                <span v-else>Comprar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: SuriPro Sentinel Membership Formal Section -->
      <section class="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#241a02]/95 via-[#1d1502] to-[#120d01] text-white p-6 lg:p-8 shadow-xl border-2 border-primary/40">
        <!-- Background Ambient Glow -->
        <div class="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header Ribbon & Mascot Banner -->
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-primary text-[#1a1200] px-3.5 py-1 rounded-full shadow-md font-black text-[11px] uppercase tracking-wider">
              <span class="material-symbols-outlined text-[15px]">shield</span>
              <span>SuriPro Centinela · Élite</span>
            </div>
            <h3 class="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Membresía SuriPro Centinela</span>
            </h3>
            <p class="text-xs lg:text-sm text-amber-200/90 font-medium leading-relaxed max-w-xl">
              El escudo definitivo para tu ciberdefensa personal y la seguridad operativa de tu organización.
            </p>
          </div>

          <div class="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/30 p-1.5 shadow-lg shrink-0 flex items-center justify-center relative">
            <img :src="suriCoolImg" alt="Suri Centinela Pro" class="w-full h-full object-contain filter drop-shadow-md" />
            <div class="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xs">
              <span class="material-symbols-outlined text-[14px] font-black">verified</span>
            </div>
          </div>
        </div>

        <!-- Pro Active Banner (If user is already subscribed) -->
        <div
          v-if="isPro"
          class="relative z-10 mt-6 bg-amber-500/20 border border-amber-400/50 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-inner"
        >
          <div class="w-12 h-12 rounded-full bg-amber-400 text-[#1a1200] flex items-center justify-center shrink-0 font-black shadow-md">
            <span class="material-symbols-outlined text-[28px]">workspace_premium</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-black text-amber-300">¡Tu Membresía Centinela está Activa!</p>
            <p class="text-xs text-amber-100/90 leading-tight mt-0.5">
              Cuentas con Corazones Dorados Ilimitados (∞) y acceso completo a todos los módulos y simulaciones avanzadas.
            </p>
          </div>
        </div>

        <!-- Detailed Benefits Checklist (Grid 4 columnas en desktop) -->
        <div class="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs">
          <!-- Benefit 1: Unlimited Golden Hearts -->
          <div class="flex items-start gap-3 p-2 rounded-xl bg-white/5">
            <div class="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <span class="material-symbols-outlined text-[18px] icon-filled">favorite</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-extrabold text-white text-xs">Corazones Ilimitados</p>
              <p class="text-[11px] text-stone-300 mt-0.5 leading-snug">
                Practica y equivócate sin límites. Sin pausas ni esperas de 4 horas.
              </p>
            </div>
          </div>

          <!-- Benefit 2: AI Gemini Roadmaps -->
          <div class="flex items-start gap-3 p-2 rounded-xl bg-white/5">
            <div class="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center shrink-0 text-cyan-300 mt-0.5">
              <span class="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-extrabold text-white text-xs">Diagnóstico Adaptativo</p>
              <p class="text-[11px] text-stone-300 mt-0.5 leading-snug">
                Ruta recomendada personalizada según las áreas más vulnerables detectadas.
              </p>
            </div>
          </div>

          <!-- Benefit 3: Practice Mistake Center -->
          <div class="flex items-start gap-3 p-2 rounded-xl bg-white/5">
            <div class="w-8 h-8 rounded-xl bg-orange-400/20 border border-orange-400/40 flex items-center justify-center shrink-0 text-orange-300 mt-0.5">
              <span class="material-symbols-outlined text-[18px]">target</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-extrabold text-white text-xs">Centro de Errores</p>
              <p class="text-[11px] text-stone-300 mt-0.5 leading-snug">
                Repetición táctica sobre tus fallos previos hasta blindar tus reflejos.
              </p>
            </div>
          </div>

          <!-- Benefit 4: Verifiable Badges & Certificates -->
          <div class="flex items-start gap-3 p-2 rounded-xl bg-white/5">
            <div class="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
              <span class="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-extrabold text-white text-xs">Insignias y Progreso Verificado</p>
              <p class="text-[11px] text-stone-300 mt-0.5 leading-snug">
                Acredita competencias ante tu empresa con historial y métricas reales.
              </p>
            </div>
          </div>
        </div>

        <!-- Formal Plans Presentation: 3 Balanced Columns on Desktop -->
        <div class="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Card Plan 1: Plan SuriPro Mensual -->
          <div class="bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col justify-between transition-all">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  Prueba 7 días gratis
                </span>
                <span class="text-xs text-stone-400 font-bold">Individual</span>
              </div>
              <h4 class="text-base font-extrabold text-white mt-3">Plan SuriPro Mensual</h4>
              <p class="text-xs text-stone-300 mt-1 leading-snug">
                Flexibilidad mes a mes para entrenamiento personal sin compromisos. Cancela cuando gustes.
              </p>
              <div class="mt-4 pt-3 border-t border-white/10">
                <span class="text-2xl font-black text-white">$4.99</span>
                <span class="text-xs text-stone-400 ml-1 font-semibold">USD / mes</span>
              </div>
            </div>

            <button
              type="button"
              class="w-full mt-5 py-2.5 px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-amber-300 border border-amber-400/40 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              :disabled="isCheckingOut !== null"
              @click="handleStripeCheckout('monthly')"
            >
              <span v-if="isCheckingOut === 'monthly'" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <template v-else>
                <span class="material-symbols-outlined text-[16px] text-amber-400">calendar_month</span>
                <span>Comprar Mensual</span>
              </template>
            </button>
          </div>

          <!-- Card Plan 2: Plan SuriPro Anual (Best Value - Ahorra 33%) -->
          <div class="relative overflow-hidden bg-gradient-to-b from-amber-500/20 via-primary/25 to-amber-600/20 border-2 border-amber-400/70 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <!-- Ribbon Badge -->
            <div class="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-primary text-black font-black text-[10px] uppercase px-3.5 py-1 rounded-bl-xl shadow-xs">
              🔥 Ahorra 33% · Mejor Valor
            </div>

            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2.5 py-0.5 rounded-full">
                  Recomendado
                </span>
                <span class="text-xs text-amber-200 font-bold">12 Meses</span>
              </div>
              <h4 class="text-base font-extrabold text-white mt-3">Plan SuriPro Anual</h4>
              <p class="text-xs text-amber-200/90 mt-1 leading-snug">
                Protección continua por todo un año ($3.33 USD/mes facturado anualmente).
              </p>
              <div class="mt-4 pt-3 border-t border-amber-400/30">
                <span class="text-2xl font-black text-amber-300">$39.99</span>
                <span class="text-xs text-amber-200/70 ml-1 font-semibold">USD / año</span>
              </div>
            </div>

            <button
              type="button"
              class="w-full mt-5 py-3 px-4 bg-gradient-to-r from-amber-400 via-primary-container to-amber-500 hover:brightness-105 active:scale-95 text-[#1a1200] rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              :disabled="isCheckingOut !== null"
              @click="handleStripeCheckout('annual')"
            >
              <span v-if="isCheckingOut === 'annual'" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <template v-else>
                <span class="material-symbols-outlined text-[18px] font-black">lock_open</span>
                <span>Comprar Anual</span>
              </template>
            </button>
          </div>

          <!-- Card Plan 3: Plan PYME Equipo -->
          <div class="bg-white/5 border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 flex flex-col justify-between transition-all">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-full">
                  Empresarial
                </span>
                <span class="text-xs text-stone-400 font-bold">10–100 Colaboradores</span>
              </div>
              <h4 class="text-base font-extrabold text-white mt-3">Plan PYME Equipo</h4>
              <p class="text-xs text-stone-300 mt-1 leading-snug">
                Panel CISO corporativo, ligas privadas y simulaciones antiphishing para todo tu personal.
              </p>
              <div class="mt-4 pt-3 border-t border-white/10">
                <span class="text-xs text-amber-300 font-bold mr-1">Desde</span>
                <span class="text-2xl font-black text-white">$49</span>
                <span class="text-xs text-stone-400 ml-1 font-semibold">USD / mes</span>
              </div>
            </div>

            <router-link
              to="/tabs/organization"
              class="w-full mt-5 py-2.5 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-cyan-300 border border-cyan-400/40 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm text-center"
            >
              <span class="material-symbols-outlined text-[16px]">domain</span>
              <span>Gestionar en Panel PYME</span>
            </router-link>
          </div>
        </div>

        <!-- Stripe Security Guarantee Footer -->
        <div class="relative z-10 mt-6 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-stone-400">
          <span class="material-symbols-outlined text-[16px] text-emerald-400">verified_user</span>
          <span>Pago seguro y cifrado procesado con tecnología Stripe Checkout</span>
        </div>
      </section>
    </main>

    <!-- Modal: Confirmación Exitosa de Membresía SuriPro -->
    <Transition name="fade">
      <div
        v-if="showSuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showSuccessModal = false"
      >
        <div class="bg-surface-container-lowest max-w-sm w-full rounded-3xl p-6 text-center shadow-2xl border-2 border-amber-400 flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 flex items-center justify-center shadow-inner">
            <span class="material-symbols-outlined text-[36px] icon-filled">verified</span>
          </div>

          <div>
            <h3 class="text-lg font-black text-on-surface">¡Bienvenido a SuriPro Centinela!</h3>
            <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Tu plan <strong>{{ confirmedPlan }}</strong> ha sido activado con éxito. Ahora cuentas con corazones dorados ilimitados (∞).
            </p>
          </div>

          <button
            type="button"
            class="w-full py-2.5 bg-primary text-white text-xs font-black rounded-xl btn-tactile-primary shadow-xs"
            @click="showSuccessModal = false"
          >
            ¡Entendido, a defender!
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
