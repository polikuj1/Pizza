import type { Router } from 'vue-router';
import { ApiError } from '../api';
import { authState } from '../store/auth';

// session expired mid-poll: bounce back to /login instead of leaving a broken staff view up
export function handleLoadError(err: unknown, router: Router) {
  if (err instanceof ApiError && err.status === 401) {
    authState.authenticated = false;
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }
  console.error(err);
}
