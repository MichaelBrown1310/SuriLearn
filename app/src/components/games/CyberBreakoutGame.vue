<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { CyberBreakoutExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberBreakoutExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  label: string;
  colorHex: string;
  tip: string;
}

const LOGICAL_W = 420;
const LOGICAL_H = 300;
const PADDLE_W = 86;
const PADDLE_H = 12;
const PADDLE_Y = LOGICAL_H - 22;
const BALL_R = 7;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);
const shieldsLeft = ref<number>(props.exercise.maxShields || 3);
const bricksRemaining = ref<number>(0);
const totalBricks = ref<number>(0);
const bannerText = ref<string>('Pulsa Iniciar y mueve el Escudo de Suri para destruir todo el malware.');
const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);

let rafId: number | null = null;
let lastFrameTime = 0;
let paddleX = (LOGICAL_W - PADDLE_W) / 2;
let ballX = LOGICAL_W / 2;
let ballY = PADDLE_Y - BALL_R - 2;
let ballVx = 145;
let ballVy = -180;
let bricks: Brick[] = [];
let moveDir: -1 | 0 | 1 = 0;

const ballSpeed = computed(() => props.exercise.ballSpeed || 230);

function buildBricks() {
  const cols = props.exercise.cols || 5;
  const rows = props.exercise.rows;
  const padX = 14;
  const gapX = 8;
  const gapY = 8;
  const topOffset = 18;
  const usableW = LOGICAL_W - padX * 2 - gapX * (cols - 1);
  const brickW = usableW / cols;
  const brickH = 22;

  const list: Brick[] = [];
  rows.forEach((rowDef, rIdx) => {
    for (let c = 0; c < cols; c++) {
      list.push({
        x: padX + c * (brickW + gapX),
        y: topOffset + rIdx * (brickH + gapY),
        w: brickW,
        h: brickH,
        hp: rowDef.hp,
        maxHp: rowDef.hp,
        label: rowDef.label,
        colorHex: rowDef.colorHex,
        tip: rowDef.tip,
      });
    }
  });
  bricks = list;
  totalBricks.value = list.length;
  bricksRemaining.value = list.length;
}

function resetBallAndPaddle() {
  paddleX = (LOGICAL_W - PADDLE_W) / 2;
  ballX = LOGICAL_W / 2;
  ballY = PADDLE_Y - BALL_R - 2;
  const spd = ballSpeed.value;
  const angle = (Math.random() > 0.5 ? 1 : -1) * 0.55;
  ballVx = Math.sin(angle) * spd;
  ballVy = -Math.cos(angle) * spd;
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastFrameTime = 0;
}

function drawScene() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fondo Carbón Tierra SuriLearn
  ctx.fillStyle = '#161311';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Grilla sutil cálida
  ctx.strokeStyle = '#2B241F';
  ctx.lineWidth = 1;
  for (let x = 0; x <= LOGICAL_W; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LOGICAL_H);
    ctx.stroke();
  }
  for (let y = 0; y <= LOGICAL_H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_W, y);
    ctx.stroke();
  }

  // Bloques de malware
  for (const b of bricks) {
    if (b.hp <= 0) continue;
    ctx.fillStyle = b.colorHex;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 6);
    ctx.fill();

    ctx.strokeStyle = b.hp > 1 ? '#FFF2DA' : 'rgba(255,242,218,0.45)';
    ctx.lineWidth = b.hp > 1 ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = '#FDFBF7';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = b.maxHp > 1 ? `${b.label} (${b.hp})` : b.label;
    ctx.fillText(text, b.x + b.w / 2, b.y + b.h / 2 + 0.5);
  }

  // Paleta Escudo Suri (Arena Ocre + Centro Claro)
  ctx.fillStyle = '#E1A653';
  ctx.beginPath();
  ctx.roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
  ctx.fill();
  ctx.fillStyle = '#FFF2DA';
  ctx.fillRect(paddleX + 16, PADDLE_Y + 3, PADDLE_W - 32, 4);

  // Bola de Pulso Cian
  ctx.save();
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function finishGame(won: boolean) {
  if (isFinished.value) return;
  isFinished.value = true;
  stopLoop();
  suriPose.value = won ? 'victory' : 'error';
  suriReactionKey.value += 1;
  drawScene();
  emit('submit', won);
}

function tick(now: number) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) {
    rafId = null;
    return;
  }

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  // Move paddle if held via keyboard or touch button
  if (moveDir !== 0) {
    paddleX = Math.max(4, Math.min(LOGICAL_W - PADDLE_W - 4, paddleX + moveDir * 320 * dt));
  }

  ballX += ballVx * dt;
  ballY += ballVy * dt;

  // Wall bounce
  if (ballX - BALL_R <= 0) {
    ballX = BALL_R;
    ballVx = Math.abs(ballVx);
  } else if (ballX + BALL_R >= LOGICAL_W) {
    ballX = LOGICAL_W - BALL_R;
    ballVx = -Math.abs(ballVx);
  }
  if (ballY - BALL_R <= 0) {
    ballY = BALL_R;
    ballVy = Math.abs(ballVy);
  }

  // Paddle collision
  if (
    ballVy > 0 &&
    ballY + BALL_R >= PADDLE_Y &&
    ballY - BALL_R <= PADDLE_Y + PADDLE_H &&
    ballX >= paddleX - 4 &&
    ballX <= paddleX + PADDLE_W + 4
  ) {
    const hitOffset = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
    const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));
    const maxAngle = Math.PI / 3;
    const bounceAngle = clampedOffset * maxAngle;
    const spd = ballSpeed.value;
    ballVx = Math.sin(bounceAngle) * spd;
    ballVy = -Math.max(120, Math.cos(bounceAngle) * spd);
    ballY = PADDLE_Y - BALL_R - 1;
  }

  // Brick collision
  for (const b of bricks) {
    if (b.hp <= 0) continue;
    const closestX = Math.max(b.x, Math.min(ballX, b.x + b.w));
    const closestY = Math.max(b.y, Math.min(ballY, b.y + b.h));
    const dx = ballX - closestX;
    const dy = ballY - closestY;
    if (dx * dx + dy * dy <= BALL_R * BALL_R) {
      b.hp -= 1;
      if (Math.abs(dx) > Math.abs(dy)) {
        ballVx = -ballVx;
      } else {
        ballVy = -ballVy;
      }
      if (b.hp <= 0) {
        bricksRemaining.value = bricks.filter((item) => item.hp > 0).length;
        bannerText.value = `⚡ ${b.label} bloqueado: ${b.tip}`;
        suriPose.value = 'ok';
        suriReactionKey.value += 1;
        if (bricksRemaining.value <= 0) {
          finishGame(true);
          return;
        }
      }
      break;
    }
  }

  // Bottom miss
  if (ballY - BALL_R > LOGICAL_H) {
    shieldsLeft.value = Math.max(0, shieldsLeft.value - 1);
    suriPose.value = 'surprised';
    suriReactionKey.value += 1;
    if (shieldsLeft.value <= 0) {
      bannerText.value = '💥 Se perdieron todos los escudos del muro defensivo.';
      finishGame(false);
      return;
    }
    bannerText.value = `🛡️ Pulso perdido. Escudos restantes: ${shieldsLeft.value}. ¡Sigue defendiendo!`;
    resetBallAndPaddle();
  }

  drawScene();
  rafId = requestAnimationFrame(tick);
}

function startLoop() {
  stopLoop();
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  lastFrameTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

function startGame() {
  if (props.disabled || isFinished.value) return;
  isStarted.value = true;
  isPaused.value = false;
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  bannerText.value = '¡Pulso activo! Desliza tu dedo, usa las flechas o A/D para rebotar el pulso.';
  startLoop();
}

function togglePause() {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  isPaused.value = !isPaused.value;
  if (isPaused.value) stopLoop();
  else startLoop();
}

function handlePointerMove(e: PointerEvent) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const relX = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
  paddleX = Math.max(4, Math.min(LOGICAL_W - PADDLE_W - 4, relX - PADDLE_W / 2));
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled || isFinished.value) return;
  const key = e.key.toLowerCase();
  if (key === 'p' || e.key === 'Escape') {
    if (isStarted.value) {
      e.preventDefault();
      togglePause();
    }
    return;
  }
  if (!isStarted.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  if (e.key === 'ArrowLeft' || key === 'a') {
    e.preventDefault();
    moveDir = -1;
  } else if (e.key === 'ArrowRight' || key === 'd') {
    e.preventDefault();
    moveDir = 1;
  }
}

function handleKeyup(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  if ((e.key === 'ArrowLeft' || key === 'a') && moveDir === -1) moveDir = 0;
  if ((e.key === 'ArrowRight' || key === 'd') && moveDir === 1) moveDir = 0;
}

function initGame() {
  stopLoop();
  isStarted.value = false;
  isPaused.value = false;
  isFinished.value = false;
  moveDir = 0;
  shieldsLeft.value = props.exercise.maxShields || 3;
  buildBricks();
  resetBallAndPaddle();
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  bannerText.value = 'Pulsa Iniciar y destruye todos los bloques de malware con el pulso cian.';
  requestAnimationFrame(() => drawScene());
}

watch(
  () => props.exercise.id,
  () => {
    initGame();
  }
);

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);
});

onUnmounted(() => {
  stopLoop();
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keyup', handleKeyup);
});
</script>

<template>
  <div class="w-full flex flex-col gap-3.5 select-none text-left">
    <!-- Top HUD -->
    <div class="flex items-center justify-between gap-2 px-1 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">sports_tennis</span>
        </div>
        <div class="min-w-0">
          <span class="text-[11px] font-black uppercase tracking-wider text-primary block truncate">
            {{ exercise.title }}
          </span>
          <h2 class="text-sm sm:text-base font-extrabold text-on-surface leading-tight">
            {{ exercise.instruction }}
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="px-2.5 py-1 rounded-full bg-shield-green/15 text-shield-green text-xs font-black">
          🧱 {{ totalBricks - bricksRemaining }}/{{ totalBricks }}
        </span>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-black"
          :class="shieldsLeft <= 1 ? 'bg-error/15 text-error' : 'bg-surface-container text-on-surface'"
        >
          Escudos: {{ shieldsLeft }}
        </span>
        <button
          v-if="isStarted && !isFinished"
          type="button"
          class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary hover:text-[#291800] text-on-surface text-[11px] font-black border border-outline-variant/40 transition-colors"
          @click="togglePause"
        >
          {{ isPaused ? '▶ Reanudar' : '⏸ Pausar' }}
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <div class="bg-surface-container-lowest rounded-3xl p-4 border-2 border-outline-variant/40 shadow-md flex flex-col gap-3.5">
      <!-- Suri Reaction Strip -->
      <div class="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded-2xl border border-outline-variant/30">
        <SuriMascotAnimated
          :pose="suriPose"
          size="xs"
          :reaction-key="suriReactionKey"
          :show-shadow="false"
        />
        <p class="text-xs font-bold text-on-surface leading-snug flex-1">
          {{ bannerText }}
        </p>
      </div>

      <!-- Canvas Arena (Paleta SuriLearn) -->
      <div class="relative w-full max-w-[460px] mx-auto aspect-[420/300] rounded-2xl overflow-hidden border-2 border-[#E1A653]/45 bg-[#161311] shadow-inner">
        <canvas
          ref="canvasRef"
          :width="LOGICAL_W"
          :height="LOGICAL_H"
          class="w-full h-full block touch-none cursor-crosshair"
          @pointermove="handlePointerMove"
          @pointerdown="handlePointerMove"
        ></canvas>

        <!-- Start Overlay -->
        <div
          v-if="!isStarted"
          class="absolute inset-0 bg-[#161311]/88 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="shield" size="md" :auto-blink="false" :show-shadow="false" />
          <div>
            <p class="text-sm font-black text-[#FDFBF7]">Rompe-Malware Arcade</p>
            <p class="text-[11px] text-[#D4C3B3] mt-1">
              Mueve la paleta de <strong class="text-[#F3B75B]">Arena Ocre</strong> con el mouse, tu dedo sobre el tablero o flechas <strong class="text-[#00E5FF]">← / →</strong> para limpiar los {{ totalBricks }} bloques.
            </p>
          </div>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="startGame"
          >
            ¡Lanzar Pulso!
          </button>
        </div>

        <!-- Pause Overlay -->
        <div
          v-else-if="isPaused && !isFinished"
          class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
          <p class="text-sm font-black text-[#F3B75B]">Juego en Pausa</p>
          <button
            type="button"
            class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="togglePause"
          >
            ▶ Reanudar
          </button>
        </div>
      </div>

      <!-- Tactile Paddle Controls for Mobile -->
      <div class="grid grid-cols-2 gap-3 max-w-[460px] w-full mx-auto">
        <button
          type="button"
          :disabled="!isStarted || isPaused || isFinished || disabled"
          class="h-12 rounded-2xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] text-[#FDFBF7] border border-[#5F4030] font-black text-sm shadow-[0_3px_0_#161311] active:translate-y-0.5 transition-all select-none disabled:opacity-50"
          @pointerdown="moveDir = -1"
          @pointerup="moveDir = 0"
          @pointerleave="moveDir = 0"
          @pointercancel="moveDir = 0"
        >
          ◀ Mover Izquierda
        </button>
        <button
          type="button"
          :disabled="!isStarted || isPaused || isFinished || disabled"
          class="h-12 rounded-2xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] text-[#FDFBF7] border border-[#5F4030] font-black text-sm shadow-[0_3px_0_#161311] active:translate-y-0.5 transition-all select-none disabled:opacity-50"
          @pointerdown="moveDir = 1"
          @pointerup="moveDir = 0"
          @pointerleave="moveDir = 0"
          @pointercancel="moveDir = 0"
        >
          Mover Derecha ▶
        </button>
      </div>
    </div>
  </div>
</template>
