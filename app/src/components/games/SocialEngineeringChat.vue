<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { SocialEngineeringChatExercise, ChatDialogueOption } from '../../types/exercises';

const props = defineProps<{
  exercise: SocialEngineeringChatExercise;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', isSuccess: boolean): void;
}>();

const currentNodeId = ref<string>(props.exercise.rootNodeId);
const isTyping = ref<boolean>(true);
const isAttackerRevealed = ref<boolean>(false);
const chatHistory = ref<Array<{ sender: 'attacker' | 'user'; text: string; time: string }>>([]);

const pendingTimers: ReturnType<typeof setTimeout>[] = [];

function scheduleTimer(fn: () => void, ms: number) {
  const id = setTimeout(fn, ms);
  pendingTimers.push(id);
}

function clearTimers() {
  while (pendingTimers.length > 0) {
    const id = pendingTimers.pop();
    if (id !== undefined) clearTimeout(id);
  }
}

const triggerLabel = computed(() => {
  switch (props.exercise.psychologicalTrigger) {
    case 'authority':
      return 'Falsa Autoridad';
    case 'fear':
      return 'Miedo / Amenaza';
    case 'sympathy':
      return 'Manipulación';
    case 'urgency':
    default:
      return 'Falsa Urgencia';
  }
});

const currentNode = computed(() => {
  return props.exercise.dialogueNodes[currentNodeId.value];
});

function initChat() {
  clearTimers();
  currentNodeId.value = props.exercise.rootNodeId;
  isTyping.value = true;
  isAttackerRevealed.value = false;
  chatHistory.value = [];

  const root = props.exercise.dialogueNodes[props.exercise.rootNodeId];
  if (root && root.incomingMessages.length > 0) {
    scheduleTimer(() => {
      isTyping.value = false;
      for (const msg of root.incomingMessages) {
        chatHistory.value.push({
          sender: 'attacker',
          text: msg.text,
          time: msg.timestamp || 'Ahora',
        });
      }
    }, 900);
  } else {
    isTyping.value = false;
  }
}

watch(
  () => props.exercise.id,
  () => {
    initChat();
  }
);

onMounted(() => {
  initChat();
});

onUnmounted(() => {
  clearTimers();
});

function handleChoice(choice: ChatDialogueOption) {
  if (props.disabled) return;

  // Add user reply to chat history
  chatHistory.value.push({
    sender: 'user',
    text: choice.text,
    time: 'Ahora',
  });

  if (choice.isPanicButton) {
    scheduleTimer(() => {
      emit('submit', true);
    }, 400);
    return;
  }

  if (!choice.isSafeChoice) {
    isAttackerRevealed.value = true;
    chatHistory.value.push({
      sender: 'attacker',
      text: '💀 [ATACANTE]: ¡Gracias por el acceso! Comprometiendo las credenciales de tu cuenta...',
      time: 'Ahora',
    });

    scheduleTimer(() => {
      emit('submit', false);
    }, 1100);
    return;
  }

  if (choice.nextDialogueNodeId && props.exercise.dialogueNodes[choice.nextDialogueNodeId]) {
    currentNodeId.value = choice.nextDialogueNodeId;
    isTyping.value = true;
    scheduleTimer(() => {
      isTyping.value = false;
      const nextNode = props.exercise.dialogueNodes[choice.nextDialogueNodeId!];
      for (const msg of nextNode.incomingMessages) {
        chatHistory.value.push({
          sender: 'attacker',
          text: msg.text,
          time: msg.timestamp || 'Ahora',
        });
      }
    }, 800);
  } else {
    scheduleTimer(() => {
      emit('submit', true);
    }, 400);
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-space-sm select-none text-left">
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs"
      >
        <span class="material-symbols-outlined text-[20px] icon-filled">chat</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ exercise.title }}
        </span>
        <h2 class="text-sm font-extrabold text-on-surface leading-tight">
          {{ exercise.instruction }}
        </h2>
      </div>
    </div>

    <!-- Simulated Messaging App Card (WhatsApp/Teams/Slack style) -->
    <div
      class="bg-surface-container-lowest rounded-2xl shadow-md border-2 border-outline-variant/30 flex flex-col overflow-hidden"
    >
      <!-- Chat Header -->
      <div
        class="p-3 flex items-center justify-between border-b transition-colors duration-500"
        :class="isAttackerRevealed ? 'bg-error text-white' : 'bg-surface-container-high border-outline-variant/20'"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs font-black transition-all duration-300"
            :class="isAttackerRevealed ? 'bg-black text-error animate-bounce' : 'bg-secondary-container text-on-secondary-container'"
          >
            <span class="material-symbols-outlined text-[22px]">
              {{ isAttackerRevealed ? 'skull' : 'person' }}
            </span>
          </div>

          <div class="flex flex-col min-w-0">
            <span
              class="text-xs font-extrabold truncate"
              :class="isAttackerRevealed ? 'text-white' : 'text-on-surface'"
            >
              {{ isAttackerRevealed ? '⚠️ SUPLANTADOR / HACKER' : exercise.attackerContact.displayName }}
            </span>
            <span
              class="text-[10px] truncate"
              :class="isAttackerRevealed ? 'text-amber-200 font-bold' : 'text-on-surface-variant'"
            >
              <template v-if="isAttackerRevealed">¡Brecha de Seguridad Detectada!</template>
              <template v-else-if="isTyping">Escribiendo...</template>
              <template v-else>{{ exercise.attackerContact.allegedRole }} · En línea</template>
            </span>
          </div>
        </div>

        <!-- Psychological Attack Flag -->
        <span
          class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
          :class="isAttackerRevealed ? 'bg-black/50 text-white' : 'bg-error/15 text-error'"
        >
          {{ triggerLabel }}
        </span>
      </div>

      <!-- Chat Bubbles Area -->
      <div class="p-3.5 bg-surface-container-low/70 flex flex-col gap-2.5 min-h-[190px] max-h-[270px] overflow-y-auto">
        <!-- Messages -->
        <div
          v-for="(msg, index) in chatHistory"
          :key="index"
          class="flex flex-col max-w-[85%]"
          :class="msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'"
        >
          <div
            class="p-3 rounded-2xl text-xs shadow-xs leading-relaxed"
            :class="
              msg.sender === 'user'
                ? 'bg-primary-container text-white rounded-br-xs font-medium'
                : msg.text.includes('💀')
                  ? 'bg-red-950 text-red-200 border border-error rounded-bl-xs font-bold'
                  : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-bl-xs'
            "
          >
            {{ msg.text }}
          </div>
          <span class="text-[9px] text-on-surface-variant/70 mt-0.5 px-1">
            {{ msg.time }}
          </span>
        </div>

        <!-- Sequential Typing Animation Indicator -->
        <div v-if="isTyping" class="self-start flex items-center gap-1.5 p-2.5 bg-surface-container rounded-2xl rounded-bl-xs w-16">
          <span class="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>

      <!-- Dialogue Options Tray -->
      <div v-if="currentNode && !isTyping && !isAttackerRevealed" class="p-3 bg-surface-container-low border-t border-outline-variant/20 flex flex-col gap-2">
        <span class="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
          Selecciona tu respuesta:
        </span>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="opt in currentNode.options"
            :key="opt.id"
            type="button"
            class="p-2.5 rounded-xl border text-xs font-bold text-left transition-all active:scale-[0.98] shadow-xs flex items-center justify-between gap-2"
            :class="
              opt.isPanicButton
                ? 'bg-error/15 border-error text-error hover:bg-error/25'
                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface hover:bg-surface-container'
            "
            :disabled="disabled"
            @click="handleChoice(opt)"
          >
            <span class="leading-snug">{{ opt.text }}</span>
            <span
              class="material-symbols-outlined text-[18px] shrink-0"
              :class="opt.isPanicButton ? 'text-error animate-pulse' : 'text-primary'"
            >
              {{ opt.isPanicButton ? 'emergency' : 'send' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
