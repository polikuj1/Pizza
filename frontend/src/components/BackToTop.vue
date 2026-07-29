<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { cartState, cartCount } from '../store/cart';

const SHOW_AFTER_PX = 400;
const visible = ref(false);

const route = useRoute();
const isCustomerFacing = computed(() => !!route.meta.customerFacing);
// 結帳頁本身就是購物車的下一步，不需要再顯示購物車按鈕
const showCart = computed(() => isCustomerFacing.value && route.name !== 'checkout');
const count = computed(() => cartCount(cartState.cart));

function onScroll() {
  visible.value = window.scrollY > SHOW_AFTER_PX;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCart() {
  cartState.cartOpen = true;
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <button
    v-if="count > 0 && showCart"
    @click="openCart"
    aria-label="購物車"
    class="fixed right-5 bottom-5 z-20 flex size-16 cursor-pointer items-center justify-center rounded-full border-[3px] border-[#1a1a1a] bg-[#ffdf3c] text-2xl shadow-[3px_3px_0_#1a1a1a] hover:brightness-95 sm:hidden"
  >
    🛒
    <span
      v-if="count > 0"
      class="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#e8384f] px-1 text-xs font-extrabold text-white"
    >
      {{ count }}
    </span>
  </button>

  <button
    v-if="visible"
    @click="scrollToTop"
    aria-label="回到頂端"
    class="back-to-top fixed right-5 bottom-5 z-20 hidden size-16 cursor-pointer drop-shadow-[3px_3px_0_#1a1a1a] hover:brightness-95 sm:block"
  >
    <svg viewBox="0 0 100 100" class="size-full">
      <path d="M50 6 L16 78 Q50 94 84 78 Z" fill="#ffdf3c" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" />
      <path d="M22 71 Q50 86 78 71" fill="none" stroke="#e8b923" stroke-width="6" stroke-linecap="round" />
      <circle cx="41" cy="34" r="6" fill="#e8384f" stroke="#1a1a1a" stroke-width="2.5" />
      <circle cx="60" cy="45" r="6" fill="#e8384f" stroke="#1a1a1a" stroke-width="2.5" />
      <circle cx="46" cy="58" r="5.5" fill="#e8384f" stroke="#1a1a1a" stroke-width="2.5" />
    </svg>
  </button>
</template>

<style scoped>
.back-to-top {
  animation: back-to-top-bounce 1.6s ease-in-out infinite;
}

@keyframes back-to-top-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
