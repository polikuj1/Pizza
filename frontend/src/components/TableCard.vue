<script setup lang="ts">
import { STATUS_LABELS, STATUS_COLORS, itemsSummary, timeLabel } from '../composables/presentation';
import type { TableCell } from '../types';

const { cell, round = false } = defineProps<{ cell: TableCell; round?: boolean }>();
defineEmits<{ advance: [id: number]; clear: [tableNum: number] }>();
</script>

<template>
  <div
    :class="[cell.occupied ? 'bg-white' : 'bg-[#f2fbff]', round ? 'rounded-full text-center' : 'rounded-2xl']"
    class="border-[2.5px] border-[#1a1a1a] p-4 sm:px-[18px]"
  >
    <div class="mb-2.5 flex items-center justify-between" :class="{ 'flex-col gap-1': round }">
      <span class="brand-text text-xl">{{ cell.num }} 桌</span>
      <span v-if="cell.occupied" class="rounded-full border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-extrabold text-[#1a1a1a]">
        {{ cell.orders.length }} 筆訂單中
      </span>
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
        <div class="mb-2 text-[11px] font-bold text-[rgba(26,26,29,.55)]">
          下單 {{ timeLabel(order.createdAt) }}・出餐 {{ order.servedAt ? timeLabel(order.servedAt) : '尚未出餐' }}
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-[15px] font-black text-[#e8384f]">${{ order.total }}</span>
          <button
            v-if="order.status < 2"
            @click="$emit('advance', order.id)"
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
  </div>
</template>
