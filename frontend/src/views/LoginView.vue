<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../store/auth';

const route = useRoute();
const router = useRouter();
const form = reactive({ username: '', password: '', error: '' });

async function submit() {
  try {
    await login(form.username, form.password);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin';
    router.push(redirect);
  } catch (err) {
    form.error = err instanceof Error ? err.message : '登入失敗';
  }
}
</script>

<template>
  <main class="mx-auto max-w-[360px] px-5 pt-16 pb-10 sm:mt-20 sm:pb-0">
    <div class="brand-text mb-5 text-center text-xl sm:text-[22px]">員工登入</div>
    <form @submit.prevent="submit" class="flex flex-col gap-3.5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-5">
      <label class="text-[13px] font-extrabold">
        帳號
        <input
          v-model="form.username"
          type="text"
          autocomplete="username"
          class="mt-1.5 block w-full rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2.5 text-sm"
        />
      </label>
      <label class="text-[13px] font-extrabold">
        密碼
        <input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          class="mt-1.5 block w-full rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2.5 text-sm"
        />
      </label>
      <div v-if="form.error" class="text-[13px] font-extrabold text-[#e8384f]">{{ form.error }}</div>
      <button
        type="submit"
        class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-[15px] font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]"
      >
        登入
      </button>
    </form>
  </main>
</template>
