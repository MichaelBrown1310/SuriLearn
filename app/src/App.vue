<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from './stores/useUserStore';
import { useGamificationStore } from './stores/useGamificationStore';
import ToastNotification from './components/common/ToastNotification.vue';
import SuspendedAccountModal from './components/common/SuspendedAccountModal.vue';

const userStore = useUserStore();
const gamificationStore = useGamificationStore();

onMounted(async () => {
  userStore.initAuthObserver();
  await gamificationStore.loadGamificationData();
});
</script>

<template>
  <div class="min-h-screen bg-surface font-sans text-on-surface antialiased">
    <router-view />
    <ToastNotification />
    <SuspendedAccountModal
      :is-open="userStore.isAuthenticated && userStore.isSuspended"
      :global-block="true"
    />
  </div>
</template>

<style>
/* Global Transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
