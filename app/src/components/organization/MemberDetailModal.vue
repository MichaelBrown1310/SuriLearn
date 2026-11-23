<script setup lang="ts">
import { computed, ref } from 'vue';
import { UserProfile } from '../../types/gamification';
import { getSuriImage } from '../../utils/suriAssets';

const props = defineProps<{
  member: UserProfile | null;
  isOpen: boolean;
  isAdmin: boolean;
  isSelf: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-status', member: UserProfile): void;
  (e: 'remove-member', member: UserProfile): void;
}>();

const isConfirmingRemove = ref(false);
const isConfirmingToggle = ref(false);

const suriFallback = getSuriImage('idle');

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Reciente';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Reciente';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Reciente';
  }
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.src = suriFallback;
}

function handleToggleClick() {
  if (!props.member) return;
  isConfirmingToggle.value = true;
}

function confirmToggle() {
  if (!props.member) return;
  isConfirmingToggle.value = false;
  emit('toggle-status', props.member);
}

function handleRemoveClick() {
  if (!props.member) return;
  isConfirmingRemove.value = true;
}

function confirmRemove() {
  if (!props.member) return;
  isConfirmingRemove.value = false;
  emit('remove-member', props.member);
}
</script>

<template>
  <div
    v-if="isOpen && member"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    @click.self="emit('close')"
  >
    <div
      class="bg-surface rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh]"
    >
      <!-- Header with Cover Accent -->
      <div class="bg-gradient-to-r from-[#5F4030] to-[#E1A653] p-5 text-white relative">
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div class="flex items-center gap-3.5">
          <div class="relative w-14 h-14 rounded-2xl bg-surface p-0.5 overflow-hidden shadow-md shrink-0">
            <img
              :src="member.avatarUrl || member.photoURL || suriFallback"
              @error="handleImageError"
              :alt="member.displayName"
              class="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="text-base font-black truncate text-[#F6E3B8]">
                {{ member.displayName }}
              </h3>
              <span
                class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                :class="member.role === 'sme_admin' ? 'bg-[#F6E3B8] text-[#5F4030]' : 'bg-white/20 text-white'"
              >
                {{ member.role === 'sme_admin' ? 'Admin' : 'Colaborador' }}
              </span>
            </div>
            <span class="text-xs text-white/80 font-medium truncate">
              {{ member.email }}
            </span>
            <!-- Status Badge -->
            <div class="mt-1 flex items-center gap-1.5">
              <span
                class="inline-block w-2 h-2 rounded-full"
                :class="member.status === 'suspended' ? 'bg-[#EF4444] animate-ping' : 'bg-[#22C55E]'"
              ></span>
              <span
                class="text-[10px] font-black uppercase tracking-wider"
                :class="member.status === 'suspended' ? 'text-[#EF4444]' : 'text-[#22C55E]'"
              >
                {{ member.status === 'suspended' ? 'Cuenta Pausada / Suspendida' : 'En Guardia Activa' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrollable Body with Telemetry -->
      <div class="p-5 flex flex-col gap-4 overflow-y-auto">
        <!-- Telemetry Grid -->
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-2">
            Métricas de Desempeño Antifraude
          </span>
          <div class="grid grid-cols-2 gap-2.5">
            <!-- XP -->
            <div class="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] icon-filled">bolt</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-black text-on-surface truncate">
                  {{ (member.xp || 0).toLocaleString() }} XP
                </span>
                <span class="text-[10px] text-on-surface-variant">Puntos de Habilidad</span>
              </div>
            </div>

            <!-- Accuracy -->
            <div class="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] icon-filled">verified</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-black text-on-surface truncate">
                  {{ member.accuracyRate || 0 }}%
                </span>
                <span class="text-[10px] text-on-surface-variant">Precisión Táctica</span>
              </div>
            </div>

            <!-- Completed Lessons -->
            <div class="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] icon-filled">school</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-black text-on-surface truncate">
                  {{ (member.completedLessons || []).length }} lecciones
                </span>
                <span class="text-[10px] text-on-surface-variant">Capacitaciones</span>
              </div>
            </div>

            <!-- Streak -->
            <div class="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] icon-filled">local_fire_department</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-black text-on-surface truncate">
                  {{ member.streakDays || 0 }} días
                </span>
                <span class="text-[10px] text-on-surface-variant">Racha de Hábitos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Timeline Info -->
        <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-on-surface-variant font-medium">Liga Competitiva:</span>
            <span class="font-black text-primary">{{ member.currentLeague || 'Bronce' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-on-surface-variant font-medium">Última Actividad:</span>
            <span class="font-bold text-on-surface">{{ formatDate(member.lastActiveDate || member.lastLoginAt) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-on-surface-variant font-medium">Fecha de Ingreso:</span>
            <span class="font-bold text-on-surface">{{ formatDate(member.createdAt) }}</span>
          </div>
          <div v-if="member.status === 'suspended'" class="flex items-center justify-between text-[#EF4444] pt-1 border-t border-outline-variant/20">
            <span class="font-bold">Fecha de Suspensión:</span>
            <span class="font-extrabold">{{ formatDate(member.suspendedAt) }}</span>
          </div>
        </div>

        <!-- Inline Confirmations -->
        <div v-if="isConfirmingToggle" class="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col gap-2">
          <p class="font-bold">
            ¿Confirmas que deseas {{ member.status === 'suspended' ? 'reactivar' : 'suspender' }} el acceso a lecciones de {{ member.displayName }}?
          </p>
          <div class="flex gap-2">
            <button
              @click="confirmToggle"
              class="flex-1 py-1.5 rounded-xl font-black text-white text-xs"
              :class="member.status === 'suspended' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'"
            >
              Sí, {{ member.status === 'suspended' ? 'Reactivar' : 'Suspender' }}
            </button>
            <button
              @click="isConfirmingToggle = false"
              class="px-3 py-1.5 rounded-xl bg-surface-container font-bold text-on-surface text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div v-if="isConfirmingRemove" class="p-3 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-900 flex flex-col gap-2">
          <p class="font-bold">
            ¿Desvincular definitivamente a {{ member.displayName }} de la empresa? Liberará 1 puesto de tu plan corporativo y el usuario volverá al plan estándar.
          </p>
          <div class="flex gap-2">
            <button
              @click="confirmRemove"
              class="flex-1 py-1.5 rounded-xl font-black bg-[#EF4444] text-white text-xs hover:bg-[#DC2626]"
            >
              Sí, Desvincular de la PYME
            </button>
            <button
              @click="isConfirmingRemove = false"
              class="px-3 py-1.5 rounded-xl bg-surface-container font-bold text-on-surface text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Action Footer (Admin Controls) -->
      <div class="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between gap-2">
        <template v-if="isAdmin && !isSelf">
          <!-- Toggle Suspend / Reactivate -->
          <button
            v-if="!isConfirmingToggle && !isConfirmingRemove"
            @click="handleToggleClick"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all"
            :class="
              member.status === 'suspended'
                ? 'bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25'
                : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25'
            "
          >
            <span class="material-symbols-outlined text-[16px]">
              {{ member.status === 'suspended' ? 'play_arrow' : 'pause' }}
            </span>
            <span>{{ member.status === 'suspended' ? 'Reactivar' : 'Suspender' }}</span>
          </button>

          <!-- Remove from PYME -->
          <button
            v-if="!isConfirmingToggle && !isConfirmingRemove"
            @click="handleRemoveClick"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all"
          >
            <span class="material-symbols-outlined text-[16px]">person_remove</span>
            <span>Desvincular</span>
          </button>
        </template>

        <button
          @click="emit('close')"
          class="ml-auto px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-black text-on-surface transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>
