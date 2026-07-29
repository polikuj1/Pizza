<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { handleLoadError } from '../composables/authGuard';
import { catalog } from '../store/catalog';
import type { Permission, StaffUser } from '../types';

const PERMISSION_LABELS: Record<Permission, string> = {
  admin: '訂單佇列',
  pos: '現場點餐 POS',
  tables: '桌況',
  history: '歷史訂單',
  menu: '菜單管理',
  users: '帳號管理',
  stats: '統計分析',
};
const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

const router = useRouter();
const users = ref<StaffUser[]>([]);
const newUser = reactive({ username: '', password: '', permissions: [] as Permission[], error: '' });

async function load() {
  try {
    users.value = await api.getUsers();
  } catch (err) {
    handleLoadError(err, router);
  }
}

async function toggleStoreOpen() {
  try {
    catalog.config = await api.updateConfig({ storeOpen: !catalog.config?.storeOpen });
  } catch (err) {
    handleLoadError(err, router);
  }
}

onMounted(async () => {
  try {
    catalog.config = await api.getConfig();
  } catch (err) {
    handleLoadError(err, router);
  }
  await load();
});

async function createUser() {
  newUser.error = '';
  if (!newUser.username.trim() || !newUser.password) {
    newUser.error = '請填寫帳號與密碼';
    return;
  }
  try {
    await api.createUser({ username: newUser.username.trim(), password: newUser.password, permissions: newUser.permissions });
    newUser.username = '';
    newUser.password = '';
    newUser.permissions = [];
    await load();
  } catch (err) {
    newUser.error = err instanceof Error ? err.message : '新增失敗';
  }
}

async function togglePermission(user: StaffUser, permission: Permission) {
  const permissions = user.permissions.includes(permission)
    ? user.permissions.filter((p) => p !== permission)
    : [...user.permissions, permission];
  try {
    await api.updateUser(user.id, { permissions });
    await load();
  } catch (err) {
    handleLoadError(err, router);
  }
}

async function resetPassword(user: StaffUser) {
  const password = prompt(`設定「${user.username}」的新密碼`);
  if (!password) return;
  try {
    await api.updateUser(user.id, { password });
  } catch (err) {
    handleLoadError(err, router);
  }
}

async function deleteUser(user: StaffUser) {
  if (!confirm(`確定刪除帳號「${user.username}」？`)) return;
  try {
    await api.deleteUser(user.id);
    await load();
  } catch (err) {
    handleLoadError(err, router);
  }
}
</script>

<template>
  <main class="mx-auto max-w-[720px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">帳號管理</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">員工帳號與各頁面權限</div>

    <div class="mb-5 flex items-center justify-between gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
      <div>
        <div class="text-sm font-black">顧客線上點餐</div>
        <div class="text-xs font-bold text-[rgba(26,26,29,.55)]">關閉後，顧客端不會顯示加入購物車與購物車按鈕，也無法進入結帳頁</div>
      </div>
      <button
        @click="toggleStoreOpen"
        :class="catalog.config?.storeOpen ? 'bg-[#3fae66]' : 'bg-[rgba(26,26,29,.25)]'"
        class="relative h-8 w-14 flex-none cursor-pointer rounded-full border-2 border-[#1a1a1a] transition-colors"
        :aria-pressed="!!catalog.config?.storeOpen"
        aria-label="切換顧客線上點餐"
      >
        <span
          class="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform"
          :class="catalog.config?.storeOpen ? 'translate-x-6' : 'translate-x-0'"
        ></span>
      </button>
    </div>

    <form @submit.prevent="createUser" class="mb-5 flex flex-col gap-3.5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
      <div class="text-[13px] font-extrabold">新增帳號</div>
      <div class="flex flex-col gap-2.5 sm:flex-row">
        <input v-model="newUser.username" type="text" autocomplete="username" placeholder="帳號" class="flex-1 rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2.5 text-sm" />
        <input v-model="newUser.password" type="password" autocomplete="new-password" placeholder="密碼" class="flex-1 rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2.5 text-sm" />
      </div>
      <div class="flex flex-wrap gap-3 text-[13px] font-bold">
        <label v-for="p in ALL_PERMISSIONS" :key="p" class="flex items-center gap-1.5">
          <input type="checkbox" :value="p" v-model="newUser.permissions" />
          {{ PERMISSION_LABELS[p] }}
        </label>
      </div>
      <div v-if="newUser.error" class="text-[13px] font-extrabold text-[#e8384f]">{{ newUser.error }}</div>
      <button type="submit" class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-2.5 text-sm font-black text-[#1a1a1a]">新增</button>
    </form>

    <div class="flex flex-col gap-3.5">
      <div v-for="u in users" :key="u.id" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="mb-2.5 flex items-center justify-between">
          <span class="text-base font-black">{{ u.username }}</span>
          <div class="flex gap-2">
            <button @click="resetPassword(u)" class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-2.5 py-1.5 text-xs font-extrabold">改密碼</button>
            <button @click="deleteUser(u)" class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#e8384f]">刪除</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 text-[13px] font-bold">
          <label v-for="p in ALL_PERMISSIONS" :key="p" class="flex items-center gap-1.5">
            <input type="checkbox" :checked="u.permissions.includes(p)" @change="togglePermission(u, p)" />
            {{ PERMISSION_LABELS[p] }}
          </label>
        </div>
      </div>
    </div>
  </main>
</template>
