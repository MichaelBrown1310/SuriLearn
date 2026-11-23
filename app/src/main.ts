import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initTheme } from './composables/useTheme';

// Global Styles, Theme Variables & 2.5D Tactile Tokens
import './style.css';

// Initialize Dark Sentinel / Light Mode immediately
initTheme();

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = (err, _instance, info) => {
  console.error('[SuriLearn Global Error]', info, err);
};

app.use(pinia);
app.use(router);

router.isReady().then(() => {
  app.mount('#app');
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA ServiceWorker] Registration failed:', err);
    });
  });
}
