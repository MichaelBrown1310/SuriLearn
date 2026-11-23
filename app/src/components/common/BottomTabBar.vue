<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../../stores/useUserStore';

const route = useRoute();
const userStore = useUserStore();

const tabs = computed(() => {
  const list = [
    { path: '/tabs/learn', label: 'Aprender', icon: 'map' },
    { path: '/tabs/leaderboard', label: 'Ligas', icon: 'leaderboard' },
  ];

  if (userStore.hasOrganization) {
    list.push({
      path: '/tabs/organization',
      label: userStore.isSmeAdmin ? 'PYME' : 'Mi Empresa',
      icon: 'domain',
    });
  }

  list.push(
    { path: '/tabs/shop', label: 'Tienda', icon: 'shopping_bag' },
    { path: '/tabs/profile', label: 'Perfil', icon: 'person' }
  );

  return list;
});

function isActive(path: string) {
  return route.path.startsWith(path);
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-1px_10px_rgba(0,0,0,0.04)]"
  >
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-space-xs">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-all rounded-xl"
        :class="
          isActive(tab.path)
            ? 'text-primary font-extrabold scale-105'
            : 'text-on-surface-variant/70 hover:text-on-surface font-semibold'
        "
      >
        <span
          class="material-symbols-outlined text-[24px]"
          :class="{ 'icon-filled': isActive(tab.path) }"
        >
          {{ tab.icon }}
        </span>
        <span class="text-[11px] tracking-tight mt-0.5">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
