<script setup lang="ts">
import { computed, ref } from 'vue';
import { catalog } from '../store/catalog';
import { addToCart, adjustQty, cartKey, toggleCheese } from '../store/cart';
import { cheeseUpcharge } from '../composables/presentation';
import type { Cart } from '../types';

const cart = defineModel<Cart>({ required: true });

const category = ref('pizza');
const upcharge = computed(() => cheeseUpcharge());

const menuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === category.value && item.enabled)
    .map((item) => {
      if (item.hasTemp) {
        return {
          item,
          qty: 0,
          cheese: false,
          showCheese: false,
          iceQty: cart.value[cartKey(item.id, 'ice')]?.qty ?? 0,
          hotQty: cart.value[cartKey(item.id, 'hot')]?.qty ?? 0,
          displayPrice: item.price,
        };
      }
      const line = cart.value[item.id];
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
  <div class="flex flex-col gap-3">
    <!-- 分類切換 -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="cat in catalog.categories"
        :key="cat.id"
        @click="category = cat.id"
        :class="category === cat.id ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- 品項列表 -->
    <div
      v-for="row in menuDisplay"
      :key="row.item.id"
      class="flex flex-col items-stretch justify-between gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3.5 px-4 sm:flex-row sm:items-center"
    >
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-2">
          <span class="text-base font-black">{{ row.item.zh }}</span>
          <span
            v-if="row.item.soldOut"
            class="rounded-full bg-[rgba(26,26,29,.5)] px-2 py-0.5 text-[11px] font-extrabold text-white"
            >已完售</span
          >
        </div>
        <div class="mt-0.5 text-xs text-[rgba(26,26,29,.6)]">
          {{ row.item.description }}
        </div>
        <label
          v-if="row.showCheese"
          class="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-bold text-[rgba(26,26,29,.7)]"
        >
          <input
            type="checkbox"
            :checked="row.cheese"
            @change="toggleCheese(cart, row.item.id)"
            class="size-[15px] accent-[#e8384f]"
          />
          加起司 +{{ upcharge }}
        </label>
      </div>

      <!-- 無溫度選項的品項 -->
      <div
        v-if="!row.item.hasTemp"
        class="flex flex-none items-center justify-between gap-2 sm:flex-col sm:items-end"
      >
        <div class="text-[15px] font-black text-[#e8384f] sm:mb-2">
          ${{ row.displayPrice }}
        </div>
        <div
          v-if="row.qty > 0"
          class="flex items-center gap-2 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-1.5 py-1"
        >
          <button
            @click="adjustQty(cart, row.item.id, -1)"
            class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black"
          >
            −
          </button>
          <span class="min-w-4 text-center text-[15px] font-black">{{
            row.qty
          }}</span>
          <button
            @click="adjustQty(cart, row.item.id, 1)"
            :disabled="row.item.soldOut"
            class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>
        <button
          v-else
          @click="addToCart(cart, row.item.id)"
          :disabled="row.item.soldOut"
          class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2 text-[13px] font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ row.item.soldOut ? '已完售' : '加點' }}
        </button>
      </div>

      <!-- 有溫度選項的品項（冰/熱） -->
      <div v-else class="flex flex-none flex-col gap-2">
        <div
          v-for="temp in ['ice', 'hot'] as const"
          :key="temp"
          class="flex items-center justify-between gap-3 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-2.5 py-1.5"
        >
          <span class="whitespace-nowrap text-[13px] font-extrabold"
            >{{ temp === 'ice' ? '冰' : '熱' }} ${{ row.displayPrice }}</span
          >
          <div
            v-if="(temp === 'ice' ? row.iceQty : row.hotQty) > 0"
            class="flex items-center gap-2 rounded-md border-2 border-[#1a1a1a] bg-white px-1.5 py-1"
          >
            <button
              @click="adjustQty(cart, cartKey(row.item.id, temp), -1)"
              class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black"
            >
              −
            </button>
            <span class="min-w-4 text-center text-[15px] font-black">{{
              temp === 'ice' ? row.iceQty : row.hotQty
            }}</span>
            <button
              @click="adjustQty(cart, cartKey(row.item.id, temp), 1)"
              :disabled="row.item.soldOut"
              class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              +
            </button>
          </div>
          <button
            v-else
            @click="addToCart(cart, row.item.id, temp)"
            :disabled="row.item.soldOut"
            class="cursor-pointer whitespace-nowrap rounded-lg border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3 py-1.5 text-[11px] font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ row.item.soldOut ? '已完售' : '加點' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
