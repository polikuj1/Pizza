<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { cartState } from '../store/cart';
import { cartLines, cartTotal, TABLES } from '../composables/presentation';
import { api } from '../api';

const router = useRouter();
const lines = computed(() => cartLines(cartState.cart));
const total = computed(() => cartTotal(cartState.cart));

const PICKUP_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const PICKUP_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const orderType = ref<'dinein' | 'takeout'>('dinein');
const table = ref<number | null>(null);
const pickupDate = ref('');
const pickupHour = ref('');
const pickupMinute = ref('');
const pickupTime = computed(() => (pickupHour.value && pickupMinute.value ? `${pickupHour.value}:${pickupMinute.value}` : ''));

const submitting = ref(false);

const form = reactive({
  customerName: '',
  customerPhone: '',
  customerNote: '',
  error: '',
});

function selectOrderType(type: 'dinein' | 'takeout') {
  orderType.value = type;
  table.value = null;
  pickupDate.value = '';
  pickupHour.value = '';
  pickupMinute.value = '';
  form.error = '';
}

function selectTable(num: number) {
  table.value = num;
  form.error = '';
}

async function submitOrder() {
  if (submitting.value) return;
  if (lines.value.length === 0) {
    form.error = '購物車是空的';
    return;
  }
  if (orderType.value === 'dinein' && !table.value) {
    form.error = '請選擇桌號';
    return;
  }
  if (orderType.value === 'takeout' && !form.customerPhone.trim()) {
    form.error = '請填寫聯絡電話';
    return;
  }
  submitting.value = true;
  try {
    const order = await api.createOrder({
      cart: cartState.cart,
      orderType: orderType.value,
      table: orderType.value === 'dinein' ? table.value : null,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      pickupDate: orderType.value === 'takeout' && pickupDate.value ? pickupDate.value : null,
      pickupTime: orderType.value === 'takeout' && pickupTime.value ? pickupTime.value : null,
      note: form.customerNote,
    });
    cartState.cart = {};
    pickupDate.value = '';
    pickupHour.value = '';
    pickupMinute.value = '';
    form.error = '';
    router.push(`/order/${order.id}`);
  } catch (err) {
    form.error = err instanceof Error ? err.message : '發生錯誤';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="mx-auto max-w-[520px] px-5 pt-6 pb-[60px]">
    <button @click="router.push('/')" class="cursor-pointer border-none bg-none pb-4 text-[13px] font-extrabold text-[#e8384f]">← 返回菜單</button>
    <div class="brand-text mb-4 text-xl sm:text-[22px]">結帳</div>

    <div class="mb-[18px] rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 sm:px-[18px]">
      <div class="mb-2.5 text-[13px] font-extrabold text-[rgba(26,26,29,.7)]">訂單內容</div>
      <div v-for="line in lines" :key="line.id" class="flex justify-between py-1.5 text-[13px]">
        <span>{{ line.zh }} × {{ line.qty }}<span class="text-[rgba(26,26,29,.5)]">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
        <span class="font-extrabold">${{ line.lineTotal }}</span>
      </div>
      <div class="mt-2 flex justify-between border-t-2 border-dashed border-[rgba(26,26,29,.2)] pt-2.5 text-[15px] font-black text-[#e8384f]">
        <span>總計</span><span>${{ total }}</span>
      </div>
    </div>

    <div class="mb-[18px] flex gap-2.5">
      <button
        @click="selectOrderType('dinein')"
        :class="orderType === 'dinein' ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font flex-1 cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
      >
        內用
      </button>
      <button
        @click="selectOrderType('takeout')"
        :class="orderType === 'takeout' ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font flex-1 cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
      >
        外帶
      </button>
    </div>

    <div v-if="orderType === 'dinein'" class="mb-[18px]">
      <div class="mb-2 text-[13px] font-extrabold">選擇桌號</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="num in TABLES"
          :key="num"
          @click="selectTable(num)"
          :class="table === num ? 'bg-[#ffdf3c]' : 'bg-white'"
          class="h-11 w-[52px] cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] text-sm font-black text-[#1a1a1a]"
        >
          {{ num }}
        </button>
      </div>
    </div>

    <div v-else class="mb-[18px] flex flex-col gap-3">
      <label class="text-[13px] font-extrabold">
        取餐人姓名（選填）
        <input v-model="form.customerName" type="text" placeholder="請輸入姓名" class="mt-1.5 block w-full rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm" />
      </label>
      <label class="text-[13px] font-extrabold">
        聯絡電話
        <input v-model="form.customerPhone" type="tel" placeholder="請輸入手機號碼" class="mt-1.5 block w-full rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm" />
      </label>
      <div class="text-[13px] font-extrabold">
        自取日期（選填，預設今天）
        <input v-model="pickupDate" type="date" class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm" />
      </div>
      <div class="text-[13px] font-extrabold">
        自取時間（選填）
        <div class="mt-1.5 flex items-center gap-1.5">
          <select v-model="pickupHour" class="rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm">
            <option value="">--</option>
            <option v-for="h in PICKUP_HOUR_OPTIONS" :key="h" :value="h">{{ h }}</option>
          </select>
          <span>:</span>
          <select v-model="pickupMinute" class="rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm">
            <option value="">--</option>
            <option v-for="m in PICKUP_MINUTE_OPTIONS" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>
    </div>

    <label class="mb-[18px] block text-[13px] font-extrabold">
      備註（選填）
      <textarea v-model="form.customerNote" placeholder="例如：不要洋蔥" rows="2" class="mt-1.5 block w-full resize-y rounded-[10px] border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm"></textarea>
    </label>

    <div class="mb-5 text-[13px] font-extrabold">
      付款方式<span class="ml-2 font-bold text-[rgba(26,26,29,.55)]">到店付款</span>
    </div>

    <div v-if="form.error" class="mb-3 text-[13px] font-extrabold text-[#e8384f]">{{ form.error }}</div>

    <button
      v-debounce
      @click="submitOrder"
      :disabled="submitting"
      class="w-full cursor-pointer rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-[15px] text-base font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ submitting ? '處理中…' : '送出訂單' }}
    </button>
  </main>
</template>
