<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { catalog } from '../store/catalog';
import { addToCart, adjustQty, cartKey, toggleCheese } from '../store/cart';
import { handleLoadError } from '../composables/authGuard';
import { cartLines, cartTotal, cheeseUpcharge, CHANNEL_LABELS, TABLES } from '../composables/presentation';
import type { Cart, Order, OrderChannel } from '../types';

const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABELS) as OrderChannel[];
const PICKUP_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const PICKUP_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const router = useRouter();
const posCart = reactive<Cart>({});
const posCategory = ref('pizza');
const posOrderType = ref<'dinein' | 'takeout'>('dinein');
const posTable = ref<number | null>(null);
const posChannel = ref<OrderChannel | null>('ig');
const posPickupDate = ref('');
const posPickupHour = ref('');
const posPickupMinute = ref('');
const posPickupTime = computed(() => (posPickupHour.value && posPickupMinute.value ? `${posPickupHour.value}:${posPickupMinute.value}` : ''));
const posNote = ref('');
const posFormError = ref('');
const posConfirmedId = ref<number | null>(null);
const activeOrders = ref<Order[]>([]);

const upcharge = computed(() => cheeseUpcharge());
const lines = computed(() => cartLines(posCart));
const total = computed(() => cartTotal(posCart));

async function refreshActiveOrders() {
  try {
    activeOrders.value = await api.getOrders('active');
  } catch (err) {
    handleLoadError(err, router);
  }
}
onMounted(refreshActiveOrders);

const tableOptions = computed(() =>
  TABLES.map((num) => {
    const occupied = activeOrders.value.some((o) => o.orderType === 'dinein' && o.table === num);
    return { num, occupied, selected: posTable.value === num };
  })
);

function selectTable(opt: { num: number; occupied: boolean }) {
  posTable.value = opt.num;
  posFormError.value = '';
}

const posMenuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === posCategory.value && item.enabled)
    .map((item) => {
      if (item.hasTemp) {
        return {
          item,
          qty: 0,
          cheese: false,
          showCheese: false,
          iceQty: posCart[cartKey(item.id, 'ice')]?.qty ?? 0,
          hotQty: posCart[cartKey(item.id, 'hot')]?.qty ?? 0,
          displayPrice: item.price,
        };
      }
      const line = posCart[item.id];
      const qty = line?.qty ?? 0;
      const cheese = line?.cheese ?? false;
      const showCheese = item.category === 'pizza';
      return {
        item,
        qty,
        cheese,
        showCheese,
        iceQty: 0,
        hotQty: 0,
        displayPrice: item.price + (cheese && showCheese ? upcharge.value : 0),
      };
    })
);

function selectChannel(channel: OrderChannel) {
  posChannel.value = channel;
  posFormError.value = '';
}

async function submitPosOrder() {
  if (lines.value.length === 0) return;
  if (posOrderType.value === 'dinein' && !posTable.value) {
    posFormError.value = '請選擇桌號';
    return;
  }
  if (posOrderType.value === 'takeout' && !posChannel.value) {
    posFormError.value = '請選擇外帶通路';
    return;
  }
  try {
    const order = await api.createPosOrder({
      cart: posCart,
      orderType: posOrderType.value,
      table: posOrderType.value === 'dinein' ? posTable.value : null,
      channel: posOrderType.value === 'takeout' ? posChannel.value : null,
      pickupDate: posOrderType.value === 'takeout' && posChannel.value === 'ig' && posPickupDate.value ? posPickupDate.value : null,
      pickupTime: posOrderType.value === 'takeout' && posChannel.value === 'ig' && posPickupTime.value ? posPickupTime.value : null,
      note: posNote.value,
    });
    Object.keys(posCart).forEach((id) => delete posCart[id]);
    posNote.value = '';
    posTable.value = null;
    posChannel.value = 'ig';
    posPickupDate.value = '';
    posPickupHour.value = '';
    posPickupMinute.value = '';
    posFormError.value = '';
    posConfirmedId.value = order.id;
    await refreshActiveOrders();
  } catch (err) {
    posFormError.value = err instanceof Error ? err.message : '發生錯誤';
  }
}

function newOrder() {
  posConfirmedId.value = null;
}
</script>

<template>
  <main class="mx-auto max-w-[1000px] px-5 pt-5 pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">現場點餐 POS</div>
    <div class="mb-4 text-[13px] font-bold text-[rgba(26,26,29,.55)]">為現場客人建立訂單</div>

    <div v-if="posConfirmedId !== null" class="mx-auto my-5 max-w-[420px] rounded-[20px] border-[2.5px] border-[#1a1a1a] bg-white p-6 px-[30px] text-center sm:p-10">
      <img src="/assets/mascot-slice.png" class="mx-auto mb-1.5 w-[100px]" />
      <div class="brand-text text-2xl">訂單 #{{ posConfirmedId }} 已送出</div>
      <div class="mt-2 text-[13px] font-bold text-[rgba(26,26,29,.6)]">已送至訂單佇列與桌況</div>
      <button @click="newOrder" class="mt-[22px] w-full cursor-pointer rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-[15px] font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]">開始下一筆點餐</button>
    </div>

    <template v-else>
      <div class="mb-4 flex gap-2.5">
        <button
          @click="posOrderType = 'dinein'; posTable = null; posChannel = 'ig'; posPickupDate = ''; posPickupHour = ''; posPickupMinute = ''; posFormError = ''"
          :class="posOrderType === 'dinein' ? 'bg-[#ffdf3c]' : 'bg-white'"
          class="tab-font flex-1 cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
        >
          內用
        </button>
        <button
          @click="posOrderType = 'takeout'; posTable = null; posChannel = 'ig'; posPickupDate = ''; posPickupHour = ''; posPickupMinute = ''; posFormError = ''"
          :class="posOrderType === 'takeout' ? 'bg-[#ffdf3c]' : 'bg-white'"
          class="tab-font flex-1 cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] p-3 text-[13px] text-[#1a1a1a]"
        >
          現場外帶
        </button>
      </div>

      <div v-if="posOrderType === 'dinein'" class="mb-4">
        <div class="mb-2 text-xs font-extrabold">選擇桌號</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in tableOptions"
            :key="opt.num"
            @click="selectTable(opt)"
            :class="opt.selected ? 'bg-[#ffdf3c]' : 'bg-white'"
            class="relative h-11 w-[52px] cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] text-sm font-black text-[#1a1a1a]"
          >
            {{ opt.num }}
            <span v-if="opt.occupied" class="absolute -top-1.5 -right-1.5 size-2.5 rounded-full border border-[#1a1a1a] bg-[#e8384f]"></span>
          </button>
        </div>
        <div class="mt-1.5 text-[11px] font-bold text-[rgba(26,26,29,.5)]">紅點代表這桌已有進行中訂單，選取後會視為加點</div>
      </div>

      <div v-if="posOrderType === 'takeout'" class="mb-4">
        <div class="mb-2 text-xs font-extrabold">選擇通路</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in CHANNEL_OPTIONS"
            :key="c"
            @click="selectChannel(c)"
            :class="posChannel === c ? 'bg-[#ffdf3c]' : 'bg-white'"
            class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] px-5 py-2.5 text-sm font-black text-[#1a1a1a]"
          >
            {{ CHANNEL_LABELS[c] }}
          </button>
        </div>
        <div v-if="posChannel === 'ig'" class="mt-3 text-xs font-extrabold">
          取餐日期（選填，預設今天）
          <input v-model="posPickupDate" type="date" class="mt-1.5 block rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm" />
        </div>
        <div v-if="posChannel === 'ig'" class="mt-3 text-xs font-extrabold">
          取餐時間（選填）
          <div class="mt-1.5 flex items-center gap-1.5">
            <select v-model="posPickupHour" class="rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm">
              <option value="">--</option>
              <option v-for="h in PICKUP_HOUR_OPTIONS" :key="h" :value="h">{{ h }}</option>
            </select>
            <span>:</span>
            <select v-model="posPickupMinute" class="rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-sm">
              <option value="">--</option>
              <option v-for="m in PICKUP_MINUTE_OPTIONS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in catalog.categories"
              :key="cat.id"
              @click="posCategory = cat.id"
              :class="posCategory === cat.id ? 'bg-[#ffdf3c]' : 'bg-white'"
              class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
            >
              {{ cat.label }}
            </button>
          </div>
          <div v-for="row in posMenuDisplay" :key="row.item.id" class="flex flex-col items-stretch justify-between gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3.5 px-4 sm:flex-row sm:items-center">
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline gap-2">
                <span class="text-base font-black">{{ row.item.zh }}</span>
                <span v-if="row.item.soldOut" class="rounded-full bg-[rgba(26,26,29,.5)] px-2 py-0.5 text-[11px] font-extrabold text-white">已完售</span>
              </div>
              <div class="mt-0.5 text-xs text-[rgba(26,26,29,.6)]">{{ row.item.description }}</div>
              <label v-if="row.showCheese" class="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-bold text-[rgba(26,26,29,.7)]">
                <input type="checkbox" :checked="row.cheese" @change="toggleCheese(posCart, row.item.id)" class="size-[15px] accent-[#e8384f]" />
                加起司 +{{ upcharge }}
              </label>
            </div>
            <div v-if="!row.item.hasTemp" class="flex flex-none items-center justify-between gap-2 sm:flex-col sm:items-end">
              <div class="text-[15px] font-black text-[#e8384f] sm:mb-2">${{ row.displayPrice }}</div>
              <div v-if="row.qty > 0" class="flex items-center gap-2 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-1.5 py-1">
                <button @click="adjustQty(posCart, row.item.id, -1)" class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black">−</button>
                <span class="min-w-4 text-center text-[15px] font-black">{{ row.qty }}</span>
                <button @click="adjustQty(posCart, row.item.id, 1)" :disabled="row.item.soldOut" class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50">+</button>
              </div>
              <button
                v-else
                @click="addToCart(posCart, row.item.id)"
                :disabled="row.item.soldOut"
                class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2 text-[13px] font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ row.item.soldOut ? '已完售' : '加點' }}
              </button>
            </div>
            <div v-else class="flex flex-none flex-col gap-2">
              <div
                v-for="temp in (['ice', 'hot'] as const)"
                :key="temp"
                class="flex items-center justify-between gap-3 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-2.5 py-1.5"
              >
                <span class="text-[13px] font-extrabold whitespace-nowrap">{{ temp === 'ice' ? '冰' : '熱' }} ${{ row.displayPrice }}</span>
                <div v-if="(temp === 'ice' ? row.iceQty : row.hotQty) > 0" class="flex items-center gap-2 rounded-md border-2 border-[#1a1a1a] bg-white px-1.5 py-1">
                  <button @click="adjustQty(posCart, cartKey(row.item.id, temp), -1)" class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black">−</button>
                  <span class="min-w-4 text-center text-[15px] font-black">{{ temp === 'ice' ? row.iceQty : row.hotQty }}</span>
                  <button @click="adjustQty(posCart, cartKey(row.item.id, temp), 1)" :disabled="row.item.soldOut" class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50">+</button>
                </div>
                <button
                  v-else
                  @click="addToCart(posCart, row.item.id, temp)"
                  :disabled="row.item.soldOut"
                  class="cursor-pointer rounded-lg border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3 py-1.5 text-[11px] font-extrabold whitespace-nowrap text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ row.item.soldOut ? '已完售' : '加點' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-[18px] lg:sticky lg:top-[84px]">
          <div class="mb-3 text-[15px] font-black">目前訂單</div>
          <div v-if="lines.length === 0" class="py-[30px] text-center text-[13px] text-[rgba(26,26,29,.5)]">尚未加入品項</div>
          <div v-for="line in lines" :key="line.id" class="flex justify-between border-b border-dashed border-[rgba(26,26,29,.15)] py-[7px] text-[13px]">
            <span>{{ line.zh }} × {{ line.qty }}<span class="text-[rgba(26,26,29,.5)]">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
            <span class="font-extrabold">${{ line.lineTotal }}</span>
          </div>
          <div class="mt-3 flex justify-between border-t-2 border-dashed border-[rgba(26,26,29,.2)] pt-2.5 text-base font-black text-[#e8384f]">
            <span>總計</span><span>${{ total }}</span>
          </div>
          <label class="mt-3.5 block text-xs font-extrabold">
            備註（選填）
            <input v-model="posNote" type="text" placeholder="例如：不要洋蔥" class="mt-1.5 block w-full rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-[13px]" />
          </label>
          <div v-if="posFormError" class="mt-2 text-xs font-extrabold text-[#e8384f]">{{ posFormError }}</div>
          <button
            @click="submitPosOrder"
            :disabled="lines.length === 0"
            class="mt-3.5 w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            送出訂單（現金）
          </button>
        </div>
      </div>
    </template>
  </main>
</template>
