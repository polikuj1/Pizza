import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { vDebounce } from './directives/debounce';
import './style.css';

// 監聽 Vite preload 錯誤（通常發生在部署新版本後，舊的 chunk 已不存在）
window.addEventListener('vite:preloadError', (event) => {
  console.warn('偵測到 Vite preload 錯誤，即將重新載入頁面...', event);
  // 只reload一次
  const lastReload = sessionStorage.getItem('lastPreloadErrorReload');
  const now = Date.now();
  if (!lastReload) {
    sessionStorage.setItem('lastPreloadErrorReload', String(now));
    window.location.reload();
  }
});

createApp(App).use(router).directive('debounce', vDebounce).mount('#app');
