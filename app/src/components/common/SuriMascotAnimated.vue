<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { SuriPose } from '../../types/exercises';
import { getSuriImage } from '../../utils/suriAssets';

const props = withDefaults(
  defineProps<{
    pose?: SuriPose;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    autoBlink?: boolean;
    interactive?: boolean;
    bubbleText?: string;
    showShadow?: boolean;
    reactionKey?: number;
  }>(),
  {
    pose: 'idle',
    size: 'md',
    autoBlink: true,
    interactive: false,
    bubbleText: '',
    showShadow: true,
    reactionKey: 0,
  }
);

const emit = defineEmits<{
  (e: 'interact'): void;
}>();

const isWinking = ref<boolean>(false);
const isJumping = ref<boolean>(false);
const tempPoseOverride = ref<SuriPose | null>(null);

let blinkInterval: ReturnType<typeof setInterval> | null = null;
let blinkResetTimer: ReturnType<typeof setTimeout> | null = null;
let interactResetTimer: ReturnType<typeof setTimeout> | null = null;

const effectivePose = computed<SuriPose>(() => {
  if (tempPoseOverride.value) return tempPoseOverride.value;
  if (isWinking.value && props.pose === 'idle') return 'wink';
  return props.pose;
});

const imageSrc = computed(() => getSuriImage(effectivePose.value));

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-9 h-9';
    case 'sm':
      return 'w-14 h-14';
    case 'md':
      return 'w-20 h-20';
    case 'lg':
      return 'w-28 h-28';
    case 'xl':
      return 'w-48 h-52 sm:w-56 sm:h-60';
    default:
      return 'w-20 h-20';
  }
});

const motionClass = computed(() => {
  if (isJumping.value) return 'suri-anim-jump';
  switch (effectivePose.value) {
    case 'victory':
    case 'ok':
      return 'suri-anim-joy';
    case 'surprised':
    case 'error':
      return 'suri-anim-alert';
    case 'running':
      return 'suri-anim-sprint';
    case 'sleeping':
      return 'suri-anim-sleep';
    case 'idea':
      return 'suri-anim-curious';
    default:
      return 'suri-anim-breathe';
  }
});

function triggerJumpFlash(overridePose: SuriPose | null = null, durationMs = 750) {
  isJumping.value = true;
  if (overridePose) tempPoseOverride.value = overridePose;
  if (interactResetTimer) clearTimeout(interactResetTimer);
  interactResetTimer = setTimeout(() => {
    isJumping.value = false;
    tempPoseOverride.value = null;
  }, durationMs);
}

watch(
  () => props.reactionKey,
  (val) => {
    if (val && val > 0) {
      triggerJumpFlash(null, 550);
    }
  }
);

function startBlinkLoop() {
  stopBlinkLoop();
  if (!props.autoBlink) return;
  blinkInterval = setInterval(() => {
    if (props.pose === 'idle' && !tempPoseOverride.value) {
      isWinking.value = true;
      if (blinkResetTimer) clearTimeout(blinkResetTimer);
      blinkResetTimer = setTimeout(() => {
        isWinking.value = false;
      }, 280);
    }
  }, 3800);
}

function stopBlinkLoop() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  if (blinkResetTimer) {
    clearTimeout(blinkResetTimer);
    blinkResetTimer = null;
  }
}

watch(
  () => props.autoBlink,
  () => {
    startBlinkLoop();
  }
);

function handleTap() {
  if (!props.interactive) return;
  triggerJumpFlash(effectivePose.value === 'ok' ? 'wink' : 'ok', 900);
  emit('interact');
}

onMounted(() => {
  startBlinkLoop();
});

onUnmounted(() => {
  stopBlinkLoop();
  if (interactResetTimer) {
    clearTimeout(interactResetTimer);
    interactResetTimer = null;
  }
});
</script>

<template>
  <div class="relative inline-flex flex-col items-center justify-center select-none">
    <!-- Speech Micro-Bubble -->
    <Transition name="suri-bubble">
      <div
        v-if="bubbleText"
        class="mb-1.5 px-3 py-1 rounded-xl bg-surface-container-lowest text-on-surface text-[11px] font-extrabold shadow-md border border-primary/30 relative z-20 max-w-[210px] text-center leading-tight"
      >
        <span>{{ bubbleText }}</span>
      </div>
    </Transition>

    <!-- Mascot Visual Stage -->
    <div
      class="relative flex items-center justify-center"
      :class="[sizeClass, interactive ? 'cursor-pointer' : '']"
      @click="handleTap"
    >
      <!-- Pose-aware ambient sparkles / alert glow -->
      <div
        v-if="effectivePose === 'ok' || effectivePose === 'victory'"
        class="absolute inset-0 pointer-events-none"
      >
        <span class="suri-sparkle suri-sparkle-1">✦</span>
        <span class="suri-sparkle suri-sparkle-2">✦</span>
      </div>

      <div
        v-if="effectivePose === 'surprised' || effectivePose === 'error'"
        class="absolute inset-1 rounded-full bg-error/15 animate-ping pointer-events-none"
      ></div>

      <div
        v-if="effectivePose === 'sleeping'"
        class="absolute -top-1 right-1 flex flex-col items-end pointer-events-none"
      >
        <span class="text-xs font-black text-primary suri-zzz-1">Z</span>
        <span class="text-[10px] font-black text-secondary suri-zzz-2">z</span>
      </div>

      <!-- Animated Suri Sprite -->
      <img
        :src="imageSrc"
        alt="Suri Centinela"
        class="relative z-10 w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 will-change-transform"
        :class="motionClass"
        draggable="false"
      />

      <!-- Synchronized soft ground shadow -->
      <div
        v-if="showShadow && size !== 'xs'"
        class="absolute -bottom-1 w-3/5 h-2 rounded-full bg-[#5F4030]/20 dark:bg-black/40 blur-[2px] suri-shadow-pulse pointer-events-none"
      ></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes suriBreathe {
  0%, 100% {
    transform: translateY(0) scaleY(1) scaleX(1);
  }
  50% {
    transform: translateY(-3px) scaleY(1.03) scaleX(0.98);
  }
}

@keyframes suriJoy {
  0%, 100% {
    transform: translateY(0) scale(1) rotate(0deg);
  }
  30% {
    transform: translateY(-7px) scale(1.06) rotate(-2deg);
  }
  65% {
    transform: translateY(-2px) scale(1.02) rotate(2deg);
  }
}

@keyframes suriAlertShake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  20% {
    transform: translateX(-4px) rotate(-4deg) scale(1.04);
  }
  45% {
    transform: translateX(4px) rotate(4deg) scale(1.04);
  }
  70% {
    transform: translateX(-2px) rotate(-2deg);
  }
}

@keyframes suriSprint {
  0%, 100% {
    transform: translateY(0) rotate(-3deg);
  }
  50% {
    transform: translateY(-5px) rotate(4deg);
  }
}

@keyframes suriSleep {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04, 0.97);
  }
}

@keyframes suriCurious {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-4px) rotate(3deg);
  }
}

@keyframes suriJump {
  0% {
    transform: translateY(0) scale(1);
  }
  35% {
    transform: translateY(-14px) scale(1.09, 0.96);
  }
  70% {
    transform: translateY(1px) scale(0.96, 1.04);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes suriShadowPulse {
  0%, 100% {
    transform: scaleX(1);
    opacity: 0.7;
  }
  50% {
    transform: scaleX(0.86);
    opacity: 0.45;
  }
}

@keyframes sparkleFloat {
  0%, 100% {
    opacity: 0;
    transform: scale(0.6) translateY(4px);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) translateY(-4px);
  }
}

@keyframes zzzRise {
  0% {
    opacity: 0;
    transform: translateY(4px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(-4px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(1.15);
  }
}

.suri-anim-breathe {
  animation: suriBreathe 2.8s ease-in-out infinite;
}

.suri-anim-joy {
  animation: suriJoy 1.3s ease-in-out infinite;
}

.suri-anim-alert {
  animation: suriAlertShake 0.55s ease-in-out infinite;
}

.suri-anim-sprint {
  animation: suriSprint 0.48s ease-in-out infinite;
}

.suri-anim-sleep {
  animation: suriSleep 3.4s ease-in-out infinite;
}

.suri-anim-curious {
  animation: suriCurious 2.4s ease-in-out infinite;
}

.suri-anim-jump {
  animation: suriJump 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.suri-shadow-pulse {
  animation: suriShadowPulse 2.8s ease-in-out infinite;
}

.suri-sparkle {
  position: absolute;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 900;
  animation: sparkleFloat 1.4s ease-in-out infinite;
}

.suri-sparkle-1 {
  top: 4px;
  left: 6px;
}

.suri-sparkle-2 {
  top: 10px;
  right: 6px;
  animation-delay: 0.5s;
}

.suri-zzz-1 {
  animation: zzzRise 2.2s ease-out infinite;
}

.suri-zzz-2 {
  animation: zzzRise 2.2s ease-out infinite 0.7s;
}

.suri-bubble-enter-active,
.suri-bubble-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.suri-bubble-enter-from,
.suri-bubble-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
