<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartState, cartCount } from '../store/cart';

const route = useRoute();
const router = useRouter();

const isStaffView = computed(() => !!route.meta.staff);
const isCustomerFacing = computed(() => !!route.meta.customerFacing);
const count = computed(() => cartCount(cartState.cart));

const tabs = [
  { to: '/admin', label: '訂單佇列' },
  { to: '/pos', label: '現場點餐 POS' },
  { to: '/tables', label: '桌況' },
  { to: '/history', label: '歷史訂單' },
];

function tabBg(to: string) {
  return route.path === to ? '#ffdf3c' : '#fff';
}
</script>

<template>
  <header
    style="position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:#fff;border-bottom:3px solid #1a1a1a;"
  >
    <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" @click="router.push('/')">
      <div
        style="width:72px;height:72px;flex:none;border-radius:50%;border:3px solid #1a1a1a;overflow:hidden;background:#4fb8e8;display:flex;align-items:center;justify-content:center;"
      >
        <img src="/assets/mascot-slice.png" style="width:86%;height:86%;object-fit:contain;" />
      </div>
      <div>
        <div class="brand-text" style="font-size:26px;line-height:1.1;">披薩救星</div>
        <div style="font-size:11px;color:rgba(26,26,26,.5);font-weight:700;letter-spacing:.5px;">PI-PI-PIZZA...</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <template v-if="isStaffView">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button
            v-for="tab in tabs"
            :key="tab.to"
            @click="router.push(tab.to)"
            :style="`border:2.5px solid #1a1a1a;background:${tabBg(tab.to)};color:#1a1a1a;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;`"
          >
            {{ tab.label }}
          </button>
        </div>
        <button
          @click="router.push('/')"
          style="border:2.5px solid #1a1a1a;background:#fff;color:#1a1a1a;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;"
        >
          回顧客端
        </button>
      </template>
      <button
        v-if="isCustomerFacing"
        @click="cartState.cartOpen = true"
        style="position:relative;border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;"
      >
        🛒 購物車
        <span
          v-if="count > 0"
          style="position:absolute;top:-9px;right:-9px;background:#e8384f;color:#fff;font-size:11px;font-weight:800;min-width:20px;height:20px;border-radius:10px;border:2px solid #1a1a1a;display:flex;align-items:center;justify-content:center;padding:0 5px;"
        >
          {{ count }}
        </span>
      </button>
    </div>
  </header>
</template>
