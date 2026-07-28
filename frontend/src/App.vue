<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import CartDrawer from './components/CartDrawer.vue';
import { loadCatalog } from './store/catalog';

const route = useRoute();
const router = useRouter();
const isCustomerFacing = computed(() => !!route.meta.customerFacing);

onMounted(loadCatalog);
</script>

<template>
  <div style="background:#f2fbff;min-height:100vh;color:#1a1a1a;position:relative;">
    <AppHeader />
    <router-view />
    <CartDrawer />
    <footer
      v-if="isCustomerFacing"
      style="text-align:center;padding:20px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap;"
    >
      <a href="#" @click.prevent="router.push('/admin')" style="font-size:11px;color:rgba(26,26,29,.4);text-decoration:underline;">訂單佇列</a>
      <a href="#" @click.prevent="router.push('/pos')" style="font-size:11px;color:rgba(26,26,29,.4);text-decoration:underline;">現場點餐 POS</a>
      <a href="#" @click.prevent="router.push('/tables')" style="font-size:11px;color:rgba(26,26,29,.4);text-decoration:underline;">桌況</a>
      <a href="#" @click.prevent="router.push('/history')" style="font-size:11px;color:rgba(26,26,29,.4);text-decoration:underline;">歷史訂單</a>
    </footer>
  </div>
</template>
