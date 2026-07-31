import { createRouter, createWebHistory } from 'vue-router';
import { authState, ensureAuthChecked, hasPermission } from './store/auth';
import { catalog, loadCatalog } from './store/catalog';
import type { Permission } from './types';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'menu', component: () => import('./views/MenuView.vue'), meta: { customerFacing: true } },
    { path: '/checkout', name: 'checkout', component: () => import('./views/CheckoutView.vue'), meta: { customerFacing: true } },
    { path: '/order/:id', name: 'tracking', component: () => import('./views/TrackingView.vue'), meta: { customerFacing: true } },
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue'), meta: { staff: 'admin' } },
    { path: '/pos', name: 'pos', component: () => import('./views/PosView.vue'), meta: { staff: 'pos' } },
    { path: '/tables', name: 'tables', component: () => import('./views/TablesView.vue'), meta: { staff: 'tables' } },
    { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue'), meta: { staff: 'history' } },
    { path: '/menu-admin', name: 'menuAdmin', component: () => import('./views/MenuAdminView.vue'), meta: { staff: 'menu' } },
    { path: '/users', name: 'users', component: () => import('./views/UsersView.vue'), meta: { staff: 'users' } },
    { path: '/stats', name: 'stats', component: () => import('./views/StatsView.vue'), meta: { staff: 'stats' } },
  ],
});

router.beforeEach(async (to) => {
  if (to.name === 'checkout') {
    await loadCatalog();
    if (catalog.config?.storeOpen === false) return { path: '/' };
  }
  if (!to.meta.staff) return true;
  await ensureAuthChecked();
  if (!authState.authenticated) return { path: '/login', query: { redirect: to.fullPath } };
  if (!hasPermission(to.meta.staff as Permission)) return { path: '/admin' };
  return true;
});
