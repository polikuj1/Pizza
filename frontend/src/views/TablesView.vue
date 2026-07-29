<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { handleLoadError } from '../composables/authGuard';
import { TABLES } from '../composables/presentation';
import { clearOrderItems } from '../store/checkedItems';
import TableCard from '../components/TableCard.vue';
import type { Order, TableCell } from '../types';

const router = useRouter();
const orders = ref<Order[]>([]);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  try {
    orders.value = await api.getOrders('active');
  } catch (err) {
    handleLoadError(err, router);
  }
}

onMounted(async () => {
  await load();
  timer = setInterval(load, 5000);
});
onUnmounted(() => clearInterval(timer));

const tableMap = computed(() => {
  const map: Record<number, TableCell> = {};
  for (const num of TABLES) {
    const tableOrders = orders.value.filter((o) => o.orderType === 'dinein' && o.table === num).sort((a, b) => a.id - b.id);
    map[num] = tableOrders.length > 0 ? { num, occupied: true, orders: tableOrders } : { num, occupied: false };
  }
  return map;
});

async function advance(id: number) {
  try {
    await api.advanceOrder(id);
    await load();
  } catch (err) {
    handleLoadError(err, router);
  }
}
async function clearTable(tableNum: number) {
  try {
    const cleared = await api.clearTable(tableNum);
    cleared.forEach((o) => clearOrderItems(o.id));
    await load();
  } catch (err) {
    handleLoadError(err, router);
  }
}
</script>

<template>
  <main class="mx-auto max-w-[1000px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">桌況</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">內用桌位即時狀態・依現場相對位置排列</div>

    <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <section class="flex-1">
        <div class="mb-3 text-xs font-extrabold text-[rgba(26,26,29,.5)]">前面</div>
        <div class="grid grid-cols-2 gap-4">
          <TableCard :cell="tableMap[1]" @advance="advance" @clear="clearTable" />
          <TableCard :cell="tableMap[2]" @advance="advance" @clear="clearTable" />
          <div class="col-span-2 flex h-16 items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(26,26,29,.35)] bg-[rgba(26,26,29,.04)] text-xs font-bold text-[rgba(26,26,29,.45)]">
            吧檯
          </div>
        </div>
      </section>

      <section class="flex-1">
        <div class="mb-3 text-xs font-extrabold text-[rgba(26,26,29,.5)]">後面</div>
        <div class="grid grid-cols-2 gap-4">
          <TableCard :cell="tableMap[3]" @advance="advance" @clear="clearTable" />
          <TableCard :cell="tableMap[4]" @advance="advance" @clear="clearTable" />
          <div></div>
          <TableCard :cell="tableMap[5]" round @advance="advance" @clear="clearTable" />
        </div>
      </section>
    </div>
  </main>
</template>
