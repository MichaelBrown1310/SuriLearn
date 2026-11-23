<script setup lang="ts">
import { ref, computed } from 'vue';
import { InboxThreatScannerExercise, InboxVerdict } from '../../types/exercises';

const props = defineProps<{
  exercise: InboxThreatScannerExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', verdict: InboxVerdict): void;
}>();

const showHeaderDetails = ref<boolean>(false);
const showUrlInspection = ref<boolean>(false);

const attachmentBadgeLabel = computed(() => {
  const filename = props.exercise.attachment?.filename || '';
  const parts = filename.split('.');
  const ext = parts.length > 1 ? `.${parts[parts.length - 1].toUpperCase()}` : '';
  if (props.exercise.attachment?.isSuspicious) {
    return ext ? `${ext} DETECTADO` : 'ADJUNTO RIESGOSO';
  }
  return ext ? `${ext} ADJUNTO` : 'ADJUNTO';
});

function selectVerdict(verdict: InboxVerdict) {
  if (props.disabled) return;
  emit('submit', verdict);
}
</script>

<template>
  <div class="w-full flex flex-col gap-space-sm select-none">
    <!-- Instruction Banner -->
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">visibility</span>
      </div>
      <div class="flex flex-col text-left">
        <span class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ exercise.title }}
        </span>
        <h2 class="text-base font-extrabold text-on-surface leading-tight">
          {{ exercise.instruction }}
        </h2>
      </div>
    </div>

    <!-- Simulated Email Client Card -->
    <div
      class="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-md border border-outline-variant/30 relative overflow-hidden"
    >
      <!-- Mock Email Client Bar -->
      <div
        class="flex items-center justify-between pb-space-xs mb-space-sm bg-surface-container-low/70 -mx-space-md -mt-space-md p-2.5 px-space-md rounded-t-2xl border-b border-outline-variant/20"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-error/70"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-tech-cyan"></div>
        </div>
        <div class="flex items-center gap-1 text-on-surface-variant text-xs font-semibold">
          <span class="material-symbols-outlined text-[15px]">mail</span>
          <span>Bandeja Corporativa</span>
        </div>
      </div>

      <!-- Sender Details & Header Toggle -->
      <div class="bg-surface-container-low/60 rounded-xl p-3 mb-space-sm border border-outline-variant/20">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-sm font-bold text-on-surface truncate">
                {{ exercise.header.visualSender }}
              </span>
              <span
                v-if="!exercise.header.isSenderSpoofed"
                class="material-symbols-outlined text-[15px] text-tertiary"
              >
                verified_user
              </span>
            </div>

            <!-- Header Toggle Action -->
            <button
              type="button"
              class="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-container transition-colors"
              @click="showHeaderDetails = !showHeaderDetails"
            >
              <span class="material-symbols-outlined text-[14px]">
                {{ showHeaderDetails ? 'expand_less' : 'expand_more' }}
              </span>
              <span>{{ showHeaderDetails ? 'Ocultar Cabecera' : 'Desplegar Cabecera Técnica' }}</span>
            </button>
          </div>
          <span class="text-xs text-on-surface-variant shrink-0">
            {{ exercise.header.receivedTime }}
          </span>
        </div>

        <!-- Expanded Header Technical Details -->
        <Transition name="expand">
          <div
            v-if="showHeaderDetails"
            class="mt-2.5 pt-2 border-t border-outline-variant/30 text-[11px] flex flex-col gap-1 text-on-surface-variant"
          >
            <div class="flex items-center justify-between">
              <span>Remitente real (FROM):</span>
              <strong
                class="font-mono text-[11px]"
                :class="exercise.header.isSenderSpoofed ? 'text-error bg-error/10 px-1 rounded' : 'text-on-surface'"
              >
                {{ exercise.header.actualSender }}
              </strong>
            </div>
            <div class="flex items-center justify-between">
              <span>Autenticación SPF:</span>
              <span
                class="px-1 rounded font-bold uppercase text-[10px]"
                :class="exercise.header.spfStatus === 'pass' ? 'bg-shield-green/20 text-shield-green' : 'bg-error/20 text-error'"
              >
                {{ exercise.header.spfStatus }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>Firma DKIM:</span>
              <span
                class="px-1 rounded font-bold uppercase text-[10px]"
                :class="exercise.header.dkimStatus === 'pass' ? 'bg-shield-green/20 text-shield-green' : 'bg-error/20 text-error'"
              >
                {{ exercise.header.dkimStatus }}
              </span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Subject & Urgency Badge -->
      <div class="mb-space-sm text-left">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            v-if="exercise.isUrgentFlag"
            class="bg-error/15 text-error px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
          >
            ⚠️ Urgente
          </span>
          <h3 class="text-sm font-bold text-on-surface">
            {{ exercise.subject }}
          </h3>
        </div>
      </div>

      <!-- Body Copy -->
      <p class="text-xs text-on-surface-variant leading-relaxed mb-space-md text-left">
        {{ exercise.bodyText }}
      </p>

      <!-- Suspicious Attachment Card (e.g. Double Extension .pdf.exe) -->
      <div
        v-if="exercise.attachment"
        class="p-3 bg-error/10 border-2 border-dashed border-error/40 rounded-xl mb-space-sm flex items-center justify-between gap-2 text-left"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-error/15 flex items-center justify-center text-error shrink-0">
            <span class="material-symbols-outlined text-[20px]">attach_file</span>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-mono font-extrabold text-error truncate block">
              {{ exercise.attachment.filename }}
            </span>
            <span class="text-[10px] text-on-surface-variant font-bold">
              {{ exercise.attachment.size }} • Archivo adjunto detectado
            </span>
          </div>
        </div>
        <span
          class="text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
          :class="exercise.attachment.isSuspicious ? 'bg-error' : 'bg-shield-green'"
        >
          {{ attachmentBadgeLabel }}
        </span>
      </div>

      <!-- Phishing Action Link Box with Inspection -->
      <div
        class="p-space-sm bg-surface-container-low rounded-xl mb-space-xs flex flex-col items-center gap-2 border border-outline-variant/20"
      >
        <!-- Real Destination Preview Banner -->
        <div
          v-if="showUrlInspection"
          class="w-full bg-inverse-surface text-inverse-on-surface rounded-lg p-2 flex items-center justify-between text-[11px] shadow-sm animate-pulse"
        >
          <div class="flex items-center gap-1 min-w-0">
            <span class="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">link</span>
            <span class="font-mono text-tertiary-fixed-dim truncate">
              {{ exercise.link.actualDestinationUrl }}
            </span>
          </div>
          <span
            class="ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-primary/20 text-primary-fixed shrink-0"
          >
            Destino real
          </span>
        </div>

        <!-- Simulated Button Inside the Email -->
        <div class="w-full flex flex-col gap-1 items-center">
          <button
            type="button"
            class="w-full py-2.5 px-space-md bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 hover:bg-secondary/90 transition-all"
            @mouseenter="showUrlInspection = true"
            @mouseleave="showUrlInspection = false"
            @click="showUrlInspection = !showUrlInspection"
          >
            <span class="material-symbols-outlined text-[16px]">touch_app</span>
            <span>{{ exercise.actionButtonText }}</span>
          </button>
          <span class="text-[10px] text-on-surface-variant/70 italic">
            Toca o mantén presionado el botón para inspeccionar el enlace real
          </span>
        </div>
      </div>

      <!-- Footnote Urgency -->
      <div v-if="exercise.footnoteWarning" class="text-center mt-2">
        <span class="text-[11px] text-on-surface-variant/80 italic">
          {{ exercise.footnoteWarning }}
        </span>
      </div>
    </div>

    <!-- Suri Micro-Tip Helper -->
    <div
      class="w-full bg-surface-container rounded-2xl p-space-sm flex items-center gap-space-sm shadow-xs border border-primary-container/20 text-left"
    >
      <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[18px] text-primary icon-filled">lightbulb</span>
      </div>
      <div class="flex-1 min-w-0">
        <span class="text-xs font-bold text-primary block">Tip Centinela de Suri:</span>
        <p class="text-[11px] text-on-surface-variant leading-tight">
          {{ exercise.suriPrompt }}
        </p>
      </div>
    </div>

    <!-- Triple Verdict Decision Actions -->
    <div class="mt-space-sm w-full flex flex-col gap-2">
      <span class="text-[11px] text-center text-on-surface-variant font-bold uppercase tracking-wider">
        Emite tu veredicto de centinela:
      </span>

      <div class="grid grid-cols-2 gap-space-sm">
        <!-- Safe Button -->
        <button
          type="button"
          class="h-13 py-3 rounded-2xl bg-surface-container-high text-on-surface font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:translate-y-1 transition-all border border-outline-variant/30"
          :disabled="disabled"
          @click="selectVerdict('safe')"
        >
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Es Seguro</span>
        </button>

        <!-- Phishing Button -->
        <button
          type="button"
          class="h-13 py-3 rounded-2xl bg-error text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:translate-y-1 transition-all shadow-[0_3px_0_#93000a]"
          :disabled="disabled"
          @click="selectVerdict('phish')"
        >
          <span class="material-symbols-outlined text-[18px] icon-filled">gpp_bad</span>
          <span>¡Es Phishing!</span>
        </button>
      </div>

      <!-- Ask IT / Verification Button (Enterprise / SME Realism) -->
      <button
        type="button"
        class="w-full py-2.5 rounded-xl bg-surface-container-low text-secondary font-bold text-xs flex items-center justify-center gap-1 hover:bg-surface-container transition-colors"
        :disabled="disabled"
        @click="selectVerdict('verify')"
      >
        <span class="material-symbols-outlined text-[16px]">contact_support</span>
        <span>Pedir Verificación a Soporte / TI</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease-out;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
