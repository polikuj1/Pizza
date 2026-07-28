<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { cartState } from '../store/cart';
import { cartLines, cartTotal } from '../composables/presentation';
import { api } from '../api';

const router = useRouter();
const lines = computed(() => cartLines(cartState.cart));
const total = computed(() => cartTotal(cartState.cart));

const form = reactive({
  customerName: '',
  customerPhone: '',
  customerNote: '',
  payment: 'store' as 'store' | 'online',
  error: '',
});

async function submitOrder() {
  if (lines.value.length === 0) {
    form.error = '購物車是空的';
    return;
  }
  if (!form.customerName.trim() || !form.customerPhone.trim()) {
    form.error = '請填寫姓名與電話';
    return;
  }
  try {
    const order = await api.createOrder({
      cart: cartState.cart,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      note: form.customerNote,
      payment: form.payment,
    });
    cartState.cart = {};
    form.error = '';
    router.push(`/order/${order.id}`);
  } catch (err) {
    form.error = err instanceof Error ? err.message : '發生錯誤';
  }
}
</script>

<template>
  <main style="max-width:520px;margin:0 auto;padding:24px 20px 60px;">
    <button @click="router.push('/')" style="border:none;background:none;color:#e8384f;font-size:13px;font-weight:800;cursor:pointer;padding:0 0 16px;">← 返回菜單</button>
    <div class="brand-text" style="font-size:22px;margin-bottom:16px;">結帳</div>

    <div style="background:#fff;border:2.5px solid #1a1a1a;border-radius:16px;padding:16px 18px;margin-bottom:18px;">
      <div style="font-size:13px;font-weight:800;color:rgba(26,26,29,.7);margin-bottom:10px;">訂單內容</div>
      <div v-for="line in lines" :key="line.id" style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;">
        <span>{{ line.zh }} × {{ line.qty }}<span style="color:rgba(26,26,29,.5);">{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span></span>
        <span style="font-weight:800;">${{ line.lineTotal }}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;color:#e8384f;border-top:2px dashed rgba(26,26,29,.2);margin-top:8px;padding-top:10px;">
        <span>總計</span><span>${{ total }}</span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px;">
      <label style="font-size:13px;font-weight:800;">
        取餐人姓名
        <input v-model="form.customerName" type="text" placeholder="請輸入姓名" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border-radius:10px;border:2px solid #1a1a1a;font-size:14px;background:#fff;" />
      </label>
      <label style="font-size:13px;font-weight:800;">
        聯絡電話
        <input v-model="form.customerPhone" type="tel" placeholder="請輸入手機號碼" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border-radius:10px;border:2px solid #1a1a1a;font-size:14px;background:#fff;" />
      </label>
      <label style="font-size:13px;font-weight:800;">
        備註（選填）
        <textarea v-model="form.customerNote" placeholder="例如：不要洋蔥" rows="2" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border-radius:10px;border:2px solid #1a1a1a;font-size:14px;background:#fff;resize:vertical;"></textarea>
      </label>
    </div>

    <div style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px;">付款方式</div>
      <div style="display:flex;gap:10px;">
        <label :style="`flex:1;display:flex;align-items:center;gap:8px;padding:12px;border-radius:12px;border:2.5px solid ${form.payment === 'store' ? '#3fae66' : 'rgba(26,26,29,.2)'};background:#fff;cursor:pointer;font-size:13px;font-weight:700;`">
          <input type="radio" name="pay" value="store" v-model="form.payment" style="accent-color:#e8384f;" />到店付款
        </label>
        <label :style="`flex:1;display:flex;align-items:center;gap:8px;padding:12px;border-radius:12px;border:2.5px solid ${form.payment === 'online' ? '#3fae66' : 'rgba(26,26,29,.2)'};background:#fff;cursor:pointer;font-size:13px;font-weight:700;`">
          <input type="radio" name="pay" value="online" v-model="form.payment" style="accent-color:#e8384f;" />線上付款
        </label>
      </div>
      <div v-if="form.payment === 'online'" style="margin-top:10px;font-size:12px;color:rgba(26,26,29,.55);background:#f2fbff;padding:10px 12px;border-radius:10px;border:2px solid rgba(26,26,29,.15);">
        送出訂單後將導向金流頁面完成付款（示意）
      </div>
    </div>

    <div v-if="form.error" style="color:#e8384f;font-size:13px;font-weight:800;margin-bottom:12px;">{{ form.error }}</div>

    <button @click="submitOrder" style="width:100%;border:2.5px solid #1a1a1a;background:#ffdf3c;color:#1a1a1a;padding:15px;border-radius:14px;font-size:16px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;">
      送出訂單
    </button>
  </main>
</template>
