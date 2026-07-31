<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { cartState, adjustQty, removeFromCart } from '../store/cart';
import { cartLines, cartTotal } from '../composables/presentation';

const router = useRouter();
const lines = computed(() => cartLines(cartState.cart));
const total = computed(() => cartTotal(cartState.cart));

function checkout() {
  cartState.cartOpen = false;
  router.push('/checkout');
}
</script>

<template>
  <div v-if="cartState.cartOpen">
    <div
      @click="cartState.cartOpen = false"
      class="fixed inset-0 z-30 animate-[fadeIn_.2s_ease] bg-[rgba(26,26,26,.45)]"
    ></div>
    <div
      class="fixed top-0 right-0 bottom-0 z-[31] flex w-full max-w-[400px] animate-[slideIn_.25s_ease] flex-col border-l-[3px] border-[#1a1a1a] bg-white"
    >
      <div class="flex items-center justify-between border-b-[3px] border-[#1a1a1a] px-5 py-[18px]">
        <span class="brand-text text-lg">購物車</span>
        <button @click="cartState.cartOpen = false" class="cursor-pointer border-none bg-none text-[22px] text-[#1a1a1a]">×</button>
      </div>
      <div class="flex-1 overflow-y-auto px-5 py-3">
        <div v-if="lines.length === 0" class="py-[30px] text-center">
          <img src="/assets/mascot-eating.png" class="mx-auto mb-1.5 w-[110px]" />
          <div class="text-sm font-bold text-[rgba(26,26,29,.5)]">購物車是空的</div>
        </div>
        <div
          v-for="line in lines"
          :key="line.id"
          class="flex flex-col gap-2 border-b-2 border-dashed border-[rgba(26,26,29,.15)] py-3.5"
        >
          <div class="flex items-start justify-between gap-2.5">
            <div>
              <div class="text-sm font-extrabold">{{ line.zh }}</div>
              <div class="mt-0.5 text-xs text-[rgba(26,26,29,.55)]">{{ line.cheeseLabel }}{{ line.tempSuffix }}</div>
            </div>
            <button
              @click="removeFromCart(cartState.cart, line.id)"
              aria-label="移除此品項"
              class="flex size-9 flex-none cursor-pointer items-center justify-center rounded-lg border-2 border-[#1a1a1a] bg-white text-lg text-[#e8384f] hover:bg-[#fde8ea]"
            >
              🗑️
            </button>
          </div>
          <div class="flex items-center justify-between">
            <div
              class="flex w-fit items-center gap-2 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-[5px] py-[3px]"
            >
              <button
                @click="adjustQty(cartState.cart, line.id, -1)"
                class="size-[22px] cursor-pointer rounded-[5px] border-none bg-white text-sm"
              >
                −
              </button>
              <span class="min-w-3.5 text-center text-[13px] font-extrabold">{{ line.qty }}</span>
              <button
                @click="adjustQty(cartState.cart, line.id, 1)"
                class="size-[22px] cursor-pointer rounded-[5px] border-none bg-white text-sm"
              >
                +
              </button>
            </div>
            <div class="text-sm font-black whitespace-nowrap text-[#e8384f]">${{ line.lineTotal }}</div>
          </div>
        </div>
      </div>
      <div class="border-t-[3px] border-[#1a1a1a] px-5 py-[18px]">
        <div class="mb-3.5 flex justify-between text-base font-black">
          <span>小計</span><span class="text-[#e8384f]">${{ total }}</span>
        </div>
        <button
          @click="checkout"
          :disabled="lines.length === 0"
          class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-[15px] font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          前往結帳
        </button>
      </div>
    </div>
  </div>
</template>
