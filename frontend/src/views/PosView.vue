<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import { catalog } from '../store/catalog';
import { addToCart, adjustQty, setTemp, toggleCheese } from '../store/cart';
import { cartLines, cartTotal, cheeseUpcharge, TABLES } from '../composables/presentation';
import type { Cart, Order } from '../types';

const posCart = reactive<Cart>({});
const posCategory = ref('pizza');
const posOrderType = ref<'dinein' | 'takeout'>('dinein');
const posTable = ref<number | null>(null);
const posNote = ref('');
const posFormError = ref('');
const posConfirmedId = ref<number | null>(null);
const activeOrders = ref<Order[]>([]);

const upcharge = computed(() => cheeseUpcharge());
const lines = computed(() => cartLines(posCart));
const total = computed(() => cartTotal(posCart));

async function refreshActiveOrders() {
  activeOrders.value = await api.getOrders('active');
}
onMounted(refreshActiveOrders);

const tableOptions = computed(() =>
  TABLES.map((num) => {
    const occupied = activeOrders.value.some((o) => o.orderType === 'dinein' && o.table === num);
    return { num, occupied, selected: posTable.value === num };
  })
);

function selectTable(opt: { num: number; occupied: boolean }) {
  if (opt.occupied) return;
  posTable.value = opt.num;
  posFormError.value = '';
}

const posMenuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === posCategory.value)
    .map((item) => {
      const line = posCart[item.id];
      const qty = line?.qty ?? 0;
      const cheese = line?.cheese ?? false;
      const temp = line?.temp ?? 'ice';
      const showCheese = item.category === 'pizza';
      return {
        item,
        qty,
        cheese,
        temp,
        showCheese,
        displayPrice: item.price + (cheese && showCheese ? upcharge.value : 0),
      };
    })
);

async function submitPosOrder() {
  if (lines.value.length === 0) return;
  if (posOrderType.value === 'dinein' && !posTable.value) {
    posFormError.value = '請選擇桌號';
    return;
  }
  try {
    const order = await api.createPosOrder({
      cart: posCart,
      orderType: posOrderType.value,
      table: posOrderType.value === 'dinein' ? posTable.value : null,
      note: posNote.value,
    });
    Object.keys(posCart).forEach((id) => delete posCart[id]);
    posNote.value = '';
    posTable.value = null;
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
  <main style="max-width:1000px;margin:0 auto;padding:20px 20px 60px;">
    <div class="brand-text" style="font-size:22px;margin-bottom:4px;">現場點餐 POS</div>
    <div style="font-size:13px;color:rgba(26,26,29,.55);margin-bottom:18px;font-weight:700;">為現場客人建立訂單</div>

    <div v-if="posConfirmedId !== null" style="background:#fff;border:2.5px solid #1a1a1a;border-radius:20px;padding:40px 30px;text-align:center;max-width:420px;margin:20px auto;">
      <img src="/assets/mascot-slice.png" style="width:100px;margin-bottom:6px;" />
      <div class="brand-text" style="font-size:24px;">訂單 #{{ posConfirmedId }} 已送出</div>
      <div style="font-size:13px;color:rgba(26,26,29,.6);margin-top:8px;font-weight:700;">已送至訂單佇列與桌況</div>
      <button @click="newOrder" style="margin-top:22px;width:100%;border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:14px;border-radius:14px;font-size:15px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;">開始下一筆點餐</button>
    </div>

    <template v-else>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <button
          @click="posOrderType = 'dinein'; posTable = null; posFormError = ''"
          :style="`flex:1;border:2.5px solid #1a1a1a;background:${posOrderType === 'dinein' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:12px;border-radius:12px;font-family:'Archivo Black',sans-serif;font-size:13px;cursor:pointer;`"
        >
          內用
        </button>
        <button
          @click="posOrderType = 'takeout'; posTable = null; posFormError = ''"
          :style="`flex:1;border:2.5px solid #1a1a1a;background:${posOrderType === 'takeout' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:12px;border-radius:12px;font-family:'Archivo Black',sans-serif;font-size:13px;cursor:pointer;`"
        >
          現場外帶
        </button>
      </div>

      <div v-if="posOrderType === 'dinein'" style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:800;margin-bottom:8px;">選擇桌號</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button
            v-for="opt in tableOptions"
            :key="opt.num"
            :disabled="opt.occupied"
            @click="selectTable(opt)"
            :style="`width:52px;height:44px;border:2.5px solid #1a1a1a;background:${opt.selected ? '#ffdf3c' : opt.occupied ? '#eee' : '#fff'};color:#1a1a1a;border-radius:10px;font-weight:900;font-size:14px;cursor:pointer;opacity:${opt.occupied ? 0.5 : 1};`"
          >
            {{ opt.num }}
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;gap:8px;">
            <button
              v-for="cat in catalog.categories"
              :key="cat.id"
              @click="posCategory = cat.id"
              :style="`border:2.5px solid #1a1a1a;background:${posCategory === cat.id ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:9px 18px;border-radius:12px;font-family:'Archivo Black',sans-serif;font-size:13px;cursor:pointer;`"
            >
              {{ cat.label }}
            </button>
          </div>
          <div v-for="row in posMenuDisplay" :key="row.item.id" style="background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:16px;font-weight:900;">{{ row.item.zh }}</div>
              <div style="font-size:12px;color:rgba(26,26,29,.6);margin-top:2px;">{{ row.item.description }}</div>
              <label v-if="row.showCheese" style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;font-weight:700;color:rgba(26,26,29,.7);cursor:pointer;width:fit-content;">
                <input type="checkbox" :checked="row.cheese" @change="toggleCheese(posCart, row.item.id)" style="accent-color:#e8384f;width:15px;height:15px;" />
                加起司 +{{ upcharge }}
              </label>
              <div v-if="row.item.hasTemp" style="display:flex;gap:6px;margin-top:8px;">
                <button @click="setTemp(posCart, row.item.id, 'ice')" :style="`border:2px solid #1a1a1a;background:${row.temp === 'ice' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;`">冰</button>
                <button @click="setTemp(posCart, row.item.id, 'hot')" :style="`border:2px solid #1a1a1a;background:${row.temp === 'hot' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;`">熱</button>
              </div>
            </div>
            <div style="text-align:right;flex:none;">
              <div style="font-weight:900;color:#e8384f;font-size:15px;margin-bottom:8px;">${{ row.displayPrice }}</div>
              <div v-if="row.qty > 0" style="display:flex;align-items:center;gap:8px;background:#f2fbff;border:2px solid #1a1a1a;border-radius:10px;padding:4px 6px;">
                <button @click="adjustQty(posCart, row.item.id, -1)" style="width:30px;height:30px;border:none;border-radius:6px;background:#fff;font-size:17px;font-weight:900;cursor:pointer;">−</button>
                <span style="min-width:16px;text-align:center;font-weight:900;font-size:15px;">{{ row.qty }}</span>
                <button @click="adjustQty(posCart, row.item.id, 1)" style="width:30px;height:30px;border:none;border-radius:6px;background:#fff;font-size:17px;font-weight:900;cursor:pointer;">+</button>
              </div>
              <button v-else @click="addToCart(posCart, row.item.id)" style="border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:8px 16px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;">加點</button>
            </div>
          </div>
        </div>

        <div style="position:sticky;top:84px;background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:18px;">
          <div style="font-weight:900;font-size:15px;margin-bottom:12px;">目前訂單</div>
          <div v-if="lines.length === 0" style="text-align:center;color:rgba(26,26,29,.5);font-size:13px;padding:30px 0;">尚未加入品項</div>
          <div v-for="line in lines" :key="line.id" style="display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px dashed rgba(26,26,29,.15);">
            <span>{{ line.zh }} × {{ line.qty }}<span style="color:rgba(26,26,29,.5);">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
            <span style="font-weight:800;">${{ line.lineTotal }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#e8384f;margin-top:12px;padding-top:10px;border-top:2px dashed rgba(26,26,29,.2);">
            <span>總計</span><span>${{ total }}</span>
          </div>
          <label style="display:block;font-size:12px;font-weight:800;margin-top:14px;">
            備註（選填）
            <input v-model="posNote" type="text" placeholder="例如：不要洋蔥" style="display:block;width:100%;margin-top:6px;padding:9px 10px;border-radius:8px;border:2px solid #1a1a1a;font-size:13px;" />
          </label>
          <div v-if="posFormError" style="color:#e8384f;font-size:12px;font-weight:800;margin-top:8px;">{{ posFormError }}</div>
          <button
            @click="submitPosOrder"
            :disabled="lines.length === 0"
            style="margin-top:14px;width:100%;border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:13px;border-radius:12px;font-size:14px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;"
          >
            送出訂單（現金）
          </button>
        </div>
      </div>
    </template>
  </main>
</template>
