<script setup lang="ts">
import { ref, computed } from 'vue';
import { PasswordVaultBuilderExercise, PasswordToken } from '../../types/exercises';

const props = defineProps<{
  exercise: PasswordVaultBuilderExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', result: { password: string; years: number; isStrongEnough: boolean }): void;
}>();

const assembledTokens = ref<PasswordToken[]>([]);

const assembledPassword = computed(() => {
  return assembledTokens.value.map((t) => t.text).join('');
});

const totalEntropyBits = computed(() => {
  return assembledTokens.value.reduce((sum, t) => sum + t.entropyContributionBits, 0);
});

// Calculate simulated crack time in years
const calculatedCrackYears = computed(() => {
  const bits = totalEntropyBits.value;
  if (bits < 20) return 0.0001; // Instant
  if (bits < 35) return 0.05; // Days
  if (bits < 45) return 5;
  if (bits < 55) return 120;
  if (bits < 65) return 450;
  if (bits < 75) return 12000;
  return 800000;
});

const crackTimeDisplayText = computed(() => {
  const years = calculatedCrackYears.value;
  if (years <= 0.0001) return 'Instantáneo (Microsegundos)';
  if (years < 1) return 'Menos de 1 mes';
  if (years < 100) return `${Math.round(years)} años`;
  if (years < 1000) return `${Math.round(years)} años`;
  return `${years.toLocaleString()} años`;
});

const usedTokenIds = computed(() => new Set(assembledTokens.value.map((t) => t.id)));

const isTargetAchieved = computed(() => {
  const meetsEntropy = totalEntropyBits.value >= (props.exercise.minEntropyRequired || 0);
  const meetsYears = calculatedCrackYears.value >= props.exercise.targetCrackYears;
  return meetsEntropy && meetsYears;
});

function isTokenUsed(tokenId: string): boolean {
  return usedTokenIds.value.has(tokenId);
}

function addToken(token: PasswordToken) {
  if (props.disabled || isTokenUsed(token.id)) return;
  assembledTokens.value.push(token);
}

function removeToken(index: number) {
  if (props.disabled) return;
  assembledTokens.value.splice(index, 1);
}

function clearAll() {
  if (props.disabled) return;
  assembledTokens.value = [];
}

function handleConfirm() {
  if (props.disabled || assembledTokens.value.length === 0) return;
  emit('submit', {
    password: assembledPassword.value,
    years: calculatedCrackYears.value,
    isStrongEnough: isTargetAchieved.value,
  });
}
</script>

<template>
  <div class="w-full flex flex-col gap-space-md select-none text-left">
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">password</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ exercise.title }}
        </span>
        <h2 class="text-base font-extrabold text-on-surface leading-tight">
          {{ exercise.instruction }}
        </h2>
      </div>
    </div>

    <!-- Password Construction Chamber -->
    <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-md border border-outline-variant/30 flex flex-col gap-3">
      <!-- Assembled Display Box -->
      <div class="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 min-h-[58px] flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap flex-1">
          <span
            v-if="assembledTokens.length === 0"
            class="text-xs text-on-surface-variant/60 italic"
          >
            Toca bloques para ensamblar tu clave centinela...
          </span>
          <button
            v-for="(token, index) in assembledTokens"
            :key="`${token.id}_${index}`"
            type="button"
            class="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono font-bold text-on-surface shadow-xs flex items-center gap-1 hover:bg-error/10 hover:border-error group transition-all"
            @click="removeToken(index)"
          >
            <span>{{ token.text }}</span>
            <span class="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-error">
              close
            </span>
          </button>
        </div>

        <button
          v-if="assembledTokens.length > 0"
          type="button"
          class="text-xs font-bold text-error hover:underline px-1 shrink-0"
          @click="clearAll"
        >
          Borrar
        </button>
      </div>

      <!-- Real-Time Brute Force Simulator Telemetry -->
      <div class="bg-surface-container rounded-xl p-3 flex flex-col gap-2 border border-outline-variant/30">
        <div class="flex items-center justify-between text-xs">
          <span class="text-on-surface-variant font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
            <span>Simulador Robot Cracker:</span>
          </span>
          <span
            class="font-extrabold text-sm"
            :class="isTargetAchieved ? 'text-shield-green' : 'text-error'"
          >
            {{ crackTimeDisplayText }}
          </span>
        </div>

        <!-- Meter bar -->
        <div class="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="isTargetAchieved ? 'bg-shield-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-primary-container'"
            :style="{ width: `${Math.min(100, (calculatedCrackYears / exercise.targetCrackYears) * 100)}%` }"
          ></div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-on-surface-variant gap-2 flex-wrap">
          <span>
            Entropía: <strong class="text-on-surface">{{ totalEntropyBits }} / {{ exercise.minEntropyRequired }} bits</strong>
            · Meta: > {{ exercise.targetCrackYears }} años
          </span>
          <span :class="isTargetAchieved ? 'text-shield-green font-extrabold flex items-center gap-0.5' : 'text-error font-bold'">
            <span class="material-symbols-outlined text-[14px]">{{ isTargetAchieved ? 'lock' : 'lock_open' }}</span>
            {{ isTargetAchieved ? 'Bóveda Blindada' : 'Clave Vulnerable' }}
          </span>
        </div>

        <!-- Passphrase comparison educational note -->
        <div class="mt-1 pt-2 border-t border-outline-variant/20 text-[10px] text-on-surface-variant/90 leading-tight flex items-start gap-1.5">
          <span class="material-symbols-outlined text-[14px] text-primary shrink-0">lightbulb</span>
          <span>
            <strong>Lección clave:</strong> Una frase de paso (ej. <em>CaballoReloj#89Plátano</em>) supera los 400 años porque combina longitud y palabras dispares, superando por mucho a sustituciones simples como <em>P@ssw0rd123</em>.
          </span>
        </div>
      </div>

      <!-- Token Bank -->
      <div class="flex flex-col gap-2 mt-1">
        <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          Bloques disponibles:
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="token in exercise.availableTokens"
            :key="token.id"
            type="button"
            class="px-3 py-2 border rounded-xl text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1"
            :class="
              isTokenUsed(token.id)
                ? 'bg-primary/15 border-primary/40 text-primary opacity-60 cursor-not-allowed'
                : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/40 text-on-surface active:scale-95'
            "
            :disabled="disabled || isTokenUsed(token.id)"
            @click="addToken(token)"
          >
            <span>{{ isTokenUsed(token.id) ? '✓' : '+' }} {{ token.text }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Button -->
    <button
      type="button"
      class="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 btn-tactile-primary"
      :disabled="assembledTokens.length === 0 || disabled"
      :class="{ 'opacity-50 pointer-events-none': assembledTokens.length === 0 }"
      @click="handleConfirm"
    >
      <span>Probar Resistencia de Bóveda</span>
      <span class="material-symbols-outlined text-[18px]">lock_reset</span>
    </button>
  </div>
</template>
