<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { STATUS_LABELS, STATUS_COLORS, TABLES, itemsSummary, timeLabel } from '../composables/presentation';
import type { Order } from '../types';

const orders = ref<Order[]>([]);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  orders.value = await api.getOrders('active');
}

onMounted(async () => {
  await load();
  timer = setInterval(load, 5000);
});
onUnmounted(() => clearInterval(timer));

const tablesView = computed(() =>
  TABLES.map((num) => {
    const order = orders.value.find((o) => o.orderType === 'dinein' && o.table === num);
    if (!order) return { num, occupied: false as const };
    return { num, occupied: true as const, order, hasNext: order.status < 2 };
  })
);

async function advance(id: number) {
  await api.advanceOrder(id);
  await load();
}
async function clearTable(id: number) {
  await api.clearOrder(id);
  await load();
}
</script>

<template>
  <main style="max-width:1000px;margin:0 auto;padding:26px 20px 60px;">
    <div class="brand-text" style="font-size:22px;margin-bottom:4px;">桌況</div>
    <div style="font-size:13px;color:rgba(26,26,29,.55);margin-bottom:22px;font-weight:700;">內用桌位即時狀態</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
      <div v-for="t in tablesView" :key="t.num" :style="`border-radius:16px;padding:16px 18px;background:${t.occupied ? '#fff' : '#f2fbff'};border:2.5px solid #1a1a1a;`">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="brand-text" style="font-size:20px;">{{ t.num }} 桌</span>
          <span v-if="t.occupied" :style="`font-size:11px;font-weight:800;color:#1a1a1a;background:${STATUS_COLORS[t.order.status]};padding:4px 10px;border-radius:20px;border:2px solid #1a1a1a;`">{{ STATUS_LABELS[t.order.status] }}</span>
        </div>
        <template v-if="t.occupied">
          <div style="font-size:12px;color:rgba(26,26,29,.7);line-height:1.6;margin-bottom:8px;">{{ itemsSummary(t.order) }}</div>
          <div style="font-size:11px;color:rgba(26,26,29,.55);font-weight:700;margin-bottom:12px;">下單 {{ timeLabel(t.order.createdAt) }}・出餐 {{ t.order.servedAt ? timeLabel(t.order.servedAt) : '尚未出餐' }}</div>
          <div style="font-weight:900;color:#e8384f;font-size:15px;margin-bottom:12px;">${{ t.order.total }}</div>
          <div style="display:flex;gap:8px;">
            <button v-if="t.hasNext" @click="advance(t.order.id)" style="flex:1;border:2px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:9px 8px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;">
              推進至「{{ STATUS_LABELS[t.order.status + 1] }}」
            </button>
            <button @click="clearTable(t.order.id)" style="flex:1;border:2px solid #1a1a1a;background:#fff;color:#e8384f;padding:9px 8px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;">結束用餐・清空</button>
          </div>
        </template>
        <div v-else style="text-align:center;color:rgba(26,26,29,.4);font-size:13px;font-weight:700;padding:30px 0;">空桌</div>
      </div>
    </div>
  </main>
</template>
