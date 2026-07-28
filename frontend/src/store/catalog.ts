import { reactive } from 'vue';
import { api } from '../api';
import type { AppConfig, Category, MenuItem } from '../types';

export const catalog = reactive({
  items: [] as MenuItem[],
  categories: [] as Category[],
  config: null as AppConfig | null,
  loaded: false,
});

let loadPromise: Promise<void> | null = null;

export function loadCatalog(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([api.getMenu(), api.getConfig()]).then(([menu, config]) => {
      catalog.items = menu.items;
      catalog.categories = menu.categories;
      catalog.config = config;
      catalog.loaded = true;
    });
  }
  return loadPromise;
}

export function menuItemById(id: string): MenuItem | undefined {
  return catalog.items.find((item) => item.id === id);
}
