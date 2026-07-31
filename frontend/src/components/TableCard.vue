<script setup lang="ts">
import { computed, ref } from 'vue';
import { STATUS_LABELS, STATUS_COLORS, itemsSummary, timeLabel } from '../composables/presentation';
import type { TableCell } from '../types';

const { cell, round = false } = defineProps<{ cell: TableCell; round?: boolean }>();
const emit = defineEmits<{ advance: [id: number]; clear: [tableNum: number]; clickTable: [tableNum: number]; updatePaid: [id: number, paid: boolean] }>();

const showPaymentOverlay = ref(false);

const allPaid = computed(() => {
  if (!cell.occupied) return true;
  return cell.orders.every(o => o.paid);
});

function openPaymentOverlay() {
  showPaymentOverlay.value = true;
}

function closePaymentOverlay() {
  showPaymentOverlay.value = false;
}

function updatePaymentStatus(orderId: number, paid: boolean) {
  emit('updatePaid', orderId, paid);
}
</script>

<template>
  <div
    :class="[cell.occupied ? 'bg-white' : 'bg-[#f2fbff]', round ? 'rounded-full text-center' : 'rounded-2xl']"
    class="relative border-[2.5px] border-[#1a1a1a] p-4 sm:px-[18px]"
  >
    <!-- 左上角結帳狀態 badge（可點擊） -->
    <button
      v-if="cell.occupied"
      @click="openPaymentOverlay"
      :class="allPaid ? 'bg-[#4ade80] text-[#1a1a1a]' : 'bg-[#fbbf24] text-[#1a1a1a]'"
      class="absolute -left-1 -top-1 origin-top-left -rotate-12 cursor-pointer rounded-md border-2 border-[#1a1a1a] px-2 py-0.5 text-[10px] font-extrabold shadow-sm transition-transform hover:scale-110"
    >
      {{ allPaid ? '已結' : '未結' }}
    </button>
    <div class="mb-2.5 flex items-center justify-between" :class="{ 'flex-col gap-1': round }">
      <span class="brand-text text-xl">{{ cell.num }} 桌</span>
      <div class="flex items-center gap-2">
        <span v-if="cell.occupied" class="rounded-full border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-extrabold text-[#1a1a1a]">
          {{ cell.orders.length }} 筆訂單中
        </span>
        <button
          @click="$emit('clickTable', cell.num)"
          class="cursor-pointer rounded-lg border-2 border-[#1a1a1a] bg-[#ffdf3c] px-2.5 py-1 text-[11px] font-extrabold text-[#1a1a1a] hover:bg-[#ffd700]"
        >
          {{ cell.occupied ? '加點' : '點餐' }}
        </button>
      </div>
    </div>
    <template v-if="cell.occupied">
      <div
        v-for="(order, i) in cell.orders"
        :key="order.id"
        class="mb-3 border-b-2 border-dashed border-[rgba(26,26,29,.2)] pb-3 last:mb-0 last:border-b-0 last:pb-0"
      >
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span v-if="i > 0" class="rounded-full bg-[#ffdf3c] border-2 border-[#1a1a1a] px-2 py-0.5 text-[10px] font-extrabold text-[#1a1a1a]">加點 #{{ i + 1 }}</span>
          <span v-else class="text-[10px] font-extrabold text-[rgba(26,26,29,.5)]">第一筆</span>
          <span
            class="rounded-full border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-extrabold text-[#1a1a1a]"
            :style="{ background: STATUS_COLORS[order.status] }"
          >{{ STATUS_LABELS[order.status] }}</span>
        </div>
        <div class="mb-1.5 text-xs leading-relaxed text-[rgba(26,26,29,.7)]">{{ itemsSummary(order) }}</div>
        <div v-if="order.note" class="mb-1.5 rounded-lg bg-[rgba(255,223,60,.2)] border border-[rgba(26,26,29,.1)] px-2.5 py-1.5 text-xs leading-relaxed text-[rgba(26,26,29,.75)]">
          <span class="font-extrabold text-[rgba(26,26,29,.85)]">備註：</span>{{ order.note }}
        </div>
        <div class="mb-2 text-[11px] font-bold text-[rgba(26,26,29,.55)]">
          下單 {{ timeLabel(order.createdAt) }}・出餐 {{ order.servedAt ? timeLabel(order.servedAt) : '尚未出餐' }}
        </div>
        <div v-if="cell.orders.length > 1 || order.status < 2" class="flex items-center justify-between gap-2">
          <span v-if="cell.orders.length > 1" class="text-[15px] font-black text-[#e8384f]">${{ order.total }}</span>
          <button
            v-if="order.status < 2"
            v-debounce
            @click="$emit('advance', order.id)"
            :class="cell.orders.length === 1 ? 'ml-auto' : ''"
            class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3 py-1.5 text-xs font-extrabold text-[#1a1a1a]"
          >
            推進至「{{ STATUS_LABELS[order.status + 1] }}」
          </button>
        </div>
      </div>

      <div class="mb-3 flex justify-between text-base font-black">
        <span>桌況總計</span>
        <span class="text-[#e8384f]">${{ cell.orders.reduce((n, o) => n + o.total, 0) }}</span>
      </div>
      <button
        @click="$emit('clear', cell.num)"
        class="w-full cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-2 py-2.5 text-xs font-extrabold text-[#e8384f]"
      >
        結束用餐・清空整桌
      </button>
    </template>
    <div v-else class="py-[30px] text-center text-[13px] font-bold text-[rgba(26,26,29,.4)]">空桌</div>

    <!-- 付款狀態蓋板 -->
    <Transition name="fade">
      <div
        v-if="showPaymentOverlay && cell.occupied"
        @click.self="closePaymentOverlay"
        :class="round ? 'rounded-full' : 'rounded-2xl'"
        class="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      >
        <div class="relative w-full max-w-[300px] rounded-xl border-[2.5px] border-[#1a1a1a] bg-white p-5 shadow-xl">
          <!-- 右上角關閉按鈕 -->
          <button
            @click="closePaymentOverlay"
            class="absolute -right-2 -top-2 flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#e8384f] text-2xl font-black text-white shadow-md hover:bg-[#d32f3f]"
          >
            ×
          </button>

          <!-- 付款狀態標題 -->
          <div class="mb-4 text-center">
            <div class="brand-text text-xl">{{ cell.num }} 桌付款狀態</div>
            <div class="mt-1 text-[11px] font-bold text-[rgba(26,26,29,.5)]">點擊更新各訂單的結帳狀態</div>
          </div>

          <!-- 訂單付款狀態列表 -->
          <div class="flex flex-col gap-3">
            <div
              v-for="(order, i) in cell.orders"
              :key="order.id"
              class="rounded-lg border-2 border-[#1a1a1a] bg-[#f2fbff] p-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-extrabold text-[rgba(26,26,29,.7)]">
                  {{ i > 0 ? `加點 #${i + 1}` : '第一筆' }} (訂單 #{{ order.id }})
                </span>
                <span class="text-sm font-black text-[#e8384f]">${{ order.total }}</span>
              </div>
              <div class="flex gap-2">
                <label class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-[#1a1a1a] px-3 py-2 text-xs font-bold transition-colors" :class="order.paid ? 'bg-[#4ade80] border-[#22c55e]' : 'bg-white'">
                  <input type="radio" :checked="order.paid" @change="updatePaymentStatus(order.id, true)" class="size-3.5 accent-[#22c55e]" />
                  已結帳
                </label>
                <label class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-[#1a1a1a] px-3 py-2 text-xs font-bold transition-colors" :class="!order.paid ? 'bg-[#fbbf24] border-[#f59e0b]' : 'bg-white'">
                  <input type="radio" :checked="!order.paid" @change="updatePaymentStatus(order.id, false)" class="size-3.5 accent-[#f59e0b]" />
                  未結帳
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
