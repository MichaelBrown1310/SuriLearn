<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { CyberInvadersExercise, SuriPose } from '../../types/exercises';
import SuriMascotAnimated from '../common/SuriMascotAnimated.vue';

const props = defineProps<{
  exercise: CyberInvadersExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

interface Invader {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  label: string;
  colorHex: string;
  points: number;
  tip: string;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
  fromPlayer: boolean;
}

interface BarrierBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
}

const LOGICAL_W = 420;
const LOGICAL_H = 320;
const PLAYER_W = 44;
const PLAYER_H = 16;
const PLAYER_Y = LOGICAL_H - 28;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isStarted = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const isFinished = ref<boolean>(false);
const shieldsLeft = ref<number>(props.exercise.maxShields || 3);
const invadersAlive = ref<number>(0);
const totalInvaders = ref<number>(0);
const score = ref<number>(0);
const bannerText = ref<string>(
  'Pulsa Iniciar, mueve la torreta de Suri y dispara rayos cian contra la oleada.'
);
const suriPose = ref<SuriPose>('shield');
const suriReactionKey = ref<number>(0);

let rafId: number | null = null;
let lastFrameTime = 0;
let playerX = (LOGICAL_W - PLAYER_W) / 2;
let moveDir: -1 | 0 | 1 = 0;
let shootCooldown = 0;
let enemyFireTimer = 0;
let invaderDir = 1;
let invaderSpeed = 32;

let invaders: Invader[] = [];
let bullets: Bullet[] = [];
let barriers: BarrierBlock[] = [];

function buildEntities() {
  const rows = props.exercise.rows || 3;
  const cols = props.exercise.cols || 4;
  const invW = 66;
  const invH = 22;
  const gapX = 16;
  const gapY = 12;
  const totalW = cols * invW + (cols - 1) * gapX;
  const startX = (LOGICAL_W - totalW) / 2;
  const startY = 22;

  const invList: Invader[] = [];
  for (let r = 0; r < rows; r++) {
    const typeDef = props.exercise.invaderTypes[r] || props.exercise.invaderTypes[0];
    for (let c = 0; c < cols; c++) {
      invList.push({
        x: startX + c * (invW + gapX),
        y: startY + r * (invH + gapY),
        w: invW,
        h: invH,
        alive: true,
        label: typeDef?.label || 'THREAT',
        colorHex: typeDef?.colorHex || '#EF4444',
        points: typeDef?.points || 100,
        tip: typeDef?.tip || 'Amenaza bloqueada en el perímetro.',
      });
    }
  }
  invaders = invList;
  totalInvaders.value = invList.length;
  invadersAlive.value = invList.length;

  // 2 warm SuriLearn Firewall Barriers split into destructible sub-blocks
  const barList: BarrierBlock[] = [];
  const barrierCenters = [LOGICAL_W * 0.28, LOGICAL_W * 0.72];
  for (const cx of barrierCenters) {
    for (let seg = -1; seg <= 1; seg++) {
      barList.push({
        x: cx - 10 + seg * 22,
        y: PLAYER_Y - 46,
        w: 20,
        h: 12,
        hp: 2,
      });
    }
  }
  barriers = barList;
  bullets = [];
  playerX = (LOGICAL_W - PLAYER_W) / 2;
  invaderDir = 1;
  invaderSpeed = 34;
  shootCooldown = 0;
  enemyFireTimer = 0.8;
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

  // Carbón Tierra SuriLearn
  ctx.fillStyle = '#161311';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.strokeStyle = '#2B241F';
  ctx.lineWidth = 1;
  for (let x = 0; x <= LOGICAL_W; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LOGICAL_H);
    ctx.stroke();
  }

  // Defense perimeter line
  ctx.strokeStyle = 'rgba(225, 166, 83, 0.35)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, PLAYER_Y - 6);
  ctx.lineTo(LOGICAL_W, PLAYER_Y - 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Firewall barriers
  for (const bar of barriers) {
    if (bar.hp <= 0) continue;
    ctx.fillStyle = bar.hp >= 2 ? '#E1A653' : '#5F4030';
    ctx.beginPath();
    ctx.roundRect(bar.x, bar.y, bar.w, bar.h, 3);
    ctx.fill();
    ctx.strokeStyle = '#FFF2DA';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Invaders
  for (const inv of invaders) {
    if (!inv.alive) continue;
    ctx.fillStyle = '#2B241F';
    ctx.beginPath();
    ctx.roundRect(inv.x, inv.y, inv.w, inv.h, 6);
    ctx.fill();
    ctx.strokeStyle = inv.colorHex;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FDFBF7';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inv.label, inv.x + inv.w / 2, inv.y + inv.h / 2 + 0.5);
  }

  // Player Suri Turret (Arena Ocre + Cañón Cian)
  ctx.fillStyle = '#E1A653';
  ctx.beginPath();
  ctx.roundRect(playerX, PLAYER_Y, PLAYER_W, PLAYER_H, 6);
  ctx.fill();
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(playerX + PLAYER_W / 2 - 4, PLAYER_Y - 6, 8, 8);

  // Bullets
  for (const b of bullets) {
    ctx.fillStyle = b.fromPlayer ? '#00E5FF' : '#EF4444';
    ctx.beginPath();
    ctx.roundRect(b.x - 2.5, b.y - 6, 5, 12, 2);
    ctx.fill();
  }
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

function firePlayerShot() {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) return;
  if (shootCooldown > 0) return;
  bullets.push({
    x: playerX + PLAYER_W / 2,
    y: PLAYER_Y - 8,
    vy: -310,
    fromPlayer: true,
  });
  shootCooldown = 0.28;
}

function tick(now: number) {
  if (!isStarted.value || isPaused.value || isFinished.value || props.disabled) {
    rafId = null;
    return;
  }

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (shootCooldown > 0) shootCooldown = Math.max(0, shootCooldown - dt);

  if (moveDir !== 0) {
    playerX = Math.max(6, Math.min(LOGICAL_W - PLAYER_W - 6, playerX + moveDir * 240 * dt));
  }

  // Move invaders horizontally & step down at walls
  const activeInvaders = invaders.filter((i) => i.alive);
  let hitEdge = false;
  for (const inv of activeInvaders) {
    inv.x += invaderDir * invaderSpeed * dt;
    if ((invaderDir > 0 && inv.x + inv.w >= LOGICAL_W - 8) || (invaderDir < 0 && inv.x <= 8)) {
      hitEdge = true;
    }
  }
  if (hitEdge) {
    invaderDir = -invaderDir;
    for (const inv of activeInvaders) {
      inv.y += 14;
      if (inv.y + inv.h >= PLAYER_Y - 6) {
        bannerText.value = '🚨 ¡Los invasores cruzaron el perímetro defensivo!';
        finishGame(false);
        return;
      }
    }
  }

  // Enemy periodic fire
  enemyFireTimer -= dt;
  if (enemyFireTimer <= 0 && activeInvaders.length > 0) {
    const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
    bullets.push({
      x: shooter.x + shooter.w / 2,
      y: shooter.y + shooter.h + 4,
      vy: 165,
      fromPlayer: false,
    });
    enemyFireTimer = Math.max(0.55, 1.3 - (totalInvaders.value - activeInvaders.length) * 0.05);
  }

  // Update bullets & collisions
  const remainingBullets: Bullet[] = [];
  for (const b of bullets) {
    b.y += b.vy * dt;
    if (b.y < -12 || b.y > LOGICAL_H + 12) continue;

    // Barrier collision
    const hitBarrier = barriers.find(
      (bar) => bar.hp > 0 && b.x >= bar.x && b.x <= bar.x + bar.w && b.y >= bar.y && b.y <= bar.y + bar.h
    );
    if (hitBarrier) {
      hitBarrier.hp -= 1;
      continue;
    }

    if (b.fromPlayer) {
      const hitInv = invaders.find(
        (inv) =>
          inv.alive && b.x >= inv.x && b.x <= inv.x + inv.w && b.y >= inv.y && b.y <= inv.y + inv.h
      );
      if (hitInv) {
        hitInv.alive = false;
        score.value += hitInv.points;
        invadersAlive.value = invaders.filter((i) => i.alive).length;
        invaderSpeed += 2.5;
        suriPose.value = 'ok';
        suriReactionKey.value += 1;
        bannerText.value = `⚡ ${hitInv.label} neutralizado (+${hitInv.points} PTS): ${hitInv.tip}`;
        if (invadersAlive.value <= 0) {
          bannerText.value = '🏆 ¡Perímetro limpio! Toda la oleada de spam/botnet fue neutralizada.';
          finishGame(true);
          return;
        }
        continue;
      }
    } else {
      // Enemy bullet hits player turret
      if (
        b.x >= playerX &&
        b.x <= playerX + PLAYER_W &&
        b.y >= PLAYER_Y - 4 &&
        b.y <= PLAYER_Y + PLAYER_H
      ) {
        shieldsLeft.value = Math.max(0, shieldsLeft.value - 1);
        suriPose.value = 'surprised';
        suriReactionKey.value += 1;
        if (shieldsLeft.value <= 0) {
          bannerText.value = '💥 Impacto crítico: la torreta de Suri perdió sus 3 escudos.';
          finishGame(false);
          return;
        }
        bannerText.value = `🛡️ Paquete malicioso interceptó tu torreta. Escudos: ${shieldsLeft.value}.`;
        continue;
      }
    }

    remainingBullets.push(b);
  }
  bullets = remainingBullets;

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
  bannerText.value = '¡Fuego libre! Usa ←/→ y [Espacio] o los botones táctiles para defender el perímetro.';
  startLoop();
}

function togglePause() {
  if (!isStarted.value || isFinished.value || props.disabled) return;
  isPaused.value = !isPaused.value;
  if (isPaused.value) stopLoop();
  else startLoop();
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
  } else if (e.key === ' ' || e.key === 'ArrowUp' || key === 'w') {
    e.preventDefault();
    firePlayerShot();
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
  score.value = 0;
  shieldsLeft.value = props.exercise.maxShields || 3;
  buildEntities();
  suriPose.value = 'shield';
  suriReactionKey.value += 1;
  bannerText.value = 'Pulsa Iniciar y elimina la formación invasora antes de que cruce el perímetro.';
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
        <div class="w-10 h-10 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px] icon-filled">rocket_launch</span>
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

      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <span class="px-2.5 py-1 rounded-full bg-shield-green/15 text-shield-green text-xs font-black">
          👾 {{ totalInvaders - invadersAlive }}/{{ totalInvaders }}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-black">
          PTS: {{ score }}
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

      <!-- Canvas Arena -->
      <div class="relative w-full max-w-[460px] mx-auto aspect-[420/320] rounded-2xl overflow-hidden border-2 border-[#E1A653]/45 bg-[#161311] shadow-inner">
        <canvas
          ref="canvasRef"
          :width="LOGICAL_W"
          :height="LOGICAL_H"
          class="w-full h-full block touch-none"
        ></canvas>

        <!-- Start Overlay -->
        <div
          v-if="!isStarted"
          class="absolute inset-0 bg-[#161311]/88 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="running" size="md" :auto-blink="false" :show-shadow="false" />
          <div>
            <p class="text-sm font-black text-[#FDFBF7]">Invasores del Spam Centinela</p>
            <p class="text-[11px] text-[#D4C3B3] mt-1">
              Protege los <strong class="text-[#F3B75B]">muros Firewall</strong> y elimina las {{ totalInvaders }} amenazas usando <strong class="text-[#00E5FF]">← / → y Espacio</strong> o los controles inferiores.
            </p>
          </div>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="startGame"
          >
            ¡Defender Perímetro!
          </button>
        </div>

        <!-- Pause Overlay -->
        <div
          v-else-if="isPaused && !isFinished"
          class="absolute inset-0 bg-[#161311]/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center gap-3 z-20"
        >
          <SuriMascotAnimated pose="sleeping" size="sm" :auto-blink="false" :show-shadow="false" />
          <p class="text-sm font-black text-[#F3B75B]">Defensa en Pausa</p>
          <button
            type="button"
            class="px-5 py-2 rounded-2xl btn-tactile-primary font-black text-xs uppercase tracking-wider"
            @click="togglePause"
          >
            ▶ Reanudar
          </button>
        </div>
      </div>

      <!-- Tactile Arcade Pad -->
      <div class="grid grid-cols-3 gap-2.5 max-w-[460px] w-full mx-auto">
        <button
          type="button"
          :disabled="!isStarted || isPaused || isFinished || disabled"
          class="h-12 rounded-2xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] text-[#FDFBF7] border border-[#5F4030] font-black text-base shadow-[0_3px_0_#161311] active:translate-y-0.5 transition-all disabled:opacity-50"
          @pointerdown="moveDir = -1"
          @pointerup="moveDir = 0"
          @pointerleave="moveDir = 0"
          @pointercancel="moveDir = 0"
        >
          ◀
        </button>

        <button
          type="button"
          :disabled="!isStarted || isPaused || isFinished || disabled"
          class="h-12 rounded-2xl btn-tactile-primary font-black text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50"
          @click="firePlayerShot"
        >
          ⚡ DISPARAR
        </button>

        <button
          type="button"
          :disabled="!isStarted || isPaused || isFinished || disabled"
          class="h-12 rounded-2xl bg-[#2B241F] hover:bg-[#E1A653] hover:text-[#291800] text-[#FDFBF7] border border-[#5F4030] font-black text-base shadow-[0_3px_0_#161311] active:translate-y-0.5 transition-all disabled:opacity-50"
          @pointerdown="moveDir = 1"
          @pointerup="moveDir = 0"
          @pointerleave="moveDir = 0"
          @pointercancel="moveDir = 0"
        >
          ▶
        </button>
      </div>
    </div>
  </div>
</template>
