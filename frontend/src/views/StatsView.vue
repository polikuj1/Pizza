<script setup lang="ts">
import { Chart as ChartJS, LineElement, PointElement, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'vue-chartjs';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { handleLoadError } from '../composables/authGuard';
import { catalog } from '../store/catalog';
import { ORDER_TYPE_COLORS, ORDER_TYPE_LABELS } from '../composables/presentation';
import type { StatsRange, StatsSummary } from '../types';

ChartJS.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: 'day', label: '當日' },
  { value: 'week', label: '一週' },
  { value: 'month', label: '一個月' },
  { value: 'custom', label: '自訂區間' },
];

const router = useRouter();
const range = ref<StatsRange>('day');
// 品項銷售排行專用的分類篩選，預設「全部」，不影響營收趨勢／訂單類型佔比
const itemCategory = ref('all');
const itemCategoryOptions = computed(() => [{ id: 'all', label: '全部' }, ...catalog.categories]);
// 預設區間（day/week/month）跟自訂區間分開存，切換分頁時才不會互相覆蓋掉對方查好的結果
const presetSummary = ref<StatsSummary | null>(null);
const customSummary = ref<StatsSummary | null>(null);
const summary = computed(() => (range.value === 'custom' ? customSummary.value : presetSummary.value));
// 頁面頂部的「當日」總覽卡跟下面圖表的區間切換器無關，固定抓 range=day，不跟著 range 重抓
const todaySummary = ref<StatsSummary | null>(null);

async function load() {
  try {
    presetSummary.value = await api.getStatsSummary(
      range.value as 'day' | 'week' | 'month',
      itemCategory.value === 'all' ? undefined : itemCategory.value
    );
  } catch (err) {
    handleLoadError(err, router);
  }
}

async function loadToday() {
  try {
    todaySummary.value = await api.getStatsSummary('day');
  } catch (err) {
    handleLoadError(err, router);
  }
}

onMounted(() => {
  load();
  loadToday();
});

const customStart = ref('');
const customEnd = ref('');
const customError = ref('');

async function submitCustomRange() {
  customError.value = '';
  if (!customStart.value || !customEnd.value) {
    customError.value = '請選擇起始與結束日期';
    return;
  }
  if (customStart.value > customEnd.value) {
    customError.value = '起始日期不能晚於結束日期';
    return;
  }
  try {
    customSummary.value = await api.getStatsSummaryCustom(
      customStart.value,
      customEnd.value,
      itemCategory.value === 'all' ? undefined : itemCategory.value
    );
  } catch (err) {
    handleLoadError(err, router);
  }
}

// 自訂區間只在使用者按查詢時才抓資料，切到這個分頁本身不觸發
watch(range, (r) => {
  if (r === 'custom') {
    customError.value = '';
    return;
  }
  load();
});

// 切換品項分類：預設區間直接重抓；自訂區間只有已經查詢過才跟著重抓，避免還沒選日期就送出請求
watch(itemCategory, () => {
  if (range.value === 'custom') {
    if (customSummary.value) submitCustomRange();
    return;
  }
  load();
});

// 還沒查過自訂區間時顯示提示，而不是空白或誤導性地沿用預設區間的圖表
const showCustomPrompt = computed(() => range.value === 'custom' && customSummary.value === null);

const todayRevenue = computed(() => (todaySummary.value?.revenue.buckets ?? []).reduce((n, b) => n + b.revenue, 0));
const todayOrderCount = computed(() => (todaySummary.value?.revenue.buckets ?? []).reduce((n, b) => n + b.orderCount, 0));
const todayDineinCount = computed(
  () => todaySummary.value?.orderTypes.breakdown.find((b) => b.orderType === 'dinein')?.orderCount ?? 0
);

const hasRevenue = computed(() => (summary.value?.revenue.buckets ?? []).some((b) => b.revenue > 0));
const hasOrderTypes = computed(() => (summary.value?.orderTypes.breakdown ?? []).some((b) => b.orderCount > 0));
const hasItems = computed(() => (summary.value?.itemRanking.items ?? []).length > 0);

const revenueChartData = computed(() => ({
  labels: summary.value?.revenue.buckets.map((b) => b.label) ?? [],
  datasets: [
    {
      label: '營收',
      data: summary.value?.revenue.buckets.map((b) => b.revenue) ?? [],
      borderColor: '#e8384f',
      backgroundColor: '#e8384f',
      pointBackgroundColor: '#ffdf3c',
      pointBorderColor: '#1a1a1a',
      pointBorderWidth: 2,
      borderWidth: 2,
      tension: 0.2,
    },
  ],
}));

const orderTypeChartData = computed(() => {
  const rows = summary.value?.orderTypes.breakdown ?? [];
  return {
    labels: rows.map((r) => ORDER_TYPE_LABELS[r.orderType]),
    datasets: [
      {
        data: rows.map((r) => r.revenue),
        orderCounts: rows.map((r) => r.orderCount),
        backgroundColor: rows.map((r) => ORDER_TYPE_COLORS[r.orderType]),
        borderColor: '#1a1a1a',
        borderWidth: 2,
      },
    ],
  };
});

// 訂單數/金額直接畫在圖上，不用 hover 才看得到
const orderTypeDataLabelsPlugin = {
  id: 'orderTypeDataLabels',
  afterDraw(chart: any) {
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    meta.data.forEach((arc: any, i: number) => {
      const count = dataset.orderCounts?.[i] ?? 0;
      if (count === 0) return;
      const revenue = dataset.data[i];
      const pos = arc.tooltipPosition();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${count} 筆`, pos.x, pos.y - 8);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`$${revenue}`, pos.x, pos.y + 8);
    });
    ctx.restore();
  },
};

const itemRankingChartData = computed(() => {
  const rows = summary.value?.itemRanking.items ?? [];
  return {
    labels: rows.map((r) => r.zh),
    datasets: [
      {
        label: '銷售數量',
        data: rows.map((r) => r.qty),
        backgroundColor: '#4fb8e8',
        borderColor: '#1a1a1a',
        borderWidth: 2,
      },
    ],
  };
});

const itemTotalQty = computed(() => (summary.value?.itemRanking.items ?? []).reduce((n, r) => n + r.qty, 0));

// 數量寫在長條尾端，區間拉大時不用 hover 就看得到累積量
const itemQtyLabelsPlugin = {
  id: 'itemQtyLabels',
  afterDraw(chart: any) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 12px sans-serif';
    chart.getDatasetMeta(0).data.forEach((bar: any, i: number) => {
      ctx.fillText(String(chart.data.datasets[0].data[i]), bar.x + 6, bar.y);
    });
    ctx.restore();
  },
};

const lineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
const rankingOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  // grace 留白，數量標籤才不會被畫到圖表外面被切掉
  scales: { x: { ticks: { precision: 0 }, grace: '8%' } },
};
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } };
</script>

<template>
  <main class="mx-auto max-w-[820px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">統計分析</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">營收趨勢、訂單類型佔比、品項銷售排行</div>

    <div class="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <div class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="text-[13px] font-bold text-[rgba(26,26,29,.55)]">當日總營收</div>
        <div class="mt-1 text-3xl font-black text-[#e8384f]">${{ todayRevenue.toLocaleString('zh-TW') }}</div>
      </div>
      <div class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="text-[13px] font-bold text-[rgba(26,26,29,.55)]">當日所有訂單數</div>
        <div class="mt-1 text-3xl font-black text-[#4fb8e8]">{{ todayOrderCount.toLocaleString('zh-TW') }}</div>
      </div>
      <div class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="text-[13px] font-bold text-[rgba(26,26,29,.55)]">當日來店數（內用）</div>
        <div class="mt-1 text-3xl font-black text-[#3fae66]">{{ todayDineinCount.toLocaleString('zh-TW') }}</div>
      </div>
    </div>

    <div class="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <button
        v-for="opt in RANGE_OPTIONS"
        :key="opt.value"
        @click="range = opt.value"
        :class="range === opt.value ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="range === 'custom'" class="mb-5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="text-[13px] font-extrabold">
          起始日期
          <input v-model="customStart" type="date" class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm" />
        </div>
        <div class="text-[13px] font-extrabold">
          結束日期
          <input v-model="customEnd" type="date" class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm" />
        </div>
        <button
          @click="submitCustomRange"
          class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3 text-[13px] text-[#1a1a1a]"
        >
          查詢
        </button>
      </div>
      <div v-if="customError" class="mt-2.5 text-[13px] font-extrabold text-[#e8384f]">{{ customError }}</div>
    </div>

    <div v-if="showCustomPrompt" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]">
      請選擇日期區間並點擊查詢
    </div>
    <template v-else>
      <div class="mb-5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="mb-3 flex items-center gap-2">
          <span class="brand-text text-lg">營收趨勢</span>
        </div>
        <div v-if="!hasRevenue" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]">
          此區間尚無訂單
        </div>
        <div v-else class="h-[280px]">
          <Line :data="revenueChartData" :options="lineOptions" />
        </div>
      </div>

      <div class="mb-5 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="mb-3 flex items-center gap-2">
          <span class="brand-text text-lg">訂單類型佔比</span>
        </div>
        <div v-if="!hasOrderTypes" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]">
          此區間尚無訂單
        </div>
        <div v-else class="mx-auto h-[280px] max-w-[320px]">
          <Doughnut :data="orderTypeChartData" :options="doughnutOptions" :plugins="[orderTypeDataLabelsPlugin]" />
        </div>
      </div>

      <div class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5">
        <div class="mb-3 flex items-center gap-2">
          <span class="brand-text text-lg">品項銷售排行</span>
          <span class="rounded-full border-2 border-[#1a1a1a] bg-white px-2.5 py-0.5 text-xs font-extrabold">{{ summary?.itemRanking.items.length ?? 0 }} 項</span>
        </div>
        <div class="mb-3.5 flex flex-wrap items-center gap-2">
          <button
            v-for="opt in itemCategoryOptions"
            :key="opt.id"
            @click="itemCategory = opt.id"
            :class="itemCategory === opt.id ? 'bg-[#ffdf3c]' : 'bg-white'"
            class="tab-font cursor-pointer rounded-xl border-2 border-[#1a1a1a] px-3.5 py-1.5 text-xs text-[#1a1a1a]"
          >
            {{ opt.label }}
          </button>
          <span class="ml-auto text-[13px] font-extrabold">共 {{ itemTotalQty.toLocaleString('zh-TW') }} 份</span>
        </div>
        <div v-if="!hasItems" class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-[60px] text-center text-sm text-[rgba(26,26,29,.5)]">
          此區間尚無銷售紀錄
        </div>
        <div v-else class="h-[400px]">
          <Bar :data="itemRankingChartData" :options="rankingOptions" :plugins="[itemQtyLabelsPlugin]" />
        </div>
      </div>
    </template>
  </main>
</template>
