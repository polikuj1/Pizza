import { reactive } from 'vue';
import { api } from '../api';
import type { Permission } from '../types';

export const authState = reactive({
  authenticated: false,
  checked: false,
  permissions: [] as Permission[],
});

export const STAFF_NAV: { to: string; label: string; permission: Permission }[] = [
  { to: '/admin', label: '訂單佇列', permission: 'admin' },
  { to: '/pos', label: '現場點餐 POS', permission: 'pos' },
  { to: '/tables', label: '桌況', permission: 'tables' },
  { to: '/history', label: '歷史訂單', permission: 'history' },
  { to: '/menu-admin', label: '菜單管理', permission: 'menu' },
  { to: '/users', label: '帳號管理', permission: 'users' },
  { to: '/stats', label: '統計分析', permission: 'stats' },
];

let checkPromise: Promise<void> | null = null;

// ponytail: cached for the tab's lifetime; a mid-session expiry just surfaces as a
// 401 on the next staff action, which redirects to /login anyway (see views' load())
export function ensureAuthChecked(): Promise<void> {
  if (!checkPromise) {
    checkPromise = (async () => {
      try {
        const res = await api.getMe();
        authState.authenticated = res.authenticated;
        authState.permissions = res.permissions;
      } finally {
        authState.checked = true;
      }
    })();
  }
  return checkPromise;
}

export function hasPermission(permission: Permission): boolean {
  return authState.permissions.includes(permission);
}

export async function login(username: string, password: string): Promise<void> {
  const res = await api.login(username, password);
  authState.authenticated = true;
  authState.permissions = res.permissions;
  authState.checked = true;
  checkPromise = Promise.resolve();
}

export async function logout(): Promise<void> {
  await api.logout();
  authState.authenticated = false;
  authState.permissions = [];
  checkPromise = Promise.resolve();
}
