<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import BackToTop from './components/BackToTop.vue';
import CartDrawer from './components/CartDrawer.vue';
import UpdateNotification from './components/UpdateNotification.vue';
import { loadCatalog } from './store/catalog';
import { ensureAuthChecked, hasPermission, STAFF_NAV } from './store/auth';
import { useVersionCheck } from './composables/versionCheck';

const route = useRoute();
const router = useRouter();
const isCustomerFacing = computed(() => !!route.meta.customerFacing);
const footerNav = computed(() => STAFF_NAV.filter((tab) => hasPermission(tab.permission)));

// 版本檢查
const { hasNewVersion } = useVersionCheck();

onMounted(() => {
  loadCatalog();
  ensureAuthChecked();
});
</script>

<template>
  <div class="relative min-h-screen bg-[#f2fbff] text-[#1a1a1a]">
    <AppHeader />
    <router-view />
    <CartDrawer />
    <BackToTop />
    <UpdateNotification :show="hasNewVersion" />
    <footer v-if="isCustomerFacing" class="flex flex-wrap justify-center gap-4 p-5 text-center">
      <template v-if="footerNav.length > 0">
        <a
          v-for="tab in footerNav"
          :key="tab.to"
          href="#"
          @click.prevent="router.push(tab.to)"
          class="text-[11px] text-[rgba(26,26,29,.4)] underline"
        >
          {{ tab.label }}
        </a>
      </template>
      <a v-else href="#" @click.prevent="router.push('/login')" class="text-[11px] text-[rgba(26,26,29,.4)] underline">員工登入</a>
    </footer>
  </div>
</template>
