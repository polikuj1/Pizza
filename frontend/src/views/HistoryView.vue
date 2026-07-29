<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { handleLoadError } from '../composables/authGuard';
import { channelLabel, itemsSummary, orderTypeColor, orderTypeLabel, paymentLabel, pickupLabel, timeLabel } from '../composables/presentation';
import type { Order } from '../types';

const router = useRouter();
const orders = ref<Order[]>([]);
const page = ref(1);
const totalPages = ref(1);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  try {
    const res = await api.getOrderHistory(page.value);
    orders.value = res.orders;
    totalPages.value = res.totalPages;
  } catch (err) {
    handleLoadError(err, router);
  }
}

function goToPage(target: number) {
  page.value = Math.min(Math.max(1, target), totalPages.value);
  load();
}

onMounted(async () => {
  await load();
  timer = setInterval(load, 10000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <main class="mx-auto max-w-[820px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">今日歷史訂單</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">已完成／已結案訂單紀錄</div>

    <div v-if="orders.length === 0" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]">今天還沒有已完成的訂單</div>

    <div class="flex flex-col gap-3.5">
      <div v-for="o in orders" :key="o.id" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="mb-2.5 flex flex-wrap justify-between gap-2.5">
          <div>
            <span class="text-base font-black">#{{ o.id }}</span>
            <span class="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white" :style="{ background: orderTypeColor(o) }">{{ orderTypeLabel(o) }}</span>
            <span v-if="channelLabel(o)" class="ml-1 rounded-full border-2 border-[#1a1a1a] px-2 py-0.5 text-[11px] font-extrabold text-[#1a1a1a]">{{ channelLabel(o) }}</span>
          </div>
          <span class="text-xs font-extrabold text-[#3fae66]">已完成</span>
        </div>
        <div class="mb-2 text-[13px] text-[rgba(26,26,29,.8)]">
          {{ o.customerName }}・{{ paymentLabel(o) }}
          <span v-if="pickupLabel(o)" class="font-extrabold text-[#e8384f]">・取餐 {{ pickupLabel(o) }}</span>
        </div>
        <div class="mb-2.5 text-[13px] leading-relaxed text-[rgba(26,26,29,.7)]">{{ itemsSummary(o) }}</div>
        <div class="flex flex-col items-start justify-between gap-1 border-t border-dashed border-[rgba(26,26,29,.15)] pt-2.5 text-xs font-bold text-[rgba(26,26,29,.55)] sm:flex-row sm:items-center sm:gap-0">
          <span>下單 {{ timeLabel(o.createdAt) }}・出餐 {{ timeLabel(o.servedAt) }}・完成 {{ timeLabel(o.completedAt) }}</span>
          <span class="text-[15px] font-black text-[#e8384f]">${{ o.total }}</span>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-5 flex items-center justify-center gap-3">
      <button
        @click="goToPage(page - 1)"
        :disabled="page <= 1"
        class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3.5 py-2 text-xs font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹ 上一頁
      </button>
      <span class="text-xs font-extrabold text-[rgba(26,26,29,.6)]">第 {{ page }} / {{ totalPages }} 頁</span>
      <button
        @click="goToPage(page + 1)"
        :disabled="page >= totalPages"
        class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3.5 py-2 text-xs font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        下一頁 ›
      </button>
    </div>
  </main>
</template>
