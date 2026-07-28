<script setup lang="ts">
import { computed, ref } from 'vue';
import { catalog } from '../store/catalog';
import { cartState, addToCart, adjustQty, toggleCheese, setTemp } from '../store/cart';
import { cheeseUpcharge } from '../composables/presentation';

const menuCategory = ref('pizza');

const storeClosed = computed(() => catalog.config?.storeOpen === false);
const upcharge = computed(() => cheeseUpcharge());

const menuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === menuCategory.value)
    .map((item) => {
      const line = cartState.cart[item.id];
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
</script>

<template>
  <main style="max-width:720px;margin:0 auto;padding:0 0 60px;">
    <div style="background:#4fb8e8;padding:10px 20px 30px;position:relative;overflow:hidden;">
      <img src="/assets/wordmark-sunburst.png" style="width:100%;max-width:380px;display:block;margin:0 auto;" />
      <div style="display:flex;justify-content:center;margin-top:-16px;position:relative;">
        <img src="/assets/mascot-eating.png" style="width:150px;filter:drop-shadow(0 6px 0 rgba(26,26,26,.15));" />
      </div>
      <div style="display:flex;justify-content:center;margin-top:6px;position:relative;">
        <div
          style="background:#fff;border:2.5px solid #1a1a1a;border-radius:10px;padding:6px 16px;transform:rotate(-2deg);font-family:'Archivo Black',sans-serif;font-size:12px;color:#e8384f;box-shadow:3px 3px 0 #1a1a1a;"
        >
          Better Pizza, Better Life.
        </div>
      </div>
      <div style="text-align:center;margin-top:14px;font-size:12px;color:#1a1a1a;font-weight:700;">
        704臺南市北區南園街49巷51號・週二〜週日 12:00–20:00・週一公休
      </div>
    </div>
    <div style="padding:20px 20px 0;">
      <div style="position:relative;border-radius:16px;border:3px solid #1a1a1a;overflow:hidden;height:180px;">
        <img src="/assets/hero-pizza.png" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>

    <div v-if="storeClosed" style="margin:16px 20px 0;background:#e8384f;color:#fff;padding:12px 16px;border-radius:10px;border:2.5px solid #1a1a1a;font-size:14px;font-weight:800;text-align:center;">
      本日公休，暫停線上點餐
    </div>

    <div style="padding:22px 20px 6px;">
      <div style="display:flex;gap:8px;">
        <button
          v-for="cat in catalog.categories"
          :key="cat.id"
          @click="menuCategory = cat.id"
          :style="`border:2.5px solid #1a1a1a;background:${menuCategory === cat.id ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:9px 18px;border-radius:12px;font-family:'Archivo Black',sans-serif;font-size:13px;cursor:pointer;`"
        >
          {{ cat.label }}
        </button>
      </div>
      <p style="font-size:12px;color:rgba(26,26,29,.55);margin:14px 0 0;line-height:1.6;">
        餅皮採用高含水老麵長時間低溫發酵，富含氣體，高溫窯烤後外緣呈現微氣泡、口感輕盈。
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;padding:10px 20px 0;">
      <div v-for="row in menuDisplay" :key="row.item.id" style="background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:16px 18px;">
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
              <span style="font-size:17px;font-weight:900;color:#1a1a1a;">{{ row.item.zh }}</span>
              <span style="font-size:11px;color:rgba(26,26,29,.5);">{{ row.item.en }}</span>
            </div>
            <div style="font-size:13px;color:rgba(26,26,29,.65);margin-top:4px;">{{ row.item.description }}</div>
            <label v-if="row.showCheese" style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:rgba(26,26,29,.7);cursor:pointer;width:fit-content;font-weight:700;">
              <input
                type="checkbox"
                :checked="row.cheese"
                @change="toggleCheese(cartState.cart, row.item.id)"
                style="accent-color:#e8384f;width:15px;height:15px;"
              />
              起司多一點 +{{ upcharge }}元
            </label>
            <div v-if="row.item.hasTemp" style="display:flex;gap:6px;margin-top:10px;">
              <button
                @click="setTemp(cartState.cart, row.item.id, 'ice')"
                :style="`border:2px solid #1a1a1a;background:${row.temp === 'ice' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;`"
              >
                冰
              </button>
              <button
                @click="setTemp(cartState.cart, row.item.id, 'hot')"
                :style="`border:2px solid #1a1a1a;background:${row.temp === 'hot' ? '#ffdf3c' : '#fff'};color:#1a1a1a;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;`"
              >
                熱
              </button>
            </div>
          </div>
          <div style="flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
            <span style="background:#e8384f;color:#fff;border:2px solid #1a1a1a;border-radius:20px;padding:5px 12px;font-size:15px;font-weight:900;white-space:nowrap;">
              ${{ row.displayPrice }}
            </span>
            <div v-if="row.qty > 0" style="display:flex;align-items:center;gap:8px;background:#f2fbff;border:2px solid #1a1a1a;border-radius:10px;padding:4px 6px;">
              <button @click="adjustQty(cartState.cart, row.item.id, -1)" style="width:26px;height:26px;border:none;border-radius:6px;background:#fff;color:#1a1a1a;font-size:16px;font-weight:900;cursor:pointer;">−</button>
              <span style="min-width:16px;text-align:center;font-weight:900;font-size:14px;">{{ row.qty }}</span>
              <button @click="adjustQty(cartState.cart, row.item.id, 1)" style="width:26px;height:26px;border:none;border-radius:6px;background:#fff;color:#1a1a1a;font-size:16px;font-weight:900;cursor:pointer;">+</button>
            </div>
            <button
              v-else
              @click="addToCart(cartState.cart, row.item.id)"
              :disabled="storeClosed"
              style="border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:8px 16px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:2.5px 2.5px 0 #1a1a1a;"
            >
              加入購物車
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
