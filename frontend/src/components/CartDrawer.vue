<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { cartState, adjustQty } from '../store/cart';
import { cartLines, cartTotal } from '../composables/presentation';

const router = useRouter();
const lines = computed(() => cartLines(cartState.cart));
const total = computed(() => cartTotal(cartState.cart));

function checkout() {
  cartState.cartOpen = false;
  router.push('/checkout');
}
</script>

<template>
  <div v-if="cartState.cartOpen">
    <div
      @click="cartState.cartOpen = false"
      style="position:fixed;inset:0;background:rgba(26,26,26,.45);z-index:30;animation:fadeIn .2s ease;"
    ></div>
    <div
      style="position:fixed;top:0;right:0;bottom:0;width:min(400px,100%);background:#fff;z-index:31;border-left:3px solid #1a1a1a;display:flex;flex-direction:column;animation:slideIn .25s ease;"
    >
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:3px solid #1a1a1a;">
        <span class="brand-text" style="font-size:18px;">購物車</span>
        <button @click="cartState.cartOpen = false" style="border:none;background:none;font-size:22px;cursor:pointer;color:#1a1a1a;">×</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:12px 20px;">
        <div v-if="lines.length === 0" style="text-align:center;padding:30px 0;">
          <img src="/assets/mascot-eating.png" style="width:110px;margin-bottom:6px;" />
          <div style="color:rgba(26,26,29,.5);font-size:14px;font-weight:700;">購物車是空的</div>
        </div>
        <div
          v-for="line in lines"
          :key="line.id"
          style="display:flex;justify-content:space-between;gap:10px;padding:14px 0;border-bottom:2px dashed rgba(26,26,29,.15);"
        >
          <div>
            <div style="font-weight:800;font-size:14px;">{{ line.zh }}</div>
            <div style="font-size:12px;color:rgba(26,26,29,.55);margin-top:2px;">{{ line.cheeseLabel }}{{ line.tempSuffix }}</div>
            <div
              style="display:flex;align-items:center;gap:8px;margin-top:8px;background:#f2fbff;border:2px solid #1a1a1a;border-radius:10px;padding:3px 5px;width:fit-content;"
            >
              <button
                @click="adjustQty(cartState.cart, line.id, -1)"
                style="width:22px;height:22px;border:none;border-radius:5px;background:#fff;font-size:14px;cursor:pointer;"
              >
                −
              </button>
              <span style="min-width:14px;text-align:center;font-size:13px;font-weight:800;">{{ line.qty }}</span>
              <button
                @click="adjustQty(cartState.cart, line.id, 1)"
                style="width:22px;height:22px;border:none;border-radius:5px;background:#fff;font-size:14px;cursor:pointer;"
              >
                +
              </button>
            </div>
          </div>
          <div style="font-weight:900;color:#e8384f;font-size:14px;white-space:nowrap;">${{ line.lineTotal }}</div>
        </div>
      </div>
      <div style="padding:18px 20px;border-top:3px solid #1a1a1a;">
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;margin-bottom:14px;">
          <span>小計</span><span style="color:#e8384f;">${{ total }}</span>
        </div>
        <button
          @click="checkout"
          :disabled="lines.length === 0"
          style="width:100%;border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:14px;border-radius:12px;font-size:15px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;"
        >
          前往結帳
        </button>
      </div>
    </div>
  </div>
</template>
