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
  <main v-if="order" style="max-width:520px;margin:0 auto;padding:30px 20px 60px;">
    <div style="text-align:center;margin-bottom:26px;">
      <div style="font-size:13px;color:rgba(26,26,29,.55);font-weight:700;">訂單編號</div>
      <div class="brand-text" style="font-size:30px;">#{{ order.id }}</div>
    </div>

    <div style="display:flex;justify-content:space-between;position:relative;margin-bottom:34px;padding:0 6px;">
      <div style="position:absolute;top:14px;left:24px;right:24px;height:3px;background:rgba(26,26,29,.15);z-index:0;"></div>
      <div :style="`position:absolute;top:14px;left:24px;height:3px;background:#e8384f;z-index:1;width:${progressWidth};transition:width .3s;`"></div>
      <div v-for="step in steps" :key="step.label" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;">
        <div :style="`width:28px;height:28px;border-radius:50%;background:${step.dotColor};border:2px solid #1a1a1a;color:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;`">{{ step.mark }}</div>
        <span :style="`font-size:11px;font-weight:800;color:${step.labelColor};text-align:center;`">{{ step.label }}</span>
      </div>
    </div>

    <div style="background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:16px 18px;margin-bottom:16px;">
      <div v-for="line in order.items" :key="line.id" style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;">
        <span>{{ line.zh }} × {{ line.qty }}<span style="color:rgba(26,26,29,.5);">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
        <span style="font-weight:800;">${{ line.lineTotal }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;color:#e8384f;border-top:2px dashed rgba(26,26,29,.2);margin-top:8px;padding-top:10px;">
        <span>總計・{{ paymentLabel(order) }}</span><span>${{ order.total }}</span>
      </div>
    </div>

    <div style="background:#4fb8e8;border:2.5px solid #1a1a1a;border-radius:16px;padding:14px 18px;font-size:13px;color:#1a1a1a;font-weight:700;line-height:1.7;margin-bottom:24px;">
      取餐人：{{ order.customerName }}（{{ order.customerPhone }}）<br />
      預估等候時間：約 {{ catalog.config?.pickupEstimateMinutes ?? 20 }} 分鐘<br />
      取餐地址：704臺南市北區南園街49巷51號
    </div>

    <button @click="router.push('/')" style="width:100%;border:2.5px solid #1a1a1a;background:#fff;color:#1a1a1a;padding:13px;border-radius:14px;font-size:14px;font-weight:900;cursor:pointer;">返回菜單</button>
  </main>
</template>
