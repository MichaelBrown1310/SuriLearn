<script setup lang="ts">
import BottomTabBar from '../components/common/BottomTabBar.vue';
import SidebarNav from '../components/navigation/SidebarNav.vue';
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-row w-full">
    <!-- Desktop Left Sidebar (>= 992px) -->
    <SidebarNav class="hidden lg:flex" />

    <!-- Main Content Stage: Expands across full remaining width with full-width header support -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen relative w-full">
      <div class="flex-1 w-full pb-20 lg:pb-8">
        <router-view />
      </div>

      <!-- Mobile Bottom Tab Bar (< 992px) -->
      <BottomTabBar class="lg:hidden" />
    </div>
  </div>
</template>
