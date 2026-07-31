<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartState, cartCount } from '../store/cart';
import { catalog } from '../store/catalog';
import { hasPermission, logout, STAFF_NAV } from '../store/auth';

const route = useRoute();
const router = useRouter();

const isStaffView = computed(() => !!route.meta.staff);
const isCustomerFacing = computed(() => !!route.meta.customerFacing);
// 結帳頁本身就是購物車的下一步，不需要再顯示購物車按鈕；公休/暫停點餐時購物車也不顯示
const showCart = computed(() => isCustomerFacing.value && route.name !== 'checkout' && catalog.config?.storeOpen !== false);
const count = computed(() => cartCount(cartState.cart));

const tabs = computed(() => STAFF_NAV.filter((tab) => hasPermission(tab.permission)));

const mobileMenuOpen = ref(false);

function go(to: string) {
  mobileMenuOpen.value = false;
  router.push(to);
}

function openCart() {
  mobileMenuOpen.value = false;
  cartState.cartOpen = true;
}

async function handleLogout() {
  mobileMenuOpen.value = false;
  await logout();
  router.push('/login');
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b-[3px] border-[#1a1a1a] bg-white">
    <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <div class="flex cursor-pointer items-center gap-2.5" @click="go('/')">
        <div
          class="flex size-14 flex-none items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1a1a1a] bg-[#4fb8e8] sm:size-[72px]"
        >
          <img src="/assets/mascot-slice.png" class="size-[86%] object-contain" />
        </div>
        <div>
          <div class="brand-text text-xl leading-[1.1] sm:text-[26px]">披薩救星</div>
          <div class="text-[11px] font-bold tracking-[.5px] text-[rgba(26,26,26,.5)]">PI-PI-PIZZA...</div>
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-2.5 sm:flex">
        <template v-if="isStaffView">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.to"
              @click="go(tab.to)"
              :class="[route.path === tab.to ? 'bg-[#ffdf3c]' : 'bg-white']"
              class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] px-3.5 py-2 text-xs font-extrabold text-[#1a1a1a]"
            >
              {{ tab.label }}
            </button>
          </div>
          <button
            @click="go('/')"
            class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white px-3.5 py-2 text-xs font-extrabold text-[#1a1a1a]"
          >
            回顧客端
          </button>
          <button
            @click="handleLogout"
            class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white px-3.5 py-2 text-xs font-extrabold text-[#e8384f]"
          >
            登出
          </button>
        </template>
        <button
          v-if="showCart"
          @click="openCart"
          class="relative cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2.5 text-sm font-extrabold text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]"
        >
          🛒 購物車
          <span
            v-if="count > 0"
            class="absolute -top-2.5 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#e8384f] px-[5px] text-[11px] font-extrabold text-white"
          >
            {{ count }}
          </span>
        </button>
      </div>

      <button
        v-if="isStaffView || showCart"
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="flex size-11 flex-none cursor-pointer items-center justify-center rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white text-xl sm:hidden"
        aria-label="選單"
      >
        <span v-if="mobileMenuOpen">×</span>
        <span v-else>☰</span>
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="sm:hidden">
      <div @click="mobileMenuOpen = false" class="fixed inset-0 z-30 animate-[fadeIn_.2s_ease] bg-[rgba(26,26,26,.45)]"></div>
      <div
        class="fixed top-0 right-0 bottom-0 z-[31] flex w-full max-w-[320px] animate-[slideIn_.25s_ease] flex-col border-l-[3px] border-[#1a1a1a] bg-white"
      >
        <div class="flex items-center justify-between border-b-[3px] border-[#1a1a1a] px-5 py-[18px]">
          <span class="brand-text text-lg">選單</span>
          <button @click="mobileMenuOpen = false" class="cursor-pointer border-none bg-none text-[22px] text-[#1a1a1a]">×</button>
        </div>
        <div class="flex flex-col gap-2 overflow-y-auto p-4">
          <template v-if="isStaffView">
            <button
              v-for="tab in tabs"
              :key="tab.to"
              @click="go(tab.to)"
              :class="[route.path === tab.to ? 'bg-[#ffdf3c]' : 'bg-white']"
              class="w-full cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] px-4 py-3 text-left text-sm font-extrabold text-[#1a1a1a]"
            >
              {{ tab.label }}
            </button>
            <button
              @click="go('/')"
              class="w-full cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white px-4 py-3 text-left text-sm font-extrabold text-[#1a1a1a]"
            >
              回顧客端
            </button>
            <button
              @click="handleLogout"
              class="w-full cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white px-4 py-3 text-left text-sm font-extrabold text-[#e8384f]"
            >
              登出
            </button>
          </template>
          <button
            v-if="showCart"
            @click="openCart"
            class="relative w-full cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-3 text-left text-sm font-extrabold text-[#1a1a1a]"
          >
            🛒 購物車
            <span v-if="count > 0">（{{ count }}）</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
