<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  advanceCap,
  itemsSummary,
  orderTypeColor,
  orderTypeLabel,
  paymentLabel,
  timeLabel,
} from '../composables/presentation';
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

const adminOrders = computed(() =>
  [...orders.value].reverse().map((o) => {
    const hasNext = o.status < advanceCap(o);
    return {
      order: o,
      hasNext,
      nextLabel: hasNext ? STATUS_LABELS[o.status + 1] : '',
    };
  })
);

async function advance(id: number) {
  await api.advanceOrder(id);
  await load();
}
</script>

<template>
  <main style="max-width:820px;margin:0 auto;padding:26px 20px 60px;">
    <div class="brand-text" style="font-size:22px;margin-bottom:4px;">訂單佇列</div>
    <div style="font-size:13px;color:rgba(26,26,29,.55);margin-bottom:22px;font-weight:700;">共 {{ orders.length }} 筆進行中訂單</div>

    <div v-if="orders.length === 0" style="text-align:center;color:rgba(26,26,29,.5);font-size:14px;padding:60px 0;background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;">尚無新訂單</div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <div v-for="row in adminOrders" :key="row.order.id" :style="`background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:16px 20px;border-left:6px solid ${STATUS_COLORS[row.order.status]};`">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <div>
            <span style="font-weight:900;font-size:16px;">#{{ row.order.id }}</span>
            <span :style="`font-size:11px;font-weight:800;color:#fff;background:${orderTypeColor(row.order)};padding:3px 9px;border-radius:20px;margin-left:8px;`">{{ orderTypeLabel(row.order) }}</span>
            <span style="font-size:12px;color:rgba(26,26,29,.55);margin-left:8px;">{{ timeLabel(row.order.createdAt) }}</span>
          </div>
          <span :style="`font-size:12px;font-weight:800;color:#1a1a1a;background:${STATUS_COLORS[row.order.status]};padding:4px 12px;border-radius:20px;border:2px solid #1a1a1a;`">{{ STATUS_LABELS[row.order.status] }}</span>
        </div>
        <div style="font-size:13px;color:rgba(26,26,29,.8);margin-bottom:8px;">{{ row.order.customerName }}・{{ row.order.customerPhone }}・{{ paymentLabel(row.order) }}</div>
        <div style="font-size:13px;color:rgba(26,26,29,.7);line-height:1.7;margin-bottom:10px;">{{ itemsSummary(row.order) }}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:900;color:#e8384f;font-size:15px;">${{ row.order.total }}</span>
          <button v-if="row.hasNext" @click="advance(row.order.id)" style="border:2px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;">
            推進至「{{ row.nextLabel }}」
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
