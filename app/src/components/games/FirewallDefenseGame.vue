<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { FirewallDefenseExercise, FirewallPacketItem } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  exercise: FirewallDefenseExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

// Arcade Game State
const playerLane = ref<0 | 1 | 2>(1);
const serverHp = ref<number>(props.exercise.serverMaxHp || 100);
const score = ref<number>(0);
const combo = ref<number>(0);
const currentPacketIdx = ref<number>(0);
const packetYProgress = ref<number>(8); // 0% (top) to 88% (firewall gate)
const isGameRunning = ref<boolean>(true);
const isPaused = ref<boolean>(false);
const lastActionBanner = ref<{ text: string; isGood: boolean } | null>(null);
const laserEffectLane = ref<number | null>(null);
const shieldEffectLane = ref<number | null>(null);
const correctDecisions = ref<number>(0);

let gameLoopTimer: ReturnType<typeof setInterval> | null = null;

const suriShieldImg = getSuriImage('shield');

const activePacket = computed<FirewallPacketItem | undefined>(() => {
  return props.exercise.packets[currentPacketIdx.value];
});

const totalPackets = computed(() => props.exercise.packets.length);

const stepSpeed = computed(() => {
  const pkt = activePacket.value;
  if (!pkt) return 1.5;
  if (pkt.speedTier === 'boss') return 2.1;
  if (pkt.speedTier === 'fast') return 1.75;
  return 1.35;
});

function startLoop() {
  stopLoop();
  gameLoopTimer = setInterval(() => {
    if (!isGameRunning.value || isPaused.value || props.disabled) return;
    if (!activePacket.value) {
      finishGame();
      return;
    }

    packetYProgress.value += stepSpeed.value;

    // If packet reaches the bottom gate without action
    if (packetYProgress.value >= 86) {
      handleTimeoutAtGate();
    }
  }, 60);
}

function stopLoop() {
  if (gameLoopTimer) {
    clearInterval(gameLoopTimer);
    gameLoopTimer = null;
  }
}

function moveLane(lane: 0 | 1 | 2) {
  if (!isGameRunning.value || props.disabled) return;
  playerLane.value = lane;
}

function showFeedbackBanner(text: string, isGood: boolean) {
  lastActionBanner.value = { text, isGood };
}

function handleTimeoutAtGate() {
  const pkt = activePacket.value;
  if (!pkt) return;

  if (pkt.isMalicious) {
    // Malicious packet slipped through!
    combo.value = 0;
    serverHp.value = Math.max(0, serverHp.value - 35);
    showFeedbackBanner(`💥 ¡Brecha! ${pkt.protocolLabel} infiltró el servidor (-35% HP)`, false);
  } else {
    // Legitimate packet timed out / dropped
    combo.value = 0;
    serverHp.value = Math.max(0, serverHp.value - 20);
    showFeedbackBanner(`⚠️ Tráfico legítimo ${pkt.protocolLabel} perdido por timeout (-20% HP)`, false);
  }

  advanceNextPacket();
}

function handleAction(action: 'allow' | 'block') {
  if (!isGameRunning.value || props.disabled || !activePacket.value) return;

  const pkt = activePacket.value;
  // Auto-snap turret to packet lane if user clicks the action button directly, or reward lane alignment
  playerLane.value = pkt.lane;

  if (action === 'block') {
    laserEffectLane.value = pkt.lane;
    setTimeout(() => {
      laserEffectLane.value = null;
    }, 260);
  } else {
    shieldEffectLane.value = pkt.lane;
    setTimeout(() => {
      shieldEffectLane.value = null;
    }, 260);
  }

  const isCorrect =
    (action === 'block' && pkt.isMalicious) || (action === 'allow' && !pkt.isMalicious);

  if (isCorrect) {
    combo.value += 1;
    correctDecisions.value += 1;
    const pts = 100 * Math.min(combo.value, 4);
    score.value += pts;
    showFeedbackBanner(
      action === 'block'
        ? `⚡ ¡Amenaza neutralizada! +${pts} PTS (${pkt.explanation})`
        : `✅ ¡Tráfico seguro autorizado! +${pts} PTS (${pkt.explanation})`,
      true
    );
  } else {
    combo.value = 0;
    serverHp.value = Math.max(0, serverHp.value - 35);
    showFeedbackBanner(
      pkt.isMalicious
        ? `🚨 ¡Error Crítico! Dejaste pasar ${pkt.protocolLabel}: ${pkt.explanation}`
        : `⚠️ ¡Falso Positivo! Bloqueaste tráfico legítimo (${pkt.protocolLabel})`,
      false
    );
  }

  advanceNextPacket();
}

function advanceNextPacket() {
  if (serverHp.value <= 0) {
    finishGame(false);
    return;
  }

  if (currentPacketIdx.value < props.exercise.packets.length - 1) {
    currentPacketIdx.value += 1;
    packetYProgress.value = 6;
  } else {
    finishGame();
  }
}

function finishGame(forcedResult?: boolean) {
  isGameRunning.value = false;
  stopLoop();
  const minCorrect = Math.ceil(props.exercise.packets.length * 0.75);
  const won =
    typeof forcedResult === 'boolean'
      ? forcedResult
      : serverHp.value > 0 && correctDecisions.value >= minCorrect;
  emit('submit', won);
}

function handleKeydown(e: KeyboardEvent) {
  if (!isGameRunning.value || props.disabled) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    playerLane.value = Math.max(0, playerLane.value - 1) as 0 | 1 | 2;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    playerLane.value = Math.min(2, playerLane.value + 1) as 0 | 1 | 2;
  } else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    handleAction('block');
  } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
    e.preventDefault();
    handleAction('allow');
  }
}

watch(
  () => props.exercise.id,
  () => {
    playerLane.value = 1;
    serverHp.value = props.exercise.serverMaxHp || 100;
    score.value = 0;
    combo.value = 0;
    currentPacketIdx.value = 0;
    packetYProgress.value = 8;
    correctDecisions.value = 0;
    lastActionBanner.value = null;
    isGameRunning.value = true;
    startLoop();
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  startLoop();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  stopLoop();
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none">
    <!-- Top Arcade HUD -->
    <div class="bg-[#161311] text-white rounded-3xl p-4 border-2 border-[#44352C] shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/50 p-1 flex items-center justify-center shrink-0">
            <img :src="suriShieldImg" alt="Suri Centinela Firewall" class="w-full h-full object-contain" />
          </div>
          <div class="flex flex-col">
            <span class="bg-tech-cyan/20 text-tech-cyan text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-tech-cyan/40 w-fit">
              🎮 Arcade Firewall En Vivo
            </span>
            <span class="text-xs font-black text-amber-400 mt-0.5">
              Paquete {{ currentPacketIdx + 1 }} / {{ totalPackets }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-xs font-black bg-white/10 px-2.5 py-1 rounded-xl">
            SCORE: <span class="text-tech-cyan">{{ score }}</span>
          </div>
          <div
            v-if="combo > 1"
            class="text-xs font-black bg-amber-500 text-black px-2.5 py-1 rounded-xl animate-bounce"
          >
            COMBO x{{ Math.min(combo, 4) }}
          </div>
        </div>
      </div>

      <!-- Server HP Bar -->
      <div class="flex items-center gap-3">
        <span class="text-[11px] font-black uppercase tracking-wider text-stone-300 shrink-0">
          Integridad Servidor PYME:
        </span>
        <div class="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-700">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="
              serverHp > 60
                ? 'bg-shield-green'
                : serverHp > 30
                  ? 'bg-amber-400'
                  : 'bg-error'
            "
            :style="{ width: `${serverHp}%` }"
          ></div>
        </div>
        <span class="text-xs font-black w-10 text-right">{{ serverHp }}%</span>
      </div>

      <!-- Active Firewall Rule Banner -->
      <div class="mt-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-amber-200 font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px] text-amber-400 icon-filled">policy</span>
        <span>{{ exercise.firewallRuleBanner }}</span>
      </div>
    </div>

    <!-- Real-time Action Feedback Toast -->
    <div
      v-if="lastActionBanner"
      class="px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 transition-all"
      :class="
        lastActionBanner.isGood
          ? 'bg-shield-green/15 text-shield-green border-shield-green/40'
          : 'bg-error/15 text-error border-error/40'
      "
    >
      <span class="material-symbols-outlined text-[18px] icon-filled">
        {{ lastActionBanner.isGood ? 'bolt' : 'warning' }}
      </span>
      <span>{{ lastActionBanner.text }}</span>
    </div>

    <!-- 3-Lane Cyber Battleground -->
    <div class="relative w-full h-[310px] bg-[#12161F] rounded-3xl border-2 border-[#2D3748] overflow-hidden shadow-inner grid grid-cols-3">
      <!-- Background Cyber Grid Lines -->
      <div
        v-for="laneIdx in [0, 1, 2]"
        :key="laneIdx"
        class="relative h-full border-r last:border-r-0 border-slate-700/50 flex flex-col justify-between items-center py-2 cursor-pointer transition-colors"
        :class="playerLane === laneIdx ? 'bg-tech-cyan/5' : ''"
        @click="moveLane(laneIdx as 0 | 1 | 2)"
      >
        <!-- Top Port Gate Label -->
        <div class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-600 z-10">
          {{ laneIdx === 0 ? 'Carril 1 · Web' : laneIdx === 1 ? 'Carril 2 · Core' : 'Carril 3 · Datos' }}
        </div>

        <!-- Laser Beam Effect -->
        <div
          v-if="laserEffectLane === laneIdx"
          class="absolute inset-x-8 top-6 bottom-14 bg-gradient-to-t from-error via-amber-400 to-transparent opacity-80 rounded-full animate-pulse z-20"
        ></div>

        <!-- Shield Absorb Effect -->
        <div
          v-if="shieldEffectLane === laneIdx"
          class="absolute inset-x-4 bottom-12 h-16 bg-shield-green/30 border-2 border-shield-green rounded-2xl animate-ping z-20"
        ></div>

        <!-- Descending Network Packet in this Lane -->
        <div
          v-if="activePacket && activePacket.lane === laneIdx"
          class="absolute inset-x-1.5 sm:inset-x-2 z-20 transition-all duration-75"
          :style="{ top: `${packetYProgress}%` }"
        >
          <div
            class="p-2 sm:p-2.5 rounded-2xl border-2 shadow-lg flex flex-col gap-1 bg-slate-900/95 border-tech-cyan text-white overflow-hidden"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 min-w-0">
              <span class="text-[9px] sm:text-[10px] font-black text-tech-cyan break-words leading-tight">
                {{ activePacket.protocolLabel }}
              </span>
              <span class="text-[8px] sm:text-[9px] font-mono text-slate-400 truncate">{{ activePacket.sourceIp }}</span>
            </div>
            <p class="text-[9px] sm:text-[10px] font-mono text-amber-200 leading-tight break-words bg-black/50 p-1.5 rounded-lg">
              {{ activePacket.payloadPreview }}
            </p>
          </div>
        </div>

        <!-- Suri Defender Turret at Bottom of Lane -->
        <div class="mt-auto z-20 flex flex-col items-center">
          <div
            v-if="playerLane === laneIdx"
            class="w-12 h-12 rounded-2xl bg-primary/25 border-2 border-primary p-1 shadow-lg flex items-center justify-center transition-transform scale-105"
          >
            <img :src="suriShieldImg" alt="Suri Firewall" class="w-full h-full object-contain" />
          </div>
          <div
            v-else
            class="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold"
          >
            <span class="material-symbols-outlined text-[16px]">shield</span>
          </div>
        </div>
      </div>

      <!-- Firewall Perimeter Line -->
      <div class="absolute inset-x-0 bottom-14 h-0.5 bg-gradient-to-r from-tech-cyan/40 via-primary to-tech-cyan/40 pointer-events-none"></div>
    </div>

    <!-- Arcade Action Controls (Gamepad Buttons) -->
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="h-14 rounded-2xl bg-shield-green text-white font-black text-xs sm:text-sm shadow-[0_4px_0_#15803d] active:translate-y-1 transition-all flex items-center justify-center gap-2 px-3"
        :disabled="disabled || !isGameRunning"
        @click="handleAction('allow')"
      >
        <span class="material-symbols-outlined text-[22px] icon-filled">check_circle</span>
        <div class="text-left leading-tight">
          <span class="block">PERMITIR PAQUETE</span>
          <span class="text-[10px] opacity-85 font-semibold">Tecla [W] o [↑] · Tráfico Seguro</span>
        </div>
      </button>

      <button
        type="button"
        class="h-14 rounded-2xl bg-error text-white font-black text-xs sm:text-sm shadow-[0_4px_0_#b91c1c] active:translate-y-1 transition-all flex items-center justify-center gap-2 px-3"
        :disabled="disabled || !isGameRunning"
        @click="handleAction('block')"
      >
        <span class="material-symbols-outlined text-[22px] icon-filled">bolt</span>
        <div class="text-left leading-tight">
          <span class="block">PULSO EMP / BLOQUEAR</span>
          <span class="text-[10px] opacity-85 font-semibold">Tecla [Espacio] o [↓] · Amenaza</span>
        </div>
      </button>
    </div>
  </div>
</template>
