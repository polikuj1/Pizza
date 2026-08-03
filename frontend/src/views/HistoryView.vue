<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import { api } from "../api";
  import { handleLoadError } from "../composables/authGuard";
  import {
    channelLabel,
    itemsSummary,
    orderTypeColor,
    orderTypeLabel,
    paymentLabel,
    pickupLabel,
    timeLabel,
  } from "../composables/presentation";
  import { hasPermission } from "../store/auth";
  import type { Order } from "../types";

  const RANGE_OPTIONS = [
    { value: "today", label: "今日" },
    { value: "yesterday", label: "昨天" },
    { value: "custom", label: "自訂區間" },
  ] as const;
  type HistoryRange = (typeof RANGE_OPTIONS)[number]["value"];

  // 台灣沒有 DST，純日曆日期加減不會有時區誤差
  function dateStr(daysBack: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d.toLocaleDateString("en-CA");
  }

  const router = useRouter();
  const orders = ref<Order[]>([]);
  const page = ref(1);
  const totalPages = ref(1);
  const deleteMode = ref(false);
  const range = ref<HistoryRange>("today");
  const customStart = ref("");
  const customEnd = ref("");
  const customError = ref("");
  // 自訂區間要按「查詢」才送出，這裡存的是實際查過的區間
  const activeRange = ref<{ start: string; end: string } | null>(null);
  let timer: ReturnType<typeof setInterval> | undefined;

  const rangeLabel = computed(() => {
    if (range.value === "today") return "今日";
    if (range.value === "yesterday") return "昨日";
    return activeRange.value
      ? `${activeRange.value.start} ~ ${activeRange.value.end}`
      : "自訂區間";
  });
  const showCustomPrompt = computed(
    () => range.value === "custom" && activeRange.value === null,
  );

  function selectRange(value: HistoryRange) {
    range.value = value;
    customError.value = "";
    page.value = 1;
    if (value === "custom") {
      activeRange.value = null;
      orders.value = [];
      return;
    }
    const d = dateStr(value === "today" ? 0 : 1);
    activeRange.value = { start: d, end: d };
    load();
  }

  function submitCustomRange() {
    customError.value = "";
    if (!customStart.value || !customEnd.value) {
      customError.value = "請選擇起始與結束日期";
      return;
    }
    if (customStart.value > customEnd.value) {
      customError.value = "起始日期不能晚於結束日期";
      return;
    }
    page.value = 1;
    activeRange.value = { start: customStart.value, end: customEnd.value };
    load();
  }

  async function remove(o: Order) {
    if (
      !confirm(
        `確定要永久刪除訂單 #${o.id}（$${o.total}）嗎？此動作無法復原，統計數字也會跟著減少。`,
      )
    )
      return;
    try {
      await api.deleteOrder(o.id);
      await load();
    } catch (err) {
      handleLoadError(err, router);
    }
  }

  async function load() {
    if (!activeRange.value) return;
    try {
      const res = await api.getOrderHistory(
        page.value,
        activeRange.value.start,
        activeRange.value.end,
      );
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

  onMounted(() => {
    selectRange("today");
    timer = setInterval(load, 10000);
  });
  onUnmounted(() => clearInterval(timer));
</script>

<template>
  <main class="mx-auto max-w-[820px] px-5 pt-[26px] pb-[60px]">
    <div class="mb-1 flex items-center gap-3">
      <div class="brand-text text-xl sm:text-[22px]">歷史訂單</div>
      <button
        v-if="hasPermission('admin')"
        @click="deleteMode = !deleteMode"
        class="cursor-pointer rounded-[10px] border-2 px-2.5 py-1 text-[11px] font-extrabold"
        :class="
          deleteMode
            ? 'border-[#e8384f] bg-[#e8384f] text-white'
            : 'border-[#1a1a1a] bg-white text-[#1a1a1a]'
        "
      >
        {{ deleteMode ? "完成" : "刪除訂單" }}
      </button>
    </div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">
      已完成／已結案訂單紀錄・{{ rangeLabel }}
    </div>

    <div class="mb-5 grid grid-cols-3 gap-2.5">
      <button
        v-for="opt in RANGE_OPTIONS"
        :key="opt.value"
        @click="selectRange(opt.value)"
        :class="range === opt.value ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
      >
        {{ opt.label }}
      </button>
    </div>

    <div
      v-if="range === 'custom'"
      class="mb-5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5"
    >
      <div class="flex flex-wrap items-end gap-3">
        <div class="text-[13px] font-extrabold">
          起始日期
          <input
            v-model="customStart"
            type="date"
            class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm"
          />
        </div>
        <div class="text-[13px] font-extrabold">
          結束日期
          <input
            v-model="customEnd"
            type="date"
            class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm"
          />
        </div>
        <button
          @click="submitCustomRange"
          class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3 text-[13px] text-[#1a1a1a]"
        >
          查詢
        </button>
      </div>
      <div
        v-if="customError"
        class="mt-2.5 text-[13px] font-extrabold text-[#e8384f]"
      >
        {{ customError }}
      </div>
    </div>

    <div
      v-if="showCustomPrompt"
      class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]"
    >
      請選擇日期區間並點擊查詢
    </div>
    <div
      v-else-if="orders.length === 0"
      class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]"
    >
      此區間沒有已完成的訂單
    </div>

    <div class="flex flex-col gap-3.5">
      <div
        v-for="o in orders"
        :key="o.id"
        class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5"
      >
        <div class="mb-2.5 flex flex-wrap justify-between gap-2.5">
          <div>
            <span class="text-base font-black">#{{ o.id }}</span>
            <span
              class="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white"
              :style="{ background: orderTypeColor(o) }"
              >{{ orderTypeLabel(o) }}</span
            >
            <span
              v-if="channelLabel(o)"
              class="ml-1 rounded-full border-2 border-[#1a1a1a] px-2 py-0.5 text-[11px] font-extrabold text-[#1a1a1a]"
              >{{ channelLabel(o) }}</span
            >
          </div>
          <span v-if="!deleteMode" class="text-xs font-extrabold text-[#3fae66]"
            >已完成</span
          >
          <button
            v-else
            @click="remove(o)"
            aria-label="永久刪除訂單"
            class="cursor-pointer rounded-[10px] border-2 border-[#e8384f] bg-white p-2 text-[#e8384f] hover:bg-[#fde8ea]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
        <div class="mb-2 text-[13px] text-[rgba(26,26,29,.8)]">
          {{ o.customerName }}・{{ paymentLabel(o) }}
          <span v-if="pickupLabel(o)" class="font-extrabold text-[#e8384f]"
            >・取餐 {{ pickupLabel(o) }}</span
          >
        </div>
        <div
          class="mb-2.5 text-[13px] leading-relaxed text-[rgba(26,26,29,.7)]"
        >
          {{ itemsSummary(o) }}
        </div>
        <div
          class="flex flex-col items-start justify-between gap-1 border-t border-dashed border-[rgba(26,26,29,.15)] pt-2.5 text-xs font-bold text-[rgba(26,26,29,.55)] sm:flex-row sm:items-center sm:gap-0"
        >
          <span
            >下單 {{ timeLabel(o.createdAt) }}・出餐
            {{ timeLabel(o.servedAt) }}・完成
            {{ timeLabel(o.completedAt) }}</span
          >
          <span class="text-[15px] font-black text-[#e8384f]"
            >${{ o.total }}</span
          >
        </div>
      </div>
    </div>

    <div
      v-if="totalPages > 1"
      class="mt-5 flex items-center justify-center gap-3"
    >
      <button
        @click="goToPage(page - 1)"
        :disabled="page <= 1"
        class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3.5 py-2 text-xs font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹ 上一頁
      </button>
      <span class="text-xs font-extrabold text-[rgba(26,26,29,.6)]"
        >第 {{ page }} / {{ totalPages }} 頁</span
      >
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
