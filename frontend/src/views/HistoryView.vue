<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { itemsSummary, orderTypeColor, orderTypeLabel, paymentLabel, timeLabel } from '../composables/presentation';
import type { Order } from '../types';

const orders = ref<Order[]>([]);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  orders.value = await api.getOrders('history');
}

onMounted(async () => {
  await load();
  timer = setInterval(load, 10000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <main style="max-width:820px;margin:0 auto;padding:26px 20px 60px;">
    <div class="brand-text" style="font-size:22px;margin-bottom:4px;">今日歷史訂單</div>
    <div style="font-size:13px;color:rgba(26,26,29,.55);margin-bottom:22px;font-weight:700;">已完成／已結案訂單紀錄</div>

    <div v-if="orders.length === 0" style="text-align:center;color:rgba(26,26,29,.5);font-size:14px;padding:60px 0;background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;">今天還沒有已完成的訂單</div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <div v-for="o in orders" :key="o.id" style="background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <div>
            <span style="font-weight:900;font-size:16px;">#{{ o.id }}</span>
            <span :style="`font-size:11px;font-weight:800;color:#fff;background:${orderTypeColor(o)};padding:3px 9px;border-radius:20px;margin-left:8px;`">{{ orderTypeLabel(o) }}</span>
          </div>
          <span style="font-size:12px;font-weight:800;color:#3fae66;">已完成</span>
        </div>
        <div style="font-size:13px;color:rgba(26,26,29,.8);margin-bottom:8px;">{{ o.customerName }}・{{ paymentLabel(o) }}</div>
        <div style="font-size:13px;color:rgba(26,26,29,.7);line-height:1.7;margin-bottom:10px;">{{ itemsSummary(o) }}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(26,26,29,.55);font-weight:700;border-top:1px dashed rgba(26,26,29,.15);padding-top:10px;">
          <span>下單 {{ timeLabel(o.createdAt) }}・出餐 {{ timeLabel(o.servedAt) }}・完成 {{ timeLabel(o.completedAt) }}</span>
          <span style="font-weight:900;color:#e8384f;font-size:15px;">${{ o.total }}</span>
        </div>
      </div>
    </div>
  </main>
</template>
