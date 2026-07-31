import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { vDebounce } from './directives/debounce';
import './style.css';

createApp(App).use(router).directive('debounce', vDebounce).mount('#app');
