<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { catalog } from '../store/catalog';
import { statusSteps, paymentLabel } from '../composables/presentation';
import type { Order } from '../types';

const route = useRoute();
const router = useRouter();
const order = ref<Order | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  order.value = await api.getOrder(Number(route.params.id));
}

onMounted(async () => {
  await load();
  timer = setInterval(async () => {
    if (order.value && order.value.status < 3) await load();
  }, 5000);
});
onUnmounted(() => clearInterval(timer));

const steps = computed(() => statusSteps(order.value?.status ?? 0));
const progressWidth = computed(() => `${((order.value?.status ?? 0) / 3) * 100}%`);
</script>

<template>
  <main v-if="order" class="mx-auto max-w-[520px] px-5 pt-[30px] pb-[60px]">
    <div class="mb-[26px] text-center">
      <div class="text-[13px] font-bold text-[rgba(26,26,29,.55)]">訂單編號</div>
      <div class="brand-text text-[30px]">#{{ order.id }}</div>
    </div>

    <div class="relative mb-[34px] flex justify-between px-1.5">
      <div class="absolute top-3.5 right-6 left-6 z-0 h-[3px] bg-[rgba(26,26,29,.15)]"></div>
      <div class="absolute top-3.5 left-6 z-10 h-[3px] bg-[#e8384f] transition-[width] duration-300" :style="{ width: progressWidth }"></div>
      <div v-for="step in steps" :key="step.label" class="relative z-20 flex flex-1 flex-col items-center gap-2">
        <div class="flex size-7 items-center justify-center rounded-full border-2 border-[#1a1a1a] text-[13px] font-black text-[#1a1a1a]" :style="{ background: step.dotColor }">{{ step.mark }}</div>
        <span class="text-center text-[11px] font-extrabold" :style="{ color: step.labelColor }">{{ step.label }}</span>
      </div>
    </div>

    <div class="mb-4 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 sm:px-[18px]">
      <div v-for="line in order.items" :key="line.id" class="flex justify-between py-1.5 text-[13px]">
        <span>{{ line.zh }} × {{ line.qty }}<span class="text-[rgba(26,26,29,.5)]">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
        <span class="font-extrabold">${{ line.lineTotal }}</span>
      </div>
      <div class="mt-2 flex justify-between border-t-2 border-dashed border-[rgba(26,26,29,.2)] pt-2.5 text-[15px] font-black text-[#e8384f]">
        <span>總計・{{ paymentLabel(order) }}</span><span>${{ order.total }}</span>
      </div>
    </div>

    <div class="mb-6 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#4fb8e8] p-3.5 text-[13px] leading-relaxed font-bold text-[#1a1a1a] sm:px-[18px]">
      取餐人：{{ order.customerName }}（{{ order.customerPhone }}）<br />
      預估等候時間：約 {{ catalog.config?.pickupEstimateMinutes ?? 20 }} 分鐘<br />
      取餐地址：704臺南市北區南園街49巷51號
    </div>

    <button @click="router.push('/')" class="w-full cursor-pointer rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3.5 text-sm font-black text-[#1a1a1a]">返回菜單</button>
  </main>
</template>
