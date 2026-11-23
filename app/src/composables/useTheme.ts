import { ref, watch, onMounted } from 'vue';

const THEME_STORAGE_KEY = 'surilearn_theme_mode';

// Reactive state shared across all components
const isDark = ref<boolean>(false);

function applyTheme(dark: boolean) {
  isDark.value = dark;
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved) {
    applyTheme(saved === 'dark');
  } else {
    // Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
}

export function useTheme() {
  function toggleDark() {
    applyTheme(!isDark.value);
  }

  function setDark(val: boolean) {
    applyTheme(val);
  }

  return {
    isDark,
    toggleDark,
    setDark,
  };
}
