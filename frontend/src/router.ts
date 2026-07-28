import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'menu', component: () => import('./views/MenuView.vue'), meta: { customerFacing: true } },
    { path: '/checkout', name: 'checkout', component: () => import('./views/CheckoutView.vue'), meta: { customerFacing: true } },
    { path: '/order/:id', name: 'tracking', component: () => import('./views/TrackingView.vue'), meta: { customerFacing: true } },
    { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue'), meta: { staff: true } },
    { path: '/pos', name: 'pos', component: () => import('./views/PosView.vue'), meta: { staff: true } },
    { path: '/tables', name: 'tables', component: () => import('./views/TablesView.vue'), meta: { staff: true } },
    { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue'), meta: { staff: true } },
  ],
});
