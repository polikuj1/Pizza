<script setup lang="ts">
import { computed, ref } from 'vue';
import { catalog } from '../store/catalog';
import { cartState, cartKey, addToCart, adjustQty, toggleCheese } from '../store/cart';
import { cheeseUpcharge } from '../composables/presentation';

const menuCategory = ref('pizza');

const storeClosed = computed(() => catalog.config?.storeOpen === false);
const upcharge = computed(() => cheeseUpcharge());

const menuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === menuCategory.value && item.enabled)
    .map((item) => {
      if (item.hasTemp) {
        return {
          item,
          qty: 0,
          cheese: false,
          showCheese: false,
          iceQty: cartState.cart[cartKey(item.id, 'ice')]?.qty ?? 0,
          hotQty: cartState.cart[cartKey(item.id, 'hot')]?.qty ?? 0,
          displayPrice: item.price,
        };
      }
      const line = cartState.cart[item.id];
      const qty = line?.qty ?? 0;
      const cheese = line?.cheese ?? false;
      const showCheese = item.category === 'pizza';
      return {
        item,
        qty,
        cheese,
        showCheese,
        iceQty: 0,
        hotQty: 0,
        displayPrice: item.price + (cheese && showCheese ? upcharge.value : 0),
      };
    })
);
</script>

<template>
  <main class="mx-auto max-w-[720px] pb-[60px]">
    <div class="relative overflow-hidden bg-[#4fb8e8] px-5 pt-2.5 pb-[30px]">
      <img src="/assets/wordmark-sunburst.png" class="mx-auto block w-full max-w-[380px]" />
      <div class="relative -mt-4 flex justify-center">
        <img src="/assets/mascot-eating.png" class="w-[150px] drop-shadow-[0_6px_0_rgba(26,26,26,.15)]" />
      </div>
      <div class="relative mt-1.5 flex justify-center">
        <div
          class="tab-font rotate-[-2deg] rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-white px-4 py-1.5 text-xs text-[#e8384f] shadow-[3px_3px_0_#1a1a1a]"
        >
          Better Pizza, Better Life.
        </div>
      </div>
      <div class="mt-3.5 text-center text-xs font-bold text-[#1a1a1a]">
        704臺南市北區南園街49巷51號・週二〜週日 12:00–20:00・週一公休
      </div>
    </div>
    <div class="px-5 pt-5">
      <div class="relative h-[180px] overflow-hidden rounded-2xl border-[3px] border-[#1a1a1a] sm:h-[240px]">
        <img src="/assets/hero-pizza.png" class="size-full object-cover" />
      </div>
    </div>

    <div v-if="storeClosed" class="mx-5 mt-4 rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#e8384f] p-3 text-center text-sm font-extrabold text-white">
      本日公休，暫停線上點餐
    </div>

    <div class="px-5 pt-[22px] pb-1.5">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in catalog.categories"
          :key="cat.id"
          @click="menuCategory = cat.id"
          :class="menuCategory === cat.id ? 'bg-[#ffdf3c]' : 'bg-white'"
          class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
        >
          {{ cat.label }}
        </button>
      </div>
      <p class="mt-3.5 text-xs leading-relaxed text-[rgba(26,26,29,.55)]">
        餅皮採用高含水老麵長時間低溫發酵，富含氣體，高溫窯烤後外緣呈現微氣泡、口感輕盈。
      </p>
    </div>

    <div class="flex flex-col gap-3.5 px-5 pt-2.5">
      <div v-for="row in menuDisplay" :key="row.item.id" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 sm:px-[18px]">
        <div class="flex flex-col justify-between gap-3 sm:flex-row">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-[17px] font-black text-[#1a1a1a]">{{ row.item.zh }}</span>
              <span class="text-[11px] text-[rgba(26,26,29,.5)]">{{ row.item.en }}</span>
              <span v-if="row.item.soldOut" class="rounded-full bg-[rgba(26,26,29,.5)] px-2 py-0.5 text-[11px] font-extrabold text-white">已完售</span>
            </div>
            <div class="mt-1 text-[13px] text-[rgba(26,26,29,.65)]">{{ row.item.description }}</div>
            <label v-if="row.showCheese" class="mt-2.5 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-bold text-[rgba(26,26,29,.7)]">
              <input
                type="checkbox"
                :checked="row.cheese"
                @change="toggleCheese(cartState.cart, row.item.id)"
                class="size-[15px] accent-[#e8384f]"
              />
              起司多一點 +{{ upcharge }}元
            </label>
          </div>
          <div v-if="!row.item.hasTemp" class="flex flex-none flex-row items-center justify-between gap-2.5 sm:flex-col sm:items-end">
            <span class="rounded-full border-2 border-[#1a1a1a] bg-[#e8384f] px-3 py-1.5 text-[15px] font-black whitespace-nowrap text-white">
              ${{ row.displayPrice }}
            </span>
            <template v-if="!storeClosed">
              <div v-if="row.qty > 0" class="flex items-center gap-2 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-1.5 py-1">
                <button @click="adjustQty(cartState.cart, row.item.id, -1)" class="size-[26px] cursor-pointer rounded-md border-none bg-white text-base font-black text-[#1a1a1a]">−</button>
                <span class="min-w-4 text-center text-sm font-black">{{ row.qty }}</span>
                <button @click="adjustQty(cartState.cart, row.item.id, 1)" :disabled="row.item.soldOut" class="size-[26px] cursor-pointer rounded-md border-none bg-white text-base font-black text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50">+</button>
              </div>
              <button
                v-else
                @click="addToCart(cartState.cart, row.item.id)"
                :disabled="row.item.soldOut"
                class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2 text-[13px] font-extrabold whitespace-nowrap text-[#1a1a1a] shadow-[2.5px_2.5px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ row.item.soldOut ? '已完售' : '加入購物車' }}
              </button>
            </template>
          </div>
          <div v-else class="flex flex-none flex-col gap-2">
            <div
              v-for="temp in (['ice', 'hot'] as const)"
              :key="temp"
              class="flex items-center justify-between gap-3 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-2.5 py-1.5"
            >
              <span class="text-[13px] font-extrabold whitespace-nowrap">{{ temp === 'ice' ? '冰' : '熱' }} ${{ row.displayPrice }}</span>
              <template v-if="!storeClosed">
                <div v-if="(temp === 'ice' ? row.iceQty : row.hotQty) > 0" class="flex items-center gap-2 rounded-md border-2 border-[#1a1a1a] bg-white px-1.5 py-1">
                  <button @click="adjustQty(cartState.cart, cartKey(row.item.id, temp), -1)" class="size-[26px] cursor-pointer rounded-md border-none bg-white text-base font-black text-[#1a1a1a]">−</button>
                  <span class="min-w-4 text-center text-sm font-black">{{ temp === 'ice' ? row.iceQty : row.hotQty }}</span>
                  <button @click="adjustQty(cartState.cart, cartKey(row.item.id, temp), 1)" :disabled="row.item.soldOut" class="size-[26px] cursor-pointer rounded-md border-none bg-white text-base font-black text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50">+</button>
                </div>
                <button
                  v-else
                  @click="addToCart(cartState.cart, row.item.id, temp)"
                  :disabled="row.item.soldOut"
                  class="cursor-pointer rounded-lg border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3 py-1.5 text-[11px] font-extrabold whitespace-nowrap text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ row.item.soldOut ? '已完售' : '加入購物車' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
